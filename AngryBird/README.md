# Angry Bird 3D

A browser game prototype inspired by **Angry Birds**, built with **Babylon.js** and **TypeScript**.

The twist: you aim in a classic side-on 2D view, then the camera swoops into a **3D first-person / behind-the-projectile POV** as the bird flies through a fully 3D environment with slight mid-air control.

---

## Features

| Feature | Details |
|---|---|
| **2D → 3D camera transition** | Aim in a side-on view; camera smoothly follows the projectile after launch |
| **Slingshot aiming** | Click-and-drag to pull back, trajectory preview shown in real-time |
| **Mid-air control** | Subtle WASD / arrow-key nudges + one-time boost (Space) |
| **Destructible targets** | Green "pig" spheres with per-target health and score values |
| **Destructible structures** | Wooden-style box obstacles that can be smashed |
| **Data-driven levels** | Levels defined as plain config objects — easy to add more |
| **Star rating system** | 1–3 stars based on score (targets, shot economy, time bonus) |
| **Win / Lose screens** | Score breakdown, star display, retry and next-level buttons |
| **HUD** | Level name, shots used, score, targets remaining |
| **Multiple levels** | 3 sample levels included, progressively harder |

---

## Controls

| Input | Action |
|---|---|
| **Click + drag down** | Pull slingshot (more pull = more power) |
| **Drag left / right** | Aim laterally |
| **Release mouse** | Launch the projectile |
| **W / ↑** | Nudge projectile up (mid-air) |
| **S / ↓** | Nudge projectile down (mid-air) |
| **A / ←** | Nudge projectile left (mid-air) |
| **D / →** | Nudge projectile right (mid-air) |
| **Space** | One-time forward boost (mid-air) |

---

## Setup & Run

### Prerequisites

- **Node.js** ≥ 18 (with npm)

### Install dependencies

```bash
npm install
```

### Run locally (dev server with hot reload)

```bash
npm run dev
```

Vite will open your browser automatically. If it doesn't, visit `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static server:

```bash
npm run preview
```

---

## Project Architecture

```
src/
├── main.ts                     # App entry point
├── game/
│   ├── Game.ts                 # Top-level orchestrator — wires all systems
│   └── GameStateManager.ts     # Finite state machine (Aiming → Launching → Flying → …)
├── scenes/
│   ├── SceneManager.ts         # Babylon Engine + Scene lifecycle
│   └── SceneSetup.ts           # Environment: ground, lights, shadows, sky
├── systems/
│   ├── CameraController.ts     # Aim cam, follow cam, smooth transitions
│   ├── InputController.ts      # Keyboard + pointer state wrapper
│   ├── LauncherSystem.ts       # Slingshot visuals, drag-to-aim, trajectory preview
│   ├── ProjectileSystem.ts     # Projectile spawning and Euler physics integration
│   ├── FlightControlSystem.ts  # Subtle post-launch air control (nudge + boost)
│   ├── TargetSystem.ts         # Collision detection (sphere/AABB) and damage
│   └── ScoreSystem.ts          # Score accumulation, bonuses, star computation
├── entities/
│   ├── Projectile.ts           # Projectile entity class
│   ├── Target.ts               # Destructible target ("pig") entity
│   └── Obstacle.ts             # Destructible / static structure block
├── levels/
│   ├── LevelData.ts            # TypeScript interfaces for level definitions
│   ├── levels.ts               # Sample level configs (add more here)
│   └── LevelManager.ts         # Level loading, progression, entity bookkeeping
├── ui/
│   ├── UIManager.ts            # Orchestrates all UI layers
│   ├── HUD.ts                  # In-game heads-up display
│   ├── WinScreen.ts            # Level-complete overlay with star rating
│   └── LoseScreen.ts           # Failure overlay
└── utils/
    ├── Constants.ts            # Central tuning knobs
    └── MathUtils.ts            # Helpers: lerp, clamp, trajectory, etc.
```

### Design principles

- **Separation of concerns** — each system does one job and exposes a clean API.
- **Data-driven levels** — levels are plain objects; no game-logic lives inside level data.
- **Observable state machine** — `GameStateManager` emits transitions; systems react accordingly.
- **Easy to extend** — adding a new projectile type means a new config in `Projectile.ts`; a new enemy type means extending `Target.ts` or creating a subclass.

---

## Where to Go Next

Here are natural extension points, roughly in order of impact:

1. **More projectile types** — add `ProjectileConfig.type` variants (e.g. "splitter", "bomber") and wire special abilities in `FlightControlSystem`.
2. **Particle effects** — use `ParticleSystem` for impact explosions, dust clouds, and trail effects.
3. **Sound** — the architecture already has clear trigger points (`_doLaunch`, `target.hit`, `target.destroy`); hook in `Sound` objects there.
4. **Richer structures** — stack boxes with simple joint/stacking logic, or add plank entities.
5. **Level editor** — since levels are JSON-like configs, a small editor UI that serialises to `LevelDef` would be straightforward.
6. **Local progression** — persist best scores and star ratings in `localStorage`.
7. **Mobile touch** — pointer events already work; add on-screen virtual buttons for flight control.
8. **Physics engine** — swap the custom Euler integration for Babylon's built-in physics (Havok / Cannon) for more realistic collisions and stacking.
9. **Visual polish** — PBR materials, skybox, ground textures, animated pig faces.
10. **Level select screen** — a menu showing all levels with earned stars.

---

## License

MIT — do whatever you want with it.
