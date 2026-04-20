import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { setupEnvironment } from "./SceneSetup";

/**
 * Owns the Babylon engine + scene lifecycle.
 */
export class SceneManager {
    public engine: Engine;
    public scene!: Scene;
    public shadowGenerator!: ShadowGenerator;

    constructor(private _canvas: HTMLCanvasElement) {
        this.engine = new Engine(_canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this._createScene();

        // Babylon.js registers a contextmenu←preventDefault handler in the bubbling phase.
        // Our capture-phase listener fires first and stops propagation, preserving
        // the native right-click menu so DevTools (right-click → Inspect) works.
        _canvas.addEventListener(
            "contextmenu",
            (e) => e.stopImmediatePropagation(),
            true, // capture phase — runs before Babylon's bubbling-phase handler
        );

        window.addEventListener("resize", () => this.engine.resize());
    }

    private async _createScene(): Promise<void> {
        this.scene = new Scene(this.engine);
        const env = await setupEnvironment(this.scene);
        this.shadowGenerator = env.shadowGenerator;
    }

    /** Tear down and rebuild the scene (used for hard resets if needed). */
    recreateScene(): void {
        this.scene.dispose();
        this._createScene().then(() => {});
    }

    /** Start the render loop. `beforeRender` is called each frame with delta-time in seconds. */
    run(beforeRender: (dt: number) => void): void {
        this.engine.runRenderLoop(() => {
            const dt = this.engine.getDeltaTime() / 1000;
            beforeRender(dt);
            this.scene.render();
        });
    }

    dispose(): void {
        this.scene.dispose();
        this.engine.dispose();
    }
}
