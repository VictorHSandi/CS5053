import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";

/**
 * In-game heads-up display: level name, shots, score, targets.
 */
export class HUD {
    private _shell: Rectangle;
    private _levelValue: TextBlock;
    private _shotsText: TextBlock;
    private _scoreText: TextBlock;
    private _targetsText: TextBlock;
    private _powerupText: TextBlock;
    private _controlsSection: StackPanel;
    private _controlsVisible = true;

    constructor(private _ui: AdvancedDynamicTexture) {
        this._shell = new Rectangle("hudShell");
        this._shell.width = "420px";
        this._shell.height = "500px";
        this._shell.thickness = 2;
        this._shell.cornerRadius = 3;
        this._shell.color = "#29325c";
        this._shell.background = "#0f1430e6";
        this._shell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._shell.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._shell.left = "14px";
        this._shell.top = "14px";
        this._ui.addControl(this._shell);

        const panel = new StackPanel("hudPanel");
        panel.isVertical = true;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.paddingLeftInPixels = 14;
        panel.paddingTopInPixels = 12;
        panel.paddingBottomInPixels = 16;
        panel.width = "390px";
        this._shell.addControl(panel);

        this._addHeader(panel, "STATUS");
        this._levelValue = this._addStatusRow(panel, "Level", "---", "#ffd700");
        this._shotsText = this._addStatusRow(panel, "Shots", "0 / 0", "#d7deea");
        this._scoreText = this._addStatusRow(panel, "Score", "0", "#d7deea");
        this._targetsText = this._addStatusRow(panel, "Targets", "0", "#66d9ff");
        this._powerupText = this._addStatusRow(panel, "Powerup", "None", "#7b88b3");

        this._controlsSection = new StackPanel("hudControlsSection");
        this._controlsSection.isVertical = true;
        this._controlsSection.width = "372px";
        panel.addControl(this._controlsSection);

        this._addGap(this._controlsSection, 8);
        this._addDivider(this._controlsSection);
        this._addGap(this._controlsSection, 8);
        this._addHeader(this._controlsSection, "CONTROLS");
        this._addWASDControlRow(this._controlsSection, "Steer");
        this._addControlRow(this._controlsSection, "ARROWS", "Steer (alt)");
        this._addControlRow(this._controlsSection, "SPACE", "Boost (once)");
        this._addControlRow(this._controlsSection, "DRAG", "Aim + launch");
        this._addControlRow(this._controlsSection, "ESC", "Options / resume");
    }

    update(
        levelName: string,
        shotsUsed: number,
        maxShots: number,
        score: number,
        targetsLeft: number,
        powerupText: string,
        powerupColor: string,
    ): void {
        this._levelValue.text = levelName;
        this._shotsText.text = `${shotsUsed} / ${maxShots}`;
        this._scoreText.text = `${score}`;
        this._targetsText.text = `${targetsLeft}`;
        this._powerupText.text = powerupText;
        this._powerupText.color = powerupColor;
    }

    setVisible(visible: boolean): void {
        this._shell.isVisible = visible;
    }

    setControlsVisible(visible: boolean): void {
        this._controlsVisible = visible;
        this._controlsSection.isVisible = visible;
        this._shell.height = visible ? "500px" : "230px";
    }

    private _addHeader(parent: StackPanel, text: string): TextBlock {
        const tb = new TextBlock();
        tb.text = text;
        tb.color = "#8f9fca";
        tb.fontFamily = "'Press Start 2P', monospace";
        tb.fontSize = 11;
        tb.height = "22px";
        tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tb.paddingBottomInPixels = 2;
        parent.addControl(tb);
        return tb;
    }

    private _addGap(parent: StackPanel, height: number): void {
        const gap = new Rectangle();
        gap.height = `${height}px`;
        gap.width = "372px";
        gap.thickness = 0;
        gap.background = "transparent";
        parent.addControl(gap);
    }

    private _addDivider(parent: StackPanel): void {
        const divider = new Rectangle();
        divider.height = "1px";
        divider.width = "372px";
        divider.thickness = 0;
        divider.background = "#1f2a52";
        parent.addControl(divider);
    }

    private _addStatusRow(parent: StackPanel, label: string, value: string, valueColor: string): TextBlock {
        const row = new StackPanel();
        row.isVertical = false;
        row.width = "372px";
        row.height = "31px";
        row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.paddingBottomInPixels = 2;
        parent.addControl(row);

        const labelText = new TextBlock();
        labelText.text = label;
        labelText.color = "#7b88b3";
        labelText.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        labelText.fontSize = 17;
        labelText.width = "132px";
        labelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.addControl(labelText);

        const valueText = new TextBlock();
        valueText.text = value;
        valueText.color = valueColor;
        valueText.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        valueText.fontSize = 17;
        valueText.width = "232px";
        valueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        valueText.paddingLeftInPixels = 12;
        valueText.resizeToFit = true;
        row.addControl(valueText);

        return valueText;
    }

    private _addControlRow(parent: StackPanel, keyText: string, description: string): void {
        const row = new StackPanel();
        row.isVertical = false;
        row.width = "372px";
        row.height = "44px";
        row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.paddingBottomInPixels = 4;
        parent.addControl(row);

        const keyBadge = new Rectangle();
        keyBadge.width = "132px";
        keyBadge.height = "34px";
        keyBadge.cornerRadius = 4;
        keyBadge.thickness = 1;
        keyBadge.color = "#30448f";
        keyBadge.background = "#1a2349";
        keyBadge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.addControl(keyBadge);

        const keyLabel = new TextBlock();
        keyLabel.text = keyText;
        keyLabel.color = "#9bb2ee";
        keyLabel.fontFamily = "'Press Start 2P', monospace";
        keyLabel.fontSize = 11;
        keyLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        keyBadge.addControl(keyLabel);

        const desc = new TextBlock();
        desc.text = description;
        desc.color = "#8190bc";
        desc.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        desc.fontSize = 16;
        desc.width = "226px";
        desc.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        desc.paddingLeftInPixels = 14;
        desc.resizeToFit = true;
        row.addControl(desc);
    }

    private _addWASDControlRow(parent: StackPanel, description: string): void {
        const row = new StackPanel();
        row.isVertical = false;
        row.width = "372px";
        row.height = "68px";
        row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.paddingBottomInPixels = 6;
        parent.addControl(row);

        const keyboardBadge = new Rectangle();
        keyboardBadge.width = "132px";
        keyboardBadge.height = "58px";
        keyboardBadge.cornerRadius = 4;
        keyboardBadge.thickness = 1;
        keyboardBadge.color = "#30448f";
        keyboardBadge.background = "#1a2349";
        keyboardBadge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.addControl(keyboardBadge);

        const keyboardStack = new StackPanel();
        keyboardStack.isVertical = true;
        keyboardStack.width = "126px";
        keyboardStack.height = "52px";
        keyboardStack.paddingTopInPixels = 3;
        keyboardBadge.addControl(keyboardStack);

        const topRow = new StackPanel();
        topRow.isVertical = false;
        topRow.height = "24px";
        keyboardStack.addControl(topRow);
        this._addMiniKey(topRow, "W", 46);

        const bottomRow = new StackPanel();
        bottomRow.isVertical = false;
        bottomRow.height = "26px";
        keyboardStack.addControl(bottomRow);
        this._addMiniKey(bottomRow, "A", 38);
        this._addMiniKey(bottomRow, "S", 38);
        this._addMiniKey(bottomRow, "D", 38);

        const desc = new TextBlock();
        desc.text = description;
        desc.color = "#8190bc";
        desc.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        desc.fontSize = 16;
        desc.width = "226px";
        desc.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        desc.paddingLeftInPixels = 14;
        row.addControl(desc);
    }

    private _addMiniKey(parent: StackPanel, label: string, width: number): void {
        const key = new Rectangle();
        key.width = `${width}px`;
        key.height = "20px";
        key.thickness = 1;
        key.cornerRadius = 2;
        key.color = "#3c56aa";
        key.background = "#0f1838";
        parent.addControl(key);

        const text = new TextBlock();
        text.text = label;
        text.color = "#a5bbf5";
        text.fontFamily = "'Press Start 2P', monospace";
        text.fontSize = 9;
        key.addControl(text);
    }
}