import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b. */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * clamp(t, 0, 1);
}

/** Lerp a Vector3. Returns a new vector. */
export function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
    return new Vector3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
}

/** Smooth-step ease curve (0→1). */
export function smoothStep(t: number): number {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
}

/** Compute simple ballistic trajectory points (no drag). */
export function ballisticTrajectory(
    origin: Vector3,
    velocity: Vector3,
    gravity: number,
    steps: number,
    dt: number,
): Vector3[] {
    const points: Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i * dt;
        points.push(
            new Vector3(
                origin.x + velocity.x * t,
                origin.y + velocity.y * t + 0.5 * gravity * t * t,
                origin.z + velocity.z * t,
            ),
        );
    }
    return points;
}

/** Generate a unique ID string. */
let _idCounter = 0;
export function uid(prefix = "id"): string {
    return `${prefix}_${++_idCounter}`;
}
