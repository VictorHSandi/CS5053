import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { GROUND_SIZE, SKY_COLOR } from "../utils/Constants";

const GRASS_TEXTURE_URL = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/rocky_terrain_02/rocky_terrain_02_diff_4k.jpg";

const SKYBOX_URL = "https://assets.babylonjs.com/textures/TropicalSunnyDay";

const NORMAL_TEXTURE_URL = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/rocky_terrain_02/rocky_terrain_02_nor_gl_4k.jpg";

const ROUGHNESS_TEXTURE_URL = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/rocky_terrain_02/rocky_terrain_02_rough_4k.jpg";

/**
 * Creates the shared 3D environment: ground, lights, sky.
 * Call once per scene.
 */
export function setupEnvironment(scene: Scene): { shadowGenerator: ShadowGenerator } {
    // ── Skybox ──────────────────────────────────────────────
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 500 }, scene);
    const skyboxMat = new StandardMaterial("skyBoxMat", scene);
    skyboxMat.backFaceCulling = false;
    skyboxMat.disableLighting = true;
    skyboxMat.disableDepthWrite = true;
    const skyTex = new CubeTexture(SKYBOX_URL, scene);
    skyTex.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMat.reflectionTexture = skyTex;
    skybox.material = skyboxMat;
    skybox.infiniteDistance = true;
    // Skybox renders in group 0 — before all game objects (group 1)
    skybox.renderingGroupId = 0;

    // Critical: don't clear depth between group 0 and group 1,
    // otherwise group 1 objects render into a fresh depth buffer and
    // the skybox box geometry occludes everything behind it.
    scene.setRenderingAutoClearDepthStencil(0, false);
    scene.setRenderingAutoClearDepthStencil(1, true);

    // ── Lights ──────────────────────────────────────────────
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.groundColor = new Color3(0.35, 0.3, 0.25);

    const sun = new DirectionalLight("sun", new Vector3(-1, -2, 1).normalize(), scene);
    sun.intensity = 0.9;
    sun.position = new Vector3(20, 40, -20);

    const shadowGen = new ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    // ── Ground ──────────────────────────────────────────────
    const ground = MeshBuilder.CreateGround(
        "ground",
        { width: GROUND_SIZE, height: GROUND_SIZE, subdivisions: 500 },
        scene,
    );

    const groundMat = new StandardMaterial("groundMat", scene);
    const grassTex = new Texture(GRASS_TEXTURE_URL, scene);
    grassTex.uScale = GROUND_SIZE / 6;
    grassTex.vScale = GROUND_SIZE / 6;
    groundMat.diffuseTexture = grassTex;
    
    // Make the ground very rough/non-shiny (low specular)
    groundMat.specularColor = new Color3(0.02, 0.02, 0.02); 
    groundMat.specularPower = 250;  // Higher = smaller, tighter highlights
    
    const roughnessTex = new Texture(ROUGHNESS_TEXTURE_URL, scene);
    roughnessTex.uScale = GROUND_SIZE / 6;
    roughnessTex.vScale = GROUND_SIZE / 6;
    groundMat.specularTexture = roughnessTex;
    
    groundMat.bumpTexture = new Texture(NORMAL_TEXTURE_URL, scene);
    ground.material = groundMat;
    ground.receiveShadows = true;

    return { shadowGenerator: shadowGen };
}