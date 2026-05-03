import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { uid } from "../utils/MathUtils";

export interface PowerupConfig {
    position: Vector3;
    size?: number;
    type?: "titanCore";
}

/**
 * Floating collectible item that grants a temporary gameplay buff.
 */
export class Powerup {
    public readonly id: string;
    public readonly type: "titanCore";
    public readonly radius: number;
    public mesh: Mesh;
    public collected = false;

    private _basePosition: Vector3;
    private _elapsed = Math.random() * Math.PI * 2;
    private _light: PointLight | null = null;

    constructor(scene: Scene, config: PowerupConfig) {
        this.id = uid("powerup");
        this.type = config.type ?? "titanCore";

        const size = config.size ?? 0.7;
        this.radius = size * 0.5;

        this.mesh = MeshBuilder.CreateSphere(
            this.id,
            { diameter: size, segments: 12 },
            scene,
        );
        this.mesh.position = config.position.clone();
        this.mesh.isPickable = false;
        this._basePosition = this.mesh.position.clone();

        const coreMat = new StandardMaterial(`${this.id}_coreMat`, scene);
        coreMat.diffuseColor = new Color3(0.98, 0.72, 0.2);
        coreMat.emissiveColor = new Color3(0.85, 0.5, 0.1);
        coreMat.specularColor = new Color3(0.4, 0.26, 0.1);
        coreMat.specularPower = 28;
        this.mesh.material = coreMat;

        const ring = MeshBuilder.CreateTorus(
            `${this.id}_ring`,
            {
                diameter: size * 1.45,
                thickness: size * 0.14,
                tessellation: 24,
            },
            scene,
        );
        ring.parent = this.mesh;
        ring.rotation.x = Math.PI * 0.5;
        ring.isPickable = false;

        const ringMat = new StandardMaterial(`${this.id}_ringMat`, scene);
        ringMat.diffuseColor = new Color3(1.0, 0.9, 0.35);
        ringMat.emissiveColor = new Color3(0.8, 0.65, 0.2);
        ringMat.specularColor = new Color3(0.5, 0.4, 0.2);
        ring.material = ringMat;

        this._light = new PointLight(`${this.id}_light`, this.mesh.position.clone(), scene);
        this._light.diffuse = new Color3(1.0, 0.72, 0.28);
        this._light.range = 9;
        this._light.intensity = 2.2;
    }

    update(dt: number): void {
        if (this.collected) return;

        this._elapsed += dt;
        this.mesh.rotation.y += dt * 2.0;
        this.mesh.rotation.x += dt * 0.35;

        const bob = Math.sin(this._elapsed * 2.1) * 0.26;
        this.mesh.position.y = this._basePosition.y + bob;

        if (this._light) {
            this._light.position.copyFrom(this.mesh.position);
            this._light.intensity = 2.0 + Math.sin(this._elapsed * 6.0) * 0.35;
        }
    }

    collect(): void {
        if (this.collected) return;
        this.collected = true;
        this.mesh.setEnabled(false);

        if (this._light) {
            this._light.dispose();
            this._light = null;
        }
    }

    dispose(): void {
        if (this._light) {
            this._light.dispose();
            this._light = null;
        }
        this.mesh.dispose();
    }
}
