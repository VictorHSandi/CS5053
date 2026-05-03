import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Projectile } from "../entities/Projectile";
import { Target } from "../entities/Target";
import { Obstacle } from "../entities/Obstacle";
import { TARGET_HIT_VELOCITY_MIN, OBSTACLE_IMPULSE_MULT } from "../utils/Constants";

export interface CollisionResult {
    targetsHit: Target[];
    obstaclesHit: Obstacle[];
    totalScore: number;
}

interface ObstacleMotionState {
    position: Vector3;
    timestampMs: number;
}

/**
 * Checks for collisions between the projectile and targets/obstacles.
 * Uses simple sphere-vs-sphere / sphere-vs-AABB overlap tests.
 */
export class TargetSystem {
    private _obstacleMotion = new Map<string, ObstacleMotionState>();
    private _obstacleTargetHitCooldown = new Map<string, number>();

    /**
     * Run collision detection for the current frame.
     * Mutates targets / obstacles (applies damage).
     */
    checkCollisions(
        projectile: Projectile,
        targets: Target[],
        obstacles: Obstacle[],
    ): CollisionResult {
        const result: CollisionResult = { targetsHit: [], obstaclesHit: [], totalScore: 0 };
        const nowMs = Date.now();
        const activeObstacleIds = new Set<string>();

        const projectileActive = projectile.active;
        const pPos = projectile.mesh.position;
        const pRad = projectile.radius;
        const speed = projectile.velocity.length();

        // ── Targets (sphere-sphere) ─────────────────────────
        if (projectileActive) {
            for (const target of targets) {
                if (target.destroyed) continue;
                const tPos = target.mesh.position;
                const tRad = (target.mesh.getBoundingInfo().boundingSphere?.radiusWorld) ?? 0.4;
                const dist = Vector3.Distance(pPos, tPos);
                if (dist < pRad + tRad && speed >= TARGET_HIT_VELOCITY_MIN) {
                    const killed = target.hit();
                    if (killed) {
                        result.targetsHit.push(target);
                        result.totalScore += target.scoreValue;
                    }
                }
            }
        }

        // ── Obstacles (sphere vs AABB) ──────────────────────
        for (const obs of obstacles) {
            if (obs.destroyed) continue;
            activeObstacleIds.add(obs.id);

            const currentPos = obs.mesh.position.clone();
            const prevMotion = this._obstacleMotion.get(obs.id);
            const dtSeconds = prevMotion
                ? Math.max((nowMs - prevMotion.timestampMs) / 1000, 1 / 240)
                : 1 / 60;
            const obstacleVelocity = prevMotion
                ? currentPos.subtract(prevMotion.position).scale(1 / dtSeconds)
                : Vector3.Zero();
            const obstacleSpeed = obstacleVelocity.length();

            this._obstacleMotion.set(obs.id, { position: currentPos, timestampMs: nowMs });

            const bb = obs.mesh.getBoundingInfo().boundingBox;

            // Projectile -> obstacle collision and impulse.
            if (projectileActive) {
            const closest = Vector3.Clamp(pPos, bb.minimumWorld, bb.maximumWorld);
            const dist = Vector3.Distance(pPos, closest);
            if (dist < pRad * 1.2 && speed >= TARGET_HIT_VELOCITY_MIN) {

                // Build impulse from the actual contact normal so blocks fall in a
                // direction consistent with where they were hit.
                const toContact = closest.subtract(pPos);
                let contactNormal = toContact.lengthSquared() > 1e-8
                    ? toContact.normalize()
                    : obs.mesh.position.subtract(pPos).normalize();

                if (contactNormal.lengthSquared() < 1e-8) {
                    contactNormal = projectile.velocity.lengthSquared() > 1e-8
                        ? projectile.velocity.normalizeToNew()
                        : new Vector3(1, 0, 0);
                }

                const velocityDir = projectile.velocity.lengthSquared() > 1e-8
                    ? projectile.velocity.normalizeToNew()
                    : contactNormal;
                const approachAlignment = Math.max(0, Vector3.Dot(velocityDir, contactNormal));

                const blendedDir = contactNormal
                    .scale(0.85)
                    .add(velocityDir.scale(0.15 * approachAlignment));

                const hitHeight = bb.maximumWorld.y - bb.minimumWorld.y;
                const hitRatio = hitHeight > 1e-5
                    ? (closest.y - bb.minimumWorld.y) / hitHeight
                    : 0.5;
                const upwardBias = Math.max(0, (0.22 - hitRatio) * 0.18);

                const impulseDir = blendedDir
                    .add(new Vector3(0, upwardBias, 0))
                    .normalize();

                const approachSpeed = Math.max(0, Vector3.Dot(projectile.velocity, contactNormal));
                const impulseMag = Math.min((approachSpeed + speed * 0.2) * OBSTACLE_IMPULSE_MULT, 22);
                obs.applyImpulse(impulseDir.scale(impulseMag), closest);

                // THEN apply damage
                const obstacleDamage = Math.min(Math.max(speed * 0.02, 0.1), 0.45);
                const destroyed = obs.hit(obstacleDamage);
                if (destroyed) {
                    result.obstaclesHit.push(obs);
                    result.totalScore += 25;
                }

                projectile.velocity = projectile.velocity.scale(0.35);
            }
            }

            // Obstacle -> target collision (falling/tumbling blocks can kill pigs).
            if (obstacleSpeed < 1.15) continue;

            for (const target of targets) {
                if (target.destroyed) continue;

                const tPos = target.mesh.position;
                const tRad = (target.mesh.getBoundingInfo().boundingSphere?.radiusWorld) ?? 0.4;
                const closestToTarget = Vector3.Clamp(tPos, bb.minimumWorld, bb.maximumWorld);
                const distToTarget = Vector3.Distance(tPos, closestToTarget);
                if (distToTarget > tRad + 0.08) continue;

                const toTarget = tPos.subtract(currentPos);
                if (toTarget.lengthSquared() < 1e-8) continue;
                const towardTarget = toTarget.normalize();
                const closingSpeed = Vector3.Dot(obstacleVelocity, towardTarget);
                if (closingSpeed < 0.75) continue;

                const pairKey = `${obs.id}|${target.id}`;
                const lastPairHit = this._obstacleTargetHitCooldown.get(pairKey) ?? 0;
                if (nowMs - lastPairHit < 180) continue;
                this._obstacleTargetHitCooldown.set(pairKey, nowMs);

                const crushDamage = Math.max(1, closingSpeed * 0.35);
                const killedByBlock = target.hit(crushDamage);
                if (killedByBlock) {
                    result.targetsHit.push(target);
                    result.totalScore += target.scoreValue;
                }
            }
        }

        // Remove stale state from removed/destroyed obstacles.
        for (const obstacleId of Array.from(this._obstacleMotion.keys())) {
            if (!activeObstacleIds.has(obstacleId)) {
                this._obstacleMotion.delete(obstacleId);
            }
        }
        for (const pairKey of Array.from(this._obstacleTargetHitCooldown.keys())) {
            const sep = pairKey.indexOf("|");
            const obstacleId = sep >= 0 ? pairKey.slice(0, sep) : pairKey;
            if (!activeObstacleIds.has(obstacleId)) {
                this._obstacleTargetHitCooldown.delete(pairKey);
            }
        }

        return result;
    }
}