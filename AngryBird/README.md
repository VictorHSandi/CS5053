# Angry Bird 3D

A browser game inspired by **Angry Birds**, built with **Babylon.js** and **TypeScript**.

You aim in a classic side-on 2D view, then the camera transitions into a **3D behind-the-projectile view** during flight.

---

## Features

| Feature | Details |
|---|---|
| **2D → 3D camera transition** | Aim in a side-on view; camera smoothly follows the projectile after launch |
| **Slingshot aiming** | Click-and-drag to pull back, trajectory preview shown in real-time |
| **Mid-air control** | Subtle WASD / arrow-key nudges + one-time boost (Space) |
| **Destructible targets** | Green "pig" spheres with per-target health and score values |
| **Destructible structures** | Wooden-style box obstacles that can be smashed |
| **Data-driven levels** | Levels are plain config objects, so adding new stages is straightforward |
| **Star rating system** | 1–3 stars based on score (targets, shot economy, time bonus) |
| **Win / Lose screens** | Score breakdown, star display, retry and next-level buttons |
| **HUD** | Level name, shots used, score, targets remaining |
| **Multiple levels** | 8 levels included with increasing difficulty |

---

## Lighting / Shading Notes

- Uses Babylon `StandardMaterial` (Phong/Blinn-Phong style shading pipeline).
- Ambient component is explicit via scene ambient color + hemispheric fill light.
- Diffuse component is explicit via per-material `diffuseColor` and light diffuse terms.
- Specular component is explicit via per-material `specularColor` and `specularPower`.
- Includes a directional light source (`sun`) plus a hemispheric ambient/fill light.

---

## Controls

| Input | Action |
|---|---|
| **Click + drag down** | Pull slingshot (more pull = more power) |
| **Release mouse** | Launch the projectile |
| **W / ↑** | Steer projectile up (mid-air) |
| **S / ↓** | Steer projectile down (mid-air) |
| **A / ←** | Steer projectile left (mid-air) |
| **D / →** | Steer projectile right (mid-air) |
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

## Deploy To GitHub Pages (One Push)

This repository is configured for one-push deploys with GitHub Actions.

### Included setup

- Workflow file: `.github/workflows/deploy-pages.yml`
- Auto-deploy trigger: every push to `main`
- Vite `base` path auto-detection for:
    - Project pages: `https://<user>.github.io/<repo>/`
    - User/org pages repo (`<user>.github.io`): `https://<user>.github.io/`

### One-time setup in GitHub

1. Open your repository on GitHub.
2. Go to Settings > Pages.
3. Under Build and deployment, set Source to GitHub Actions.

After that, every push to `main` deploys automatically.

### First deploy

```bash
git add .
git commit -m "Set up GitHub Pages deploy"
git push origin main
```

Track progress in the Actions tab. The deployed URL appears in the deploy job output.

### Public vs Private repos

- Public repo: works on all plans.
- Private repo: works only if your GitHub plan includes Pages for private repositories (Pro/Team/Enterprise).
    - On GitHub Free, Pages deployment generally requires a public repo.

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

## License

Licensed under the MIT License.
