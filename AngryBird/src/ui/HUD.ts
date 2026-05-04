import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";

/**
 * In-game heads-up display: level name, shots, score, targets.
 */
export class HUD {
    private _levelText: TextBlock;
    private _shotsText: TextBlock;
    private _scoreText: TextBlock;
    private _targetsText: TextBlock;
    private _controlHint: TextBlock;
    private _gravityText: TextBlock; // NEW

    constructor(private _ui: AdvancedDynamicTexture) {
        const panel = new StackPanel("hudPanel");
        panel.isVertical = true;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.paddingLeftInPixels = 20;
        panel.paddingTopInPixels = 16;
        panel.width = "360px";
        _ui.addControl(panel);

        this._levelText   = this._addLine(panel, "Level: —",      22);
        this._shotsText   = this._addLine(panel, "Shots: 0 / 0",  20);
        this._scoreText   = this._addLine(panel, "Score: 0",       20);
        this._targetsText = this._addLine(panel, "Targets: 0",     20);
        this._gravityText = this._addLine(panel, "🌍 Earth Gravity", 18);

        // Control hint (bottom-left)
        this._controlHint = new TextBlock("hint", "Drag down & sideways to aim • Release to launch");
        this._controlHint.color = "white";
        this._controlHint.fontSize = 16;
        this._controlHint.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._controlHint.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._controlHint.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._controlHint.paddingLeftInPixels = 20;
        this._controlHint.paddingBottomInPixels = 16;
        this._controlHint.outlineColor = "black";
        this._controlHint.outlineWidth = 3;
        _ui.addControl(this._controlHint);
    }

    update(levelName: string, shotsUsed: number, maxShots: number, score: number, targetsLeft: number): void {
        this._levelText.text   = `Level: ${levelName}`;
        this._shotsText.text   = `Shots: ${shotsUsed} / ${maxShots}`;
        this._scoreText.text   = `Score: ${score}`;
        this._targetsText.text = `Targets: ${targetsLeft} remaining`;
    }

    /** Call when gravity is toggled to update the indicator. */ 
    setGravity(isEarthGravity: boolean): void {                 
        this._gravityText.text  = isEarthGravity               
            ? "🌍 Earth Gravity"                               
            : "🌙 Moon Gravity";                               
        this._gravityText.color = isEarthGravity ? "white" : "#aaddff"; //blue tint on moon
    }                                                           

    setHint(text: string): void {
        this._controlHint.text = text;
    }

    setVisible(visible: boolean): void {
        this._levelText.isVisible   = visible;
        this._shotsText.isVisible   = visible;
        this._scoreText.isVisible   = visible;
        this._targetsText.isVisible = visible;
        this._controlHint.isVisible = visible;
        this._gravityText.isVisible = visible;
    }

    private _addLine(parent: StackPanel, text: string, size: number): TextBlock {
        const tb = new TextBlock();
        tb.text  = text;
        tb.color = "white";
        tb.fontSize = size;
        tb.height   = `${size + 10}px`;
        tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tb.outlineColor = "black";
        tb.outlineWidth = 3;
        parent.addControl(tb);
        return tb;
    }
}