import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { uid } from "../utils/MathUtils";

export interface TargetConfig {
    position: Vector3;
    size?: number;
    color?: Color3;
    health?: number;
    scoreValue?: number;
    /** Future: different enemy types. */
    type?: string;
}

/**
 * A destructible target entity ("pig").
 */
export class Target {
    public readonly id: string;
    public mesh: Mesh;
    public health: number;
    public maxHealth: number;
    public scoreValue: number;
    public destroyed = false;
    public readonly type: string;

    constructor(scene: Scene, config: TargetConfig) {
        this.id = uid("target");
        const size = config.size ?? 0.8;
        this.health = config.health ?? 1;
        this.maxHealth = this.health;
        this.scoreValue = config.scoreValue ?? 100;
        this.type = config.type ?? "pig";

        // Visual — a simple sphere "pig"
        this.mesh = MeshBuilder.CreateSphere(
            this.id,
            { diameter: size, segments: 12 },
            scene,
        );
        this.mesh.position = config.position.clone();
        // Raise it so it sits on the ground
        this.mesh.position.y = Math.max(this.mesh.position.y, size / 2);

        const mat = new StandardMaterial(`${this.id}_mat`, scene);
        mat.diffuseColor = config.color ?? new Color3(0.2, 0.85, 0.2);
        mat.specularColor = new Color3(0.3, 0.3, 0.3);
        this.mesh.material = mat;
    }

    /** Apply damage. Returns true if the target was destroyed by this hit. */
    hit(damage = 1): boolean {
        if (this.destroyed) return false;
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        // Flash red briefly
        const mat = this.mesh.material as StandardMaterial;
        const orig = mat.diffuseColor.clone();
        mat.diffuseColor = new Color3(1, 0.3, 0.3);
        setTimeout(() => {
            if (!this.destroyed) mat.diffuseColor = orig;
        }, 120);
        return false;
    }

    destroy(): void {
        this.destroyed = true;
        this.mesh.isVisible = false;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
