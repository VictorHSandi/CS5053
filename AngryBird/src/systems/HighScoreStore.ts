export interface LevelHighScoreEntry {
    levelId: string;
    score: number;
}

const STORAGE_KEY = "anger-ball-high-scores";

/**
 * Persists per-level high scores in localStorage.
 */
export class HighScoreStore {
    private _scores = new Map<string, number>();

    constructor() {
        this._load();
    }

    get(levelId: string): number {
        return this._scores.get(levelId) ?? 0;
    }

    getAll(): LevelHighScoreEntry[] {
        return Array.from(this._scores.entries()).map(([levelId, score]) => ({ levelId, score }));
    }

    saveIfHigher(levelId: string, score: number): { previous: number; current: number; isNewHighScore: boolean } {
        const previous = this.get(levelId);
        const current = Math.max(previous, Math.max(0, Math.round(score)));
        const isNewHighScore = current > previous;
        if (isNewHighScore) {
            this._scores.set(levelId, current);
            this._persist();
        }
        return { previous, current, isNewHighScore };
    }

    resetAll(): void {
        this._scores.clear();
        this._persist();
    }

    private _load(): void {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Record<string, number>;
            Object.entries(parsed).forEach(([levelId, score]) => {
                if (!Number.isFinite(score)) return;
                this._scores.set(levelId, Math.max(0, Math.round(score)));
            });
        } catch {
            this._scores.clear();
        }
    }

    private _persist(): void {
        const payload = Object.fromEntries(this._scores.entries());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
}
