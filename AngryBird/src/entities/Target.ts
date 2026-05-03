import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { uid } from "../utils/MathUtils";

export interface TargetConfig {
    position: Vector3;
    size?: number;
    color?: Color3;
    health?: number;
    scoreValue?: number;
    type?: string;
}

/**
 * Draws a pig face onto a 256x256 DynamicTexture canvas.
 * Green body, round snout with nostrils, beady eyes, small ears.
 */
function createPigTexture(scene: Scene, id: string): DynamicTexture {
    const size = 256;
    const tex = new DynamicTexture(`pigTex_${id}`, { width: size, height: size }, scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const c = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Body
    ctx.beginPath();
    ctx.arc(c, c, 110, 0, Math.PI * 2);
    ctx.fillStyle = "#3aaa35";
    ctx.fill();

    // Lighter belly
    ctx.beginPath();
    ctx.ellipse(c, c + 20, 65, 55, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#5cc956";
    ctx.fill();

    // Body outline
    ctx.beginPath();
    ctx.arc(c, c, 110, 0, Math.PI * 2);
    ctx.strokeStyle = "#1e6b1a";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Ears (small bumps at top)
    for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(c + sign * 72, c - 90, 22, 18, sign * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#2d8a28";
        ctx.fill();
        ctx.strokeStyle = "#1e6b1a";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Inner ear
        ctx.beginPath();
        ctx.ellipse(c + sign * 72, c - 90, 12, 10, sign * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#e88080";
        ctx.fill();
    }

    // Eyes (beady, slightly nervous)
    const eyeY = c - 28;
    const eyeOffX = 34;
    const eyeR = 20;
    for (const sign of [-1, 1]) {
        // White sclera
        ctx.beginPath();
        ctx.arc(c + sign * eyeOffX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#1e6b1a";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pupil
        ctx.beginPath();
        ctx.arc(c + sign * eyeOffX, eyeY, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#111111";
        ctx.fill();

        // Shine
        ctx.beginPath();
        ctx.arc(c + sign * eyeOffX + 4, eyeY - 5, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }

    // Snout (round, centered lower on face)
    const snoutY = c + 28;
    ctx.beginPath();
    ctx.ellipse(c, snoutY, 40, 32, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#5cc956";
    ctx.fill();
    ctx.strokeStyle = "#1e6b1a";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Nostrils
    for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(c + sign * 14, snoutY + 4, 9, 7, sign * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "#1e6b1a";
        ctx.fill();
    }

    // Smile
    ctx.beginPath();
    ctx.arc(c, snoutY - 4, 22, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = "#1e6b1a";
    ctx.lineWidth = 3;
    ctx.stroke();

    tex.update();
    return tex;
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

    private _mat: StandardMaterial;

    constructor(scene: Scene, config: TargetConfig) {
        this.id = uid("target");
        const size = config.size ?? 0.8;
        this.health = config.health ?? 1;
        this.maxHealth = this.health;
        this.scoreValue = config.scoreValue ?? 100;
        this.type = config.type ?? "pig";

        this.mesh = MeshBuilder.CreateSphere(
            this.id,
            { diameter: size, segments: 16 },
            scene,
        );
        this.mesh.position = config.position.clone();
        this.mesh.position.y = Math.max(this.mesh.position.y, size / 2);

<<<<<<< HEAD
        const mat = new StandardMaterial(`${this.id}_mat`, scene);
        mat.ambientColor = new Color3(0.07, 0.18, 0.07);
        mat.diffuseColor = config.color ?? new Color3(0.2, 0.85, 0.2);
        mat.specularColor = new Color3(0.3, 0.3, 0.3);
        mat.specularPower = 64;
        this.mesh.material = mat;
        this.mesh.receiveShadows = true;
=======
        this._mat = new StandardMaterial(`${this.id}_mat`, scene);
        this._mat.diffuseTexture = createPigTexture(scene, this.id);
        this._mat.specularColor = new Color3(0.2, 0.3, 0.2);
        this._mat.specularPower = 16;
        this.mesh.material = this._mat;
>>>>>>> Textures
    }

    hit(damage = 1): boolean {
        if (this.destroyed) return false;
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        // Flash: tint the diffuse color red briefly, then restore
        this._mat.diffuseColor = new Color3(1.5, 0.4, 0.4);
        setTimeout(() => {
            if (!this.destroyed) this._mat.diffuseColor = new Color3(1, 1, 1);
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