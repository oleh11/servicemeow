"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Filter,
  RefreshCw,
  Plus,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Clock,
  User,
  ShieldAlert,
  Search,
  CheckCircle2,
} from "lucide-react";

interface TaskItem {
  id: string;
  number: string;
  sysClassName: string;
  shortDescription: string;
  priority: number;
  state: number;
  assignedTo?: { name: string; email: string };
  openedBy?: { name: string };
  createdAt: string;
}

const STATE_COLUMNS = [
  { id: 1, label: "New", color: "border-blue-500", badge: "bg-blue-100 text-blue-800" },
  { id: 2, label: "In Progress", color: "border-purple-500", badge: "bg-purple-100 text-purple-800" },
  { id: 3, label: "On Hold", color: "border-amber-500", badge: "bg-amber-100 text-amber-800" },
  { id: 6, label: "Resolved", color: "border-emerald-500", badge: "bg-emerald-100 text-emerald-800" },
  { id: 7, label: "Closed", color: "border-slate-400", badge: "bg-slate-100 text-slate-700" },
];

const PRIORITY_COLUMNS = [
  { id: 1, label: "P1 - Critical", color: "border-rose-600", badge: "bg-rose-100 text-rose-800 font-bold" },
  { id: 2, label: "P2 - High", color: "border-orange-500", badge: "bg-orange-100 text-orange-800 font-bold" },
  { id: 3, label: "P3 - Moderate", color: "border-amber-500", badge: "bg-amber-100 text-amber-800" },
  { id: 4, label: "P4 - Low", color: "border-emerald-500", badge: "bg-emerald-100 text-emerald-800" },
  { id: 5, label: "P5 - Planning", color: "border-slate-400", badge: "bg-slate-100 text-slate-700" },
];

export default function VisualTaskBoardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"state" | "priority">("state");
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/table/task?sysparm_limit=100");
      if (res.ok) {
        const json = await res.json();
        setTasks(json.result || []);
      }
    } catch (e) {
      console.error("Error loading task board:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTaskState = async (task: TaskItem, newState: number) => {
    setUpdatingTaskId(task.id);
    try {
      const table = task.sysClassName || "task";
      const res = await fetch(`/api/now/table/${table}/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, state: newState } : t))
        );
      }
    } catch (e) {
      console.error("Error moving task:", e);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleMoveTaskPriority = async (task: TaskItem, newPriority: number) => {
    setUpdatingTaskId(task.id);
    try {
      const table = task.sysClassName || "task";
      const res = await fetch(`/api/now/table/${table}/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, priority: newPriority } : t))
        );
      }
    } catch (e) {
      console.error("Error updating priority:", e);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesClass = classFilter === "all" || t.sysClassName === classFilter;
    if (!search.trim()) return matchesClass;
    const q = search.toLowerCase();
    return (
      matchesClass &&
      (t.number.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        (t.assignedTo?.name || "").toLowerCase().includes(q))
    );
  });

  const columns = groupBy === "state" ? STATE_COLUMNS : PRIORITY_COLUMNS;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-100 min-h-screen text-black font-sans">
      {/* Swiss Header Bar */}
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase font-extrabold px-2 py-0.5 bg-black text-white">
              TRIAGE
            </span>
            <span className="font-mono text-xs uppercase font-bold text-neutral-500">
              03 / Visual Task Board
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-black">
            Visual Task Board (VTB)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
            Real-time interactive Kanban swimlanes for operations triage, ticket status progression, and priority balancing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Group By */}
          <div className="flex items-center border-2 border-black bg-white p-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs">
            <button
              onClick={() => setGroupBy("state")}
              className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors ${
                groupBy === "state"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              By State
            </button>
            <button
              onClick={() => setGroupBy("priority")}
              className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors ${
                groupBy === "priority"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              By Priority
            </button>
          </div>

          <button
            onClick={loadTasks}
            className="p-2 border-2 border-black bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors"
            title="Refresh Board"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Class Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["all", "incident", "change_request", "problem", "task"].map((cls) => {
            const count = cls === "all" ? tasks.length : tasks.filter((t) => t.sysClassName === cls).length;
            const label =
              cls === "all"
                ? "All Records"
                : cls === "incident"
                ? "Incidents"
                : cls === "change_request"
                ? "Changes"
                : cls === "problem"
                ? "Problems"
                : "Tasks";
            return (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 whitespace-nowrap border-2 ${
                  classFilter === cls
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-600 border-neutral-300 hover:border-black hover:text-black"
                }`}
              >
                <span>{label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number, title, assignee..."
            className="w-full bg-white border-2 border-black pl-8 pr-3 py-1.5 text-xs text-black font-medium focus:outline-none focus:border-red-600 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {columns.map((col, colIndex) => {
          const colTasks = filteredTasks.filter((t) =>
            groupBy === "state" ? t.state === col.id : t.priority === col.id
          );

          return (
            <div
              key={col.id}
              className={`bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col max-h-[82vh] overflow-hidden`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold font-mono text-xs uppercase text-black">{col.label}</h3>
                  <span className={`text-[10px] px-2 py-0.2 font-mono font-bold border border-black ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 italic">
                    No tickets in this lane
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const isUpdating = updatingTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`p-3 bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all space-y-2 relative group ${
                          isUpdating ? "opacity-40 pointer-events-none" : ""
                        }`}
                      >
                        {/* Header: Class Badge & Number */}
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/workspace/${t.sysClassName || "task"}/${t.id}`}
                            className="font-mono text-xs font-bold text-red-600 hover:text-black flex items-center gap-1"
                          >
                            <span>{t.number}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-neutral-400 group-hover:text-black" />
                          </Link>

                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-neutral-100 text-neutral-800 font-bold border border-neutral-300">
                            {t.sysClassName}
                          </span>
                        </div>

                        {/* Title */}
                        <p className="text-xs text-black font-bold line-clamp-2 leading-snug">
                          {t.shortDescription}
                        </p>

                        {/* Priority & Assignee Info */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[10px] text-neutral-600">
                          <span
                            className={`px-1.5 py-0.5 font-mono font-bold border ${
                              t.priority === 1
                                ? "bg-red-600 text-white border-red-600"
                                : t.priority === 2
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-neutral-100 text-neutral-700 border-neutral-300"
                            }`}
                          >
                            P{t.priority}
                          </span>

                          <div className="flex items-center gap-1 text-neutral-700 truncate max-w-[120px] font-mono">
                            <User className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{t.assignedTo?.name || "Unassigned"}</span>
                          </div>
                        </div>

                        {/* Quick State/Priority Move Controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[10px]">
                          {groupBy === "state" ? (
                            <>
                              <button
                                type="button"
                                disabled={colIndex === 0}
                                onClick={() =>
                                  handleMoveTaskState(t, STATE_COLUMNS[colIndex - 1].id)
                                }
                                className="px-1.5 py-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-20 flex items-center gap-0.5"
                                title="Move Left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Prev</span>
                              </button>
                              <button
                                type="button"
                                disabled={colIndex === STATE_COLUMNS.length - 1}
                                onClick={() =>
                                  handleMoveTaskState(t, STATE_COLUMNS[colIndex + 1].id)
                                }
                                className="px-1.5 py-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-20 flex items-center gap-0.5"
                                title="Move Right"
                              >
                                <span>Next</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={colIndex === 0}
                                onClick={() =>
                                  handleMoveTaskPriority(t, PRIORITY_COLUMNS[colIndex - 1].id)
                                }
                                className="px-1.5 py-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-20 flex items-center gap-0.5"
                                title="Escalate Priority"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Higher</span>
                              </button>
                              <button
                                type="button"
                                disabled={colIndex === PRIORITY_COLUMNS.length - 1}
                                onClick={() =>
                                  handleMoveTaskPriority(t, PRIORITY_COLUMNS[colIndex + 1].id)
                                }
                                className="px-1.5 py-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-20 flex items-center gap-0.5"
                                title="Lower Priority"
                              >
                                <span>Lower</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
