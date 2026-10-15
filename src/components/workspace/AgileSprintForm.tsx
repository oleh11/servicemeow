"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  Flame,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface AgileSprintFormProps {
  recordId: string; // "new" or cuid
}

export function AgileSprintForm({ recordId }: AgileSprintFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sprint Fields
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"planning" | "active" | "closed">("planning");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [capacityPoints, setCapacityPoints] = useState<number>(45);
  const [goal, setGoal] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/now/table/rm_sprint/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const sp = data.result;
            setNumber(sp.number || "");
            setName(sp.name || "");
            setState(sp.state || "planning");
            setStartDate(sp.startDate || sp.start_date || "");
            setEndDate(sp.endDate || sp.end_date || "");
            setCapacityPoints(sp.capacityPoints || sp.capacity_points || 45);
            setGoal(sp.goal || "");
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Sprint name is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      name: name.trim(),
      state,
      start_date: startDate,
      end_date: endDate,
      capacity_points: Number(capacityPoints),
      goal: goal.trim(),
    };

    try {
      const url = isNew ? "/api/now/table/rm_sprint" : `/api/now/table/rm_sprint/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save sprint");
      }

      const data = await res.json();
      showToast(isNew ? "Sprint created successfully" : "Sprint updated");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/rm_sprint/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Sprint '${name}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/rm_sprint/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/agile");
    } catch (err: any) {
      alert(err.message || "Could not delete sprint");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-black">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING SPRINT SPECIFICATION...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-black selection:bg-[#eb0029] selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-mono text-xs text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Top Swiss Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-black bg-white px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/workspace/agile"
            className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
            title="Back to Agile Board"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                SPRINT // rm_sprint
              </span>
              <span className="h-1 w-1 bg-black" />
              <span className="font-mono text-xs font-black uppercase text-black">
                {isNew ? "NEW SPRINT TIMEBOX" : `${number} // ${name}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-xs font-bold uppercase text-red-600 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex h-9 items-center gap-2 border-2 border-black bg-black px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-[#eb0029] hover:text-white transition-all disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "SAVING..." : isNew ? "CREATE SPRINT" : "SAVE SPEC"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="mx-auto max-w-4xl p-6">
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 border-2 border-black bg-red-100 p-4 font-mono text-xs text-red-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-black" />
              <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                Sprint Timebox & Capacity Parameters
              </h2>
            </div>
            {number && <span className="font-mono text-xs font-bold text-neutral-600">{number}</span>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Sprint Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sprint 26.3 - Core Infrastructure"
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Sprint Status
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value as any)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="planning">Planning / Upcoming</option>
                  <option value="active">Active (Current Sprint)</option>
                  <option value="closed">Closed / Retrospective Done</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Target Capacity Points
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={capacityPoints}
                  onChange={(e) => setCapacityPoints(Number(e.target.value))}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Sprint Goal & Deliverables
              </label>
              <textarea
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Key outcomes to deliver during this 2-week cycle..."
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
