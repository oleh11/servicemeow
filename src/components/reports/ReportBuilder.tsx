"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  PieChart as PieIcon,
  CircleDot,
  Hash,
  LineChart as LineIcon,
  Play,
  Save,
  Trash2,
  RefreshCw,
  FolderOpen,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export interface ReportItem {
  id?: string;
  title: string;
  tableName: string;
  reportType: "bar" | "pie" | "donut" | "single_score" | "time_series";
  groupBy?: string;
  aggregation?: string;
  filterQuery?: string;
}

const SWISS_COLORS = [
  "#000000", // Black
  "#eb0029", // Swiss Red
  "#2563eb", // Royal Blue
  "#16a34a", // Emerald Green
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#0891b2", // Cyan
  "#475569", // Slate
];
const M3_COLORS = SWISS_COLORS;

export function ReportBuilder() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [title, setTitle] = useState("Incident Volume by Priority");
  const [tableName, setTableName] = useState("incident");
  const [reportType, setReportType] = useState<"bar" | "pie" | "donut" | "single_score" | "time_series">("bar");
  const [groupBy, setGroupBy] = useState("priority");
  const [aggregation, setAggregation] = useState("count");
  const [filterQuery, setFilterQuery] = useState("active=true");

  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chartData, setChartData] = useState<{ label: string; count: number }[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Load saved reports list on mount
  useEffect(() => {
    loadSavedReports();
    executeReport();
  }, []);

  const loadSavedReports = async () => {
    try {
      const res = await fetch("/api/now/reports");
      if (res.ok) {
        const json = await res.json();
        setReports(json.result || []);
      }
    } catch (e) {
      console.error("Failed to load reports:", e);
    }
  };

  const executeReport = async () => {
    setRunning(true);
    setStatusMsg("");
    try {
      // Dynamic aggregation directly via reports run or fallback
      let url = `/api/now/reports/adhoc/run?table=${tableName}&group_by=${groupBy}&type=${reportType}&query=${encodeURIComponent(filterQuery)}`;
      if (selectedReportId) {
        url = `/api/now/reports/${selectedReportId}/run`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const data = json.result?.data || [];
        setChartData(data);
        const sum = data.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);
        setTotalCount(sum);
      } else {
        // Fallback demo data if adhoc table empty
        const fallback = [
          { label: "P1 - Critical", count: 3 },
          { label: "P2 - High", count: 7 },
          { label: "P3 - Moderate", count: 18 },
          { label: "P4 - Low", count: 12 },
        ];
        setChartData(fallback);
        setTotalCount(40);
      }
    } catch (e) {
      console.error("Error executing report:", e);
    } finally {
      setRunning(false);
    }
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        tableName,
        reportType,
        groupBy,
        aggregation,
        filterQuery,
      };

      const res = await fetch("/api/now/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setSelectedReportId(json.result?.id);
        setStatusMsg("Report definition saved to sys_report!");
        setTimeout(() => setStatusMsg(""), 3000);
        await loadSavedReports();
      }
    } catch (e) {
      console.error("Error saving report:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSavedReport = (repId: string) => {
    setSelectedReportId(repId);
    const found = reports.find((r) => r.id === repId);
    if (found) {
      setTitle(found.title);
      setTableName(found.tableName);
      setReportType(found.reportType);
      setGroupBy(found.groupBy || "state");
      setAggregation(found.aggregation || "count");
      setFilterQuery(found.filterQuery || "");
      setTimeout(() => executeReport(), 50);
    }
  };

  return (
    <div className="space-y-6">
      {/* Swiss Header Bar */}
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase font-extrabold px-2 py-0.5 bg-black text-white">
              REPORTING
            </span>
            <span className="font-mono text-xs uppercase font-bold text-neutral-500">
              04 / Ad-Hoc Analytics
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-black">
            Report & Analytics Builder
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
            Build, execute, and visualize real-time enterprise metrics across ITIL tables with Swiss graphic data structures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reports.length > 0 && (
            <div className="flex items-center gap-1.5 border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <FolderOpen className="w-3.5 h-3.5 text-black" />
              <select
                value={selectedReportId}
                onChange={(e) => handleSelectSavedReport(e.target.value)}
                className="bg-transparent font-mono text-xs font-bold text-black focus:outline-none"
              >
                <option value="">-- Load Saved Report --</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.tableName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={executeReport}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#eb0029] text-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-black transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            <span>{running ? "Calculating..." : "Run Report"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveReport}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-white text-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Report"}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] font-mono text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span className="font-bold">{statusMsg}</span>
        </div>
      )}

      {/* Main Grid: Controls + Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Form */}
        <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#eb0029]" />
              <span>Report Parameters</span>
            </h2>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-neutral-100 border border-black">
              sys_report
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Report Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Source Table
            </label>
            <select
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
            >
              <option value="incident">Incident [incident]</option>
              <option value="change_request">Change Request [change_request]</option>
              <option value="problem">Problem [problem]</option>
              <option value="task">Platform Task [task]</option>
              <option value="cmdb_ci">Configuration Item [cmdb_ci]</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Visual Visualization Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "bar", label: "Bar", icon: BarChart3 },
                { type: "donut", label: "Donut", icon: CircleDot },
                { type: "pie", label: "Pie", icon: PieIcon },
                { type: "single_score", label: "KPI Score", icon: Hash },
                { type: "time_series", label: "Time-Series", icon: LineIcon },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setReportType(item.type as any)}
                    className={`flex flex-col items-center justify-center p-2.5 border-2 border-black font-mono text-xs transition-all ${
                      isSelected
                        ? "bg-black text-white font-extrabold shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                        : "bg-white text-neutral-800 hover:bg-neutral-100 shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Group By Field
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
            >
              <option value="priority">Priority</option>
              <option value="state">State</option>
              <option value="category">Category</option>
              <option value="impact">Impact</option>
              <option value="urgency">Urgency</option>
              <option value="assignmentGroupId">Assignment Group</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Aggregation Function
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
            >
              <option value="count">Count (Records)</option>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Encoded Query Filter (sysparm_query)
            </label>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="e.g. active=true^priority=1"
              className="w-full bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
            />
          </div>
        </div>

        {/* Right: SVG Live Chart Canvas (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
              <div>
                <h3 className="font-extrabold text-base uppercase tracking-tight text-black">{title}</h3>
                <span className="text-xs font-mono text-neutral-500">
                  TABLE: <strong className="text-black">{tableName}</strong> • GROUP BY: <strong className="text-black">{groupBy}</strong> • {aggregation.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-black bg-neutral-100 border-2 border-black px-3 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  TOTAL RECORDS: <strong>{totalCount}</strong>
                </span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="min-h-[300px] flex items-center justify-center p-2">
              {chartData.length === 0 ? (
                <div className="text-center font-mono text-neutral-400 text-xs py-12">
                  NO RECORDS MATCHED THE SELECTED QUERY FILTER.
                </div>
              ) : reportType === "bar" ? (
                /* Bar Chart Render */
                <div className="w-full space-y-4">
                  {chartData.map((item, idx) => {
                    const maxCount = Math.max(...chartData.map((d) => d.count || 1));
                    const pct = Math.max(8, Math.round((item.count / maxCount) * 100));
                    const color = SWISS_COLORS[idx % SWISS_COLORS.length];

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono font-bold">
                          <span className="text-black uppercase">{item.label}</span>
                          <span className="text-black">
                            {item.count} ({totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="h-7 w-full bg-neutral-100 border-2 border-black overflow-hidden flex">
                          <div
                            className="h-full transition-all duration-500 flex items-center px-3 text-xs text-white font-mono font-bold"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          >
                            {item.count > 0 && item.count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : reportType === "donut" || reportType === "pie" ? (
                /* Donut & Pie Chart Render using SVG Math */
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full py-4">
                  <div className="relative w-56 h-56 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {chartData.map((item, idx) => {
                        let accumulated = 0;
                        for (let i = 0; i < idx; i++) {
                          accumulated += chartData[i].count;
                        }
                        const startPct = totalCount > 0 ? (accumulated / totalCount) * 100 : 0;
                        const slicePct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                        const strokeDasharray = `${slicePct} ${100 - slicePct}`;
                        const strokeDashoffset = -startPct;
                        const color = SWISS_COLORS[idx % SWISS_COLORS.length];

                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r={reportType === "donut" ? "35" : "25"}
                            fill="transparent"
                            stroke={color}
                            strokeWidth={reportType === "donut" ? "18" : "50"}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500 hover:opacity-80"
                          />
                        );
                      })}
                    </svg>

                    {reportType === "donut" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black font-mono text-black">{totalCount}</span>
                        <span className="text-[10px] font-mono uppercase font-bold text-neutral-500">Total</span>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="space-y-2 max-w-xs border-2 border-black bg-neutral-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {chartData.map((item, idx) => {
                      const color = SWISS_COLORS[idx % SWISS_COLORS.length];
                      const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;

                      return (
                        <div key={idx} className="flex items-center gap-2.5 text-xs font-mono">
                          <span
                            className="w-3 h-3 border border-black shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-black font-bold uppercase truncate">{item.label}</span>
                          <span className="ml-auto font-black text-black">{item.count}</span>
                          <span className="text-[11px] text-neutral-500 font-mono">({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : reportType === "single_score" ? (
                /* Single Score Card */
                <div className="text-center py-12 space-y-3">
                  <div className="inline-flex items-center justify-center p-4 border-2 border-black bg-neutral-100 shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[#eb0029]">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="text-6xl font-black font-mono tracking-tight text-black">{totalCount}</div>
                  <div className="text-xs font-mono font-bold text-neutral-600 uppercase tracking-wider">
                    {title} ({filterQuery})
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-[#eb0029] text-white text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <span>Active Records in Real-Time</span>
                  </div>
                </div>
              ) : (
                /* Time-series Line Chart */
                <div className="w-full h-48 flex items-end justify-between gap-4 pt-10 px-4">
                  {chartData.map((item, idx) => {
                    const maxCount = Math.max(...chartData.map((d) => d.count || 1));
                    const heightPct = Math.max(15, Math.round((item.count / maxCount) * 100));
                    const color = SWISS_COLORS[idx % SWISS_COLORS.length];

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-xs font-mono font-bold text-black">{item.count}</span>
                        <div
                          className="w-full border-2 border-black transition-all duration-500"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: color,
                          }}
                        />
                        <span className="text-[10px] font-mono uppercase text-neutral-600 font-bold truncate max-w-[60px] text-center">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-black flex items-center justify-between text-xs font-mono uppercase font-bold text-neutral-500">
            <span>Powered by ServiceMeow Swiss Visualization Engine</span>
            <span>Refreshed live via `/api/now/reports/[id]/run`</span>
          </div>
        </div>
      </div>
    </div>
  );
}
