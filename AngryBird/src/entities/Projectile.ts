import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PROJECTILE_RADIUS } from "../utils/Constants";

export interface ProjectileConfig {
    radius?: number;
    color?: Color3;
    /** Future: different projectile types could carry special abilities. */
    type?: string;
}

const DEFAULT_CONFIG: Required<ProjectileConfig> = {
    radius: PROJECTILE_RADIUS,
    color: new Color3(1, 0.2, 0.2),
    type: "standard",
};

/**
 * Represents a launchable projectile (the "bird").
 */
export class Projectile {
    public mesh: Mesh;
    public velocity: Vector3 = Vector3.Zero();
    public active = false;
    public lifetime = 0;
    public nudgesUsed = 0;
    public boostUsed = false;

    private readonly _config: Required<ProjectileConfig>;

    constructor(scene: Scene, config: ProjectileConfig = {}) {
        this._config = { ...DEFAULT_CONFIG, ...config } as Required<ProjectileConfig>;

        this.mesh = MeshBuilder.CreateSphere(
            "projectile",
            { diameter: this._config.radius * 2, segments: 16 },
            scene,
        );
        const mat = new StandardMaterial("projectileMat", scene);
        mat.diffuseColor = this._config.color;
        mat.specularColor = new Color3(0.4, 0.4, 0.4);
        this.mesh.material = mat;
        this.mesh.isVisible = false;
    }

    get radius(): number {
        return this._config.radius;
    }

    get type(): string {
        return this._config.type;
    }

    /** Place the projectile at a position and make it visible (pre-launch). */
    spawn(position: Vector3): void {
        this.mesh.position = position.clone();
        this.mesh.isVisible = true;
        this.velocity = Vector3.Zero();
        this.active = false;
        this.lifetime = 0;
        this.nudgesUsed = 0;
        this.boostUsed = false;
    }

    /** Activate physics simulation for the projectile. */
    launch(velocity: Vector3): void {
        this.velocity = velocity.clone();
        this.active = true;
    }

    /** Per-frame update (simple Euler integration). */
    update(dt: number, gravity: number): void {
        if (!this.active) return;
        this.lifetime += dt;

        // Apply gravity
        this.velocity.y += gravity * dt;

        // Integrate position
        this.mesh.position.addInPlace(this.velocity.scale(dt));
    }

    /** Hide and deactivate. */
    deactivate(): void {
        this.active = false;
        this.mesh.isVisible = false;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}
