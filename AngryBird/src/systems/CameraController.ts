import { Scene } from "@babylonjs/core/scene";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
    CAM_AIM_DISTANCE,
    CAM_AIM_HEIGHT,
    CAM_AIM_LOOKAHEAD_X,
    CAM_AIM_TARGET_HEIGHT,
    CAM_AIM_ORTHO_HALF_HEIGHT,
    CAM_DESTRUCTION_DISTANCE,
    CAM_DESTRUCTION_HEIGHT,
    CAM_DESTRUCTION_LOOKAHEAD_X,
    CAM_DESTRUCTION_ORTHO_HALF_HEIGHT,
    CAM_FOLLOW_DISTANCE,
    CAM_FOLLOW_HEIGHT,
    CAM_TRANSITION_DURATION,
} from "../utils/Constants";
import { lerpVector3, smoothStep } from "../utils/MathUtils";

export enum CameraMode {
    Aim,
    Transition,
    Follow,
    Destruction,
}

/**
 * Owns the single active camera and provides modes for aiming and following.
 */
export class CameraController {
    public camera: FreeCamera;
    public mode: CameraMode = CameraMode.Aim;
    private _scene: Scene;
    private _aimMaxX: number | null = null;
    private _orthoHalfHeight = CAM_AIM_ORTHO_HALF_HEIGHT;

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
        this._scene = scene;
        this.camera = new FreeCamera("mainCam", new Vector3(0, CAM_AIM_HEIGHT, -CAM_AIM_DISTANCE), scene);
        this.camera.minZ = 0.1;
        this.camera.maxZ = 10000;
        // We control the camera manually — detach default input
        this.camera.detachControl();
        scene.activeCamera = this.camera;
    }

    /** Position the aiming camera to look at the launcher from the side. */
    setAimView(launcherPos: Vector3, aimMaxX?: number): void {
        this.mode = CameraMode.Aim;
        this._aimTarget = launcherPos.clone();
        this._aimMaxX = aimMaxX ?? null;
        this._orthoHalfHeight = CAM_AIM_ORTHO_HALF_HEIGHT;
        // Camera sits to the side and slightly above
        this.camera.position = new Vector3(
            launcherPos.x,
            launcherPos.y + CAM_AIM_HEIGHT,
            launcherPos.z - CAM_AIM_DISTANCE,
        );
        this.camera.setTarget(
            new Vector3(
                launcherPos.x + CAM_AIM_LOOKAHEAD_X,
                launcherPos.y + CAM_AIM_TARGET_HEIGHT,
                launcherPos.z,
            ),
        );
        this._applyAimOrtho();
    }

    setDestructionView(focusPos: Vector3, lookAheadX = CAM_DESTRUCTION_LOOKAHEAD_X): void {
        this.mode = CameraMode.Destruction;
        this._aimTarget = focusPos.clone();
        this._aimMaxX = focusPos.x + lookAheadX + 10;
        this._orthoHalfHeight = CAM_DESTRUCTION_ORTHO_HALF_HEIGHT;
        this.camera.position = new Vector3(
            focusPos.x - 1.5,
            focusPos.y + CAM_DESTRUCTION_HEIGHT,
            focusPos.z - CAM_DESTRUCTION_DISTANCE,
        );
        this.camera.setTarget(
            new Vector3(
                focusPos.x + lookAheadX,
                Math.max(2.2, focusPos.y + 1.6),
                focusPos.z,
            ),
        );
        this._applyAimOrtho();
    }

    /** Kick off a smooth transition from current position to follow position. */
    beginTransition(startPos: Vector3, startLook: Vector3, endPos: Vector3, endLook: Vector3): void {
        this.mode = CameraMode.Transition;
        this.camera.mode = Camera.PERSPECTIVE_CAMERA;
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
        if (this.mode === CameraMode.Aim) {
            // Keeps orthographic framing stable after browser resizes.
            this._applyAimOrtho();
        }

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

    private _applyAimOrtho(): void {
        const engine = this._scene.getEngine();
        const renderHeight = Math.max(engine.getRenderHeight(), 1);
        const aspect = engine.getRenderWidth() / renderHeight;
        const baseHalfHeight = this._orthoHalfHeight;
        const baseHalfWidth = baseHalfHeight * aspect;

        let halfWidth = baseHalfWidth;
        if (this._aimMaxX !== null) {
            const centerX = this._aimTarget.x + CAM_AIM_LOOKAHEAD_X;
            const rightPadding = 2;
            const requiredHalfWidth = this._aimMaxX - centerX + rightPadding;
            if (requiredHalfWidth > halfWidth) {
                halfWidth = requiredHalfWidth;
            }
        }

        // Keep orthographic scaling isotropic so objects do not look squished.
        const scale = halfWidth / baseHalfWidth;
        const halfHeight = baseHalfHeight * scale;

        // Keep the bottom of the orthographic window above ground so hiding the
        // skybox does not reveal a black strip at the bottom of the screen.
        const look = this.camera.getTarget();
        const forward = look.subtract(this.camera.position).normalize();
        let right = Vector3.Cross(forward, Vector3.Up());
        if (right.lengthSquared() < 1e-6) {
            right = Vector3.Right();
        } else {
            right.normalize();
        }
        const up = Vector3.Cross(right, forward).normalize();

        const minBottomOriginY = 0.35;
        const symmetricBottom = -halfHeight;
        const bottomOriginY = this.camera.position.y + up.y * symmetricBottom;
        let orthoOffset = 0;
        if (up.y > 1e-4 && bottomOriginY < minBottomOriginY) {
            orthoOffset = (minBottomOriginY - bottomOriginY) / up.y;
        }

        this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this.camera.orthoTop = halfHeight + orthoOffset;
        this.camera.orthoBottom = -halfHeight + orthoOffset;
        this.camera.orthoLeft = -halfWidth;
        this.camera.orthoRight = halfWidth;
    }
}
