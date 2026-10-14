import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { SlaBadge } from "@/components/workspace/SlaBadge";
import {
  AlertCircle,
  GitPullRequest,
  CheckCircle,
  Activity,
  Server,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkspaceDashboard() {
  const [openIncidents, cabChanges, cis, slaCount] = await Promise.all([
    db.task.findMany({
      where: { sysClassName: "incident", state: { in: [1, 2, 3] } },
      include: {
        assignedTo: true,
        incident: { include: { cmdbCi: true } },
        slaInstances: { include: { slaDefinition: true } },
      },
      orderBy: { priority: "asc" },
      take: 5,
    }),
    db.task.findMany({
      where: {
        sysClassName: "change_request",
        changeRequest: { cabApprovalState: "requested" },
      },
      include: {
        assignedTo: true,
        changeRequest: true,
      },
      take: 5,
    }),
    db.configurationItem.count(),
    db.slaInstance.count({ where: { state: "in_progress" } }),
  ]);

  const p1Count = openIncidents.filter((i) => i.priority === 1).length;

  return (
    <div
      className="p-6 space-y-6"
      style={{
        backgroundColor: "var(--theme-page-bg, #f8f9fa)",
        color: "var(--theme-text-primary, #1f1f1f)",
      }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
            Agent Operations Center
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
          >
            Live ITIL Service Desk triage and operational performance dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Link
            href="/workspace/incident/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-medium shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] transition-all"
            style={{
              backgroundColor: "var(--md-sys-color-primary, #0b57d0)",
              color: "var(--md-sys-color-on-primary, #ffffff)",
            }}
          >
            + Create Incident
          </Link>
          <Link
            href="/workspace/change_request/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-medium border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              borderColor: "var(--md-sys-color-outline, #79747e)",
              color: "var(--md-sys-color-on-surface, #1d1b20)",
            }}
          >
            + Create Change
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid (M3 Outlined Cards: rounded-[16px]) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* P1 Critical Metric */}
        <div
          className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] flex items-center justify-between"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            >
              Critical P1 Incidents
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 flex items-baseline gap-2">
              {p1Count}
              <span className="text-xs font-medium text-rose-500 animate-pulse">● Active triage</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* CAB Approvals Pending */}
        <div
          className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] flex items-center justify-between"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            >
              Pending CAB Reviews
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {cabChanges.length}
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <GitPullRequest className="w-5 h-5" />
          </div>
        </div>

        {/* Active SLAs */}
        <div
          className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] flex items-center justify-between"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            >
              Active SLA Timers
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {slaCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Managed CIs */}
        <div
          className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] flex items-center justify-between"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            >
              CMDB Assets
            </span>
            <div className="text-2xl font-extrabold mt-1">
              {cis}
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
              color: "var(--md-sys-color-on-surface-variant, #49454f)",
            }}
          >
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Incidents & Pending CAB Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Priority Incidents */}
        <div
          className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] space-y-4"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-sm font-bold">Highest Priority Active Incidents</h2>
            </div>
            <Link
              href="/workspace/incident"
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {openIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-[12px] border transition-colors space-y-2 hover:shadow-xs"
                style={{
                  backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
                  borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/workspace/incident/${inc.id}`}
                      className="font-mono text-xs font-bold hover:underline"
                      style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
                    >
                      {inc.number}
                    </Link>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-[8px] ${
                        inc.priority === 1
                          ? "bg-[var(--md-sys-color-p1-bg,#fee2e2)] text-[var(--md-sys-color-p1-fg,#991b1b)] border border-red-300"
                          : "bg-[var(--md-sys-color-p2-bg,#ffedd5)] text-[var(--md-sys-color-p2-fg,#9a3412)] border border-amber-300"
                      }`}
                    >
                      P{inc.priority}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                  >
                    {inc.assignedTo?.name || "Unassigned"}
                  </span>
                </div>

                <p className="text-xs font-semibold line-clamp-1">
                  {inc.shortDescription}
                </p>

                {inc.slaInstances[0] && (
                  <div className="pt-1">
                    <SlaBadge slaInstance={inc.slaInstances[0]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Change Management Approvals */}
        <div
          className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] space-y-4"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
          >
            <div className="flex items-center space-x-2">
              <GitPullRequest className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold">Changes Awaiting CAB Authorization</h2>
            </div>
            <Link
              href="/workspace/change_request"
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {cabChanges.length === 0 ? (
              <p
                className="text-xs italic py-8 text-center"
                style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
              >
                No changes pending CAB approval.
              </p>
            ) : (
              cabChanges.map((chg) => (
                <div
                  key={chg.id}
                  className="p-3.5 rounded-[12px] border transition-colors space-y-2 hover:shadow-xs"
                  style={{
                    backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
                    borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/workspace/change_request/${chg.id}`}
                      className="font-mono text-xs font-bold hover:underline text-amber-700 dark:text-amber-400"
                    >
                      {chg.number}
                    </Link>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 uppercase">
                      CAB Review
                    </span>
                  </div>
                  <p className="text-xs font-semibold line-clamp-2">
                    {chg.shortDescription}
                  </p>
                  <div
                    className="flex items-center justify-between text-[11px] pt-1.5 border-t"
                    style={{
                      borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      color: "var(--md-sys-color-on-surface-variant, #49454f)",
                    }}
                  >
                    <span>Risk: <strong className="uppercase">{chg.changeRequest?.risk}</strong></span>
                    <span>Lead: {chg.assignedTo?.name || "Governance"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
