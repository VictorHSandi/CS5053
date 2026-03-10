import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Projectile } from "../entities/Projectile";
import { Target } from "../entities/Target";
import { Obstacle } from "../entities/Obstacle";
import { TARGET_HIT_VELOCITY_MIN } from "../utils/Constants";

export interface CollisionResult {
    targetsHit: Target[];
    obstaclesHit: Obstacle[];
    totalScore: number;
}

/**
 * Checks for collisions between the projectile and targets/obstacles.
 * Uses simple sphere-vs-sphere / sphere-vs-AABB overlap tests.
 */
export class TargetSystem {
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
        if (!projectile.active) return result;

        const pPos = projectile.mesh.position;
        const pRad = projectile.radius;
        const speed = projectile.velocity.length();

        // ── Targets (sphere-sphere) ─────────────────────────
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

        // ── Obstacles (sphere vs AABB) ──────────────────────
        for (const obs of obstacles) {
            if (obs.destroyed) continue;
            const bb = obs.mesh.getBoundingInfo().boundingBox;
            const closest = Vector3.Clamp(pPos, bb.minimumWorld, bb.maximumWorld);
            const dist = Vector3.Distance(pPos, closest);
            if (dist < pRad) {
                const destroyed = obs.hit();
                if (destroyed) {
                    result.obstaclesHit.push(obs);
                    result.totalScore += 25; // small bonus for breaking structures
                }
                // Reflect / stop projectile on obstacle hit
                projectile.velocity = projectile.velocity.scale(0.15);
            }
        }

        return result;
    }
}
