import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SoundManager } from "../systems/SoundSystem";
import { SceneManager } from "../scenes/SceneManager";
import { setSkyboxVisible } from "../scenes/SceneSetup";
import { GameStateManager, GameState } from "./GameStateManager";
import { InputController } from "../systems/InputController";
import { CameraController } from "../systems/CameraController";
import { LauncherSystem } from "../systems/LauncherSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { FlightControlSystem } from "../systems/FlightControlSystem";
import { TargetSystem } from "../systems/TargetSystem";
import { PowerupSystem } from "../systems/PowerupSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { GameProgressStore } from "../systems/GameProgressStore";
import { GravitySystem } from "../systems/GravitySystem";
import { HighScoreStore } from "../systems/HighScoreStore";
import { LevelManager } from "../levels/LevelManager";
import { LEVELS } from "../levels/levels";
import { LevelDef, toVec3 } from "../levels/LevelData";
import { UIManager } from "../ui/UIManager";
import { CreditsOverlay } from "../ui/CreditsOverlay";
import { MainMenu } from "../ui/MainMenu";

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
    private _powerups: PowerupSystem;
    private _score: ScoreSystem;
    private _gravity: GravitySystem;
    private _sound: SoundManager;
    private _highScores: HighScoreStore;
    private _progress: GameProgressStore;

    // Data
    private _levels: LevelManager;

    // UI
    private _ui: UIManager;
    private _mainMenu: MainMenu;
    private _credits: CreditsOverlay;

    // Misc
    private _evaluateDelay = 0;
    private _titanCoreReadyNextShot = false;
    private _titanCoreActiveThisShot = false;
    private _optionsOpenInGame = false;
    private _impactViewActiveThisShot = false;

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
        this._powerups = new PowerupSystem();
        this._score = new ScoreSystem();
        this._levels = new LevelManager();
        this._ui = new UIManager(scene);
        this._gravity = new GravitySystem(scene);
        this._sound = new SoundManager();
        this._highScores = new HighScoreStore();
        this._progress = new GameProgressStore();
        this._credits = new CreditsOverlay();
        this._mainMenu = new MainMenu({
            onStartNew: () => this._startGameAtLevel(0),
            onSelectLevel: (levelNumber) => this._startGameAtLevel(levelNumber - 1),
            onGravityModeChange: (mode) => this._gravity.setMode(mode),
            onSfxVolumeChange: (volume) => this._sound.setSfxVolume(volume),
            onMusicVolumeChange: (volume) => this._sound.setMusicVolume(volume),
            onSoundtrackModeChange: (mode) => {
                this._progress.setSoundtrackMode(mode);
                this._sound.setSoundtrackMode(mode);
            },
            onResetHighScores: () => {
                this._highScores.resetAll();
                this._refreshMenuHighScores();
            },
            onResumeFromOptions: () => this._closeInGameOptions(),
            onReturnToMainMenu: () => this._returnToMainMenu(),
        });
        this._sound.setSoundtrackMode(this._progress.soundtrackMode);
        this._refreshMenuHighScores();
        this._refreshMenuProgress();

        // Init audio on first pointer interaction (browser autoplay policy)
        canvas.addEventListener("pointerdown", () => {
            this._sound.init();
        }, { once: true });

        this._ui.winScreen.onNext = () => this._advanceLevel();
        this._ui.winScreen.onRetry = () => this._restartLevel();
        this._ui.winScreen.onCredits = () => this._showCredits();
        this._ui.loseScreen.onRetry = () => this._restartLevel();

        this._state.onChange((_prev, next) => this._onStateChange(next));

        this._sceneManager.ready.then(() => {
            this._ui.hud.setVisible(false);
            this._mainMenu.show();
            this._sceneManager.run((dt) => this._update(dt));
        });
    }

    private _refreshMenuHighScores(): void {
        const scores = LEVELS.map((level) => this._highScores.get(level.id));
        const stars = LEVELS.map((level, index) => ScoreSystem.getStarsForScore(level, scores[index]));
        this._mainMenu.setLevelHighScores(scores, stars);
    }

    private _refreshMenuProgress(): void {
        this._mainMenu.setEpicSoundtrackUnlocked(this._progress.epicUnlocked, this._progress.soundtrackMode);
    }

    private _startGameAtLevel(levelIndex: number): void {
        this._optionsOpenInGame = false;
        this._mainMenu.hide();
        this._levels.setLevel(levelIndex);
        this._loadLevel();
    }

    private _openInGameOptions(): void {
        this._optionsOpenInGame = true;
        this._ui.hud.setVisible(false);
        this._mainMenu.showOptionsInGame();
    }

    private _closeInGameOptions(): void {
        this._optionsOpenInGame = false;
        this._mainMenu.hide();
        if (this._state.state !== GameState.Won && this._state.state !== GameState.Lost) {
            this._ui.hud.setVisible(true);
        }
    }

    private _returnToMainMenu(): void {
        this._optionsOpenInGame = false;
        this._sound.stopPigOinks();
        this._sound.clearCreditsThemeOverride();
        this._credits.hide();
        this._levels.clearEntities();
        this._projectile.projectile.deactivate();
        this._launcher.setVisible(false);
        this._ui.winScreen.hide();
        this._ui.loseScreen.hide();
        this._ui.hud.setVisible(false);
        setSkyboxVisible(false);
        this._state.transition(GameState.MainMenu);
        this._refreshMenuHighScores();
        this._refreshMenuProgress();
        this._mainMenu.show();
    }

    private _showCredits(): void {
        this._ui.winScreen.hide();
        this._sound.playCreditsTheme();
        this._progress.unlockEpicSoundtrack();
        this._refreshMenuProgress();
        void this._credits.show(() => {
            this._sound.clearCreditsThemeOverride();
            this._returnToMainMenu();
        });
    }

    private _loadLevel(): void {
        const scene = this._sceneManager.scene;
        this._levels.load(scene);

        const def = this._levels.currentDef;
        this._launcher.configure(toVec3(def.launcherPosition), toVec3(def.launchDirection));
        this._launcher.setVisible(true);

        this._projectile.spawn(this._launcher.launchPoint);
        this._titanCoreReadyNextShot = false;
        this._titanCoreActiveThisShot = false;
        this._impactViewActiveThisShot = false;
        this._projectile.projectile.setTitanCoreCharged(false);
        this._refreshShadowCasters();
        this._score.reset();
        this._evaluateDelay = 0;

        this._camera.setAimView(toVec3(def.launcherPosition), this._computeAimMaxX(def));
        setSkyboxVisible(false);
        this._ui.hideOverlays();
        this._state.transition(GameState.Aiming);

        // Start random pig oinks while pigs are alive
        this._sound.stopPigOinks();
        this._sound.startPigOinks(() => this._levels.aliveTargetCount);
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
        for (const powerup of this._levels.powerups) {
            if (!powerup.collected) {
                shadowGen.addShadowCaster(powerup.mesh);
            }
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
                break;
            case GameState.Flying:
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
        const previousHighScore = this._highScores.get(def.id);
        const breakdown = this._score.finalise(def, previousHighScore);
        this._highScores.saveIfHigher(def.id, breakdown.totalScore);
        this._refreshMenuHighScores();
        this._ui.showWin(breakdown, this._levels.hasNextLevel, !this._levels.hasNextLevel);
    }

    private _update(dt: number): void {
        const state = this._state.state;

        if (this._credits.isVisible && this._input.keysJustPressed.has("Escape")) {
            this._credits.skip();
            this._input.endFrame();
            return;
        }

        if (state !== GameState.MainMenu && this._input.keysJustPressed.has("Escape")) {
            if (this._optionsOpenInGame) {
                this._closeInGameOptions();
            } else if (state !== GameState.Won && state !== GameState.Lost) {
                this._openInGameOptions();
            }
        }

        if (state !== GameState.MainMenu && this._input.keysJustPressed.has("KeyH")) {
            this._ui.hud.toggleSidebar();
        }

        if (state === GameState.MainMenu) {
            this._input.endFrame();
            return;
        }

        if (this._optionsOpenInGame) {
            this._input.endFrame();
            return;
        }

        const def = this._levels.currentDef;
        const totalPowerups = def.powerups?.length ?? 0;
        const remainingPowerups = this._levels.powerups.filter((powerup) => !powerup.collected).length;
        const powerupText = totalPowerups === 0
            ? "None"
            : this._titanCoreReadyNextShot
                ? "Titan Core Ready"
                : remainingPowerups > 0
                    ? `Titan Core ${remainingPowerups} Left`
                    : "Collected";
        const powerupColor = totalPowerups === 0
            ? "#7b88b3"
            : this._titanCoreReadyNextShot
                ? "#00ff88"
                : remainingPowerups > 0
                    ? "#66d9ff"
                    : "#9dd1ff";

        if (state !== GameState.Won && state !== GameState.Lost) {
            this._ui.updateHUD(
                def.name,
                this._score.shotsUsed,
                def.maxShots,
                this._score.liveScore,
                this._levels.aliveTargetCount,
                powerupText,
                powerupColor,
            );
        }

        this._powerups.update(this._levels.powerups, dt);

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
        if (this._input.pointerJustReleased && this._launcher.pullDistance > 0.15) {
            this._doLaunch();
            return;
        }
        this._launcher.update(this._input, this._gravity.currentGravity);
    }

    private _doLaunch(): void {
        setSkyboxVisible(true);

        // Play launch sound
        this._sound.playLaunch();

        const vel = this._launcher.launchVelocity.clone();
        this._titanCoreActiveThisShot = this._titanCoreReadyNextShot;
        this._titanCoreReadyNextShot = false;
        this._impactViewActiveThisShot = false;
        this._score.recordShot();
        this._projectile.spawn(this._launcher.launchPoint);
        this._projectile.projectile.setTitanCoreCharged(this._titanCoreActiveThisShot);
        this._projectile.launch(vel);
        this._ui.hud.setControlsVisible(true);
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
        this._updatePowerupCollections();
        const done = this._camera.update(dt, this._projectile.position, this._projectile.velocity);
        this._runCollisions();
        if (done) {
            this._state.transition(GameState.Flying);
        }
    }

    private _updateFlying(dt: number): void {
        this._flight.update(this._projectile.projectile, this._input, dt);

        const stillAlive = this._projectile.update(dt, this._gravity.currentGravity);
        this._updatePowerupCollections();
        this._camera.update(dt, this._projectile.position, this._projectile.velocity);
        this._runCollisions();

        if (!stillAlive) {
            this._state.transition(GameState.Evaluating);
        }
    }

    private _updateEvaluating(dt: number): void {
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
        this._titanCoreActiveThisShot = false;
        this._projectile.spawn(this._launcher.launchPoint);
        this._projectile.projectile.setTitanCoreCharged(this._titanCoreReadyNextShot);
        this._refreshShadowCasters();
        this._launcher.configure(toVec3(def.launcherPosition), toVec3(def.launchDirection));
        this._launcher.setVisible(true);
        this._camera.setAimView(toVec3(def.launcherPosition), this._computeAimMaxX(def));
        this._ui.hud.setControlsVisible(true);
        setSkyboxVisible(false);
        this._state.transition(GameState.Aiming);
    }

    private _runCollisions(): void {
        const result = this._targets.checkCollisions(
            this._projectile.projectile,
            this._levels.targets,
            this._levels.obstacles,
            this._titanCoreActiveThisShot,
        );

        if (result.totalScore > 0) {
            this._score.recordDestruction(
                result.targetScore,
                result.obstacleScore,
                result.targetsHit.filter((target) => target.isObjective).length,
            );
        }

        if (result.hadImpact && !this._impactViewActiveThisShot) {
            this._impactViewActiveThisShot = true;
            this._ui.hud.setControlsVisible(false);
            this._camera.setDestructionView(result.impactPoint ?? this._projectile.position);
        }

        // Play sound effects based on what was hit this frame
        if (result.targetsHit.length > 0) {
            this._sound.playHitPig();
        }
        if (result.obstaclesHit.length > 0) {
            this._sound.playHitObstacle();
        }

        if (result.titanCoreConsumed) {
            this._titanCoreActiveThisShot = false;
            this._projectile.projectile.setTitanCoreCharged(false);
            this._score.recordPowerupUse();
        }
    }

    private _updatePowerupCollections(): void {
        const collected = this._powerups.checkCollections(
            this._projectile.projectile,
            this._levels.powerups,
        );

        if (collected.titanCoreCollected > 0) {
            this._titanCoreReadyNextShot = true;
        }
    }
}