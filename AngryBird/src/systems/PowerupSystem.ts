import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Projectile } from "../entities/Projectile";
import { Powerup } from "../entities/Powerup";

export interface PowerupCollectResult {
    titanCoreCollected: number;
}

/**
 * Handles floating powerup animation and collection checks.
 */
export class PowerupSystem {
    update(powerups: Powerup[], dt: number): void {
        for (const powerup of powerups) {
            powerup.update(dt);
        }
    }

    checkCollections(projectile: Projectile, powerups: Powerup[]): PowerupCollectResult {
        const result: PowerupCollectResult = { titanCoreCollected: 0 };
        if (!projectile.active) return result;

        const projectilePos = projectile.mesh.position;
        for (const powerup of powerups) {
            if (powerup.collected) continue;

            const dist = Vector3.Distance(projectilePos, powerup.mesh.position);
            if (dist > projectile.radius + powerup.radius) continue;

            powerup.collect();
            if (powerup.type === "titanCore") {
                result.titanCoreCollected++;
            }
        }

        return result;
    }
}
