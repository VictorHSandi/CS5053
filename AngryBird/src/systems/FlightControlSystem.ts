import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Projectile } from "../entities/Projectile";
import { InputController } from "./InputController";
import {
    FLIGHT_STEER_FORCE,
    FLIGHT_PITCH_FORCE,
    FLIGHT_BOOST_IMPULSE,
    FLIGHT_MAX_NUDGES,
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

        const nudgeUsed = { value: false };

        // ── Lateral steering (A/D or ArrowLeft/ArrowRight) ──
        if (input.keys.has("KeyA") || input.keys.has("ArrowLeft")) {
            this._applyNudge(projectile, new Vector3(0, 0, -1), FLIGHT_STEER_FORCE, dt, nudgeUsed);
        }
        if (input.keys.has("KeyD") || input.keys.has("ArrowRight")) {
            this._applyNudge(projectile, new Vector3(0, 0, 1), FLIGHT_STEER_FORCE, dt, nudgeUsed);
        }

        // ── Pitch adjustment (W/S or ArrowUp/ArrowDown) ─────
        if (input.keys.has("KeyW") || input.keys.has("ArrowUp")) {
            this._applyNudge(projectile, new Vector3(0, 1, 0), FLIGHT_PITCH_FORCE, dt, nudgeUsed);
        }
        if (input.keys.has("KeyS") || input.keys.has("ArrowDown")) {
            this._applyNudge(projectile, new Vector3(0, -1, 0), FLIGHT_PITCH_FORCE, dt, nudgeUsed);
        }

        // ── One-time boost (Space) ──────────────────────────
        if (input.keys.has("Space") && !projectile.boostUsed) {
            const fwd = projectile.velocity.normalizeToNew();
            projectile.velocity.addInPlace(fwd.scale(FLIGHT_BOOST_IMPULSE));
            projectile.boostUsed = true;
            // Consume the key so it doesn't repeat
            input.keys.delete("Space");
        }
    }

    private _applyNudge(
        proj: Projectile,
        dir: Vector3,
        force: number,
        dt: number,
        nudgeUsed: { value: boolean },
    ): void {
        if (proj.nudgesUsed >= FLIGHT_MAX_NUDGES) return;
        proj.velocity.addInPlace(dir.scale(force * dt));
        if (!nudgeUsed.value) {
            proj.nudgesUsed++;
            nudgeUsed.value = true;
        }
    }
}
