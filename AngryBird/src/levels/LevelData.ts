import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";

// ── Serialisable level data interfaces ───────────────────

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface TargetDef {
    position: Vec3;
    size?: number;
    color?: { r: number; g: number; b: number };
    health?: number;
    scoreValue?: number;
    type?: string;
}

export interface ObstacleDef {
    position: Vec3;
    size?: Vec3;
    color?: { r: number; g: number; b: number };
    destructible?: boolean;
    health?: number;
}

export interface LevelDef {
    id: string;
    name: string;
    /** Launcher world position (the slingshot). */
    launcherPosition: Vec3;
    /** Default launch direction (unit-ish vector). */
    launchDirection: Vec3;
    targets: TargetDef[];
    obstacles: ObstacleDef[];
    /** Max shots the player gets this level. */
    maxShots: number;
    /** Score thresholds for 1 / 2 / 3 stars. */
    starThresholds: [number, number, number];
    /** Optional time bonus: seconds under which the player gets extra points. */
    timeBonusThreshold?: number;
}

// ── Helpers to convert plain data → engine types ─────────

export function toVec3(v: Vec3): Vector3 {
    return new Vector3(v.x, v.y, v.z);
}

export function toColor3(c?: { r: number; g: number; b: number }): Color3 | undefined {
    return c ? new Color3(c.r, c.g, c.b) : undefined;
}
