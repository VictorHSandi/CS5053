import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { uid } from "../utils/MathUtils";
import { OBSTACLE_MASS, OBSTACLE_RESTITUTION, OBSTACLE_FRICTION } from "../utils/Constants";

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
 * Now a Havok rigid body — blocks tumble and react to impacts.
 */
export class Obstacle {
    public readonly id: string;
    public mesh: Mesh;
    public health: number;
    public destructible: boolean;
    public destroyed = false;
    private _physicsAggregate: PhysicsAggregate;
    private _scene: Scene;
    private _lastHitTime = 0;

    constructor(scene: Scene, config: ObstacleConfig) {
        this._scene = scene;
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

        // Havok rigid body
        // mass > 0 makes it dynamic (moves), mass = 0 would be static
        this._physicsAggregate = new PhysicsAggregate(
            this.mesh,
            PhysicsShapeType.BOX,
            {
                mass: OBSTACLE_MASS,
                restitution: OBSTACLE_RESTITUTION,
                friction: OBSTACLE_FRICTION,
            },
            scene,
        );
        this._physicsAggregate.body.disablePreStep = false; 
    }

    hit(damage = 1): boolean {
        if (this.destroyed || !this.destructible) return false;

        // Cooldown — only take damage once per second   // NEW
        const now = Date.now();
        if (now - this._lastHitTime < 1000) return false; // NEW
        this._lastHitTime = now;                           // NEW

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
        // Disable physics on destroyed blocks so they don't keep simulating
        this._physicsAggregate.dispose();                                     
    }

    /** Apply a physics impulse at a world-space contact point. */
    applyImpulse(impulse: Vector3, contactPoint: Vector3): void {
        // if (this.destroyed) return; // removed
        const body = this._physicsAggregate.body;
        const bodyId = (body as any)._pluginData.hpBodyId;
        const plugin = (this._scene as any)
            .getPhysicsEngine()
            ._physicsPlugin;
        plugin._hknp.HP_Body_ApplyImpulse(
            bodyId,
            [impulse.x, impulse.y, impulse.z],
            [contactPoint.x, contactPoint.y, contactPoint.z]
        );
    }

    dispose(): void {
        this._physicsAggregate.dispose(); // NEW
        this.mesh.dispose();
    }
}