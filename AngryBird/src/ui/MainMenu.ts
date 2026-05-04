export type MenuPanel = "main" | "levels" | "options" | "howToPlay";
export type GravityMode = "earth" | "moon";
export type SoundtrackMode = "classic" | "epic";

export interface MainMenuHandlers {
    onStartNew: () => void;
    onSelectLevel: (levelNumber: number) => void;
    onGravityModeChange: (mode: GravityMode) => void;
    onSfxVolumeChange: (volume: number) => void;
    onMusicVolumeChange: (volume: number) => void;
    onSoundtrackModeChange: (mode: SoundtrackMode) => void;
    onResetHighScores: () => void;
    onResumeFromOptions: () => void;
    onReturnToMainMenu: () => void;
}

/**
 * Controls the HTML main menu overlay and panel navigation.
 */
export class MainMenu {
    private _root: HTMLElement;
    private _panels: Record<MenuPanel, HTMLElement>;
    private _handlers: MainMenuHandlers;
    private _inGameOptions = false;

    constructor(handlers: MainMenuHandlers) {
        const root = document.getElementById("main-menu-root");
        if (!root) {
            throw new Error("Main menu root #main-menu-root not found");
        }

        this._root = root;
        this._handlers = handlers;
        this._panels = {
            main: this._getPanel("menu-panel-main"),
            levels: this._getPanel("menu-panel-levels"),
            options: this._getPanel("menu-panel-options"),
            howToPlay: this._getPanel("menu-panel-how-to-play"),
        };

        this._wireActions();
    }

    show(): void {
        this._inGameOptions = false;
        this._root.classList.remove("hidden");
        this._root.classList.remove("in-game-options");
        this._setOptionsBackLabel("Back");
        this._showPanel("main");
    }

    showOptionsInGame(): void {
        this._inGameOptions = true;
        this._root.classList.remove("hidden");
        this._root.classList.add("in-game-options");
        this._setOptionsBackLabel("Resume Game");
        this._showPanel("options");
    }

    hide(): void {
        this._root.classList.add("hidden");
        this._root.classList.remove("in-game-options");
        this._inGameOptions = false;
        this._setOptionsBackLabel("Back");
    }

    private _getPanel(id: string): HTMLElement {
        const el = document.getElementById(id);
        if (!el) {
            throw new Error(`Main menu panel #${id} not found`);
        }
        return el;
    }

    private _wireActions(): void {
        this._bindButton("menu-action-start", () => this._handlers.onStartNew());
        this._bindButton("menu-action-level-select", () => this._showPanel("levels"));
        this._bindButton("menu-action-options", () => this._showPanel("options"));
        this._bindButton("menu-action-how-to-play", () => this._showPanel("howToPlay"));
        this._bindButton("menu-action-levels-back", () => this._showPanel("main"));
        this._bindButton("menu-action-how-to-play-back", () => this._showPanel("main"));
        this._bindButton("menu-action-reset-high-scores", () => this._handlers.onResetHighScores());
        this._bindButton("menu-action-return-main", () => this._handlers.onReturnToMainMenu());
        this._bindButton("menu-action-options-back", () => {
            if (this._inGameOptions) {
                this._handlers.onResumeFromOptions();
                return;
            }
            this._showPanel("main");
        });

        const levelButtons = this._root.querySelectorAll<HTMLButtonElement>("[data-level]");
        levelButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const raw = button.dataset.level;
                const parsed = raw ? Number(raw) : NaN;
                if (!Number.isFinite(parsed)) return;
                this._handlers.onSelectLevel(parsed);
            });
        });

        const gravityRadios = this._root.querySelectorAll<HTMLInputElement>("input[name='menu-gravity']");
        gravityRadios.forEach((radio) => {
            radio.addEventListener("change", () => {
                if (!radio.checked) return;
                const value = radio.value === "moon" ? "moon" : "earth";
                this._handlers.onGravityModeChange(value);
            });
        });

        this._wireSlider(
            "menu-sfx-volume",
            "menu-sfx-volume-value",
            (volume) => this._handlers.onSfxVolumeChange(volume),
        );

        this._wireSlider(
            "menu-music-volume",
            "menu-music-volume-value",
            (volume) => this._handlers.onMusicVolumeChange(volume),
        );

        const soundtrackRadios = this._root.querySelectorAll<HTMLInputElement>("input[name='menu-soundtrack']");
        soundtrackRadios.forEach((radio) => {
            radio.addEventListener("change", () => {
                if (!radio.checked) return;
                const value = radio.value === "epic" ? "epic" : "classic";
                this._handlers.onSoundtrackModeChange(value);
            });
        });
    }

    private _wireSlider(
        inputId: string,
        valueId: string,
        onChange: (volume: number) => void,
    ): void {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        const value = document.getElementById(valueId);
        if (!input || !value) {
            throw new Error(`Main menu slider #${inputId} or value #${valueId} not found`);
        }

        const update = () => {
            const raw = Number(input.value);
            const clamped = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));
            value.textContent = `${clamped}%`;
            onChange(clamped / 100);
        };

        input.addEventListener("input", update);
        update();
    }

    private _bindButton(id: string, onClick: () => void): void {
        const button = document.getElementById(id) as HTMLButtonElement | null;
        if (!button) {
            throw new Error(`Main menu button #${id} not found`);
        }

        button.addEventListener("click", () => onClick());
    }

    private _setOptionsBackLabel(text: string): void {
        const button = document.getElementById("menu-action-options-back") as HTMLButtonElement | null;
        if (!button) return;
        button.textContent = text;
    }

    setLevelHighScores(scores: number[], stars: number[]): void {
        scores.forEach((score, index) => {
            const slot = document.getElementById(`menu-level-score-${index + 1}`);
            const starSlot = document.getElementById(`menu-level-stars-${index + 1}`);
            if (!slot || !starSlot) return;
            slot.textContent = `High Score: ${Math.max(0, Math.round(score))}`;
            const starCount = Math.max(0, Math.min(3, stars[index] ?? 0));
            starSlot.textContent = `${"★".repeat(starCount)}${"☆".repeat(3 - starCount)}`;
        });
    }

    setEpicSoundtrackUnlocked(unlocked: boolean, selectedMode: SoundtrackMode): void {
        const epic = document.getElementById("menu-soundtrack-epic") as HTMLInputElement | null;
        const classic = document.getElementById("menu-soundtrack-classic") as HTMLInputElement | null;
        const lockNote = document.getElementById("menu-soundtrack-epic-lock");
        if (!epic || !classic || !lockNote) return;

        epic.disabled = !unlocked;
        lockNote.textContent = unlocked ? "Unlocked" : "Locked until credits";
        classic.checked = selectedMode !== "epic";
        epic.checked = selectedMode === "epic" && unlocked;
    }

    private _showPanel(panel: MenuPanel): void {
        (Object.keys(this._panels) as MenuPanel[]).forEach((key) => {
            this._panels[key].classList.toggle("active", key === panel);
        });
    }
}
