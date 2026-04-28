import { LevelDef } from "./LevelData";

/**
 * All levels — designed around Havok physics block interactions.
 * Blocks are placed directly in the flight path at z:0.
 * Targets sit behind/above blocks so chain reactions are rewarded.
 */
export const LEVELS: LevelDef[] = [

    // ── Level 1: Tutorial ────────────────────────────────────────────
    // Simple intro — one wall of blocks, two pigs behind it.
    // Player learns: aim at blocks, knock them into pigs.
    {
        id: "level_1",
        name: "First Flight",
        launcherPosition: { x: -12, y: 1, z: 0 },
        launchDirection: { x: 1, y: 0.5, z: 0 },
        maxShots: 4,
        starThresholds: [100, 200, 350],
        timeBonusThreshold: 40,
        targets: [
            // Pig sitting directly behind the wall
            { position: { x: 12, y: 0.5, z: 0 }, size: 0.9, health: 1, scoreValue: 100 },
            // Pig slightly to the side, reachable by a second shot
            { position: { x: 14, y: 0.5, z: 2 }, size: 0.9, health: 1, scoreValue: 100 },
        ],
        obstacles: [
            // Front wall — 3 stacked blocks directly in flight path
            { position: { x: 8, y: 0.5, z: 0 },  size: { x: 1, y: 1, z: 3 }, destructible: true, health: 2 },
            { position: { x: 8, y: 1.5, z: 0 },  size: { x: 1, y: 1, z: 3 }, destructible: true, health: 2 },
            { position: { x: 8, y: 2.5, z: 0 },  size: { x: 1, y: 1, z: 3 }, destructible: true, health: 2 },
            // Side block protecting second pig
            { position: { x: 13, y: 0.5, z: 1.5 }, size: { x: 1, y: 1, z: 0.5 }, destructible: true, health: 1 },
            // Bonus block on top — worth knocking off
            { position: { x: 8, y: 3.5, z: 0 },  size: { x: 1, y: 1, z: 1 }, destructible: true, health: 1 },
        ],
    },

    // ── Level 2: Tower ───────────────────────────────────────────────
    // A tall tower the player must topple onto pigs below.
    // Tests understanding of block momentum and chain reactions.
    {
        id: "level_2",
        name: "Topple the Tower",
        launcherPosition: { x: -12, y: 1, z: 0 },
        launchDirection: { x: 1, y: 0.6, z: 0 },
        maxShots: 4,
        starThresholds: [150, 350, 600],
        timeBonusThreshold: 45,
        targets: [
            // Pig at base of tower — hard to hit directly
            { position: { x: 10, y: 0.5, z: 0 }, size: 0.8, health: 1, scoreValue: 150 },
            // Pig behind tower
            { position: { x: 14, y: 0.5, z: 0 }, size: 0.8, health: 1, scoreValue: 150 },
            // Elevated pig on a platform
            { position: { x: 18, y: 3.5, z: 0 }, size: 0.8, health: 2, scoreValue: 200 },
        ],
        obstacles: [
            // Tower — 5 blocks stacked vertically
            { position: { x: 10, y: 0.5, z: 0 }, size: { x: 1.5, y: 1, z: 1.5 }, destructible: true, health: 2 },
            { position: { x: 10, y: 1.5, z: 0 }, size: { x: 1.5, y: 1, z: 1.5 }, destructible: true, health: 2 },
            { position: { x: 10, y: 2.5, z: 0 }, size: { x: 1.5, y: 1, z: 1.5 }, destructible: true, health: 2 },
            { position: { x: 10, y: 3.5, z: 0 }, size: { x: 1.5, y: 1, z: 1.5 }, destructible: true, health: 2 },
            { position: { x: 10, y: 4.5, z: 0 }, size: { x: 1.5, y: 1, z: 1.5 }, destructible: true, health: 1 },
            // Platform for elevated pig
            { position: { x: 18, y: 3.0, z: 0 }, size: { x: 3, y: 0.5, z: 2 }, destructible: true, health: 2 },
            // Platform supports
            { position: { x: 17, y: 1.5, z: 0 }, size: { x: 0.5, y: 3, z: 1 }, destructible: true, health: 2 },
            { position: { x: 19, y: 1.5, z: 0 }, size: { x: 0.5, y: 3, z: 1 }, destructible: true, health: 2 },
        ],
    },

    // ── Level 3: Fortress ────────────────────────────────────────────
    // A full fortress with multiple chambers.
    // Chain reactions required to reach all pigs.
    // Moon gravity (G key) is very useful here.
    {
        id: "level_3",
        name: "Pig Fortress",
        launcherPosition: { x: -14, y: 1, z: 0 },
        launchDirection: { x: 1, y: 0.55, z: 0 },
        maxShots: 6,
        starThresholds: [200, 500, 900],
        timeBonusThreshold: 60,
        targets: [
            // Ground floor pig
            { position: { x: 10, y: 0.5, z: 0  }, size: 0.8, health: 1, scoreValue: 100 },
            // Second floor pig
            { position: { x: 13, y: 3.5, z: 0  }, size: 0.8, health: 1, scoreValue: 150 },
            // Hidden pig behind right wall
            { position: { x: 17, y: 0.5, z: 0  }, size: 0.8, health: 2, scoreValue: 200 },
            // Bonus pig on top
            { position: { x: 13, y: 6.5, z: 0  }, size: 0.9, health: 2, scoreValue: 300 },
        ],
        obstacles: [
            // ── Left wall ──
            { position: { x: 8,  y: 0.5, z: 0 }, size: { x: 0.5, y: 1, z: 3 }, destructible: true, health: 2 },
            { position: { x: 8,  y: 1.5, z: 0 }, size: { x: 0.5, y: 1, z: 3 }, destructible: true, health: 2 },
            { position: { x: 8,  y: 2.5, z: 0 }, size: { x: 0.5, y: 1, z: 3 }, destructible: true, health: 2 },
            // ── Right wall ──
            { position: { x: 16, y: 0.5, z: 0 }, size: { x: 0.5, y: 1, z: 3 }, destructible: true, health: 2 },
            { position: { x: 16, y: 1.5, z: 0 }, size: { x: 0.5, y: 1, z: 3 }, destructible: true, health: 2 },
            { position: { x: 16, y: 2.5, z: 0 }, size: { x: 0.5, y: 1, z: 3 }, destructible: true, health: 2 },
            // ── Middle floor ──
            { position: { x: 12, y: 3.0, z: 0 }, size: { x: 5, y: 0.5, z: 2.5 }, destructible: true, health: 3 },
            // ── Middle floor walls ──
            { position: { x: 10, y: 4.0, z: 0 }, size: { x: 0.5, y: 1, z: 2 }, destructible: true, health: 2 },
            { position: { x: 14, y: 4.0, z: 0 }, size: { x: 0.5, y: 1, z: 2 }, destructible: true, health: 2 },
            // ── Top floor ──
            { position: { x: 12, y: 6.0, z: 0 }, size: { x: 4, y: 0.5, z: 2 }, destructible: true, health: 2 },
        ],
    },
];
