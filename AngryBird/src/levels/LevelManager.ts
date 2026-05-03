import { Scene } from "@babylonjs/core/scene";
import { LevelDef, toVec3, toColor3 } from "./LevelData";
import { Target } from "../entities/Target";
import { Obstacle } from "../entities/Obstacle";
import { setSkybox } from "../scenes/SceneSetup";
import { LEVELS } from "./levels";

/**
 * Manages level lifecycle: loading, resetting, and progression.
 */
export class LevelManager {
    private _currentIndex = 0;
    public targets: Target[] = [];
    public obstacles: Obstacle[] = [];

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

        for (const td of def.targets) {
            this.targets.push(
                new Target(scene, {
                    position: toVec3(td.position),
                    size: td.size,
                    color: toColor3(td.color),
                    health: td.health,
                    scoreValue: td.scoreValue,
                    type: td.type,
                }),
            );
        }

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
        this.targets = [];
        this.obstacles = [];
    }

    /** Number of targets still alive. */
    get aliveTargetCount(): number {
        return this.targets.filter((t) => !t.destroyed).length;
    }

    dispose(): void {
        this.clearEntities();
    }
}