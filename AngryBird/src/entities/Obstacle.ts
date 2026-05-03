import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

import { uid } from "../utils/MathUtils";
import {
    OBSTACLE_FRICTION,
    OBSTACLE_MASS,
    OBSTACLE_RESTITUTION,
} from "../utils/Constants";

const WOOD_TEXTURE_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks/wood_planks_diff_1k.jpg";
const WOOD_NORMAL_URL =
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks/wood_planks_nor_gl_1k.jpg";

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

/**
 * Destructible structure block with optional wood/stone materials and Havok body.
 */
export class Obstacle {
    public readonly id: string;
    public mesh: Mesh;
    public health: number;
    public destructible: boolean;
    public destroyed = false;

    private _physicsAggregate: PhysicsAggregate | null = null;
    private _lastHitTime = 0;
    private _lastImpulseTime = 0;

    constructor(scene: Scene, config: ObstacleConfig) {
        this.id = uid("obstacle");

        const size = config.size ?? new Vector3(1, 1, 1);
        this.health = config.health ?? 2;
        this.destructible = config.destructible ?? true;

        this.mesh = MeshBuilder.CreateBox(
            this.id,
            {
                width: size.x,
                height: size.y,
                depth: size.z,
            },
            scene,
        );

        this.mesh.position = config.position.clone();
        this.mesh.position.y = Math.max(this.mesh.position.y, size.y / 2);

        const mat = new StandardMaterial(`${this.id}_mat`, scene);
        const materialType = config.materialType ?? "wood";

        if (materialType === "stone") {
            const diffuse = new Texture(STONE_TEXTURE_URL, scene);
            const normal = new Texture(STONE_NORMAL_URL, scene);
            diffuse.uScale = size.x;
            diffuse.vScale = size.y;
            normal.uScale = size.x;
            normal.vScale = size.y;
            mat.diffuseTexture = diffuse;
            mat.bumpTexture = normal;
            mat.specularColor = new Color3(0.3, 0.3, 0.3);
            mat.specularPower = 20;
            mat.emissiveColor = new Color3(0.03, 0.03, 0.03);
        } else {
            const diffuse = new Texture(WOOD_TEXTURE_URL, scene);
            const normal = new Texture(WOOD_NORMAL_URL, scene);
            diffuse.uScale = size.x;
            diffuse.vScale = size.y;
            normal.uScale = size.x;
            normal.vScale = size.y;
            mat.diffuseTexture = diffuse;
            mat.bumpTexture = normal;
            mat.specularColor = new Color3(0.1, 0.08, 0.05);
            mat.specularPower = 8;
        }

        if (config.color) {
            mat.diffuseColor = config.color;
        }

        this.mesh.material = mat;
        this.mesh.receiveShadows = true;

        const massScale = materialType === "stone" ? 1.35 : 0.75;

        this._physicsAggregate = new PhysicsAggregate(
            this.mesh,
            PhysicsShapeType.BOX,
            {
                mass: OBSTACLE_MASS * massScale,
                restitution: OBSTACLE_RESTITUTION,
                friction: OBSTACLE_FRICTION,
            },
            scene,
        );
        this._physicsAggregate.body.disablePreStep = false;
        // Slight damping keeps motion plausible while still allowing topples.
        (this._physicsAggregate.body as any).setLinearDamping?.(0.08);
        (this._physicsAggregate.body as any).setAngularDamping?.(0.12);
    }

    hit(damage = 1): boolean {
        if (this.destroyed || !this.destructible) return false;

        // Prevent one sustained overlap from draining all health in a single instant.
        const now = Date.now();
        if (now - this._lastHitTime < 180) return false;
        this._lastHitTime = now;

        this.health -= damage;

        const mat = this.mesh.material as StandardMaterial | null;
        if (mat) {
            mat.diffuseColor = mat.diffuseColor.scale(0.86);
        }

        if (this.health <= 0) {
            this.destroy();
            return true;
        }

        return false;
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;

        if (this._physicsAggregate) {
            this._physicsAggregate.dispose();
            this._physicsAggregate = null;
        }

        this.mesh.setEnabled(false);
    }

    /** Apply a physics impulse at a world-space contact point. */
    applyImpulse(impulse: Vector3, contactPoint: Vector3): void {
        if (this.destroyed || !this._physicsAggregate) return;

        const now = Date.now();
        if (now - this._lastImpulseTime < 60) return;
        this._lastImpulseTime = now;

        const physicsEngine = this.mesh.getScene().getPhysicsEngine() as any;
        const plugin = physicsEngine?._physicsPlugin;
        const bodyAny = this._physicsAggregate.body as any;
        const bodyId = bodyAny?._pluginData?.hpBodyId;
        if (!plugin || !bodyId) return;

        // Wake body before impulse so sleeping blocks react immediately.
        plugin._hknp.HP_Body_SetActivationState(bodyId, 1);

        plugin._hknp.HP_Body_ApplyImpulse(
            bodyId,
            [impulse.x, impulse.y, impulse.z],
            [contactPoint.x, contactPoint.y, contactPoint.z],
        );
    }

    dispose(): void {
        if (this._physicsAggregate) {
            this._physicsAggregate.dispose();
            this._physicsAggregate = null;
        }
        this.mesh.dispose();
    }
}