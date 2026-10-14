"use client";

import React, { useState, useEffect } from "react";
import {
  GitPullRequest,
  AlertTriangle,
  CheckCircle,
  Plus,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  X,
  Layers,
} from "lucide-react";

interface ChangeTask {
  id: string;
  number: string;
  shortDescription: string;
  changeRequestId: string;
  state: string; // "pending" | "open" | "work_in_progress" | "closed_complete" | "closed_skipped"
  sequence: number;
  assignedTo?: { id: string; name: string; email: string };
  assignedToId?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

interface ChangeConflict {
  id: string;
  changeId: string;
  conflictType: string; // "blackout_period" | "maintenance_window_overlap" | "ci_schedule_collision"
  conflictDescription: string;
  conflictingChangeId?: string;
  status: string; // "detected" | "acknowledged" | "resolved"
}

interface ChangeTasksListProps {
  changeRequestId: string;
  changeState?: number;
  onGatingChange?: (canClose: boolean, openTasksCount: number) => void;
}

export function ChangeTasksList({
  changeRequestId,
  changeState,
  onGatingChange,
}: ChangeTasksListProps) {
  const [tasks, setTasks] = useState<ChangeTask[]>([]);
  const [conflicts, setConflicts] = useState<ChangeConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // New CTASK form fields
  const [shortDesc, setShortDesc] = useState("");
  const [sequence, setSequence] = useState(1);

  useEffect(() => {
    if (changeRequestId && changeRequestId !== "new") {
      fetchTasksAndConflicts();
    }
  }, [changeRequestId]);

  const fetchTasksAndConflicts = async () => {
    setLoading(true);
    try {
      const [tasksRes, conflictsRes] = await Promise.all([
        fetch(`/api/now/change-tasks?change_request_id=${changeRequestId}`),
        fetch(`/api/now/change-conflicts?change_id=${changeRequestId}`),
      ]);

      if (tasksRes.ok) {
        const json = await tasksRes.json();
        const tList: ChangeTask[] = json.result || [];
        setTasks(tList);

        const openCount = tList.filter(
          (t) => !["closed_complete", "closed_skipped"].includes(t.state)
        ).length;
        if (onGatingChange) {
          onGatingChange(openCount === 0, openCount);
        }
      }

      if (conflictsRes.ok) {
        const json = await conflictsRes.json();
        setConflicts(json.result || []);
      }
    } catch (err) {
      console.error("Failed to load change tasks or conflicts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortDesc.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/now/change-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeRequestId,
          shortDescription: shortDesc,
          sequence: Number(sequence) || tasks.length + 1,
        }),
      });

      if (res.ok) {
        setShortDesc("");
        setShowAddModal(false);
        await fetchTasksAndConflicts();
      }
    } catch (e) {
      console.error("Failed to create change task:", e);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateTaskState = async (taskId: string, newState: string) => {
    try {
      const res = await fetch(`/api/now/change-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (res.ok) {
        await fetchTasksAndConflicts();
      }
    } catch (e) {
      console.error("Failed to update task state:", e);
    }
  };

  const openTasksCount = tasks.filter(
    (t) => !["closed_complete", "closed_skipped"].includes(t.state)
  ).length;

  return (
    <div className="space-y-4">
      {/* Change Conflicts Banner (M3 High-Severity Container) */}
      {conflicts.length > 0 && (
        <div
          className="p-4 rounded-[16px] border flex items-start gap-3 text-xs shadow-xs"
          style={{
            backgroundColor: "#fffbfa",
            borderColor: "var(--md-sys-color-error, #ba1a1a)",
            color: "#410002",
          }}
        >
          <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-error,#ba1a1a)] shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm tracking-tight text-red-950">
                Change Schedule Collisions Detected ({conflicts.length})
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 text-red-900 font-bold">
                CAB Warning
              </span>
            </div>
            {conflicts.map((c) => (
              <p key={c.id} className="text-slate-700">
                • <strong>{c.conflictType.replace(/_/g, " ").toUpperCase()}:</strong> {c.conflictDescription}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* CTASK Closure Gate Warning */}
      {openTasksCount > 0 && (
        <div className="p-3.5 rounded-[12px] bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>CAB Governance Gate:</strong> {openTasksCount} Change Task(s) remaining open. This Change Request cannot be closed until all CTASKs are completed.
            </span>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 bg-amber-200 rounded font-bold">
            GATED
          </span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Change Tasks (change_task)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {tasks.length} Total
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTasksAndConflicts}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Change Task</span>
          </button>
        </div>
      </div>

      {/* CTASKs Table */}
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl italic">
          No change tasks (CTASKs) registered for this change request yet.
        </div>
      ) : (
        <div className="border rounded-[14px] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b">
              <tr>
                <th className="p-3 w-12 text-center">Seq</th>
                <th className="p-3">Number</th>
                <th className="p-3">Short Description</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">State</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[11px]">
              {tasks.map((task) => {
                const isComplete = ["closed_complete", "closed_skipped"].includes(task.state);

                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{task.sequence}</td>
                    <td className="p-3 font-mono font-bold text-purple-700">{task.number}</td>
                    <td className="p-3 text-slate-800 font-medium">{task.shortDescription}</td>
                    <td className="p-3 text-slate-600">
                      {task.assignedTo?.name || "Unassigned"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          task.state === "closed_complete"
                            ? "bg-emerald-100 text-emerald-800"
                            : task.state === "work_in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.state === "closed_complete" && <CheckCircle className="w-3 h-3" />}
                        {task.state.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {!isComplete && (
                        <div className="inline-flex items-center gap-1.5">
                          {task.state !== "work_in_progress" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskState(task.id, "work_in_progress")}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            >
                              Start
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateTaskState(task.id, "closed_complete")}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add CTASK Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md p-6 rounded-[20px] border shadow-2xl space-y-4"
            style={{
              backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
              borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900">Add Change Task (CTASK)</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Task Short Description *
                </label>
                <input
                  type="text"
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="e.g. Verify database replica sync and backup"
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-800 focus:outline-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Execution Sequence</label>
                <input
                  type="number"
                  min="1"
                  value={sequence}
                  onChange={(e) => setSequence(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-800 focus:outline-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 shadow-xs"
                >
                  {adding ? "Creating..." : "Save CTASK"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
