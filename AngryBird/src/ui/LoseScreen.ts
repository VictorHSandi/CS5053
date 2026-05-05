import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";

/**
 * Overlay shown when the player runs out of shots.
 */
export class LoseScreen {
    private _root: Rectangle;
    public onRetry: (() => void) | null = null;

    constructor(private _ui: AdvancedDynamicTexture) {
        this._root = new Rectangle("loseRoot");
        this._root.width = "500px";
        this._root.height = "300px";
        this._root.cornerRadius = 10;
        this._root.color = "#31427f";
        this._root.thickness = 2;
        this._root.background = "#10162fe8";
        this._root.isVisible = false;
        _ui.addControl(this._root);

        const panel = new StackPanel();
        panel.isVertical = true;
        panel.paddingTopInPixels = 18;
        panel.paddingBottomInPixels = 18;
        panel.width = "420px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._root.addControl(panel);

        const title = new TextBlock();
        title.text = "Level Failed";
        title.color = "#ff6b6b";
        title.fontFamily = "'Press Start 2P', monospace";
        title.fontSize = 24;
        title.height = "46px";
        panel.addControl(title);

        panel.addControl(this._spacer(12));

        const sub = new TextBlock();
        sub.text = "Out of shots. Reset and try a new angle.";
        sub.color = "#9bb2ee";
        sub.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        sub.fontSize = 18;
        sub.height = "54px";
        sub.textWrapping = true;
        sub.lineSpacing = "4px";
        panel.addControl(sub);

        panel.addControl(this._spacer(14));

        const divider = new Rectangle();
        divider.width = "420px";
        divider.height = "1px";
        divider.thickness = 0;
        divider.background = "#1f2a52";
        panel.addControl(divider);

        panel.addControl(this._spacer(14));

        const tip = new TextBlock();
        tip.text = "Tip: Pull farther back to maximize launch power.";
        tip.color = "#8190bc";
        tip.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        tip.fontSize = 16;
        tip.height = "42px";
        tip.textWrapping = true;
        tip.lineSpacing = "2px";
        panel.addControl(tip);

        panel.addControl(this._spacer(18));

        const btn = Button.CreateSimpleButton("retryBtn", "Retry Level");
        btn.width = "240px";
        btn.height = "48px";
        btn.color = "#dfe7ff";
        btn.background = "#1d2a57";
        btn.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        btn.fontSize = 20;
        btn.thickness = 1;
        btn.cornerRadius = 8;
        btn.hoverCursor = "pointer";
        btn.focusedColor = "#233060";
        btn.onPointerEnterObservable.add(() => {
            btn.background = "#233060";
        });
        btn.onPointerOutObservable.add(() => {
            btn.background = "#1d2a57";
        });
        btn.onPointerClickObservable.add(() => this.onRetry?.());
        panel.addControl(btn);
    }

    show(): void {
        this._root.isVisible = true;
    }

    hide(): void {
        this._root.isVisible = false;
    }

    private _spacer(height: number): Rectangle {
        const spacer = new Rectangle();
        spacer.width = "420px";
        spacer.height = `${height}px`;
        spacer.thickness = 0;
        spacer.background = "transparent";
        return spacer;
    }
}
