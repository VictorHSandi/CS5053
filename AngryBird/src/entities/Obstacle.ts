import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { uid } from "../utils/MathUtils";

// ── WOOD ─────────────────────────────────────────────
const WOOD_TEXTURE_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks/wood_planks_diff_1k.jpg";

const WOOD_NORMAL_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks/wood_planks_nor_gl_1k.jpg";

// ── STONE ────────────────────────────────────────────
const STONE_TEXTURE_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/brick_wall_08/brick_wall_08_diff_4k.jpg";

const STONE_NORMAL_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/brick_wall_08/brick_wall_08_nor_gl_4k.jpg";

export interface ObstacleConfig {
    position: Vector3;
    size?: Vector3;
    color?: Color3;
    destructible?: boolean;
    health?: number;
    materialType?: "wood" | "stone";
}

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
        this.mesh.position.y = Math.max(this.mesh.position.y, size.y / 2);

        // ─────────────────────────────────────────────
        // HARD DEBUG: confirm what we actually received
        // ─────────────────────────────────────────────
        const rawType = config.materialType;
        const type = (rawType ?? "wood").trim().toLowerCase();

        console.log(`[Obstacle] RAW materialType:`, rawType);
        console.log(`[Obstacle] NORMALIZED type:`, type);

        if (type === "stone") {
            console.log("🪨 STONE OBSTACLE CREATED");

            // make failure IMPOSSIBLE to miss visually
            this.mesh.visibility = 1;

            const mat = new StandardMaterial(`${this.id}_mat`, scene);

            const tex = new Texture(STONE_TEXTURE_URL, scene);
            const normalTex = new Texture(STONE_NORMAL_URL, scene);

            mat.diffuseTexture = tex;
            mat.bumpTexture = normalTex;

            mat.specularColor = new Color3(0.3, 0.3, 0.3);
            mat.specularPower = 20;

            mat.emissiveColor = new Color3(0.05, 0.05, 0.05);

            tex.uScale = size.x;
            tex.vScale = size.y;

            normalTex.uScale = size.x;
            normalTex.vScale = size.y;

            this.mesh.material = mat;
            return;
        }

        // ─────────────────────────────────────────────
        // DEFAULT (WOOD)
        // ─────────────────────────────────────────────
        console.log("🪵 WOOD OBSTACLE CREATED");

        const mat = new StandardMaterial(`${this.id}_mat`, scene);

        const tex = new Texture(WOOD_TEXTURE_URL, scene);
        const normalTex = new Texture(WOOD_NORMAL_URL, scene);

        mat.diffuseTexture = tex;
        mat.bumpTexture = normalTex;

        mat.specularColor = new Color3(0.1, 0.08, 0.05);
        mat.specularPower = 8;

        tex.uScale = size.x;
        tex.vScale = size.y;

        normalTex.uScale = size.x;
        normalTex.vScale = size.y;

        this.mesh.material = mat;
        this.mesh.receiveShadows = true;
    }

    hit(damage = 1): boolean {
        if (this.destroyed || !this.destructible) return false;

        this.health -= damage;

        if (this.health <= 0) {
            this.destroy();
            return true;
        }

        const mat = this.mesh.material as StandardMaterial;
        const darken = 1 - (0.2 * (1 - this.health / 2));

        mat.diffuseColor = new Color3(
            0.95 * darken,
            0.85 * darken,
            0.7 * darken
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