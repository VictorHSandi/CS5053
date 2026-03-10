import { LevelDef } from "../levels/LevelData";
import { DEFAULT_STAR_THRESHOLDS } from "../utils/Constants";

export interface ScoreBreakdown {
    targetsDestroyed: number;
    targetScore: number;
    shotsUsed: number;
    shotBonus: number;
    timeElapsed: number;
    timeBonus: number;
    totalScore: number;
    stars: number;
}

/**
 * Accumulates score during a level and computes star ratings.
 */
export class ScoreSystem {
    public score = 0;
    public targetsDestroyed = 0;
    public shotsUsed = 0;
    public startTime = 0;

    reset(): void {
        this.score = 0;
        this.targetsDestroyed = 0;
        this.shotsUsed = 0;
        this.startTime = performance.now();
    }

    addScore(points: number): void {
        this.score += points;
    }

    recordShot(): void {
        this.shotsUsed++;
    }

    recordTargetKill(points: number): void {
        this.targetsDestroyed++;
        this.score += points;
    }

    /** Compute the final breakdown including bonuses. */
    finalise(levelDef: LevelDef, totalTargets: number): ScoreBreakdown {
        const elapsed = (performance.now() - this.startTime) / 1000;

        // Shot economy bonus: unused shots × 50
        const unusedShots = Math.max(0, levelDef.maxShots - this.shotsUsed);
        const shotBonus = unusedShots * 50;

        // Time bonus
        let timeBonus = 0;
        if (levelDef.timeBonusThreshold && elapsed < levelDef.timeBonusThreshold) {
            timeBonus = Math.round((levelDef.timeBonusThreshold - elapsed) * 5);
        }

        const totalScore = this.score + shotBonus + timeBonus;

        const thresholds = levelDef.starThresholds ?? DEFAULT_STAR_THRESHOLDS;
        let stars = 0;
        if (totalScore >= thresholds[0]) stars = 1;
        if (totalScore >= thresholds[1]) stars = 2;
        if (totalScore >= thresholds[2]) stars = 3;

        return {
            targetsDestroyed: this.targetsDestroyed,
            targetScore: this.score,
            shotsUsed: this.shotsUsed,
            shotBonus,
            timeElapsed: Math.round(elapsed),
            timeBonus,
            totalScore,
            stars,
        };
    }
}
