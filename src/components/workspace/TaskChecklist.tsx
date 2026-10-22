"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  description?: string | null;
  isMandatory: boolean;
  isCompleted: boolean;
  order: number;
  completedAt?: string | null;
  completedById?: string | null;
  completedBy?: {
    id: string;
    name: string | null;
    userName: string;
  } | null;
}

interface TaskChecklistProps {
  taskId: string;
  isNew?: boolean;
  onIncompleteMandatoryChange?: (count: number) => void;
}

export function TaskChecklist({
  taskId,
  isNew = false,
  onIncompleteMandatoryChange,
}: TaskChecklistProps) {
  const { currentUser } = useUser();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  // Add Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMandatory, setNewMandatory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    if (isNew || !taskId || taskId === "new") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/now/table/task_checklist_item?sysparm_query=task_id=${taskId}`);
      if (!res.ok) throw new Error("Failed to load SOP checklist");
      const json = await res.json();
      const list = json.result || [];
      // Sort by order ascending
      list.sort((a: ChecklistItem, b: ChecklistItem) => (a.order || 0) - (b.order || 0));
      setItems(list);

      const incompleteMandatory = list.filter(
        (i: ChecklistItem) => i.isMandatory && !i.isCompleted
      ).length;
      if (onIncompleteMandatoryChange) {
        onIncompleteMandatoryChange(incompleteMandatory);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [taskId, isNew]);

  const handleToggleComplete = async (item: ChecklistItem) => {
    const nextState = !item.isCompleted;
    const now = nextState ? new Date().toISOString() : null;
    const completedById = nextState ? currentUser?.id : null;

    // Optimistic update
    const prevItems = [...items];
    const updated = items.map((i) =>
      i.id === item.id
        ? {
            ...i,
            isCompleted: nextState,
            completedAt: now,
            completedById: completedById || null,
            completedBy: nextState
              ? {
                  id: currentUser?.id || "",
                  name: currentUser?.name || currentUser?.userName || "Me",
                  userName: currentUser?.userName || "user",
                }
              : null,
          }
        : i
    );
    setItems(updated);

    const incompleteMandatory = updated.filter((i) => i.isMandatory && !i.isCompleted).length;
    if (onIncompleteMandatoryChange) {
      onIncompleteMandatoryChange(incompleteMandatory);
    }

    try {
      const res = await fetch(`/api/now/table/task_checklist_item/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          is_completed: nextState,
          completed_by_id: completedById,
          completed_at: now,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update checklist item");
      }
    } catch (err: any) {
      console.error("Toggle error:", err);
      // Revert optimistic update
      setItems(prevItems);
      setError(err.message);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    setError(null);

    const maxOrder = items.reduce((max, i) => Math.max(max, i.order || 0), 0);

    try {
      const res = await fetch(`/api/now/table/task_checklist_item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          task_id: taskId,
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          is_mandatory: newMandatory,
          order: maxOrder + 1,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create checklist item");
      }

      setNewTitle("");
      setNewDesc("");
      setNewMandatory(true);
      setIsAdding(false);
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this SOP step?")) return;
    try {
      const res = await fetch(`/api/now/table/task_checklist_item/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
      });
      if (!res.ok) throw new Error("Failed to delete checklist item");
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.isCompleted).length;
  const mandatoryItems = items.filter((i) => i.isMandatory);
  const incompleteMandatory = mandatoryItems.filter((i) => !i.isCompleted).length;
  const percentComplete = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (isNew) {
    return (
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-neutral-600" />
          <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider">
            Standard Operating Procedure (SOP) Checklist
          </h3>
        </div>
        <p className="text-xs font-mono text-neutral-500">
          Save this record first to configure mandatory SOP steps and resolution gatekeeper rules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Swiss Header Card */}
      <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                SOP GATEKEEPER
              </span>
              <span className="font-mono text-xs uppercase font-bold text-neutral-500">
                Resolution Compliance
              </span>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black mt-1">
              Standard Operating Procedure (SOP) Checklist
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-2xl font-black text-black">
                {completedItems}/{totalItems}
              </div>
              <div className="font-mono text-[10px] uppercase text-neutral-500">
                {percentComplete}% Completed
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-2 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? "Cancel" : "Add Step"}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-neutral-200 h-3 border border-black overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                incompleteMandatory > 0 ? "bg-amber-500" : "bg-emerald-600"
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Gatekeeper Status Notice */}
        {incompleteMandatory > 0 ? (
          <div className="mt-4 p-3 bg-red-50 border-2 border-red-600 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-extrabold uppercase text-red-700">
                Resolution Gatekeeper Active ({incompleteMandatory} Mandatory{" "}
                {incompleteMandatory === 1 ? "Step" : "Steps"} Remaining)
              </div>
              <p className="text-xs text-red-900 mt-0.5 leading-relaxed">
                This record cannot be marked <strong>Resolved</strong> or <strong>Closed</strong> until
                all mandatory SOP items are verified and marked complete. Any resolution attempt will be
                rejected by the API gatekeeper.
              </p>
            </div>
          </div>
        ) : totalItems > 0 ? (
          <div className="mt-4 p-3 bg-emerald-50 border-2 border-emerald-600 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-mono text-xs font-extrabold uppercase text-emerald-800">
                SOP Gatekeeper Satisfied
              </div>
              <p className="text-xs text-emerald-900">
                All mandatory verification criteria have been met. Record may be transitioned to Resolved or Closed.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Inline Form to Add SOP Step */}
      {isAdding && (
        <form
          onSubmit={handleCreateItem}
          className="border-2 border-black bg-neutral-50 p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4"
        >
          <div className="font-mono text-xs font-extrabold uppercase text-black">
            + Define New SOP Verification Step
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Step Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Verify Database Replica Lag < 10ms"
                className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Detailed Verification Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Specific instructions, queries to run, or confirmation links"
                className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isMandatory"
                checked={newMandatory}
                onChange={(e) => setNewMandatory(e.target.checked)}
                className="w-4 h-4 rounded-none border-2 border-black text-black focus:ring-black"
              />
              <label
                htmlFor="isMandatory"
                className="font-mono text-xs font-bold uppercase text-black cursor-pointer select-none"
              >
                Mandatory for Resolution (Gatekeeper Enforcement)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-300">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-black font-mono text-xs font-bold uppercase hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Save Step"}
            </button>
          </div>
        </form>
      )}

      {/* Checklist Items List */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] divide-y-2 divide-neutral-200">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-500">
            Loading SOP Checklist items...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-500 space-y-2">
            <div>No SOP checklist items defined for this task.</div>
            <p className="text-[11px] text-neutral-400">
              Click &quot;Add Step&quot; above to add mandatory verification criteria.
            </p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                item.isCompleted ? "bg-neutral-50/60" : "hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(item)}
                  className="mt-0.5 p-1 hover:bg-neutral-200 cursor-pointer transition-colors"
                  title={item.isCompleted ? "Mark incomplete" : "Mark complete"}
                >
                  {item.isCompleted ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-400 shrink-0" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-neutral-500">
                      #{idx + 1}
                    </span>
                    <span
                      className={`font-mono text-xs font-extrabold ${
                        item.isCompleted ? "line-through text-neutral-500" : "text-black"
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.isMandatory ? (
                      <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-red-600 text-white tracking-widest">
                        MANDATORY
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 bg-neutral-200 text-neutral-700 tracking-wider">
                        OPTIONAL
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        item.isCompleted ? "text-neutral-400" : "text-neutral-600"
                      }`}
                    >
                      {item.description}
                    </p>
                  )}

                  {item.isCompleted && item.completedAt && (
                    <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-emerald-700">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>
                        Verified by{" "}
                        <strong className="font-bold">
                          {item.completedBy?.name || item.completedBy?.userName || "Staff"}
                        </strong>{" "}
                        on {new Date(item.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                title="Remove SOP Step"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
