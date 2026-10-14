export interface SlaStatus {
  instanceId: string;
  definitionName: string;
  stage: string;
  targetDurationMinutes: number;
  startTime: Date;
  breachTime: Date;
  elapsedPercent: number;
  remainingMinutes: number;
  isBreached: boolean;
  statusBadge: "healthy" | "warning" | "danger" | "breached" | "paused" | "achieved";
  state: string;
}

export function computeSlaStatus(instance: {
  id: string;
  startTime: Date;
  breachTime: Date;
  state: string;
  pausedAt?: Date | null;
  totalPauseSeconds: number;
  slaDefinition: {
    name: string;
    stage: string;
    targetDurationMinutes: number;
  };
}): SlaStatus {
  const now = new Date();
  const startMs = new Date(instance.startTime).getTime();
  const breachMs = new Date(instance.breachTime).getTime();
  const totalDurationMs = breachMs - startMs;

  if (instance.state === "achieved") {
    return {
      instanceId: instance.id,
      definitionName: instance.slaDefinition.name,
      stage: instance.slaDefinition.stage,
      targetDurationMinutes: instance.slaDefinition.targetDurationMinutes,
      startTime: instance.startTime,
      breachTime: instance.breachTime,
      elapsedPercent: 100,
      remainingMinutes: 0,
      isBreached: false,
      statusBadge: "achieved",
      state: "achieved",
    };
  }

  if (instance.state === "paused") {
    return {
      instanceId: instance.id,
      definitionName: instance.slaDefinition.name,
      stage: instance.slaDefinition.stage,
      targetDurationMinutes: instance.slaDefinition.targetDurationMinutes,
      startTime: instance.startTime,
      breachTime: instance.breachTime,
      elapsedPercent: 50,
      remainingMinutes: Math.max(0, Math.round((breachMs - now.getTime()) / (1000 * 60))),
      isBreached: false,
      statusBadge: "paused",
      state: "paused",
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - startMs - instance.totalPauseSeconds * 1000);
  const remainingMs = breachMs - now.getTime();
  const remainingMinutes = Math.round(remainingMs / (1000 * 60));
  const elapsedPercent = Math.min(200, Math.round((elapsedMs / totalDurationMs) * 100));
  const isBreached = now.getTime() > breachMs;

  let statusBadge: SlaStatus["statusBadge"] = "healthy";
  if (isBreached) {
    statusBadge = "breached";
  } else if (elapsedPercent >= 75) {
    statusBadge = "danger";
  } else if (elapsedPercent >= 50) {
    statusBadge = "warning";
  }

  return {
    instanceId: instance.id,
    definitionName: instance.slaDefinition.name,
    stage: instance.slaDefinition.stage,
    targetDurationMinutes: instance.slaDefinition.targetDurationMinutes,
    startTime: instance.startTime,
    breachTime: instance.breachTime,
    elapsedPercent,
    remainingMinutes,
    isBreached,
    statusBadge,
    state: instance.state,
  };
}

/**
 * Calculates priority using standard ITIL Impact x Urgency matrix.
 * Impact: 1 (High), 2 (Medium), 3 (Low)
 * Urgency: 1 (High), 2 (Medium), 3 (Low)
 */
export function calculatePriority(impact: number, urgency: number): number {
  if (impact === 1 && urgency === 1) return 1; // Critical
  if ((impact === 1 && urgency === 2) || (impact === 2 && urgency === 1)) return 2; // High
  if ((impact === 1 && urgency === 3) || (impact === 2 && urgency === 2) || (impact === 3 && urgency === 1)) return 3; // Moderate
  if ((impact === 2 && urgency === 3) || (impact === 3 && urgency === 2)) return 4; // Low
  return 5; // Planning
}
