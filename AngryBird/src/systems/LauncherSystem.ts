import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { InputController } from "./InputController";
import {
    LAUNCHER_MAX_PULL,
    LAUNCHER_POWER_MULT,
    GRAVITY,
    TRAJECTORY_SEGMENTS,
    TRAJECTORY_TIME_STEP,
} from "../utils/Constants";
import { clamp, ballisticTrajectory } from "../utils/MathUtils";

/**
 * Handles the slingshot aiming mechanic: drag to pull, release to launch.
 */
export class LauncherSystem {
    /** World position of the slingshot. */
    public origin = Vector3.Zero();
    /** Normalised default launch direction. */
    public direction = new Vector3(1, 0.4, 0).normalize();

    /** Current pull distance (0 = none, up to LAUNCHER_MAX_PULL). */
    public pullDistance = 0;
    /** Computed launch velocity for current pull. */
    public launchVelocity = Vector3.Zero();

    // Visuals
    private _slingshotBase: Mesh;
    private _band: Mesh;
    private _trajectoryDots: Mesh[] = [];
    private _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;

        // Simple Y-shaped slingshot post
        this._slingshotBase = MeshBuilder.CreateCylinder(
            "slingPost",
            { height: 3.2, diameterTop: 0.15, diameterBottom: 0.25 },
            scene,
        );
        const postMat = new StandardMaterial("postMat", scene);
        postMat.diffuseColor = new Color3(0.45, 0.28, 0.1);
        this._slingshotBase.material = postMat;
        this._slingshotBase.receiveShadows = true;

        // Left fork
        const forkL = MeshBuilder.CreateCylinder("forkL", { height: 1, diameter: 0.12 }, scene);
        forkL.parent = this._slingshotBase;
        forkL.position = new Vector3(-0.25, 1.6, 0);
        forkL.rotation.z = -0.45;
        forkL.material = postMat;
        forkL.receiveShadows = true;

        // Right fork
        const forkR = MeshBuilder.CreateCylinder("forkR", { height: 1, diameter: 0.12 }, scene);
        forkR.parent = this._slingshotBase;
        forkR.position = new Vector3(0.25, 1.6, 0);
        forkR.rotation.z = 0.45;
        forkR.material = postMat;
        forkR.receiveShadows = true;

        // Elastic band (stretched line)
        this._band = MeshBuilder.CreateCylinder(
            "band",
            { height: 1, diameter: 0.06 },
            scene,
        );
        const bandMat = new StandardMaterial("bandMat", scene);
        bandMat.diffuseColor = new Color3(0.35, 0.18, 0.05);
        this._band.material = bandMat;
        this._band.receiveShadows = true;
        this._band.isVisible = false;

        // Trajectory dots
        const dotMat = new StandardMaterial("dotMat", scene);
        dotMat.diffuseColor = new Color3(1.0, 0.96, 0.68);
        dotMat.emissiveColor = new Color3(0.92, 0.84, 0.30);
        dotMat.disableLighting = true;
        dotMat.alpha = 0.92;
        for (let i = 0; i < TRAJECTORY_SEGMENTS; i++) {
            const dot = MeshBuilder.CreateSphere(`dot_${i}`, { diameter: 0.16 }, scene);
            dot.material = dotMat;
            dot.renderingGroupId = 2;
            dot.alwaysSelectAsActiveMesh = true;
            dot.isVisible = false;
            this._trajectoryDots.push(dot);
        }
    }

    /** Set the launcher position & direction for the current level. */
    configure(origin: Vector3, direction: Vector3): void {
        this.origin = origin.clone();
        this.direction = direction.normalize();
        this._slingshotBase.position = origin.clone();
        this._slingshotBase.position.y = origin.y + 0.6; // keeps launch top at origin.y + 2.2 while grounding the post
        this.pullDistance = 0;
        this.launchVelocity = Vector3.Zero();
    }

    /**
     * Per-frame update during Aiming state.
     * Reads input to compute pull and trajectory preview.
     */
    update(input: InputController, gravity: number = GRAVITY): void {
        if (input.pointerDown) {
            // Map vertical drag to pull distance (drag down = more pull)
            const rawPull = input.dragDY / (input.canvasHeight * 0.35);
            this.pullDistance = clamp(rawPull, 0, 1) * LAUNCHER_MAX_PULL;

            // 2D-style aiming: direction is fixed, drag only controls power.
            const speed = this.pullDistance * LAUNCHER_POWER_MULT;
            this.launchVelocity = this.direction.clone().normalize().scale(speed);
        } else {
            this.pullDistance = 0;
        }

        this._updateTrajectory(gravity);
        this._updateBand();
    }

    /** Show/hide aiming visuals. */
    setVisible(visible: boolean): void {
        this._slingshotBase.isVisible = visible;
        // forks are children, auto-hidden
        this._slingshotBase.getChildMeshes().forEach((m) => (m.isVisible = visible));
        if (!visible) {
            this._band.isVisible = false;
            this._trajectoryDots.forEach((d) => (d.isVisible = false));
        }
    }

    /** The world-space launch point (top of slingshot). */
    get launchPoint(): Vector3 {
        return this.origin.add(new Vector3(0, 2.2, 0));
    }

    /** Register slingshot meshes as casters in the active shadow generator. */
    registerShadowCasters(shadowGen: ShadowGenerator): void {
        shadowGen.addShadowCaster(this._slingshotBase, true);
        shadowGen.addShadowCaster(this._band);
    }

    // ── private helpers ───────────────────────────────────

    private _updateTrajectory(gravity: number): void {
        if (this.pullDistance < 0.05) {
            this._trajectoryDots.forEach((d) => (d.isVisible = false));
            return;
        }

        // On moon gravity use longer time step to show the full extended arc
        const timeStep = gravity === -1.62 
            ? TRAJECTORY_TIME_STEP * 3.5  // moon — much longer arc
            : TRAJECTORY_TIME_STEP;       // earth — normal

        const pts = ballisticTrajectory(
            this.launchPoint,
            this.launchVelocity,
            gravity,
            TRAJECTORY_SEGMENTS,
            timeStep,
        );
        for (let i = 0; i < this._trajectoryDots.length; i++) {
            const dot = this._trajectoryDots[i];
            if (i < pts.length && pts[i].y >= 0) {
                dot.position = pts[i];
                dot.isVisible = true;
            } else {
                dot.isVisible = false;
            }
        }
    }

    private _updateBand(): void {
        if (this.pullDistance < 0.05) {
            this._band.isVisible = false;
            return;
        }
        // Stretch a cylinder from fork top to pull-back point
        const top = this.launchPoint;
        const pullBack = top.subtract(this.launchVelocity.normalizeToNew().scale(this.pullDistance));
        const mid = top.add(pullBack).scale(0.5);
        const len = Vector3.Distance(top, pullBack);
        this._band.position = mid;
        this._band.scaling.y = len;
        this._band.lookAt(pullBack);
        this._band.rotation.x += Math.PI / 2;
        this._band.isVisible = true;
    }

    dispose(): void {
        this._slingshotBase.dispose();
        this._band.dispose();
        this._trajectoryDots.forEach((d) => d.dispose());
    }
}
