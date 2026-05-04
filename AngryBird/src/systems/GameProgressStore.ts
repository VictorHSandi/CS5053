export type SoundtrackMode = "classic" | "epic";

interface ProgressPayload {
    epicUnlocked: boolean;
    soundtrackMode: SoundtrackMode;
}

const STORAGE_KEY = "anger-ball-progress";

/**
 * Persists unlocks and soundtrack preferences.
 */
export class GameProgressStore {
    private _epicUnlocked = false;
    private _soundtrackMode: SoundtrackMode = "classic";

    constructor() {
        this._load();
    }

    get epicUnlocked(): boolean {
        return this._epicUnlocked;
    }

    get soundtrackMode(): SoundtrackMode {
        return this._soundtrackMode;
    }

    unlockEpicSoundtrack(): boolean {
        if (this._epicUnlocked) return false;
        this._epicUnlocked = true;
        this._persist();
        return true;
    }

    setSoundtrackMode(mode: SoundtrackMode): void {
        if (mode === "epic" && !this._epicUnlocked) {
            this._soundtrackMode = "classic";
        } else {
            this._soundtrackMode = mode;
        }
        this._persist();
    }

    private _load(): void {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Partial<ProgressPayload>;
            this._epicUnlocked = parsed.epicUnlocked === true;
            this._soundtrackMode = parsed.soundtrackMode === "epic" && this._epicUnlocked ? "epic" : "classic";
        } catch {
            this._epicUnlocked = false;
            this._soundtrackMode = "classic";
        }
    }

    private _persist(): void {
        const payload: ProgressPayload = {
            epicUnlocked: this._epicUnlocked,
            soundtrackMode: this._soundtrackMode,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
}
