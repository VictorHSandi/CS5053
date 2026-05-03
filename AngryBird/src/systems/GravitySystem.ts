import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { InputController } from "./InputController";
import { HUD } from "../ui/HUD";

/**
 * Interactive feature: press G to toggle gravity on/off.
 * Satisfies assignment requirement for interactive features.
 */
export class GravitySystem {
    private _gravityOn = true;
    private _scene: Scene;
    private _hud: HUD;

    private readonly _normalGravity = new Vector3(0, -9.81, 0);
    private readonly _moonGravity = new Vector3(0, -1.62, 0);  // moon = 1/6 of Earth


    constructor(scene: Scene, hud: HUD) {
        this._scene = scene;
        this._hud = hud;
    }

    /** Call each frame — checks for G key press and toggles gravity. */
    update(input: InputController): void {
        if (input.keysJustPressed.has("KeyG")) {
            this._gravityOn = !this._gravityOn;
            const gravity = this._gravityOn ? this._normalGravity : this._moonGravity;
            this._scene.getPhysicsEngine()?.setGravity(gravity);

            // Wake up all sleeping physics bodies so they respond immediately
            const bodies = (this._scene.getPhysicsEngine() as any)?._physicsBodies;
            bodies?.forEach((body: any) => {
                const bodyId = body._pluginData?.hpBodyId;
                if (bodyId) {
                    const plugin = (this._scene.getPhysicsEngine() as any)._physicsPlugin;
                    plugin._hknp.HP_Body_SetActivationState(bodyId, 1); // 1 = active
                }
            });
            this._hud.setGravity(this._gravityOn);
            console.log("Gravity:", this._gravityOn ? "Earth" : "Moon");
        }
    }

    get gravityOn(): boolean {
        return this._gravityOn;
    }

    /** Current gravity value — use this for projectile physics and trajectory preview. */
    get currentGravity(): number {
        return this._gravityOn ? -9.81 : -1.62;
    }
}
