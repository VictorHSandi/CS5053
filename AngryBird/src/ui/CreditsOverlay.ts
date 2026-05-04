export class CreditsOverlay {
    private _root: HTMLElement;
    private _text: HTMLElement;
    private _completeTimer: number | null = null;
    private _durationMs = 22000;
    private _loadedText = "";
    private _onComplete: (() => void) | null = null;

    constructor() {
        const root = document.getElementById("credits-root");
        const text = document.getElementById("credits-text");
        if (!root || !text) {
            throw new Error("Credits overlay elements not found");
        }

        this._root = root;
        this._text = text;
    }

    async show(onComplete: () => void): Promise<void> {
        await this._ensureLoaded();
        this.hide();
        this._onComplete = onComplete;
        this._text.textContent = this._loadedText;
        this._root.classList.remove("hidden");

        // Restart CSS animation cleanly.
        void this._text.offsetHeight;
        this._text.classList.add("credits-scroll");

        this._completeTimer = window.setTimeout(() => {
            const callback = this._onComplete;
            this.hide();
            callback?.();
        }, this._durationMs);
    }

    skip(): void {
        const callback = this._onComplete;
        this.hide();
        callback?.();
    }

    get isVisible(): boolean {
        return !this._root.classList.contains("hidden");
    }

    hide(): void {
        this._root.classList.add("hidden");
        this._text.classList.remove("credits-scroll");
        if (this._completeTimer !== null) {
            window.clearTimeout(this._completeTimer);
            this._completeTimer = null;
        }
        this._onComplete = null;
    }

    private async _ensureLoaded(): Promise<void> {
        if (this._loadedText) return;
        const creditsPath = `${import.meta.env.BASE_URL}credits.txt`;
        const response = await fetch(creditsPath);
        if (!response.ok) {
            throw new Error("Failed to load credits.txt");
        }
        this._loadedText = await response.text();
    }
}
