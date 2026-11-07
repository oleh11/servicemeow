"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  GitPullRequest,
  HelpCircle,
  Server,
  RefreshCw,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronRight,
} from "lucide-react";

interface WatchtowerData {
  metrics: {
    totalOpenIncidents: number;
    p1P2Incidents: number;
    breachingSlas: number;
    pendingApprovals: number;
    activeProblemsWithoutWorkaround: number;
    degradedCis: number;
    failingMorningChecks: number;
    healthScore: number;
  };
  attentionStreams: {
    criticalIncidents: Array<{
      id: string;
      number: string;
      shortDescription: string;
      priority: number;
      state: number;
      assignedTo: string | null;
      sysCreatedAt: string;
    }>;
    breachingSlas: Array<{
      id: string;
      taskNumber: string;
      slaName: string;
      targetHours: number;
      timeRemainingHours: number;
      percentRemaining: number;
    }>;
    pendingApprovals: Array<{
      id: string;
      changeNumber: string;
      changeTitle: string;
      requestedBy: string;
      risk: string;
      type: string;
      sysCreatedAt: string;
    }>;
    activeProblems: Array<{
      id: string;
      number: string;
      shortDescription: string;
      priority: number;
      hasWorkaround: boolean;
      hasRootCause: boolean;
    }>;
    degradedCis: Array<{
      id: string;
      name: string;
      category: string;
      status: string;
      ipAddress: string | null;
      location: string | null;
    }>;
    failingMorningChecks: Array<{
      id: string;
      title: string;
      category: string;
      status: string;
      shift: string;
      inspectedBy: string | null;
      notes: string | null;
    }>;
  };
}

export function WatchtowerCockpit() {
  const [data, setData] = useState<WatchtowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchWatchtower = async () => {
    try {
      const res = await fetch("/api/now/watchtower");
      if (!res.ok) throw new Error("Failed to query Watchtower attention streams");
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchtower();
  }, []);

  // 30s Auto Refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchWatchtower();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-mono text-xs text-neutral-600">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        INITIALIZING WATCHTOWER ATTENTION COCKPIT...
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalOpenIncidents: 0,
    p1P2Incidents: 0,
    breachingSlas: 0,
    pendingApprovals: 0,
    activeProblemsWithoutWorkaround: 0,
    degradedCis: 0,
    failingMorningChecks: 0,
    healthScore: 100,
  };

  const streams = data?.attentionStreams || {
    criticalIncidents: [],
    breachingSlas: [],
    pendingApprovals: [],
    activeProblems: [],
    degradedCis: [],
    failingMorningChecks: [],
  };

  const score = metrics.healthScore;
  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-500" : "text-red-600";
  const scoreBg =
    score >= 80 ? "bg-emerald-600" : score >= 50 ? "bg-amber-500" : "bg-red-600";
  const scoreBorder =
    score >= 80 ? "border-emerald-600" : score >= 50 ? "border-amber-500" : "border-red-600";
  const statusLabel =
    score >= 80
      ? "OPERATIONAL HEALTH STABLE"
      : score >= 50
      ? "ELEVATED SYSTEM FRICTION"
      : "CRITICAL OPERATIONAL DISTRESS";

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-100 min-h-screen text-black font-sans">
      {/* Swiss Header Bar */}
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase font-extrabold px-2 py-0.5 bg-black text-white">
              WATCHTOWER
            </span>
            <span className="font-mono text-xs uppercase font-bold text-neutral-500">
              Deterministic Attention Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-black">
            Operational Attention Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-3xl">
            Real-time critical attention aggregation. Eliminates information fragmentation across P1/P2 incidents, imminent SLA breaches, pending CAB authorisations, unresolved problems, and degraded physical assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border-2 border-black font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
              autoRefresh ? "bg-emerald-100 text-emerald-900" : "bg-white text-neutral-600"
            }`}
          >
            {autoRefresh ? "Auto-Refresh: 30s" : "Auto-Refresh: Off"}
          </button>
          <button
            type="button"
            onClick={fetchWatchtower}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stream</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border-2 border-red-600 bg-red-50 text-red-900 font-mono text-xs">
          {error}
        </div>
      )}

      {/* Primary Health Score Hero Card */}
      <div
        className={`border-4 ${scoreBorder} bg-white p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-6`}
      >
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center w-24 h-24 border-4 border-black bg-neutral-50 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <span className={`font-mono text-4xl font-black ${scoreColor}`}>{score}</span>
            <span className="absolute bottom-1 font-mono text-[9px] font-bold text-neutral-400 uppercase">
              / 100
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-xs font-black uppercase px-2 py-0.5 text-white ${scoreBg}`}
              >
                HEALTH INDEX
              </span>
              <span className="font-mono text-xs text-neutral-500">
                Calculated at {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-xl font-black uppercase font-mono tracking-tight text-black">
              {statusLabel}
            </h2>
            <p className="text-xs text-neutral-600 font-mono max-w-xl">
              Weighted index deducting penalties for active P1/P2 incidents (-15), breaching SLAs (-10), degraded CMDB hardware (-8), and failing shift rounds (-10).
            </p>
          </div>
        </div>

        {/* Quick Matrix Counter */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-t md:border-t-0 md:border-l-2 border-black pt-4 md:pt-0 md:pl-6">
          <div className="text-center font-mono">
            <div className="text-xl font-black text-red-600">{metrics.p1P2Incidents}</div>
            <div className="text-[9px] uppercase text-neutral-500 font-bold">P1/P2 Active</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-xl font-black text-amber-600">{metrics.breachingSlas}</div>
            <div className="text-[9px] uppercase text-neutral-500 font-bold">SLA &lt;1h</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-xl font-black text-black">{metrics.pendingApprovals}</div>
            <div className="text-[9px] uppercase text-neutral-500 font-bold">CAB Pending</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-xl font-black text-neutral-800">
              {metrics.activeProblemsWithoutWorkaround}
            </div>
            <div className="text-[9px] uppercase text-neutral-500 font-bold">Open Problems</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-xl font-black text-red-600">{metrics.degradedCis}</div>
            <div className="text-[9px] uppercase text-neutral-500 font-bold">Degraded CI</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-xl font-black text-amber-600">
              {metrics.failingMorningChecks}
            </div>
            <div className="text-[9px] uppercase text-neutral-500 font-bold">Failed Checks</div>
          </div>
        </div>
      </div>

      {/* 6 High-Priority Attention Quadrants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QUADRANT 1: CRITICAL INCIDENTS (P1 & P2) */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                01 // Critical Incidents (P1 &amp; P2)
              </h3>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-red-600 text-white">
              {streams.criticalIncidents.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-neutral-200">
            {streams.criticalIncidents.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Zero critical incidents currently active. Operations nominal.</span>
              </div>
            ) : (
              streams.criticalIncidents.map((inc) => (
                <div key={inc.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono text-[10px] font-black uppercase px-1.5 py-0.2 ${
                          inc.priority === 1
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-black"
                        }`}
                      >
                        P{inc.priority} - {inc.priority === 1 ? "CRITICAL" : "HIGH"}
                      </span>
                      <span className="font-mono text-xs font-black text-black">
                        {inc.number}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        Assigned: {inc.assignedTo || "Unassigned"}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-neutral-800 font-bold truncate">
                      {inc.shortDescription}
                    </div>
                  </div>

                  <Link
                    href={`/workspace/incident/${inc.id}`}
                    className="shrink-0 px-2.5 py-1 border border-black hover:bg-black hover:text-white font-mono text-[11px] font-bold uppercase transition-colors"
                  >
                    Triage &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QUADRANT 2: IMMINENT SLA BREACHES (< 1 HOUR) */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                02 // Imminent SLA Breaches (&lt; 1 Hour Remaining)
              </h3>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-amber-500 text-black">
              {streams.breachingSlas.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-neutral-200">
            {streams.breachingSlas.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>All active tasks well within SLA commitment deadlines.</span>
              </div>
            ) : (
              streams.breachingSlas.map((sla) => (
                <div key={sla.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-black">
                        {sla.taskNumber}
                      </span>
                      <span className="font-mono text-xs text-neutral-600 font-medium">
                        {sla.slaName}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-red-600">
                      {sla.timeRemainingHours <= 0
                        ? "BREACHED"
                        : `${Math.round(sla.timeRemainingHours * 60)} min remaining`}
                    </span>
                  </div>

                  <div className="w-full bg-neutral-200 h-2 border border-black overflow-hidden">
                    <div
                      className={`h-full ${
                        sla.percentRemaining < 20 ? "bg-red-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.max(sla.percentRemaining, 5)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QUADRANT 3: PENDING CAB AUTHORIZATIONS */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-black" />
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                03 // Pending CAB Change Authorizations
              </h3>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white">
              {streams.pendingApprovals.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-neutral-200">
            {streams.pendingApprovals.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Zero change requests awaiting CAB review. Queue clear.</span>
              </div>
            ) : (
              streams.pendingApprovals.map((chg) => (
                <div key={chg.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-black">
                        {chg.changeNumber}
                      </span>
                      <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-neutral-200 text-neutral-800">
                        {chg.risk} RISK · {chg.type}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-neutral-800 font-bold truncate">
                      {chg.changeTitle}
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500">
                      Requested by {chg.requestedBy} on{" "}
                      {new Date(chg.sysCreatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <Link
                    href={`/workspace/change_request/${chg.id}`}
                    className="shrink-0 px-2.5 py-1 border border-black hover:bg-black hover:text-white font-mono text-[11px] font-bold uppercase transition-colors"
                  >
                    Review &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QUADRANT 4: ACTIVE PROBLEMS MISSING WORKAROUND */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-black" />
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                04 // Active Problems Missing Root Cause / Fix
              </h3>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-neutral-800 text-white">
              {streams.activeProblems.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-neutral-200">
            {streams.activeProblems.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>All active problem investigations have published workarounds.</span>
              </div>
            ) : (
              streams.activeProblems.map((prob) => (
                <div key={prob.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-black">
                        {prob.number}
                      </span>
                      {!prob.hasWorkaround && (
                        <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-red-600 text-white">
                          NO WORKAROUND
                        </span>
                      )}
                      {!prob.hasRootCause && (
                        <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-neutral-300 text-neutral-800">
                          ROOT CAUSE UNKNOWN
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-neutral-800 font-bold truncate">
                      {prob.shortDescription}
                    </div>
                  </div>

                  <Link
                    href={`/workspace/problem/${prob.id}`}
                    className="shrink-0 px-2.5 py-1 border border-black hover:bg-black hover:text-white font-mono text-[11px] font-bold uppercase transition-colors"
                  >
                    Investigate &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QUADRANT 5: DEGRADED & OUTAGE CMDB CIS */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-red-600" />
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                05 // Degraded &amp; Outage Configuration Items
              </h3>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-red-600 text-white">
              {streams.degradedCis.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-neutral-200">
            {streams.degradedCis.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>All physical and cloud configuration items reporting operational.</span>
              </div>
            ) : (
              streams.degradedCis.map((ci) => (
                <div key={ci.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-black">
                        {ci.name}
                      </span>
                      <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-red-600 text-white">
                        {ci.status.replace("_", " ")}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500 uppercase">
                        {ci.category}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-neutral-600">
                      IP: {ci.ipAddress || "N/A"} · Facility: {ci.location || "Central DC"}
                    </div>
                  </div>

                  <Link
                    href={`/workspace/cmdb`}
                    className="shrink-0 px-2.5 py-1 border border-black hover:bg-black hover:text-white font-mono text-[11px] font-bold uppercase transition-colors"
                  >
                    Topology &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QUADRANT 6: FAILING SHIFT MORNING CHECKS */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                06 // Failed / Degraded Shift Operational Rounds
              </h3>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-amber-500 text-black">
              {streams.failingMorningChecks.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-neutral-200">
            {streams.failingMorningChecks.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>All infrastructure shift inspection rounds passing without issues.</span>
              </div>
            ) : (
              streams.failingMorningChecks.map((chk) => (
                <div key={chk.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-black">
                        {chk.title}
                      </span>
                      <span
                        className={`font-mono text-[9px] font-black uppercase px-1.5 py-0.2 ${
                          chk.status === "FAIL"
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-black"
                        }`}
                      >
                        {chk.status}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500 uppercase">
                        {chk.category} · {chk.shift}
                      </span>
                    </div>
                    {chk.notes && (
                      <div className="font-mono text-xs text-neutral-700">{chk.notes}</div>
                    )}
                  </div>

                  <Link
                    href={`/workspace/morning-checks`}
                    className="shrink-0 px-2.5 py-1 border border-black hover:bg-black hover:text-white font-mono text-[11px] font-bold uppercase transition-colors"
                  >
                    Shift Console &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
