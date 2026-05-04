import { LevelDef } from "../levels/LevelData";

export interface ScoreBarSegment {
    label: string;
    value: number;
    color: string;
}

export interface ScoreBreakdown {
    objectiveTargetsDestroyed: number;
    targetScore: number;
    obstacleScore: number;
    destructionScore: number;
    shotsUsed: number;
    shotScore: number;
    powerupsUsed: number;
    powerupAdjustment: number;
    totalScore: number;
    maxScore: number;
    stars: number;
    previousHighScore: number;
    highScore: number;
    isNewHighScore: boolean;
    scoreToBeatHighScore: number;
    barTargetScore: number;
    barFillScore: number;
    barOverflowScore: number;
    barPenaltyScore: number;
    barSegments: ScoreBarSegment[];
}

/**
 * Accumulates score during a level and computes star ratings.
 */
export class ScoreSystem {
    public targetScore = 0;
    public obstacleScore = 0;
    public objectiveTargetsDestroyed = 0;
    public shotsUsed = 0;
    public powerupsUsed = 0;

    reset(): void {
        this.targetScore = 0;
        this.obstacleScore = 0;
        this.objectiveTargetsDestroyed = 0;
        this.shotsUsed = 0;
        this.powerupsUsed = 0;
    }

    recordDestruction(targetPoints: number, obstaclePoints: number, destroyedObjectiveTargets: number): void {
        this.targetScore += Math.max(0, targetPoints);
        this.obstacleScore += Math.max(0, obstaclePoints);
        this.objectiveTargetsDestroyed += Math.max(0, destroyedObjectiveTargets);
    }

    recordShot(): void {
        this.shotsUsed++;
    }

    recordPowerupUse(): void {
        this.powerupsUsed++;
    }

    get liveScore(): number {
        return this.targetScore + this.obstacleScore;
    }

    /** Compute the final breakdown including high-score comparison. */
    finalise(levelDef: LevelDef, previousHighScore: number): ScoreBreakdown {
        const destructionScore = this.targetScore + this.obstacleScore;
        const maxDestructionScore = levelDef.targets.reduce((sum, target) => sum + (target.scoreValue ?? 100), 0)
            + (levelDef.obstacles?.length ?? 0) * 25;
        const shotTierValue = maxDestructionScore + 150;
        const remainingShots = Math.max(0, levelDef.maxShots - this.shotsUsed + 1);
        const shotScore = remainingShots * shotTierValue;
        const powerupAdjustment = this.powerupsUsed * -100;
        const totalScore = Math.max(0, destructionScore + shotScore + powerupAdjustment);
        const maxScore = Math.max(0, (levelDef.maxShots * shotTierValue) + maxDestructionScore);

        const thresholds: [number, number, number] = [
            Math.round(maxScore * 0.35),
            Math.round(maxScore * 0.6),
            Math.round(maxScore * 0.82),
        ];
        let stars = 0;
        if (totalScore >= thresholds[0]) stars = 1;
        if (totalScore >= thresholds[1]) stars = 2;
        if (totalScore >= thresholds[2]) stars = 3;

        const highScore = Math.max(previousHighScore, totalScore);
        const isNewHighScore = totalScore > previousHighScore;
        const scoreToBeatHighScore = isNewHighScore ? 0 : Math.max(0, previousHighScore - totalScore + 1);
        const barTargetScore = previousHighScore > 0 ? previousHighScore : totalScore;
        const barFillScore = isNewHighScore ? barTargetScore : totalScore;
        const barOverflowScore = isNewHighScore && previousHighScore > 0
            ? totalScore - previousHighScore
            : 0;
        const barPenaltyScore = Math.max(0, -powerupAdjustment);
        const positiveContributionTotal = Math.max(1, this.targetScore + this.obstacleScore + shotScore);
        const visiblePositiveScore = Math.max(0, totalScore + barPenaltyScore);
        const visiblePositiveFill = Math.min(barTargetScore || visiblePositiveScore, visiblePositiveScore);
        const positiveFillScale = visiblePositiveFill / positiveContributionTotal;
        const targetBarValue = Math.max(barTargetScore, 1);
        const barSegments: ScoreBarSegment[] = [
            {
                label: "Targets",
                value: Math.max(0, Math.min(targetBarValue, this.targetScore * positiveFillScale)),
                color: "#58d68d",
            },
            {
                label: "Structures",
                value: Math.max(0, Math.min(targetBarValue, this.obstacleScore * positiveFillScale)),
                color: "#5dade2",
            },
            {
                label: "Shot Score",
                value: Math.max(0, Math.min(targetBarValue, shotScore * positiveFillScale)),
                color: "#f4d03f",
            },
        ];

        return {
            objectiveTargetsDestroyed: this.objectiveTargetsDestroyed,
            targetScore: this.targetScore,
            obstacleScore: this.obstacleScore,
            destructionScore,
            shotsUsed: this.shotsUsed,
            shotScore,
            powerupsUsed: this.powerupsUsed,
            powerupAdjustment,
            totalScore,
            maxScore,
            stars,
            previousHighScore,
            highScore,
            isNewHighScore,
            scoreToBeatHighScore,
            barTargetScore,
            barFillScore,
            barOverflowScore,
            barPenaltyScore,
            barSegments,
        };
    }
}
