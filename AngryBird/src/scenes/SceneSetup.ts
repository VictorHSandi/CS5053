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
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { GROUND_SIZE } from "../utils/Constants";
import { SkyboxType } from "../levels/LevelData";

const GRASS_TEXTURE_URL =
  "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/rocky_terrain_02/rocky_terrain_02_diff_4k.jpg";

const NORMAL_TEXTURE_URL =
  "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/rocky_terrain_02/rocky_terrain_02_nor_gl_4k.jpg";

let _skyboxMesh: Mesh | null = null;

function applyLightingPreset(scene: Scene, type: SkyboxType): void {
    const hemi = scene.getLightByName("hemi") as HemisphericLight | null;
    const sun = scene.getLightByName("sun") as DirectionalLight | null;

    if (!hemi || !sun) return;

    if (type === "night") {
        hemi.intensity = 0.1;
        hemi.diffuse = new Color3(0.2, 0.24, 0.34);
        hemi.specular = new Color3(0.04, 0.05, 0.08);
        hemi.groundColor = new Color3(0.03, 0.03, 0.05);

        sun.intensity = 0.65;
        sun.diffuse = new Color3(0.7, 0.8, 1);
        sun.specular = new Color3(0.5, 0.58, 0.75);
        sun.direction = new Vector3(0.35, -1, -0.25).normalize();
        sun.position = new Vector3(-18, 42, 18);
        return;
    }

    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(0.95, 0.92, 0.88);
    hemi.specular = new Color3(0.12, 0.12, 0.12);
    hemi.groundColor = new Color3(0.35, 0.3, 0.25);

    sun.intensity = 0.75;
    sun.diffuse = new Color3(1, 0.75, 0.55);
    sun.specular = new Color3(1, 0.85, 0.65);
    sun.direction = new Vector3(-1, -2, 1).normalize();
    sun.position = new Vector3(20, 40, -20);
}

export function setSkybox(scene: Scene, type: SkyboxType): void {
    if (_skyboxMesh) {
        _skyboxMesh.material?.dispose();
        _skyboxMesh.dispose();
        _skyboxMesh = null;
    }

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000 }, scene);

    const mat = new StandardMaterial("skyBoxMat", scene);
    mat.backFaceCulling = false;
    mat.disableLighting = true;

    if (type === "tropical") {
        scene.clearColor = new Color4(0.53, 0.81, 0.98, 1);

        const tex = new CubeTexture(
            "https://assets.babylonjs.com/textures/TropicalSunnyDay",
            scene
        );

        tex.coordinatesMode = Texture.SKYBOX_MODE;
        mat.reflectionTexture = tex;
    }

    else if (type === "night") {
        scene.clearColor = new Color4(0.01, 0.01, 0.05, 1);

        const tex = new CubeTexture(
            "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/MilkyWay/",
            scene,
            ["dark-s_px.jpg", "dark-s_nx.jpg", "dark-s_py.jpg", "dark-s_ny.jpg", "dark-s_pz.jpg", "dark-s_nz.jpg"]
        );

        tex.coordinatesMode = Texture.SKYBOX_MODE;
        mat.reflectionTexture = tex;
    }

    applyLightingPreset(scene, type);

    skybox.material = mat;
    skybox.infiniteDistance = true;
    _skyboxMesh = skybox;
}

export function setSkyboxVisible(visible: boolean): void {
    if (!_skyboxMesh) return;
    _skyboxMesh.setEnabled(visible);
}

export function setupEnvironment(scene: Scene): { shadowGenerator: ShadowGenerator } {
    scene.clearColor = new Color4(0.53, 0.81, 0.98, 1);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(0.95, 0.92, 0.88);
    hemi.specular = new Color3(0.12, 0.12, 0.12);
    hemi.groundColor = new Color3(0.35, 0.3, 0.25);

    const sun = new DirectionalLight(
        "sun",
        new Vector3(-1, -2, 1).normalize(),
        scene
    );

    sun.intensity = 0.75;
    sun.diffuse = new Color3(1, 0.75, 0.55);
    sun.position = new Vector3(20, 40, -20);

    const shadowGen = new ShadowGenerator(1024, sun);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    const ground = MeshBuilder.CreateGround(
        "ground",
        { width: GROUND_SIZE, height: GROUND_SIZE, subdivisions: 500 },
        scene
    );

    const groundMat = new StandardMaterial("groundMat", scene);

    const grassTex = new Texture(GRASS_TEXTURE_URL, scene);
    grassTex.uScale = GROUND_SIZE / 20;
    grassTex.vScale = GROUND_SIZE / 20;

    groundMat.diffuseTexture = grassTex;
    groundMat.bumpTexture = new Texture(NORMAL_TEXTURE_URL, scene);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
    groundMat.specularPower = 0;

    ground.material = groundMat;
    ground.receiveShadows = true;

    return { shadowGenerator: shadowGen };
}