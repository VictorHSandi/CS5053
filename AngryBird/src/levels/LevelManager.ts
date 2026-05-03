import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LevelDef, toVec3, toColor3 } from "./LevelData";
import { Target } from "../entities/Target";
import { Obstacle } from "../entities/Obstacle";
import { Powerup } from "../entities/Powerup";
import { setSkybox } from "../scenes/SceneSetup";
import { LEVELS } from "./levels";

/**
 * Manages level lifecycle: loading, resetting, and progression.
 */
export class LevelManager {
    private _currentIndex = 0;
    public targets: Target[] = [];
    public obstacles: Obstacle[] = [];
    public powerups: Powerup[] = [];

    get currentDef(): LevelDef {
        return LEVELS[this._currentIndex];
    }

    get currentIndex(): number {
        return this._currentIndex;
    }

    get totalLevels(): number {
        return LEVELS.length;
    }

    get hasNextLevel(): boolean {
        return this._currentIndex < LEVELS.length - 1;
    }

    /** Load (or reload) the current level into the given scene. */
    load(scene: Scene): void {
        this.clearEntities();
        const def = this.currentDef;

        // Swap skybox to match this level
        setSkybox(scene, def.skybox);

        for (const od of def.obstacles) {
            this.obstacles.push(
                new Obstacle(scene, {
                    position: toVec3(od.position),
                    size: od.size ? toVec3(od.size) : undefined,
                    color: toColor3(od.color),
                    destructible: od.destructible,
                    health: od.health,
                    materialType: od.materialType, 
                }),
            );
        }

        for (const td of def.targets) {
            const targetSize = td.size ?? 0.8;
            const resolvedPosition = this._resolveTargetSpawn(
                toVec3(td.position),
                targetSize,
            );

            this.targets.push(
                new Target(scene, {
                    position: resolvedPosition,
                    size: td.size,
                    color: toColor3(td.color),
                    health: td.health,
                    scoreValue: td.scoreValue,
                    type: td.type,
                }),
            );
        }

        for (const pd of def.powerups ?? []) {
            this.powerups.push(
                new Powerup(scene, {
                    position: toVec3(pd.position),
                    size: pd.size,
                    type: pd.type,
                }),
            );
        }
    }

    /** Move target spawns out of any obstacle volume to avoid initial overlap. */
    private _resolveTargetSpawn(position: Vector3, diameter: number): Vector3 {
        const radius = diameter * 0.5;
        const resolved = position.clone();
        resolved.y = Math.max(resolved.y, radius);

        for (let iter = 0; iter < 8; iter++) {
            let moved = false;

            for (const obstacle of this.obstacles) {
                if (obstacle.destroyed) continue;

                obstacle.mesh.computeWorldMatrix(true);
                const bb = obstacle.mesh.getBoundingInfo().boundingBox;
                const closest = Vector3.Clamp(resolved, bb.minimumWorld, bb.maximumWorld);
                const offset = resolved.subtract(closest);
                const dist = offset.length();

                if (dist >= radius) continue;

                moved = true;
                if (dist > 1e-5) {
                    const pushDir = offset.scale(1 / dist);
                    const pushAmount = (radius - dist) + 0.04;
                    resolved.addInPlace(pushDir.scale(pushAmount));
                } else {
                    resolved.y = bb.maximumWorld.y + radius + 0.06;
                }

                resolved.y = Math.max(resolved.y, radius);
            }

            if (!moved) break;
        }

        return resolved;
    }

    /** Advance to the next level. Returns false if there's no next level. */
    nextLevel(): boolean {
        if (!this.hasNextLevel) return false;
        this._currentIndex++;
        return true;
    }

    /** Jump to a specific level by index. */
    setLevel(index: number): void {
        this._currentIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
    }

    /** Dispose all spawned entities. */
    clearEntities(): void {
        for (const t of this.targets) t.dispose();
        for (const o of this.obstacles) o.dispose();
        for (const p of this.powerups) p.dispose();
        this.targets = [];
        this.obstacles = [];
        this.powerups = [];
    }

    /** Number of objective targets still alive (barrels do not count). */
    get aliveTargetCount(): number {
        return this.targets.filter((t) => !t.destroyed && t.isObjective).length;
    }

    dispose(): void {
        this.clearEntities();
    }
}