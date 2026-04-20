import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";  // NEW
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate"; // NEW
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin"; // NEW
import HavokPhysics from "@babylonjs/havok";                                     // NEW
import { GROUND_SIZE, SKY_COLOR } from "../utils/Constants";
 
/**
 * Creates the shared 3D environment: ground, lights, sky.
 * Call once per scene.
 */
export async function setupEnvironment(scene: Scene): Promise<{ shadowGenerator: ShadowGenerator }> {
    // Sky colour
    scene.clearColor = new Color4(SKY_COLOR.r, SKY_COLOR.g, SKY_COLOR.b, 1);
 
    // ── Havok physics engine ──────────────────────────────
    const havokInstance = await HavokPhysics();           // NEW
    const havokPlugin = new HavokPlugin(true, havokInstance); // NEW
    scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin); // NEW
 
    // Ambient hemisphere light
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.groundColor = new Color3(0.35, 0.3, 0.25);
 
    // Directional sun
    const sun = new DirectionalLight("sun", new Vector3(-1, -2, 1).normalize(), scene);
    sun.intensity = 0.9;
    sun.position = new Vector3(20, 40, -20);
 
    // Shadows
    const shadowGen = new ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;
 
    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: GROUND_SIZE, height: GROUND_SIZE }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.42, 0.65, 0.28);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
    ground.material = groundMat;
    ground.receiveShadows = true;
 
    // Give the ground a static physics body so blocks land on it  // NEW
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene); // NEW
 
    return { shadowGenerator: shadowGen };
}