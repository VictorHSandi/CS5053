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
        this._root.width = "380px";
        this._root.height = "220px";
        this._root.cornerRadius = 16;
        this._root.color = "#fff";
        this._root.thickness = 2;
        this._root.background = "rgba(0,0,0,0.82)";
        this._root.isVisible = false;
        _ui.addControl(this._root);

        const panel = new StackPanel();
        panel.isVertical = true;
        this._root.addControl(panel);

        const title = new TextBlock();
        title.text = "Level Failed";
        title.color = "#ff5555";
        title.fontSize = 30;
        title.height = "50px";
        panel.addControl(title);

        const sub = new TextBlock();
        sub.text = "You ran out of shots!";
        sub.color = "#ccc";
        sub.fontSize = 18;
        sub.height = "40px";
        panel.addControl(sub);

        const btn = Button.CreateSimpleButton("retryBtn", "Retry Level");
        btn.width = "200px";
        btn.height = "40px";
        btn.color = "white";
        btn.background = "#633";
        btn.cornerRadius = 8;
        btn.paddingTopInPixels = 16;
        btn.onPointerClickObservable.add(() => this.onRetry?.());
        panel.addControl(btn);
    }

    show(): void {
        this._root.isVisible = true;
    }

    hide(): void {
        this._root.isVisible = false;
    }
}
