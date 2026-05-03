import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { SceneManager } from "../scenes/SceneManager";
import { setSkyboxVisible } from "../scenes/SceneSetup";
import { GameStateManager, GameState } from "./GameStateManager";
import { InputController } from "../systems/InputController";
import { CameraController } from "../systems/CameraController";
import { LauncherSystem } from "../systems/LauncherSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { FlightControlSystem } from "../systems/FlightControlSystem";
import { TargetSystem } from "../systems/TargetSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { GravitySystem } from "../systems/GravitySystem";
import { LevelManager } from "../levels/LevelManager";
import { LevelDef, toVec3 } from "../levels/LevelData";
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
    private _gravity: GravitySystem;

    // Data
    private _levels: LevelManager;

    // UI
    private _ui: UIManager;

    // Misc
    private _evaluateDelay = 0;

    constructor(canvas: HTMLCanvasElement) {
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
        this._gravity = new GravitySystem(scene, this._ui.hud);

        this._ui.winScreen.onNext = () => this._advanceLevel();
        this._ui.winScreen.onRetry = () => this._restartLevel();
        this._ui.loseScreen.onRetry = () => this._restartLevel();

        this._state.onChange((_prev, next) => this._onStateChange(next));

        this._sceneManager.ready.then(() => {
            this._loadLevel();
            this._sceneManager.run((dt) => this._update(dt));
        });
    }

    private _loadLevel(): void {
        const scene = this._sceneManager.scene;
        this._levels.load(scene);

        const def = this._levels.currentDef;
        this._launcher.configure(toVec3(def.launcherPosition), toVec3(def.launchDirection));
        this._launcher.setVisible(true);

        this._projectile.spawn(this._launcher.launchPoint);
        this._refreshShadowCasters();
        this._score.reset();
        this._evaluateDelay = 0;

        this._camera.setAimView(toVec3(def.launcherPosition), this._computeAimMaxX(def));
        setSkyboxVisible(false);
        this._ui.hideOverlays();
        this._state.transition(GameState.Aiming);
    }

    private _computeAimMaxX(def: LevelDef): number {
        let maxX = def.launcherPosition.x;

        for (const t of def.targets) {
            const radius = (t.size ?? 0.8) * 0.5;
            maxX = Math.max(maxX, t.position.x + radius);
        }

        for (const o of def.obstacles) {
            const halfWidth = (o.size?.x ?? 1) * 0.5;
            maxX = Math.max(maxX, o.position.x + halfWidth);
        }

        return maxX;
    }

    private _refreshShadowCasters(): void {
        const shadowGen = this._sceneManager.shadowGenerator;
        const shadowMap = shadowGen.getShadowMap();
        if (shadowMap) {
            shadowMap.renderList = [];
        }

        this._launcher.registerShadowCasters(shadowGen);
        if (this._projectile.active) {
            shadowGen.addShadowCaster(this._projectile.projectile.mesh);
        }
        for (const target of this._levels.targets) {
            shadowGen.addShadowCaster(target.mesh);
        }
        for (const obstacle of this._levels.obstacles) {
            shadowGen.addShadowCaster(obstacle.mesh);
        }
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

    private _onStateChange(next: GameState): void {
        switch (next) {
            case GameState.Aiming:
                this._ui.hud.setHint("Drag down to set power • Release to launch • G = toggle gravity");
                break;
            case GameState.Flying:
                this._ui.hud.setHint("WASD / Arrows = steer • Space = boost (once) • G = toggle gravity");
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

    private _update(dt: number): void {
        const state = this._state.state;
        const def = this._levels.currentDef;

        if (state !== GameState.Won && state !== GameState.Lost) {
            this._ui.updateHUD(
                def.name,
                this._score.shotsUsed,
                def.maxShots,
                this._score.score,
                this._levels.aliveTargetCount,
            );
        }

        this._gravity.update(this._input);

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
        }

        this._input.endFrame();
    }

    private _updateAiming(): void {
        // Evaluate release before update() because update() resets pull when pointerDown=false.
        if (this._input.pointerJustReleased && this._launcher.pullDistance > 0.15) {
            this._doLaunch();
            return;
        }
        this._launcher.update(this._input, this._gravity.currentGravity);
    }

    private _doLaunch(): void {
        setSkyboxVisible(true);

        const vel = this._launcher.launchVelocity.clone();
        this._score.recordShot();
        this._projectile.spawn(this._launcher.launchPoint);
        this._projectile.launch(vel);
        this._refreshShadowCasters();

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

    private _updateLaunching(dt: number): void {
        this._projectile.update(dt, this._gravity.currentGravity);
        const done = this._camera.update(dt, this._projectile.position, this._projectile.velocity);
        this._runCollisions();
        if (done) {
            this._state.transition(GameState.Flying);
        }
    }

    private _updateFlying(dt: number): void {
        this._flight.update(this._projectile.projectile, this._input, dt);

        const stillAlive = this._projectile.update(dt, this._gravity.currentGravity);
        this._camera.update(dt, this._projectile.position, this._projectile.velocity);
        this._runCollisions();

        if (!stillAlive) {
            this._state.transition(GameState.Evaluating);
        }
    }

    private _updateEvaluating(dt: number): void {
        // Allow structural collapses to keep affecting targets after projectile stops.
        this._runCollisions();

        this._evaluateDelay += dt;
        if (this._evaluateDelay < 0.8) return;
        this._evaluateDelay = 0;

        if (this._levels.aliveTargetCount === 0) {
            this._state.transition(GameState.Won);
        } else if (this._score.shotsUsed >= this._levels.currentDef.maxShots) {
            this._state.transition(GameState.Lost);
        } else {
            this._prepareNextShot();
        }
    }

    private _prepareNextShot(): void {
        const def = this._levels.currentDef;
        this._projectile.spawn(this._launcher.launchPoint);
        this._refreshShadowCasters();
        this._launcher.configure(toVec3(def.launcherPosition), toVec3(def.launchDirection));
        this._launcher.setVisible(true);
        this._camera.setAimView(toVec3(def.launcherPosition), this._computeAimMaxX(def));
        setSkyboxVisible(false);
        this._state.transition(GameState.Aiming);
    }

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