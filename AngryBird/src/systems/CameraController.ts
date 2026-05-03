import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
    CAM_AIM_DISTANCE,
    CAM_AIM_HEIGHT,
    CAM_FOLLOW_DISTANCE,
    CAM_FOLLOW_HEIGHT,
    CAM_TRANSITION_DURATION,
} from "../utils/Constants";
import { lerpVector3, smoothStep } from "../utils/MathUtils";

export enum CameraMode {
    Aim,
    Transition,
    Follow,
}

/**
 * Owns the single active camera and provides modes for aiming and following.
 */
export class CameraController {
    public camera: FreeCamera;
    public mode: CameraMode = CameraMode.Aim;

    // aiming
    private _aimTarget = Vector3.Zero();

    // transition
    private _transFrom = Vector3.Zero();
    private _transTo = Vector3.Zero();
    private _transLookFrom = Vector3.Zero();
    private _transLookTo = Vector3.Zero();
    private _transElapsed = 0;
    private _transDuration = CAM_TRANSITION_DURATION;

    constructor(scene: Scene) {
        this.camera = new FreeCamera("mainCam", new Vector3(0, CAM_AIM_HEIGHT, -CAM_AIM_DISTANCE), scene);
        this.camera.minZ = 0.1;
        this.camera.maxZ = 10000;
        // We control the camera manually — detach default input
        this.camera.detachControl();
        scene.activeCamera = this.camera;
    }

    /** Position the aiming camera to look at the launcher from the side. */
    setAimView(launcherPos: Vector3): void {
        this.mode = CameraMode.Aim;
        this._aimTarget = launcherPos.clone();
        // Camera sits to the side and slightly above
        this.camera.position = new Vector3(
            launcherPos.x,
            launcherPos.y + CAM_AIM_HEIGHT,
            launcherPos.z - CAM_AIM_DISTANCE,
        );
        this.camera.setTarget(new Vector3(launcherPos.x + 8, launcherPos.y + 2, launcherPos.z));
    }

    /** Kick off a smooth transition from current position to follow position. */
    beginTransition(startPos: Vector3, startLook: Vector3, endPos: Vector3, endLook: Vector3): void {
        this.mode = CameraMode.Transition;
        this._transFrom = startPos.clone();
        this._transTo = endPos.clone();
        this._transLookFrom = startLook.clone();
        this._transLookTo = endLook.clone();
        this._transElapsed = 0;
        this._transDuration = CAM_TRANSITION_DURATION;
    }

    /**
     * Update every frame.
     * @returns true when a transition just finished (so caller can switch to Follow).
     */
    update(dt: number, projectilePos?: Vector3, projectileVel?: Vector3): boolean {
        if (this.mode === CameraMode.Transition) {
            this._transElapsed += dt;
            const t = smoothStep(Math.min(this._transElapsed / this._transDuration, 1));
            this.camera.position = lerpVector3(this._transFrom, this._transTo, t);
            const look = lerpVector3(this._transLookFrom, this._transLookTo, t);
            this.camera.setTarget(look);
            if (this._transElapsed >= this._transDuration) {
                this.mode = CameraMode.Follow;
                return true; // transition finished
            }
        }

        if (this.mode === CameraMode.Follow && projectilePos && projectileVel) {
            // Chase cam behind & above the projectile
            const dir = projectileVel.normalizeToNew();
            const behind = dir.scale(-CAM_FOLLOW_DISTANCE);
            const desired = projectilePos.add(behind).add(new Vector3(0, CAM_FOLLOW_HEIGHT, 0));
            // Smooth follow (lerp toward desired)
            this.camera.position = lerpVector3(this.camera.position, desired, 0.12);
            this.camera.setTarget(projectilePos.add(dir.scale(4)));
        }

        return false;
    }
}
