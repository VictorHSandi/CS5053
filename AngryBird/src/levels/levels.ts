import { LevelDef } from "./LevelData";

/**
 * All sample levels — add more entries here to extend the game.
 */
export const LEVELS: LevelDef[] = [
    // ── Level 1: Tutorial ────────────────────────────────
    {
        id: "level_1",
        name: "First Flight",
        launcherPosition: { x: -12, y: 1, z: 0 },
        launchDirection: { x: 1, y: 0.8, z: 0 },
        maxShots: 3,
        starThresholds: [100, 200, 350],
        timeBonusThreshold: 30,
        targets: [
            { position: { x: 10, y: 0.5, z: 0 }, size: 0.9, health: 1, scoreValue: 100 },
            { position: { x: 14, y: 0.5, z: 1 }, size: 0.9, health: 1, scoreValue: 100 },
        ],
        obstacles: [
            {
                position: { x: 8, y: 0, z: 0 },
                size: { x: 0.5, y: 2.5, z: 2 },
                destructible: true,
                health: 3,
            },
        ],
    },

    // ── Level 2: Fortress ────────────────────────────────
    {
        id: "level_2",
        name: "Little Fortress",
        launcherPosition: { x: -14, y: 1, z: 0 },
        launchDirection: { x: 1, y: 0.45, z: 0 },
        maxShots: 4,
        starThresholds: [150, 350, 600],
        timeBonusThreshold: 40,
        targets: [
            { position: { x: 10, y: 0.5, z: 0 }, size: 0.8, health: 1, scoreValue: 100 },
            { position: { x: 12, y: 2.5, z: 0 }, size: 0.8, health: 1, scoreValue: 150 },
            { position: { x: 14, y: 0.5, z: -2 }, size: 0.8, health: 2, scoreValue: 200 },
        ],
        obstacles: [
            // ground wall
            { position: { x: 9, y: 0, z: 0 }, size: { x: 0.5, y: 3, z: 3 }, destructible: true, health: 2 },
            // platform
            { position: { x: 11, y: 2, z: 0 }, size: { x: 3, y: 0.4, z: 2 }, destructible: true, health: 2 },
            // right pillar
            { position: { x: 13, y: 0, z: 0 }, size: { x: 0.5, y: 3, z: 2 }, destructible: true, health: 2 },
            // side wall protecting rightmost pig
            { position: { x: 13.5, y: 0, z: -2 }, size: { x: 1, y: 2, z: 0.5 }, destructible: true, health: 1 },
        ],
    },

    // ── Level 3: Spread Out ──────────────────────────────
    {
        id: "level_3",
        name: "Scattered Pigs",
        launcherPosition: { x: -14, y: 1, z: 0 },
        launchDirection: { x: 1, y: 0.5, z: 0 },
        maxShots: 5,
        starThresholds: [200, 450, 800],
        timeBonusThreshold: 50,
        targets: [
            { position: { x: 8, y: 0.5, z: 4 }, size: 0.8, health: 1, scoreValue: 100 },
            { position: { x: 12, y: 0.5, z: -3 }, size: 0.8, health: 1, scoreValue: 100 },
            { position: { x: 16, y: 0.5, z: 1 }, size: 0.8, health: 1, scoreValue: 150 },
            { position: { x: 20, y: 3, z: 0 }, size: 1, health: 2, scoreValue: 250 },
        ],
        obstacles: [
            { position: { x: 7, y: 0, z: 4 }, size: { x: 2, y: 1.5, z: 0.5 }, destructible: true, health: 1 },
            { position: { x: 19, y: 0, z: 0 }, size: { x: 0.5, y: 4, z: 2 }, destructible: true, health: 3 },
            { position: { x: 21, y: 0, z: 0 }, size: { x: 0.5, y: 4, z: 2 }, destructible: true, health: 3 },
            { position: { x: 20, y: 4, z: 0 }, size: { x: 3, y: 0.4, z: 2.5 }, destructible: true, health: 2 },
        ],
    },
];
