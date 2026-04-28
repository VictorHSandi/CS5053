import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Projectile } from "../entities/Projectile";
import { GRAVITY, PROJECTILE_LIFETIME } from "../utils/Constants";

/**
 * Manages the active projectile: spawning, physics integration, lifetime.
 */
export class ProjectileSystem {
    public projectile: Projectile;

    constructor(scene: Scene) {
        this.projectile = new Projectile(scene);
    }

    /** Place projectile at the launcher, ready for launch. */
    spawn(position: Vector3): void {
        this.projectile.spawn(position);
    }

    /** Fire with the given velocity. */
    launch(velocity: Vector3): void {
        this.projectile.launch(velocity);
    }

    /**
     * Per-frame update. Returns true while projectile is still active.
     */
    update(dt: number, gravity: number = GRAVITY): boolean {
        const p = this.projectile;
        if (!p.active) return false;

        p.update(dt, gravity);

        // Ground collision
        if (p.mesh.position.y <= p.radius) {
            p.mesh.position.y = p.radius;
            p.velocity = Vector3.Zero();
            p.deactivate();
            return false;
        }

        // Lifetime — extend on moon gravity since ball travels much further
        const maxLifetime = gravity === -1.62 
            ? PROJECTILE_LIFETIME * 4   // moon — 4x longer
            : PROJECTILE_LIFETIME;      // earth — normal

        if (p.lifetime >= maxLifetime) {
            p.deactivate();
            return false;
        }

        return true;
    }

    /** World position of the projectile. */
    get position(): Vector3 {
        return this.projectile.mesh.position;
    }

    get velocity(): Vector3 {
        return this.projectile.velocity;
    }

    get active(): boolean {
        return this.projectile.active;
    }

    dispose(): void {
        this.projectile.dispose();
    }
}
