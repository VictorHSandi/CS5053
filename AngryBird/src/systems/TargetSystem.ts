import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Projectile } from "../entities/Projectile";
import { Target } from "../entities/Target";
import { Obstacle } from "../entities/Obstacle";
import {
    BARREL_EXPLOSION_OBSTACLE_DAMAGE,
    BARREL_EXPLOSION_OBSTACLE_IMPULSE,
    BARREL_EXPLOSION_RADIUS,
    BARREL_EXPLOSION_TARGET_DAMAGE,
    BARREL_EXPLOSION_TARGET_IMPULSE,
    BARREL_EXPLOSION_VFX_DURATION,
    OBSTACLE_IMPULSE_MULT,
    TITAN_CORE_OBSTACLE_DAMAGE_MULT,
    TITAN_CORE_OBSTACLE_IMPULSE_MULT,
    TITAN_CORE_SHOCKWAVE_OBSTACLE_DAMAGE,
    TITAN_CORE_SHOCKWAVE_OBSTACLE_IMPULSE,
    TITAN_CORE_SHOCKWAVE_RADIUS,
    TITAN_CORE_TARGET_DAMAGE,
    TITAN_CORE_TARGET_BLAST_RADIUS,
    TARGET_HIT_VELOCITY_MIN,
} from "../utils/Constants";

export interface CollisionResult {
    targetsHit: Target[];
    obstaclesHit: Obstacle[];
    totalScore: number;
    targetScore: number;
    obstacleScore: number;
    titanCoreConsumed: boolean;
    hadImpact: boolean;
    impactPoint: Vector3 | null;
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
    private _projectileObstacleHitCooldown = new Map<string, number>();

    /**
     * Run collision detection for the current frame.
     * Mutates targets / obstacles (applies damage).
     */
    checkCollisions(
        projectile: Projectile,
        targets: Target[],
        obstacles: Obstacle[],
        titanCoreCharged = false,
    ): CollisionResult {
        const result: CollisionResult = {
            targetsHit: [],
            obstaclesHit: [],
            totalScore: 0,
            targetScore: 0,
            obstacleScore: 0,
            titanCoreConsumed: false,
            hadImpact: false,
            impactPoint: null,
        };
        const nowMs = Date.now();
        const activeObstacleIds = new Set<string>();
        const explodedBarrelIds = new Set<string>();

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
                    result.hadImpact = true;
                    result.impactPoint = target.mesh.position.clone();
                    const useTitanCore = titanCoreCharged && !result.titanCoreConsumed;
                    const hitDamage = useTitanCore ? TITAN_CORE_TARGET_DAMAGE : 1;
                    if (useTitanCore) {
                        result.titanCoreConsumed = true;
                    }

                    const killed = target.hit(hitDamage);
                    if (killed) {
                        this._registerTargetDestroyed(target, targets, obstacles, result, explodedBarrelIds);
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
                const pairKey = `${projectile.mesh.uniqueId}|${obs.id}`;
                const lastPairHit = this._projectileObstacleHitCooldown.get(pairKey) ?? 0;
                if (dist < pRad * 1.2 && speed >= TARGET_HIT_VELOCITY_MIN && nowMs - lastPairHit >= 120) {
                    this._projectileObstacleHitCooldown.set(pairKey, nowMs);
                    result.hadImpact = true;
                    result.impactPoint = closest.clone();
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

                    const outwardNormal = pPos.subtract(closest).lengthSquared() > 1e-8
                        ? pPos.subtract(closest).normalize()
                        : contactNormal.scale(-1);
                    const approachSpeed = Math.max(0, Vector3.Dot(projectile.velocity, contactNormal));
                    const useTitanCore = titanCoreCharged && !result.titanCoreConsumed;
                    let impulseMag = Math.min((approachSpeed * 1.15 + speed * 0.45) * OBSTACLE_IMPULSE_MULT, 34);
                    if (useTitanCore) {
                        const empoweredBase =
                            (approachSpeed * 1.2 + speed * 0.8) * OBSTACLE_IMPULSE_MULT * TITAN_CORE_OBSTACLE_IMPULSE_MULT;
                        impulseMag = Math.min(empoweredBase, 118);
                        result.titanCoreConsumed = true;
                    }
                    obs.applyImpulse(impulseDir.scale(impulseMag), closest);

                    // THEN apply damage
                    let obstacleDamage = Math.min(Math.max(speed * 0.05, 0.32), 1.15);
                    if (useTitanCore) {
                        obstacleDamage = Math.max(obstacleDamage * TITAN_CORE_OBSTACLE_DAMAGE_MULT, 1.4);
                    }
                    const destroyed = obs.hit(obstacleDamage);
                    if (destroyed) {
                        this._registerObstacleDestroyed(obs, result);
                    }

                    if (useTitanCore) {
                        this._applyTitanCoreShockwave(closest, obs, obstacles, result);
                        this._applyTitanCoreTargetBlast(closest, targets, obstacles, result, explodedBarrelIds);
                    }

                    this._separateProjectileFromObstacle(projectile, closest, outwardNormal, pRad, dist);
                    projectile.velocity = this._computePostImpactVelocity(projectile.velocity, outwardNormal, useTitanCore);
                }
            }

            // Obstacle -> target collision (falling/tumbling blocks can kill pigs).
            if (obstacleSpeed < 0.8) continue;

            for (const target of targets) {
                if (target.destroyed) continue;

                const tPos = target.mesh.position;
                const tRad = (target.mesh.getBoundingInfo().boundingSphere?.radiusWorld) ?? 0.4;
                const closestToTarget = Vector3.Clamp(tPos, bb.minimumWorld, bb.maximumWorld);
                const distToTarget = Vector3.Distance(tPos, closestToTarget);
                if (distToTarget > tRad + 0.2) continue;

                const toTarget = tPos.subtract(currentPos);
                if (toTarget.lengthSquared() < 1e-8) continue;
                const towardTarget = toTarget.normalize();
                const closingSpeed = Vector3.Dot(obstacleVelocity, towardTarget);
                if (closingSpeed < 0.45) continue;

                const pairKey = `${obs.id}|${target.id}`;
                const lastPairHit = this._obstacleTargetHitCooldown.get(pairKey) ?? 0;
                if (nowMs - lastPairHit < 180) continue;
                this._obstacleTargetHitCooldown.set(pairKey, nowMs);

                const obstacleExtent = bb.maximumWorld.subtract(bb.minimumWorld).length();
                const impactWeight = Math.max(0.7, obstacleExtent * 0.35);
                const crushDamage = Math.min(
                    3.6,
                    Math.max(1, closingSpeed * 0.9 + obstacleSpeed * 0.55 + impactWeight * 0.2),
                );
                const killedByBlock = target.hit(crushDamage);
                if (killedByBlock) {
                    this._registerTargetDestroyed(target, targets, obstacles, result, explodedBarrelIds);
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
        for (const pairKey of Array.from(this._projectileObstacleHitCooldown.keys())) {
            const sep = pairKey.indexOf("|");
            const obstacleId = sep >= 0 ? pairKey.slice(sep + 1) : pairKey;
            if (!activeObstacleIds.has(obstacleId)) {
                this._projectileObstacleHitCooldown.delete(pairKey);
            }
        }

        return result;
    }

    private _separateProjectileFromObstacle(
        projectile: Projectile,
        contactPoint: Vector3,
        outwardNormal: Vector3,
        projectileRadius: number,
        distanceToSurface: number,
    ): void {
        const pushNormal = outwardNormal.lengthSquared() > 1e-8
            ? outwardNormal.normalizeToNew()
            : new Vector3(1, 0, 0);
        const penetrationDepth = Math.max(0, projectileRadius - distanceToSurface);
        const separation = Math.min(projectileRadius * 0.3, penetrationDepth + 0.025);

        if (penetrationDepth <= 1e-4) {
            return;
        }

        projectile.mesh.position.addInPlace(pushNormal.scale(separation));

        const resolvedClosest = Vector3.Clamp(
            projectile.mesh.position,
            contactPoint.subtract(new Vector3(projectileRadius, projectileRadius, projectileRadius)),
            contactPoint.add(new Vector3(projectileRadius, projectileRadius, projectileRadius)),
        );
        const resolvedOffset = projectile.mesh.position.subtract(resolvedClosest);
        if (resolvedOffset.lengthSquared() < projectileRadius * projectileRadius * 0.18) {
            projectile.mesh.position.addInPlace(pushNormal.scale(0.012));
        }
    }

    private _computePostImpactVelocity(velocity: Vector3, outwardNormal: Vector3, empowered: boolean): Vector3 {
        if (velocity.lengthSquared() < 1e-8) return velocity.clone();

        const normal = outwardNormal.lengthSquared() > 1e-8
            ? outwardNormal.normalizeToNew()
            : new Vector3(0, 1, 0);
        const incomingAlongNormal = Vector3.Dot(velocity, normal);
        const normalComponent = normal.scale(incomingAlongNormal);
        const tangentialComponent = velocity.subtract(normalComponent);

        const tangentialRetention = empowered ? 0.84 : 0.66;
        const bounceStrength = empowered ? 0.14 : 0.06;
        let response = tangentialComponent.scale(tangentialRetention);

        if (incomingAlongNormal < 0) {
            response = response.add(normal.scale(-incomingAlongNormal * bounceStrength));
        } else {
            response = response.add(normalComponent.scale(0.08));
        }

        if (normal.y > 0.72) {
            const incomingHorizontal = new Vector3(velocity.x, 0, velocity.z);
            if (incomingHorizontal.lengthSquared() > 1e-8) {
                response.addInPlace(incomingHorizontal.scale(empowered ? 0.08 : 0.05));
            }
            response.y = Math.max(response.y, empowered ? 0.22 : 0.08);
        }

        return response;
    }

    private _applyTitanCoreTargetBlast(
        center: Vector3,
        targets: Target[],
        obstacles: Obstacle[],
        result: CollisionResult,
        explodedBarrelIds: Set<string>,
    ): void {
        for (const target of targets) {
            if (target.destroyed) continue;

            const dist = Vector3.Distance(center, target.mesh.position);
            if (dist > TITAN_CORE_TARGET_BLAST_RADIUS) continue;

            // Titan Core nearby blast should reliably clear pigs instead of launching them away.
            const killed = target.hit(99);
            if (killed) {
                this._registerTargetDestroyed(target, targets, obstacles, result, explodedBarrelIds);
            }
        }
    }

    private _registerTargetDestroyed(
        target: Target,
        targets: Target[],
        obstacles: Obstacle[],
        result: CollisionResult,
        explodedBarrelIds: Set<string>,
    ): void {
        if (!result.targetsHit.includes(target)) {
            result.targetsHit.push(target);
            result.targetScore += target.scoreValue;
            result.totalScore += target.scoreValue;
        }

        if (target.type === "barrel") {
            this._explodeBarrel(target, targets, obstacles, result, explodedBarrelIds);
        }
    }

    private _registerObstacleDestroyed(obstacle: Obstacle, result: CollisionResult): void {
        if (result.obstaclesHit.includes(obstacle)) return;
        result.obstaclesHit.push(obstacle);
        result.obstacleScore += 25;
        result.totalScore += 25;
    }

    private _explodeBarrel(
        barrel: Target,
        targets: Target[],
        obstacles: Obstacle[],
        result: CollisionResult,
        explodedBarrelIds: Set<string>,
    ): void {
        if (explodedBarrelIds.has(barrel.id)) return;
        explodedBarrelIds.add(barrel.id);

        const center = barrel.mesh.position.clone();
        this._spawnExplosionEffect(barrel, center, BARREL_EXPLOSION_RADIUS);

        for (const target of targets) {
            if (target.id === barrel.id || target.destroyed) continue;

            const dist = Vector3.Distance(center, target.mesh.position);
            if (dist > BARREL_EXPLOSION_RADIUS) continue;

            const falloff = Math.max(0, 1 - dist / BARREL_EXPLOSION_RADIUS);
            if (falloff <= 0) continue;

            const rawDir = target.mesh.position.subtract(center);
            const blastDir = rawDir.lengthSquared() > 1e-8
                ? rawDir.normalize()
                : new Vector3(1, 0, 0);
            const targetImpulse = blastDir
                .add(new Vector3(0, 0.28 * falloff, 0))
                .normalize()
                .scale(BARREL_EXPLOSION_TARGET_IMPULSE * falloff);
            target.applyImpulse(targetImpulse, target.mesh.position);

            const damage = Math.max(0.2, BARREL_EXPLOSION_TARGET_DAMAGE * falloff);
            const killed = target.hit(damage);
            if (killed) {
                this._registerTargetDestroyed(target, targets, obstacles, result, explodedBarrelIds);
            }
        }

        for (const obstacle of obstacles) {
            if (obstacle.destroyed) continue;

            const bb = obstacle.mesh.getBoundingInfo().boundingBox;
            const closest = Vector3.Clamp(center, bb.minimumWorld, bb.maximumWorld);
            const dist = Vector3.Distance(center, closest);
            if (dist > BARREL_EXPLOSION_RADIUS) continue;

            const falloff = Math.max(0, 1 - dist / BARREL_EXPLOSION_RADIUS);
            if (falloff <= 0) continue;

            const rawDir = obstacle.mesh.position.subtract(center);
            const horizontalDir = rawDir.lengthSquared() > 1e-8
                ? rawDir.normalize()
                : new Vector3(1, 0, 0);
            const impulseDir = horizontalDir
                .add(new Vector3(0, 0.22 * falloff, 0))
                .normalize();
            const impulseMag = BARREL_EXPLOSION_OBSTACLE_IMPULSE * falloff;
            obstacle.applyImpulse(impulseDir.scale(impulseMag), closest);

            const destroyed = obstacle.hit(Math.max(0.1, BARREL_EXPLOSION_OBSTACLE_DAMAGE * falloff));
            if (destroyed) {
                this._registerObstacleDestroyed(obstacle, result);
            }
        }
    }

    private _spawnExplosionEffect(barrel: Target, center: Vector3, radius: number): void {
        const scene = barrel.mesh.getScene();
        const tag = `explosion_${barrel.id}`;

        const flash = MeshBuilder.CreateSphere(`${tag}_flash`, { diameter: 0.6, segments: 14 }, scene);
        flash.position.copyFrom(center);
        flash.isPickable = false;
        flash.renderingGroupId = 2;

        const flashMat = new StandardMaterial(`${tag}_mat`, scene);
        flashMat.disableLighting = true;
        flashMat.emissiveColor = new Color3(1.25, 0.62, 0.14);
        flashMat.alpha = 0.85;
        flash.material = flashMat;

        const blastLight = new PointLight(`${tag}_light`, center.clone(), scene);
        blastLight.diffuse = new Color3(1.0, 0.65, 0.25);
        blastLight.range = radius * 3.2;
        blastLight.intensity = 22;

        // Use a frame observer so the effect works without relying on scene animation helpers.
        let elapsed = 0;
        const startScale = 0.2;
        const endScale = Math.max(0.5, radius * 0.9);
        const observer = scene.onBeforeRenderObservable.add(() => {
            const dt = scene.getEngine().getDeltaTime() / 1000;
            elapsed += dt;

            const t = Math.min(elapsed / BARREL_EXPLOSION_VFX_DURATION, 1);
            const eased = 1 - (1 - t) * (1 - t);
            const scale = startScale + (endScale - startScale) * eased;

            flash.scaling.set(scale, scale, scale);
            flashMat.alpha = 0.85 * (1 - t);
            blastLight.intensity = 22 * (1 - t) * (1 - 0.25 * t);

            if (t >= 1) {
                scene.onBeforeRenderObservable.remove(observer);
                blastLight.dispose();
                flashMat.dispose();
                flash.dispose();
            }
        });
    }

    private _applyTitanCoreShockwave(
        center: Vector3,
        hitObstacle: Obstacle,
        obstacles: Obstacle[],
        result: CollisionResult,
    ): void {
        for (const obstacle of obstacles) {
            if (obstacle.id === hitObstacle.id || obstacle.destroyed) continue;

            const bb = obstacle.mesh.getBoundingInfo().boundingBox;
            const closest = Vector3.Clamp(center, bb.minimumWorld, bb.maximumWorld);
            const dist = Vector3.Distance(center, closest);
            if (dist > TITAN_CORE_SHOCKWAVE_RADIUS) continue;

            const falloff = Math.max(0, 1 - dist / TITAN_CORE_SHOCKWAVE_RADIUS);
            if (falloff <= 0) continue;

            const rawDir = obstacle.mesh.position.subtract(center);
            const outwardDir = rawDir.lengthSquared() > 1e-8
                ? rawDir.normalize()
                : new Vector3(1, 0, 0);
            const impulseDir = outwardDir
                .add(new Vector3(0, 0.35 + 0.12 * falloff, 0))
                .normalize();
            const impulseMag = TITAN_CORE_SHOCKWAVE_OBSTACLE_IMPULSE * (0.35 + 0.65 * falloff);
            obstacle.applyImpulse(impulseDir.scale(impulseMag), closest);

            const damage = Math.max(0.12, TITAN_CORE_SHOCKWAVE_OBSTACLE_DAMAGE * falloff);
            const destroyed = obstacle.hit(damage);
            if (destroyed) {
                this._registerObstacleDestroyed(obstacle, result);
            }
        }
    }
}