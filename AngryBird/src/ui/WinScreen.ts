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
    private _summary: TextBlock;
    private _details: TextBlock;
    private _scoreBarTrack: Rectangle;
    private _scoreBarSegments: Rectangle[] = [];
    private _scoreBarPenalty: Rectangle;
    private _scoreBarLabel: TextBlock;
    private _scoreLegend: TextBlock;
    private _nextBtn: Button;
    private _retryBtn: Button;
    private _creditsBtn: Button;

    public onNext: (() => void) | null = null;
    public onRetry: (() => void) | null = null;
    public onCredits: (() => void) | null = null;

    constructor(private _ui: AdvancedDynamicTexture) {
        this._root = new Rectangle("winRoot");
        this._root.width = "500px";
        this._root.height = "590px";
        this._root.cornerRadius = 14;
        this._root.color = "#31427f";
        this._root.thickness = 2;
        this._root.background = "#10162fe8";
        this._root.isVisible = false;
        _ui.addControl(this._root);

        const panel = new StackPanel();
        panel.isVertical = true;
        panel.paddingTopInPixels = 14;
        this._root.addControl(panel);

        this._title = this._text(panel, "Level Complete!", 30, "#4cff4c");
        this._starsText = this._text(panel, "★ ★ ★", 36, "#ffd700");
        this._summary = this._text(panel, "", 19, "#9dd1ff");
        this._summary.height = "70px";
        this._summary.textWrapping = true;
        const barWrap = new Rectangle();
        barWrap.width = "420px";
        barWrap.height = "34px";
        barWrap.thickness = 1;
        barWrap.color = "#31427f";
        barWrap.background = "#0d1226";
        barWrap.paddingBottomInPixels = 10;
        panel.addControl(barWrap);

        this._scoreBarTrack = new Rectangle();
        this._scoreBarTrack.width = "420px";
        this._scoreBarTrack.height = "34px";
        this._scoreBarTrack.thickness = 0;
        this._scoreBarTrack.background = "transparent";
        barWrap.addControl(this._scoreBarTrack);

        for (let index = 0; index < 3; index++) {
            const segment = new Rectangle();
            segment.thickness = 0;
            segment.height = "34px";
            segment.width = "0px";
            segment.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            segment.left = "0px";
            this._scoreBarTrack.addControl(segment);
            this._scoreBarSegments.push(segment);
        }

        this._scoreBarPenalty = new Rectangle();
        this._scoreBarPenalty.thickness = 0;
        this._scoreBarPenalty.height = "34px";
        this._scoreBarPenalty.background = "#ff5a5a";
        this._scoreBarPenalty.alpha = 0.85;
        this._scoreBarPenalty.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._scoreBarPenalty.width = "0px";
        this._scoreBarPenalty.left = "0px";
        this._scoreBarTrack.addControl(this._scoreBarPenalty);

        this._scoreBarLabel = new TextBlock();
        this._scoreBarLabel.color = "#a9b8de";
        this._scoreBarLabel.fontFamily = "'Share Tech Mono', 'Courier New', monospace";
        this._scoreBarLabel.fontSize = 16;
        this._scoreBarLabel.height = "26px";
        panel.addControl(this._scoreBarLabel);

        this._scoreLegend = this._text(
            panel,
            "Green=Targets  Blue=Structures  Gold=Shot Score  Red=Powerup Cost",
            13,
            "#8f9fca",
        );
        this._scoreLegend.height = "28px";

        this._details = this._text(panel, "", 18, "#ddd");
        this._details.height = "190px";
        this._details.textWrapping = true;

        this._creditsBtn = this._button(panel, "Credits", () => this.onCredits?.());
        this._nextBtn = this._button(panel, "Next Level", () => this.onNext?.());
        this._retryBtn = this._button(panel, "Retry", () => this.onRetry?.());
    }

    show(breakdown: ScoreBreakdown, hasNext: boolean, showCredits: boolean): void {
        const starStr = "★".repeat(breakdown.stars) + "☆".repeat(3 - breakdown.stars);
        this._starsText.text = starStr;
        if (breakdown.previousHighScore === 0) {
            this._summary.text = `First clear. New high score set at ${breakdown.totalScore}.`;
        } else if (breakdown.isNewHighScore) {
            this._summary.text = `New high score by ${breakdown.totalScore - breakdown.previousHighScore}. Best is now ${breakdown.highScore}.`;
        } else {
            this._summary.text = `High score stays at ${breakdown.highScore}. Need ${breakdown.scoreToBeatHighScore} more to beat it.`;
        }
        const targetScore = Math.max(1, breakdown.barTargetScore);
        const trackWidth = 420;
        if (breakdown.isNewHighScore && breakdown.previousHighScore > 0) {
            this._scoreBarLabel.text = `High score beaten by +${breakdown.barOverflowScore}`;
        } else if (breakdown.previousHighScore > 0) {
            this._scoreBarLabel.text = `${breakdown.totalScore} / ${breakdown.previousHighScore} to beat best`;
        } else {
            this._scoreBarLabel.text = `First score: ${breakdown.totalScore}`;
        }

        let usedWidth = 0;
        this._scoreBarSegments.forEach((segment, index) => {
            const source = breakdown.barSegments[index];
            const segmentWidth = Math.max(0, Math.min(trackWidth - usedWidth, Math.round((source?.value ?? 0) / targetScore * trackWidth)));
            segment.width = `${segmentWidth}px`;
            segment.left = `${usedWidth}px`;
            segment.background = source?.color ?? "transparent";
            usedWidth += segmentWidth;
        });

        const penaltyWidth = Math.max(0, Math.min(trackWidth, Math.round((breakdown.barPenaltyScore / targetScore) * trackWidth)));
        const fillWidth = breakdown.isNewHighScore
            ? trackWidth
            : Math.max(0, Math.min(trackWidth, Math.round((breakdown.barFillScore / targetScore) * trackWidth)));
        const penaltyLeft = Math.max(0, fillWidth - penaltyWidth);
        this._scoreBarPenalty.width = `${breakdown.barPenaltyScore > 0 ? Math.min(penaltyWidth, fillWidth) : 0}px`;
        this._scoreBarPenalty.left = `${penaltyLeft}px`;
        this._details.text =
            `Objective clears: ${breakdown.objectiveTargetsDestroyed}\n` +
            `Target destruction: +${breakdown.targetScore}\n` +
            `Structure destruction: +${breakdown.obstacleScore}\n` +
            `Destruction total: +${breakdown.destructionScore}\n` +
            `Shots used: ${breakdown.shotsUsed}\n` +
            `Shot score: +${breakdown.shotScore}\n` +
            `Powerups used: ${breakdown.powerupsUsed}\n` +
            `Powerup adjustment: ${breakdown.powerupAdjustment >= 0 ? "+" : ""}${breakdown.powerupAdjustment}\n` +
            `Final score: ${breakdown.totalScore}`;
        this._nextBtn.isVisible = hasNext;
        this._creditsBtn.isVisible = showCredits;
        this._root.isVisible = true;
    }

    hide(): void {
        this._root.isVisible = false;
    }

    private _text(parent: StackPanel, text: string, size: number, color: string): TextBlock {
        const tb = new TextBlock();
        tb.text = text;
        tb.color = color;
        tb.fontFamily = size >= 30 ? "'Press Start 2P', monospace" : "'Share Tech Mono', 'Courier New', monospace";
        tb.fontSize = size;
        tb.height = `${size + 18}px`;
        parent.addControl(tb);
        return tb;
    }

    private _button(parent: StackPanel, label: string, cb: () => void): Button {
        const btn = Button.CreateSimpleButton(`btn_${label}`, label);
        btn.width = "200px";
        btn.height = "42px";
        btn.color = "white";
        btn.background = "#1d2a57";
        btn.cornerRadius = 8;
        btn.paddingTopInPixels = 8;
        btn.onPointerClickObservable.add(cb);
        parent.addControl(btn);
        return btn;
    }
}
