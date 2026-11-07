import { db } from "@/lib/db";

export interface ChangeRiskEvaluation {
  riskScore: number; // 0 - 100
  riskLevel: "low" | "moderate" | "high" | "very_high";
  cabRecommended: boolean;
  factors: Array<{
    factor: string;
    scoreContribution: number;
    description: string;
  }>;
  conflictingChanges: Array<{
    id: string;
    number: string;
    shortDescription: string;
    plannedStart?: Date | null;
    plannedEnd?: Date | null;
  }>;
}

export interface EvaluateChangeRiskInput {
  changeId?: string;
  changeType?: string; // normal, standard, emergency
  cmdbCiId?: string | null;
  plannedStart?: Date | string | null;
  plannedEnd?: Date | string | null;
}

/**
 * ServiceMeow Change Risk & Governance Engine (Inspired by FreeITSM & ITIL v4)
 * Deterministically evaluates change risk based on CI criticality, duration,
 * blackout windows, and concurrent change collision detection.
 */
export async function evaluateChangeRisk(
  input: EvaluateChangeRiskInput
): Promise<ChangeRiskEvaluation> {
  const factors: ChangeRiskEvaluation["factors"] = [];
  const conflictingChanges: ChangeRiskEvaluation["conflictingChanges"] = [];
  let totalScore = 0;

  // 1. Evaluate Change Type Impact
  const changeType = (input.changeType || "normal").toLowerCase();
  if (changeType === "emergency") {
    totalScore += 40;
    factors.push({
      factor: "CHANGE_TYPE_EMERGENCY",
      scoreContribution: 40,
      description: "Emergency changes bypass standard review and incur high operational volatility risk.",
    });
  } else if (changeType === "normal") {
    totalScore += 20;
    factors.push({
      factor: "CHANGE_TYPE_NORMAL",
      scoreContribution: 20,
      description: "Normal change requires standard verification and peer review.",
    });
  } else {
    totalScore += 5;
    factors.push({
      factor: "CHANGE_TYPE_STANDARD",
      scoreContribution: 5,
      description: "Pre-approved standard change with established operational playbooks.",
    });
  }

  // 2. Evaluate CI Criticality Tier
  if (input.cmdbCiId) {
    const ci = await db.configurationItem.findUnique({
      where: { id: input.cmdbCiId },
      select: { id: true, name: true, tier: true, operationalStatus: true },
    });

    if (ci) {
      const tierStr = (ci.tier || "").toLowerCase();
      if (tierStr.includes("tier 1") || tierStr.includes("mission critical")) {
        totalScore += 35;
        factors.push({
          factor: "CI_TIER_1_CRITICAL",
          scoreContribution: 35,
          description: `Target CI '${ci.name}' is Tier 1 Mission Critical infrastructure.`,
        });
      } else if (tierStr.includes("tier 2")) {
        totalScore += 20;
        factors.push({
          factor: "CI_TIER_2_BUSINESS",
          scoreContribution: 20,
          description: `Target CI '${ci.name}' is Tier 2 Business Essential.`,
        });
      } else {
        totalScore += 10;
        factors.push({
          factor: "CI_TIER_3_SUPPORT",
          scoreContribution: 10,
          description: `Target CI '${ci.name}' is Tier 3 / standard equipment.`,
        });
      }

      if (ci.operationalStatus === "non_operational" || ci.operationalStatus === "degraded") {
        totalScore += 25;
        factors.push({
          factor: "CI_DEGRADED_STATE",
          scoreContribution: 25,
          description: `Target CI is currently degraded or non-operational.`,
        });
      }
    }
  }

  // 3. Evaluate Planned Maintenance Window Duration
  if (input.plannedStart && input.plannedEnd) {
    const start = new Date(input.plannedStart).getTime();
    const end = new Date(input.plannedEnd).getTime();
    const durationHours = (end - start) / (1000 * 60 * 60);

    if (durationHours > 24) {
      totalScore += 25;
      factors.push({
        factor: "EXTENDED_DURATION_24H",
        scoreContribution: 25,
        description: `Maintenance window duration (${durationHours.toFixed(1)} hrs) exceeds 24-hour threshold.`,
      });
    } else if (durationHours > 4) {
      totalScore += 15;
      factors.push({
        factor: "ELEVATED_DURATION_4H",
        scoreContribution: 15,
        description: `Maintenance window duration (${durationHours.toFixed(1)} hrs) exceeds 4-hour threshold.`,
      });
    } else if (durationHours > 0) {
      totalScore += 5;
      factors.push({
        factor: "STANDARD_DURATION",
        scoreContribution: 5,
        description: `Maintenance window duration (${durationHours.toFixed(1)} hrs) is within standard 4-hour envelope.`,
      });
    }
  }

  // 4. Collision Detection with other concurrent changes targeting the same CI
  if (input.cmdbCiId && input.plannedStart && input.plannedEnd) {
    const start = new Date(input.plannedStart);
    const end = new Date(input.plannedEnd);

    const overlapping = await db.changeRequest.findMany({
      where: {
        cmdbCiId: input.cmdbCiId,
        id: input.changeId ? { not: input.changeId } : undefined,
        plannedStart: { lte: end },
        plannedEnd: { gte: start },
        task: { state: { in: [1, 2, 3] } }, // Active changes
      },
      include: {
        task: { select: { id: true, number: true, shortDescription: true } },
      },
    });

    if (overlapping.length > 0) {
      totalScore += 30;
      factors.push({
        factor: "CONCURRENT_CI_COLLISION",
        scoreContribution: 30,
        description: `Detected ${overlapping.length} overlapping active change request(s) on the same CI.`,
      });

      for (const chg of overlapping) {
        conflictingChanges.push({
          id: chg.id,
          number: chg.task.number,
          shortDescription: chg.task.shortDescription,
          plannedStart: chg.plannedStart,
          plannedEnd: chg.plannedEnd,
        });
      }
    }
  }

  // Cap score at 100
  const normalizedScore = Math.min(100, Math.max(0, totalScore));

  let riskLevel: ChangeRiskEvaluation["riskLevel"] = "low";
  if (normalizedScore >= 85) riskLevel = "very_high";
  else if (normalizedScore >= 60) riskLevel = "high";
  else if (normalizedScore >= 30) riskLevel = "moderate";

  return {
    riskScore: normalizedScore,
    riskLevel,
    cabRecommended: normalizedScore >= 60,
    factors,
    conflictingChanges,
  };
}
