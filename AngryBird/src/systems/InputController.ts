/**
 * Thin wrapper around browser keyboard + pointer state,
 * consumed by various systems each frame.
 */
export class InputController {
    // Keyboard
    public readonly keys = new Set<string>();
    // Keys pressed this frame only (cleared at end of frame)
    public readonly keysJustPressed = new Set<string>(); // NEW

    // Pointer / mouse
    public pointerDown = false;
    public pointerX = 0;
    public pointerY = 0;
    /** Pointer position at the moment the button was pressed. */
    public pointerStartX = 0;
    public pointerStartY = 0;
    /** Delta from start while dragging. */
    public dragDX = 0;
    public dragDY = 0;
    /** Set to true for the single frame a click/release happens. */
    public pointerJustReleased = false;

    private _canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        window.addEventListener("keydown", (e) => {
            if (!this.keys.has(e.code)) {
                this.keysJustPressed.add(e.code); // only on initial press, not hold
            }
            this.keys.add(e.code);
        });
        window.addEventListener("keyup", (e) => this.keys.delete(e.code));

        canvas.addEventListener("pointerdown", (e) => {
            this.pointerDown = true;
            this.pointerStartX = e.offsetX;
            this.pointerStartY = e.offsetY;
            this.pointerX = e.offsetX;
            this.pointerY = e.offsetY;
            this.dragDX = 0;
            this.dragDY = 0;
        });
        canvas.addEventListener("pointermove", (e) => {
            this.pointerX = e.offsetX;
            this.pointerY = e.offsetY;
            if (this.pointerDown) {
                this.dragDX = this.pointerX - this.pointerStartX;
                this.dragDY = this.pointerY - this.pointerStartY;
            }
        });
        canvas.addEventListener("pointerup", () => {
            this.pointerDown = false;
            this.pointerJustReleased = true;
        });
        canvas.addEventListener("pointerleave", () => {
            if (this.pointerDown) {
                this.pointerDown = false;
                this.pointerJustReleased = true;
            }
        });
    }

    /** Call at the END of each game-loop tick to reset one-frame flags. */
    endFrame(): void {
        this.pointerJustReleased = false;
        this.keysJustPressed.clear(); // NEW — reset single-frame key presses
    }

    get canvasWidth(): number {
        return this._canvas.clientWidth;
    }

    get canvasHeight(): number {
        return this._canvas.clientHeight;
    }
}