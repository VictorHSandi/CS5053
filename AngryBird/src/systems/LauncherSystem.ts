import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
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
            { height: 2.2, diameterTop: 0.15, diameterBottom: 0.25 },
            scene,
        );
        const postMat = new StandardMaterial("postMat", scene);
        postMat.diffuseColor = new Color3(0.45, 0.28, 0.1);
        this._slingshotBase.material = postMat;

        // Left fork
        const forkL = MeshBuilder.CreateCylinder("forkL", { height: 1, diameter: 0.12 }, scene);
        forkL.parent = this._slingshotBase;
        forkL.position = new Vector3(-0.25, 1.1, 0);
        forkL.rotation.z = -0.45;
        forkL.material = postMat;

        // Right fork
        const forkR = MeshBuilder.CreateCylinder("forkR", { height: 1, diameter: 0.12 }, scene);
        forkR.parent = this._slingshotBase;
        forkR.position = new Vector3(0.25, 1.1, 0);
        forkR.rotation.z = 0.45;
        forkR.material = postMat;

        // Elastic band (stretched line)
        this._band = MeshBuilder.CreateCylinder(
            "band",
            { height: 1, diameter: 0.06 },
            scene,
        );
        const bandMat = new StandardMaterial("bandMat", scene);
        bandMat.diffuseColor = new Color3(0.35, 0.18, 0.05);
        this._band.material = bandMat;
        this._band.isVisible = false;

        // Trajectory dots
        const dotMat = new StandardMaterial("dotMat", scene);
        dotMat.diffuseColor = new Color3(1, 1, 1);
        dotMat.alpha = 0.5;
        for (let i = 0; i < TRAJECTORY_SEGMENTS; i++) {
            const dot = MeshBuilder.CreateSphere(`dot_${i}`, { diameter: 0.12 }, scene);
            dot.material = dotMat;
            dot.isVisible = false;
            this._trajectoryDots.push(dot);
        }
    }

    /** Set the launcher position & direction for the current level. */
    configure(origin: Vector3, direction: Vector3): void {
        this.origin = origin.clone();
        this.direction = direction.normalize();
        this._slingshotBase.position = origin.clone();
        this._slingshotBase.position.y = origin.y + 1.1; // half-height offset
        this.pullDistance = 0;
        this.launchVelocity = Vector3.Zero();
    }

    /**
     * Per-frame update during Aiming state.
     * Reads input to compute pull and trajectory preview.
     */
    update(input: InputController): void {
        if (input.pointerDown) {
            // Map vertical drag to pull distance (drag down = more pull)
            const rawPull = input.dragDY / (input.canvasHeight * 0.35);
            this.pullDistance = clamp(rawPull, 0, 1) * LAUNCHER_MAX_PULL;

            // Horizontal drag can angle the shot laterally
            const lateralAngle = -(input.dragDX / (input.canvasWidth * 0.5)) * 0.6; // ±0.6 rad

            // Compute velocity vector
            const speed = this.pullDistance * LAUNCHER_POWER_MULT;
            const dir = this.direction.clone();
            // Rotate direction around Y by lateral angle
            const cosA = Math.cos(lateralAngle);
            const sinA = Math.sin(lateralAngle);
            const rx = dir.x * cosA - dir.z * sinA;
            const rz = dir.x * sinA + dir.z * cosA;
            this.launchVelocity = new Vector3(rx, dir.y, rz).normalize().scale(speed);
        } else {
            this.pullDistance = 0;
        }

        this._updateTrajectory();
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

    // ── private helpers ───────────────────────────────────

    private _updateTrajectory(): void {
        if (this.pullDistance < 0.05) {
            this._trajectoryDots.forEach((d) => (d.isVisible = false));
            return;
        }
        const pts = ballisticTrajectory(
            this.launchPoint,
            this.launchVelocity,
            GRAVITY,
            TRAJECTORY_SEGMENTS,
            TRAJECTORY_TIME_STEP,
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
