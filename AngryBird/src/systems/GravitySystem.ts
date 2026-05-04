import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type GravityMode = "earth" | "moon";

/**
 * Controls the active gravity mode for scene physics and projectile simulation.
 */
export class GravitySystem {
    private _mode: GravityMode = "earth";
    private _scene: Scene;

    private readonly _normalGravity = new Vector3(0, -9.81, 0);
    private readonly _moonGravity = new Vector3(0, -1.62, 0);


    constructor(scene: Scene) {
        this._scene = scene;
        this.setMode("earth");
    }

    setMode(mode: GravityMode): void {
        this._mode = mode;
        const gravity = mode === "moon" ? this._moonGravity : this._normalGravity;
        this._scene.getPhysicsEngine()?.setGravity(gravity);

        // Wake sleeping bodies so gravity changes take effect immediately.
        const bodies = (this._scene.getPhysicsEngine() as any)?._physicsBodies;
        bodies?.forEach((body: any) => {
            const bodyId = body._pluginData?.hpBodyId;
            if (!bodyId) return;
            const plugin = (this._scene.getPhysicsEngine() as any)._physicsPlugin;
            plugin._hknp.HP_Body_SetActivationState(bodyId, 1);
        });
    }

    get mode(): GravityMode {
        return this._mode;
    }

    /** Current gravity value — use this for projectile physics and trajectory preview. */
    get currentGravity(): number {
        return this._mode === "moon" ? -1.62 : -9.81;
    }
}
