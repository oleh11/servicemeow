import React from "react";
import { computeSlaStatus } from "@/lib/sla";
import { Clock, AlertTriangle, CheckCircle, PauseCircle } from "lucide-react";

interface SlaBadgeProps {
  slaInstance?: {
    id: string;
    startTime: any;
    breachTime: any;
    state: string;
    pausedAt?: any;
    totalPauseSeconds: number;
    slaDefinition: {
      name: string;
      stage: string;
      targetDurationMinutes: number;
    };
  } | null;
}

export function SlaBadge({ slaInstance }: SlaBadgeProps) {
  if (!slaInstance) {
    return (
      <div className="text-xs text-slate-400 italic flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> No active SLA attached
      </div>
    );
  }

  const status = computeSlaStatus({
    id: slaInstance.id,
    startTime: new Date(slaInstance.startTime),
    breachTime: new Date(slaInstance.breachTime),
    state: slaInstance.state,
    pausedAt: slaInstance.pausedAt ? new Date(slaInstance.pausedAt) : null,
    totalPauseSeconds: slaInstance.totalPauseSeconds,
    slaDefinition: slaInstance.slaDefinition,
  });

  const getBadgeColor = () => {
    switch (status.statusBadge) {
      case "achieved":
        return {
          bar: "bg-emerald-500",
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: CheckCircle,
          label: "SLA Achieved",
        };
      case "paused":
        return {
          bar: "bg-blue-400",
          bg: "bg-blue-50 border-blue-200 text-blue-800",
          icon: PauseCircle,
          label: "Paused (On Hold)",
        };
      case "breached":
        return {
          bar: "bg-rose-500",
          bg: "bg-rose-50 border-rose-300 text-rose-800",
          icon: AlertTriangle,
          label: `Breached (${Math.abs(status.remainingMinutes)}m ago)`,
        };
      case "danger":
        return {
          bar: "bg-orange-500",
          bg: "bg-orange-50 border-orange-200 text-orange-800",
          icon: Clock,
          label: `${status.remainingMinutes}m left (Urgent)`,
        };
      case "warning":
        return {
          bar: "bg-amber-400",
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: Clock,
          label: `${status.remainingMinutes}m left`,
        };
      default:
        return {
          bar: "bg-emerald-500",
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: Clock,
          label: `${status.remainingMinutes}m left`,
        };
    }
  };

  const style = getBadgeColor();
  const Icon = style.icon;

  return (
    <div className={`p-2.5 rounded-lg border text-xs ${style.bg} space-y-1.5 shadow-sm`}>
      <div className="flex items-center justify-between font-medium">
        <span className="flex items-center gap-1.5 font-semibold">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {status.definitionName}
        </span>
        <span className="font-mono text-[11px] font-bold">{style.label}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${style.bar}`}
          style={{ width: `${Math.min(100, status.elapsedPercent)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>Target: {status.targetDurationMinutes} mins</span>
        <span>Breach: {new Date(status.breachTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}
