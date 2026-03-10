import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { HUD } from "./HUD";
import { WinScreen } from "./WinScreen";
import { LoseScreen } from "./LoseScreen";
import { ScoreBreakdown } from "../systems/ScoreSystem";

/**
 * Orchestrates all UI panels (HUD + overlays).
 */
export class UIManager {
    public gui: AdvancedDynamicTexture;
    public hud: HUD;
    public winScreen: WinScreen;
    public loseScreen: LoseScreen;

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
        this.hud = new HUD(this.gui);
        this.winScreen = new WinScreen(this.gui);
        this.loseScreen = new LoseScreen(this.gui);
    }

    /** Update the HUD every frame. */
    updateHUD(levelName: string, shotsUsed: number, maxShots: number, score: number, targetsLeft: number): void {
        this.hud.update(levelName, shotsUsed, maxShots, score, targetsLeft);
    }

    showWin(breakdown: ScoreBreakdown, hasNext: boolean): void {
        this.hud.setVisible(false);
        this.winScreen.show(breakdown, hasNext);
    }

    showLose(): void {
        this.hud.setVisible(false);
        this.loseScreen.show();
    }

    hideOverlays(): void {
        this.winScreen.hide();
        this.loseScreen.hide();
        this.hud.setVisible(true);
    }

    dispose(): void {
        this.gui.dispose();
    }
}
