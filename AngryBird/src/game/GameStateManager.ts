/**
 * Finite set of game-play states used by Game and consumed by all systems.
 */
export enum GameState {
    /** Player is dragging the sling / choosing aim. */
    Aiming = "aiming",
    /** Brief camera transition from aim view to follow cam. */
    Launching = "launching",
    /** Projectile is in the air; player has slight air control. */
    Flying = "flying",
    /** Projectile has landed / timed out — evaluate results. */
    Evaluating = "evaluating",
    /** Level completed successfully. */
    Won = "won",
    /** Level failed (out of shots). */
    Lost = "lost",
}

export type StateChangeListener = (prev: GameState, next: GameState) => void;

/**
 * Simple observable state machine for the game loop.
 */
export class GameStateManager {
    private _state: GameState = GameState.Aiming;
    private _listeners: StateChangeListener[] = [];

    get state(): GameState {
        return this._state;
    }

    /** Transition to a new state; notifies all listeners. */
    transition(next: GameState): void {
        if (next === this._state) return;
        const prev = this._state;
        this._state = next;
        for (const fn of this._listeners) fn(prev, next);
    }

    /** Register a listener that fires on every state transition. */
    onChange(fn: StateChangeListener): void {
        this._listeners.push(fn);
    }

    /** Remove a previously registered listener. */
    offChange(fn: StateChangeListener): void {
        this._listeners = this._listeners.filter((l) => l !== fn);
    }
}
