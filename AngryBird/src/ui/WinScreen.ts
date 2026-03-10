import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { ScoreBreakdown } from "../systems/ScoreSystem";

/**
 * Overlay shown when the player clears a level.
 */
export class WinScreen {
    private _root: Rectangle;
    private _title: TextBlock;
    private _starsText: TextBlock;
    private _details: TextBlock;
    private _nextBtn: Button;
    private _retryBtn: Button;

    public onNext: (() => void) | null = null;
    public onRetry: (() => void) | null = null;

    constructor(private _ui: AdvancedDynamicTexture) {
        this._root = new Rectangle("winRoot");
        this._root.width = "420px";
        this._root.height = "380px";
        this._root.cornerRadius = 16;
        this._root.color = "#fff";
        this._root.thickness = 2;
        this._root.background = "rgba(0,0,0,0.8)";
        this._root.isVisible = false;
        _ui.addControl(this._root);

        const panel = new StackPanel();
        panel.isVertical = true;
        this._root.addControl(panel);

        this._title = this._text(panel, "Level Complete!", 30, "#4cff4c");
        this._starsText = this._text(panel, "★ ★ ★", 36, "#ffd700");
        this._details = this._text(panel, "", 18, "#ddd");
        this._details.height = "120px";
        this._details.textWrapping = true;

        this._nextBtn = this._button(panel, "Next Level", () => this.onNext?.());
        this._retryBtn = this._button(panel, "Retry", () => this.onRetry?.());
    }

    show(breakdown: ScoreBreakdown, hasNext: boolean): void {
        const starStr = "★".repeat(breakdown.stars) + "☆".repeat(3 - breakdown.stars);
        this._starsText.text = starStr;
        this._details.text =
            `Targets destroyed: ${breakdown.targetsDestroyed}\n` +
            `Shots used: ${breakdown.shotsUsed}\n` +
            `Shot bonus: +${breakdown.shotBonus}\n` +
            `Time bonus: +${breakdown.timeBonus}\n` +
            `Total score: ${breakdown.totalScore}`;
        this._nextBtn.isVisible = hasNext;
        this._root.isVisible = true;
    }

    hide(): void {
        this._root.isVisible = false;
    }

    private _text(parent: StackPanel, text: string, size: number, color: string): TextBlock {
        const tb = new TextBlock();
        tb.text = text;
        tb.color = color;
        tb.fontSize = size;
        tb.height = `${size + 14}px`;
        parent.addControl(tb);
        return tb;
    }

    private _button(parent: StackPanel, label: string, cb: () => void): Button {
        const btn = Button.CreateSimpleButton(`btn_${label}`, label);
        btn.width = "200px";
        btn.height = "40px";
        btn.color = "white";
        btn.background = "#336";
        btn.cornerRadius = 8;
        btn.paddingTopInPixels = 8;
        btn.onPointerClickObservable.add(cb);
        parent.addControl(btn);
        return btn;
    }
}
