import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { uid } from "../utils/MathUtils";

// ── CC0 wood plank texture (Angry Birds classic: wood structures) ──
const WOOD_TEXTURE_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks/wood_planks_diff_1k.jpg";

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

        // Wood plank texture — tiles nicely on boxes of any size
        const tex = new Texture(WOOD_TEXTURE_URL, scene);
        // Scale UV based on the largest face dimension so planks look consistent
        tex.uScale = Math.max(size.x, size.z) / 2;
        tex.vScale = size.y / 2;
        mat.diffuseTexture = tex;

        // Warm wood tint
        mat.diffuseColor = config.color ?? new Color3(0.95, 0.85, 0.7);
        mat.specularColor = new Color3(0.1, 0.08, 0.05);
        mat.specularPower = 8;

        this.mesh.material = mat;
    }

    hit(damage = 1): boolean {
        if (this.destroyed || !this.destructible) return false;
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        // Darken slightly when damaged — shows wear
        const mat = this.mesh.material as StandardMaterial;
        const darken = 1 - (0.2 * (1 - this.health / 2));
        mat.diffuseColor = new Color3(
            0.95 * darken,
            0.85 * darken,
            0.7 * darken,
        );
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
