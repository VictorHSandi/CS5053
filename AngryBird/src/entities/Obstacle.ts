import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { uid } from "../utils/MathUtils";

export interface ObstacleConfig {
    position: Vector3;
    size?: Vector3;
    color?: Color3;
    /** If true, the obstacle can be destroyed by the projectile. */
    destructible?: boolean;
    health?: number;
}

/**
 * A static or destructible obstacle/structure block.
 */
export class Obstacle {
    public readonly id: string;
    public mesh: Mesh;
    public health: number;
    public destructible: boolean;
    public destroyed = false;

    constructor(scene: Scene, config: ObstacleConfig) {
        this.id = uid("obstacle");
        const size = config.size ?? new Vector3(1, 1, 1);
        this.health = config.health ?? 2;
        this.destructible = config.destructible ?? true;

        this.mesh = MeshBuilder.CreateBox(this.id, {
            width: size.x,
            height: size.y,
            depth: size.z,
        }, scene);
        this.mesh.position = config.position.clone();
        // Sit on ground
        this.mesh.position.y = Math.max(this.mesh.position.y, size.y / 2);

        const mat = new StandardMaterial(`${this.id}_mat`, scene);
        mat.diffuseColor = config.color ?? new Color3(0.72, 0.53, 0.24);
        mat.specularColor = new Color3(0.15, 0.15, 0.15);
        this.mesh.material = mat;
    }

    hit(damage = 1): boolean {
        if (this.destroyed || !this.destructible) return false;
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
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
