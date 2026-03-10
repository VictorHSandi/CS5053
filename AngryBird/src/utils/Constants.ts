/**
 * Central place for tuning knobs and game-wide constants.
 */

// ── Physics ──────────────────────────────────────────────
export const GRAVITY = -9.81;

// ── Launcher / Aiming ────────────────────────────────────
export const LAUNCHER_MAX_PULL = 3.0; // max drag distance in world units
export const LAUNCHER_POWER_MULT = 12.0; // pull distance → launch speed
export const TRAJECTORY_SEGMENTS = 40; // dots in trajectory preview
export const TRAJECTORY_TIME_STEP = 0.06; // seconds per segment

// ── Projectile ───────────────────────────────────────────
export const PROJECTILE_RADIUS = 0.35;
export const PROJECTILE_MASS = 2.0;
export const PROJECTILE_LIFETIME = 8.0; // seconds before auto-deactivate

// ── Flight control (post-launch air nudge) ───────────────
export const FLIGHT_STEER_FORCE = 2.5; // lateral nudge strength
export const FLIGHT_PITCH_FORCE = 2.0; // up/down nudge strength
export const FLIGHT_BOOST_IMPULSE = 5.0; // one-time forward boost
export const FLIGHT_MAX_NUDGES = 6; // limited air-control budget

// ── Targets ──────────────────────────────────────────────
export const TARGET_BASE_SCORE = 100;
export const TARGET_HIT_VELOCITY_MIN = 2.0; // min impact speed to register

// ── Scoring / Stars ──────────────────────────────────────
export const DEFAULT_STAR_THRESHOLDS = [100, 250, 400];

// ── Camera ───────────────────────────────────────────────
export const CAM_AIM_DISTANCE = 18; // distance from launcher in aiming view
export const CAM_AIM_HEIGHT = 6;
export const CAM_FOLLOW_DISTANCE = 3.5;
export const CAM_FOLLOW_HEIGHT = 1.2;
export const CAM_TRANSITION_DURATION = 0.6; // seconds

// ── World ────────────────────────────────────────────────
export const GROUND_SIZE = 200;
export const GROUND_Y = 0;
export const SKY_COLOR = { r: 0.53, g: 0.81, b: 0.92 };
