import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Projectile } from "../entities/Projectile";
import { InputController } from "./InputController";
import {
    FLIGHT_STEER_FORCE,
    FLIGHT_PITCH_FORCE,
    FLIGHT_BOOST_IMPULSE,
    FLIGHT_MAX_ASCENT_SPEED,
    FLIGHT_MAX_SPEED,
} from "../utils/Constants";

/**
 * Provides subtle mid-air control while the projectile is in flight.
 * The player can steer slightly with arrow keys / WASD, and has one boost.
 */
export class FlightControlSystem {
    /**
     * Apply air control based on current input.
     * Should be called each frame while in Flying state.
     */
    update(projectile: Projectile, input: InputController, dt: number): void {
        if (!projectile.active) return;

        // ── Lateral steering (A/D or ArrowLeft/ArrowRight) ──
        if (input.keys.has("KeyA") || input.keys.has("ArrowLeft")) {
            this._applySteer(projectile, new Vector3(0, 0, 1), FLIGHT_STEER_FORCE, dt);
        }
        if (input.keys.has("KeyD") || input.keys.has("ArrowRight")) {
            this._applySteer(projectile, new Vector3(0, 0, -1), FLIGHT_STEER_FORCE, dt);
        }

        // ── Pitch adjustment (W/S or ArrowUp/ArrowDown) ─────
        if (input.keys.has("KeyW") || input.keys.has("ArrowUp")) {
            if (projectile.velocity.y < FLIGHT_MAX_ASCENT_SPEED) {
                this._applySteer(projectile, new Vector3(0, 1, 0), FLIGHT_PITCH_FORCE, dt);
            }
        }
        if (input.keys.has("KeyS") || input.keys.has("ArrowDown")) {
            this._applySteer(projectile, new Vector3(0, -1, 0), FLIGHT_PITCH_FORCE, dt);
        }

        // ── One-time boost (Space) ──────────────────────────
        if (input.keys.has("Space") && !projectile.boostUsed) {
            const fwd = projectile.velocity.normalizeToNew();
            projectile.velocity.addInPlace(fwd.scale(FLIGHT_BOOST_IMPULSE));
            this._clampFlightVelocity(projectile);
            projectile.boostUsed = true;
            // Consume the key so it doesn't repeat
            input.keys.delete("Space");
        }

        this._clampFlightVelocity(projectile);
    }

    private _applySteer(proj: Projectile, dir: Vector3, force: number, dt: number): void {
        proj.velocity.addInPlace(dir.scale(force * dt));
    }

    private _clampFlightVelocity(proj: Projectile): void {
        if (proj.velocity.y > FLIGHT_MAX_ASCENT_SPEED) {
            proj.velocity.y = FLIGHT_MAX_ASCENT_SPEED;
        }

        const speed = proj.velocity.length();
        if (speed > FLIGHT_MAX_SPEED) {
            proj.velocity.scaleInPlace(FLIGHT_MAX_SPEED / speed);
        }
    }
}
