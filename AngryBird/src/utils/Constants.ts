/**
 * Central place for tuning knobs and game-wide constants.
 */

// ── Physics ──────────────────────────────────────────────
export const GRAVITY = -9.81;
export const OBSTACLE_MASS = 30.0;   // kg base — per-material scaling is applied in Obstacle
export const OBSTACLE_RESTITUTION = 0.01;   // bounciness (0 = dead stop, 1 = full bounce)
export const OBSTACLE_FRICTION = 0.55;   // lower grip helps blocks tip instead of sticking in place
export const OBSTACLE_IMPULSE_MULT = 1.15; // projectile speed → impulse strength

// ── Launcher / Aiming ────────────────────────────────────
export const LAUNCHER_PULL_INPUT_FRACTION = 0.4; // fraction of screen height needed to reach full pull
export const LAUNCHER_MAX_PULL = 5.35; // max drag distance in world units
export const LAUNCHER_POWER_MULT = 8.9; // pull distance → launch speed
export const TRAJECTORY_SEGMENTS = 60; // dots in trajectory preview
export const TRAJECTORY_TIME_STEP = 0.12; // seconds per segment

// ── Projectile ───────────────────────────────────────────
export const PROJECTILE_RADIUS = 0.35;
export const PROJECTILE_MASS = 2.0;
export const PROJECTILE_LIFETIME = 8.0; // seconds before auto-deactivate

// ── Flight control (post-launch air nudge) ───────────────
export const FLIGHT_STEER_FORCE = 15.0; // lateral steering strength while keys are held
export const FLIGHT_PITCH_FORCE = 8.0; // up/down steering strength while keys are held
export const FLIGHT_BOOST_IMPULSE = 8.0; // one-time forward boost
export const FLIGHT_MAX_ASCENT_SPEED = 6.0; // cap upward velocity so moon gravity cannot sustain infinite climb
export const FLIGHT_MAX_SPEED = 38.0; // total speed clamp to keep air control bounded
export const FLIGHT_MAX_NUDGES = 6; // legacy value, unused with continuous control

// ── Targets ──────────────────────────────────────────────
export const TARGET_BASE_SCORE = 100;
export const TARGET_HIT_VELOCITY_MIN = 2.0; // min impact speed to register
export const TARGET_MASS = 8.0;
export const TARGET_RESTITUTION = 0.02;
export const TARGET_FRICTION = 0.75;
export const TARGET_LINEAR_DAMPING = 0.2;
export const TARGET_ANGULAR_DAMPING = 0.3;
export const BARREL_MASS = 10.0;
export const BARREL_EXPLOSION_RADIUS = 4.2;
export const BARREL_EXPLOSION_TARGET_DAMAGE = 2.2;
export const BARREL_EXPLOSION_TARGET_IMPULSE = 11.5;
export const BARREL_EXPLOSION_OBSTACLE_DAMAGE = 1.35;
export const BARREL_EXPLOSION_OBSTACLE_IMPULSE = 16.0;
export const BARREL_EXPLOSION_VFX_DURATION = 0.26;
export const TITAN_CORE_OBSTACLE_DAMAGE_MULT = 6.0;
export const TITAN_CORE_OBSTACLE_IMPULSE_MULT = 4.6;
export const TITAN_CORE_TARGET_DAMAGE = 3.2;
export const TITAN_CORE_TARGET_BLAST_RADIUS = 3.6;
export const TITAN_CORE_SHOCKWAVE_RADIUS = 5.2;
export const TITAN_CORE_SHOCKWAVE_OBSTACLE_IMPULSE = 22.0;
export const TITAN_CORE_SHOCKWAVE_OBSTACLE_DAMAGE = 1.25;

// ── Scoring / Stars ──────────────────────────────────────
export const DEFAULT_STAR_THRESHOLDS = [100, 250, 400];

// ── Camera ───────────────────────────────────────────────
export const CAM_AIM_DISTANCE = 18; // distance from launcher in aiming view
export const CAM_AIM_HEIGHT = 7.2;
export const CAM_AIM_LOOKAHEAD_X = 12; // bigger look-ahead pushes launcher farther left on screen
export const CAM_AIM_TARGET_HEIGHT = 1.8; // slightly lower than camera for stronger downward framing
export const CAM_AIM_ORTHO_HALF_HEIGHT = 8; // half-height for 2D aiming projection
export const CAM_FOLLOW_DISTANCE = 3.5;
export const CAM_FOLLOW_HEIGHT = 1.2;
export const CAM_DESTRUCTION_DISTANCE = 20;
export const CAM_DESTRUCTION_HEIGHT = 8.5;
export const CAM_DESTRUCTION_LOOKAHEAD_X = 5.5;
export const CAM_DESTRUCTION_ORTHO_HALF_HEIGHT = 11;
export const CAM_TRANSITION_DURATION = 0.6; // seconds

// ── World ────────────────────────────────────────────────
// Large enough that the floor boundary stays outside all camera views.
export const GROUND_SIZE = 4000;
export const GROUND_Y = 0;
export const SKY_COLOR = { r: 0.25, g: 0.12, b: 0.11 };
