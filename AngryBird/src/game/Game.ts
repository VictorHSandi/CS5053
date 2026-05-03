import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { SceneManager } from "../scenes/SceneManager";
import { GameStateManager, GameState } from "./GameStateManager";
import { InputController } from "../systems/InputController";
import { CameraController, CameraMode } from "../systems/CameraController";
import { LauncherSystem } from "../systems/LauncherSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { FlightControlSystem } from "../systems/FlightControlSystem";
import { TargetSystem } from "../systems/TargetSystem";
import { ScoreSystem, ScoreBreakdown } from "../systems/ScoreSystem";
import { LevelManager } from "../levels/LevelManager";
import { toVec3 } from "../levels/LevelData";
import { UIManager } from "../ui/UIManager";

/**
 * Top-level game controller.
 * Wires together all systems and drives the main update loop.
 */
export class Game {
    // Core
    private _sceneManager: SceneManager;
    private _state: GameStateManager;
    private _input: InputController;

    // Systems
    private _camera: CameraController;
    private _launcher: LauncherSystem;
    private _projectile: ProjectileSystem;
    private _flight: FlightControlSystem;
    private _targets: TargetSystem;
    private _score: ScoreSystem;

    // Data
    private _levels: LevelManager;

    // UI
    private _ui: UIManager;

    // Misc
    private _evaluateDelay = 0;

    constructor(canvas: HTMLCanvasElement) {
        // ── Bootstrap ──────────────────────────────────────
        this._sceneManager = new SceneManager(canvas);
        (window as any).__scene = this._sceneManager.scene;
        const scene = this._sceneManager.scene;

        this._state = new GameStateManager();
        this._input = new InputController(canvas);

        this._camera = new CameraController(scene);
        this._launcher = new LauncherSystem(scene);
        this._projectile = new ProjectileSystem(scene);
        this._flight = new FlightControlSystem();
        this._targets = new TargetSystem();
        this._score = new ScoreSystem();
        this._levels = new LevelManager();
        this._ui = new UIManager(scene);

        // Wire UI callbacks
        this._ui.winScreen.onNext = () => this._advanceLevel();
        this._ui.winScreen.onRetry = () => this._restartLevel();
        this._ui.loseScreen.onRetry = () => this._restartLevel();

        // State-change listener
        this._state.onChange((_prev, next) => this._onStateChange(next));

        // Load first level and start
        this._loadLevel();
        this._sceneManager.run((dt) => this._update(dt));
    }

    // ══════════════════════════════════════════════════════
    //  LEVEL LIFECYCLE
    // ══════════════════════════════════════════════════════

    private _loadLevel(): void {
        const scene = this._sceneManager.scene;
        this._levels.load(scene);

        const def = this._levels.currentDef;
        this._launcher.configure(toVec3(def.launcherPosition), toVec3(def.launchDirection));
        this._launcher.setVisible(true);

        this._projectile.spawn(this._launcher.launchPoint);
        this._score.reset();
        this._evaluateDelay = 0;

        this._camera.setAimView(toVec3(def.launcherPosition));
        this._ui.hideOverlays();
        this._state.transition(GameState.Aiming);
    }

    private _restartLevel(): void {
        this._levels.clearEntities();
        this._projectile.projectile.deactivate();
        this._loadLevel();
    }

    private _advanceLevel(): void {
        this._levels.clearEntities();
        this._projectile.projectile.deactivate();
        if (this._levels.nextLevel()) {
            this._loadLevel();
        }
    }

    // ══════════════════════════════════════════════════════
    //  STATE TRANSITIONS
    // ══════════════════════════════════════════════════════

    private _onStateChange(next: GameState): void {
        switch (next) {
            case GameState.Aiming:
                this._ui.hud.setHint("Drag down & sideways to aim • Release to launch");
                break;
            case GameState.Flying:
                this._ui.hud.setHint("WASD / Arrows = nudge • Space = boost (once)");
                break;
            case GameState.Won:
                this._showWin();
                break;
            case GameState.Lost:
                this._ui.showLose();
                break;
        }
    }

    private _showWin(): void {
        const def = this._levels.currentDef;
        const totalTargets = def.targets.length;
        const breakdown = this._score.finalise(def, totalTargets);
        this._ui.showWin(breakdown, this._levels.hasNextLevel);
    }

    // ══════════════════════════════════════════════════════
    //  MAIN UPDATE LOOP
    // ══════════════════════════════════════════════════════

    private _update(dt: number): void {
        const state = this._state.state;
        const def = this._levels.currentDef;

        // HUD (always refreshed except on overlays)
        if (state !== GameState.Won && state !== GameState.Lost) {
            this._ui.updateHUD(
                def.name,
                this._score.shotsUsed,
                def.maxShots,
                this._score.score,
                this._levels.aliveTargetCount,
            );
        }

        switch (state) {
            case GameState.Aiming:
                this._updateAiming();
                break;
            case GameState.Launching:
                this._updateLaunching(dt);
                break;
            case GameState.Flying:
                this._updateFlying(dt);
                break;
            case GameState.Evaluating:
                this._updateEvaluating(dt);
                break;
            // Won / Lost — no per-frame logic, overlays handle input
        }

        this._input.endFrame();
    }

    // ── Aiming ────────────────────────────────────────────

    private _updateAiming(): void {
        // Check release BEFORE calling launcher.update().
        // When pointerJustReleased=true, pointerDown is already false, so
        // update() would reset pullDistance to 0 before we can read it.
        if (this._input.pointerJustReleased && this._launcher.pullDistance > 0.15) {
            this._doLaunch();
            return;
        }
        this._launcher.update(this._input);
    }

    private _doLaunch(): void {
        const vel = this._launcher.launchVelocity.clone();
        this._score.recordShot();
        this._projectile.spawn(this._launcher.launchPoint);
        this._projectile.launch(vel);

        // Begin camera transition
        const camStart = this._camera.camera.position.clone();
        const camStartLook = this._camera.camera.getTarget();

        const projPos = this._projectile.position;
        const dir = vel.normalizeToNew();
        const camEnd = projPos.subtract(dir.scale(3.5)).add(new Vector3(0, 1.2, 0));
        const camEndLook = projPos.add(dir.scale(4));

        this._camera.beginTransition(camStart, camStartLook, camEnd, camEndLook);
        this._launcher.setVisible(false);

        this._state.transition(GameState.Launching);
    }

    // ── Launching (camera transition) ─────────────────────

    private _updateLaunching(dt: number): void {
        this._projectile.update(dt);
        const done = this._camera.update(dt, this._projectile.position, this._projectile.velocity);
        // Run collision even during transition
        this._runCollisions();
        if (done) {
            this._state.transition(GameState.Flying);
        }
    }

    // ── Flying ────────────────────────────────────────────

    private _updateFlying(dt: number): void {
        this._flight.update(this._projectile.projectile, this._input, dt);

        const stillAlive = this._projectile.update(dt);
        this._camera.update(dt, this._projectile.position, this._projectile.velocity);
        this._runCollisions();

        if (!stillAlive) {
            // Projectile hit ground or timed out
            this._state.transition(GameState.Evaluating);
        }
    }

    // ── Evaluating ────────────────────────────────────────

    private _updateEvaluating(dt: number): void {
        // Brief pause before deciding win/lose/retry
        this._evaluateDelay += dt;
        if (this._evaluateDelay < 0.8) return;
        this._evaluateDelay = 0;

        if (this._levels.aliveTargetCount === 0) {
            this._state.transition(GameState.Won);
        } else if (this._score.shotsUsed >= this._levels.currentDef.maxShots) {
            this._state.transition(GameState.Lost);
        } else {
            // Reset for next shot
            this._prepareNextShot();
        }
    }

    private _prepareNextShot(): void {
        const def = this._levels.currentDef;
        this._projectile.spawn(this._launcher.launchPoint);
        this._launcher.configure(toVec3(def.launcherPosition), toVec3(def.launchDirection));
        this._launcher.setVisible(true);
        this._camera.setAimView(toVec3(def.launcherPosition));
        this._state.transition(GameState.Aiming);
    }

    // ── Collision helper ──────────────────────────────────

    private _runCollisions(): void {
        const result = this._targets.checkCollisions(
            this._projectile.projectile,
            this._levels.targets,
            this._levels.obstacles,
        );
        if (result.totalScore > 0) {
            this._score.addScore(result.totalScore);
        }
    }
}
