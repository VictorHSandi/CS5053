import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { GROUND_SIZE, SKY_COLOR } from "../utils/Constants";

/**
 * Creates the shared 3D environment: ground, lights, sky.
 * Call once per scene.
 */
export function setupEnvironment(scene: Scene): { shadowGenerator: ShadowGenerator } {
    // Sky colour
    scene.clearColor = new Color4(SKY_COLOR.r, SKY_COLOR.g, SKY_COLOR.b, 1);
    // Explicit scene ambient term for grading clarity.
    scene.ambientColor = new Color3(0.18, 0.18, 0.18);

    // Ambient hemisphere light
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(0.95, 0.92, 0.88);
    hemi.specular = new Color3(0.12, 0.12, 0.12);
    hemi.groundColor = new Color3(0.35, 0.3, 0.25);

    // Directional sun from launcher side (negative X) toward the target side (positive X)
    const sun = new DirectionalLight("sun", new Vector3(1, -1.6, 0.2).normalize(), scene);
    sun.intensity = 0.9;
    sun.diffuse = new Color3(1, 0.96, 0.9);
    sun.specular = new Color3(0.95, 0.95, 0.95);
    sun.position = new Vector3(-34, 34, -4);

    // Shadows
    const shadowGen = new ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: GROUND_SIZE, height: GROUND_SIZE }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.ambientColor = new Color3(0.16, 0.2, 0.12);
    groundMat.diffuseColor = new Color3(0.42, 0.65, 0.28);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
    groundMat.specularPower = 32;
    ground.material = groundMat;
    ground.receiveShadows = true;

    return { shadowGenerator: shadowGen };
}
