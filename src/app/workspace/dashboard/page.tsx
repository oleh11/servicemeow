"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox,
  TrendingUp,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function ExecutiveDashboard() {
  const [timeWindow, setTimeWindow] = useState<"today" | "7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = async (win: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/now/dashboard?window=${win}`);
      const json = await res.json();
      if (json.result) {
        setData(json.result);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(timeWindow);
  }, [timeWindow]);

  const kpi = data?.kpi || {
    totalOpenTasks: 0,
    criticalP1s: 0,
    slaAtRisk: 0,
    resolvedToday: 0,
    unassignedOpen: 0,
  };

  const charts = data?.charts || {
    priorities: [],
    states: [],
    categories: [],
    sla: { compliancePercent: 100, achieved: 0, breached: 0, atRisk: 0 },
  };

  // Find max count for priority chart scaling
  const maxPriorityCount = Math.max(1, ...(charts.priorities?.map((p: any) => p.count) || [1]));
  
  // Total incidents across states for percentage calculation
  const totalStateIncidents = Math.max(
    1,
    (charts.states || []).reduce((acc: number, curr: any) => acc + curr.count, 0)
  );

  // Max category count
  const maxCategoryCount = Math.max(1, ...(charts.categories?.map((c: any) => c.count) || [1]));

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive ITIL Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time enterprise operational intelligence, SLA compliance & incident distribution
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2" />
          <button
            onClick={() => setTimeWindow("today")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              timeWindow === "today"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeWindow("7d")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              timeWindow === "7d"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeWindow("30d")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              timeWindow === "30d"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => fetchDashboardData(timeWindow)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Open Tasks */}
        <div className="bg-white p-4 rounded-xl border shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Open Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{kpi.totalOpenTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">Active triage</span> in backlog
          </div>
        </div>

        {/* Critical P1s */}
        <div className="bg-white p-4 rounded-xl border shadow-xs hover:border-rose-200 transition-all border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical P1s</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2 font-mono flex items-baseline gap-2">
            {kpi.criticalP1s}
            {kpi.criticalP1s > 0 && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full animate-pulse">
                High Priority
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Requires immediate exec attention</div>
        </div>

        {/* SLA At-Risk Count */}
        <div className="bg-white p-4 rounded-xl border shadow-xs hover:border-amber-200 transition-all border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA At-Risk</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2 font-mono">{kpi.slaAtRisk}</div>
          <div className="text-[11px] text-slate-400 mt-1">&lt; 1 hour or &gt; 75% elapsed</div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white p-4 rounded-xl border shadow-xs hover:border-emerald-200 transition-all border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resolved Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">{kpi.resolvedToday}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> Successfully closed
          </div>
        </div>

        {/* Unassigned Count */}
        <div className="bg-white p-4 rounded-xl border shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unassigned Open</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-600 mt-2 font-mono">{kpi.unassignedOpen}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting technician routing</div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Incidents by Priority (P1-P5) Bar Chart */}
        <div className="bg-white p-5 rounded-xl border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Incidents by Priority (P1–P5)</h2>
              <p className="text-xs text-slate-400">Distribution of incidents in selected window</p>
            </div>
            <Link
              href="/workspace/incident"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Browse List <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* SVG Vertical Bar Chart */}
          <div className="pt-4">
            <div className="h-52 w-full flex items-end justify-between gap-4 px-4 pb-2 border-b border-slate-200">
              {charts.priorities.map((item: any) => {
                const heightPercent = maxPriorityCount > 0 ? (item.count / maxPriorityCount) * 100 : 0;
                return (
                  <div key={item.priority} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-xs font-mono font-bold text-slate-700 mb-1 group-hover:scale-110 transition-transform">
                      {item.count}
                    </div>
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-md overflow-hidden h-full flex items-end">
                      <div
                        style={{ height: `${Math.max(8, heightPercent)}%`, backgroundColor: item.color }}
                        className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-90"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 mt-2 text-center whitespace-nowrap">
                      P{item.priority}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 px-4 mt-2">
              <span>P1: Critical (Outage)</span>
              <span>P2: High</span>
              <span>P3: Moderate</span>
              <span>P4: Low</span>
              <span>P5: Planning</span>
            </div>
          </div>
        </div>

        {/* CHART 2: Incidents by State Colored Distribution Gauge */}
        <div className="bg-white p-5 rounded-xl border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Incidents by State Distribution</h2>
              <p className="text-xs text-slate-400">Status lifecycle tracking across all incidents</p>
            </div>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="space-y-4 pt-2">
            <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 border">
              {charts.states.map((st: any) => {
                const percent = Math.round((st.count / totalStateIncidents) * 100);
                if (st.count === 0) return null;
                return (
                  <div
                    key={st.label}
                    style={{ width: `${percent}%`, backgroundColor: st.color }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:opacity-90 relative group"
                    title={`${st.label}: ${st.count} (${percent}%)`}
                  />
                );
              })}
            </div>

            {/* State Grid Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {charts.states.map((st: any) => {
                const percent = Math.round((st.count / totalStateIncidents) * 100);
                return (
                  <div key={st.label} className="p-2.5 rounded-lg border bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                      <span className="text-xs font-semibold text-slate-700">{st.label}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold font-mono text-slate-900">{st.count}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHART 3: Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-sm font-bold text-slate-900">Incident Category Breakdown</h2>
            <p className="text-xs text-slate-400">Distribution across IT service domains</p>
          </div>

          <div className="space-y-3 pt-1">
            {charts.categories.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-6 text-center">No categorized incidents in window.</div>
            ) : (
              charts.categories.map((cat: any) => {
                const percent = Math.round((cat.count / maxCategoryCount) * 100);
                return (
                  <div key={cat.label} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span>{cat.label}</span>
                      <span className="font-mono font-bold text-slate-900">{cat.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CHART 4: SLA Compliance Meter (Radial / Percentage Bar) */}
        <div className="bg-white p-5 rounded-xl border shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-sm font-bold text-slate-900">SLA Compliance Meter</h2>
            <p className="text-xs text-slate-400">Contractual resolution delivery performance</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Circular Radial Meter */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={charts.sla.compliancePercent >= 90 ? "#10b981" : "#f59e0b"}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - charts.sla.compliancePercent / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {charts.sla.compliancePercent}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Target: 95%
                </span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="space-y-3 text-xs w-full sm:w-48">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Achieved Within Target</div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{charts.sla.achieved}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <div className="text-[10px] font-bold text-rose-800 uppercase">Breached Contracts</div>
                <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">{charts.sla.breached}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-bold text-amber-800 uppercase">At-Risk Timers Active</div>
                <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">{charts.sla.atRisk}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
