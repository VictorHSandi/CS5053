import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PROJECTILE_RADIUS } from "../utils/Constants";

export interface ProjectileConfig {
    radius?: number;
    color?: Color3;
    type?: string;
}

const DEFAULT_CONFIG: Required<ProjectileConfig> = {
    radius: PROJECTILE_RADIUS,
    color: new Color3(1, 0.2, 0.2),
    type: "standard",
};

/**
 * Draws an angry bird face onto a 256x256 DynamicTexture canvas.
 * Red body, white eyes, angry V-brows, orange beak, crest tuft on top.
 */
function createBirdTexture(scene: Scene): DynamicTexture {
    const size = 256;
    const tex = new DynamicTexture("birdTex", { width: size, height: size }, scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const c = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Body
    ctx.beginPath();
    ctx.arc(c, c, 110, 0, Math.PI * 2);
    ctx.fillStyle = "#d42b2b";
    ctx.fill();

    // Belly highlight
    ctx.beginPath();
    ctx.ellipse(c, c + 30, 60, 50, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#e85c5c";
    ctx.fill();

    // Body outline
    ctx.beginPath();
    ctx.arc(c, c, 110, 0, Math.PI * 2);
    ctx.strokeStyle = "#7a0000";
    ctx.lineWidth = 4;
    ctx.stroke();

    // White eye sclera
    const eyeY = c - 20;
    const eyeOffX = 32;
    const eyeR = 22;
    for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(c + sign * eyeOffX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Black pupils (shifted up for angry look)
    for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(c + sign * eyeOffX, eyeY - 4, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#111111";
        ctx.fill();
    }

    // Eye shine
    for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(c + sign * eyeOffX + 5, eyeY - 8, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }

    // Angry V-shaped eyebrows
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#2a0000";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(c - eyeOffX - eyeR + 2, eyeY - eyeR + 2);
    ctx.lineTo(c - eyeOffX + eyeR - 4, eyeY - eyeR - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c + eyeOffX + eyeR - 2, eyeY - eyeR + 2);
    ctx.lineTo(c + eyeOffX - eyeR + 4, eyeY - eyeR - 10);
    ctx.stroke();

    // Upper beak
    ctx.beginPath();
    ctx.moveTo(c - 10, c + 10);
    ctx.lineTo(c + 42, c + 2);
    ctx.lineTo(c - 10, c + 22);
    ctx.closePath();
    ctx.fillStyle = "#f0a020";
    ctx.fill();
    ctx.strokeStyle = "#a06000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lower beak
    ctx.beginPath();
    ctx.moveTo(c - 10, c + 22);
    ctx.lineTo(c + 38, c + 14);
    ctx.lineTo(c - 10, c + 34);
    ctx.closePath();
    ctx.fillStyle = "#e08010";
    ctx.fill();
    ctx.stroke();

    // Crest / tuft on top
    ctx.fillStyle = "#b81a1a";
    ctx.beginPath();
    ctx.moveTo(c - 10, c - 100);
    ctx.quadraticCurveTo(c + 20, c - 148, c + 5, c - 115);
    ctx.quadraticCurveTo(c + 40, c - 152, c + 20, c - 108);
    ctx.quadraticCurveTo(c + 52, c - 150, c + 32, c - 100);
    ctx.fill();

    tex.update();
    return tex;
}

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
            { diameter: this._config.radius * 2, segments: 24 },
            scene,
        );

        const mat = new StandardMaterial("projectileMat", scene);
        mat.diffuseTexture = createBirdTexture(scene);
        mat.specularColor = new Color3(0.2, 0.2, 0.2);
        mat.specularPower = 16;
        this.mesh.material = mat;
        this.mesh.isVisible = false;
    }

    get radius(): number { return this._config.radius; }
    get type(): string { return this._config.type; }

    spawn(position: Vector3): void {
        this.mesh.position = position.clone();
        this.mesh.isVisible = true;
        this.velocity = Vector3.Zero();
        this.active = false;
        this.lifetime = 0;
        this.nudgesUsed = 0;
        this.boostUsed = false;
    }

    launch(velocity: Vector3): void {
        this.velocity = velocity.clone();
        this.active = true;
    }

    update(dt: number, gravity: number): void {
        if (!this.active) return;
        this.lifetime += dt;
        this.velocity.y += gravity * dt;
        this.mesh.position.addInPlace(this.velocity.scale(dt));
        // Tumble in flight so the face spins visibly
        this.mesh.rotation.z -= dt * 3;
    }

    deactivate(): void {
        this.active = false;
        this.mesh.isVisible = false;
    }

    dispose(): void {
        this.mesh.dispose();
    }
}