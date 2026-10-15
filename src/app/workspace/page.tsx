import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { SlaBadge } from "@/components/workspace/SlaBadge";
import {
  AlertCircle,
  GitPullRequest,
  Server,
  Clock,
  ArrowRight,
  Plus,
  ShieldAlert,
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
      take: 6,
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
      take: 6,
    }),
    db.configurationItem.count(),
    db.slaInstance.count({ where: { state: "in_progress" } }),
  ]);

  const p1Count = openIncidents.filter((i) => i.priority === 1).length;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-100 min-h-screen text-black">
      {/* Swiss Header Bar */}
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase font-extrabold px-2 py-0.5 bg-black text-white">
              OPERATIONS
            </span>
            <span className="font-mono text-xs uppercase font-bold text-neutral-500">
              ITIL Fulfiller Console
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-black">
            Agent Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
            Live incident response, CAB authorization board, and service level agreement monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/workspace/incident/new"
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Incident</span>
          </Link>
          <Link
            href="/workspace/change_request/new"
            className="px-5 py-3 border-2 border-black hover:bg-black hover:text-white text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Change</span>
          </Link>
        </div>
      </div>

      {/* Swiss 4-Quadrant Metric Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 01: P1 Incidents */}
        <div className="border-2 border-red-600 bg-white p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-red-600">01 / INCIDENT TRIAGE</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-red-600">{p1Count}</div>
            <div className="text-xs font-bold uppercase tracking-tight text-black mt-1">
              Critical P1 Incidents Active
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-2">
            Target SLA: 1 Hour Response
          </div>
        </div>

        {/* Metric 02: CAB Reviews */}
        <div className="border-2 border-amber-600 bg-white p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-amber-600">02 / GOVERNANCE</span>
            <GitPullRequest className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-black">{cabChanges.length}</div>
            <div className="text-xs font-bold uppercase tracking-tight text-black mt-1">
              Pending CAB Authorizations
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-2">
            Next CAB Window: Thursday 14:00
          </div>
        </div>

        {/* Metric 03: Active SLAs */}
        <div className="border-2 border-blue-600 bg-white p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-600">03 / SERVICE LEVELS</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-black">{slaCount}</div>
            <div className="text-xs font-bold uppercase tracking-tight text-black mt-1">
              Active SLA Timers Running
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-2">
            100% Breached Warning System
          </div>
        </div>

        {/* Metric 04: CMDB Assets */}
        <div className="border-2 border-black bg-white p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-neutral-500">04 / ARCHITECTURE</span>
            <Server className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono text-black">{cis}</div>
            <div className="text-xs font-bold uppercase tracking-tight text-black mt-1">
              CMDB Configuration Items
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-2">
            Mapped Across 6 Tiers
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Active Incidents vs CAB Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Highest Priority Incidents */}
        <div className="border-2 border-black bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-extrabold uppercase tracking-tight text-black">
                Active Priority Incidents
              </h2>
            </div>
            <Link
              href="/workspace/incident"
              className="text-xs font-mono uppercase font-bold text-neutral-600 hover:text-black flex items-center gap-1"
            >
              <span>View Queue &rarr;</span>
            </Link>
          </div>

          <div className="space-y-3">
            {openIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-neutral-500">
                No active priority incidents currently open.
              </div>
            ) : (
              openIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 border border-neutral-300 hover:border-black transition-colors space-y-2 bg-neutral-50/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/workspace/incident/${inc.id}`}
                        className="font-mono text-xs font-extrabold text-black hover:underline"
                      >
                        {inc.number}
                      </Link>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                          inc.priority === 1
                            ? "bg-red-50 border-red-600 text-red-700"
                            : "bg-amber-50 border-amber-600 text-amber-800"
                        }`}
                      >
                        P{inc.priority} {inc.priority === 1 ? "CRITICAL" : "HIGH"}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-500">
                      {inc.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-black line-clamp-1">
                    {inc.shortDescription}
                  </p>

                  {inc.slaInstances[0] && (
                    <div className="pt-1">
                      <SlaBadge slaInstance={inc.slaInstances[0]} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Changes Awaiting CAB Authorization */}
        <div className="border-2 border-black bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-extrabold uppercase tracking-tight text-black">
                Changes Awaiting CAB Approval
              </h2>
            </div>
            <Link
              href="/workspace/change_request"
              className="text-xs font-mono uppercase font-bold text-neutral-600 hover:text-black flex items-center gap-1"
            >
              <span>View Queue &rarr;</span>
            </Link>
          </div>

          <div className="space-y-3">
            {cabChanges.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-neutral-500">
                No change requests currently pending CAB authorization.
              </div>
            ) : (
              cabChanges.map((chg) => (
                <div
                  key={chg.id}
                  className="p-4 border border-neutral-300 hover:border-black transition-colors space-y-2 bg-neutral-50/50"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/workspace/change_request/${chg.id}`}
                      className="font-mono text-xs font-extrabold text-black hover:underline"
                    >
                      {chg.number}
                    </Link>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-800 uppercase">
                      CAB REVIEW
                    </span>
                  </div>

                  <p className="text-xs font-bold text-black line-clamp-2">
                    {chg.shortDescription}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-200">
                    <span>Risk: <strong className="text-black uppercase">{chg.changeRequest?.risk || "Moderate"}</strong></span>
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
