"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Flame,
  MessageSquare,
  UserCheck,
  Calendar,
  Filter,
  Check,
  AlertCircle,
  ExternalLink,
  Layers,
  Server,
  Database,
  HardDrive,
  Wifi,
  AppWindow,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

export interface MorningCheckItem {
  id: string;
  checkDate: string;
  shift: "MORNING" | "AFTERNOON" | "NIGHT";
  category: "DATACENTER" | "BACKUP" | "DATABASE" | "NETWORK" | "APPLICATION";
  title: string;
  status: "PENDING" | "PASS" | "DEGRADED" | "FAIL";
  notes?: string | null;
  inspectedById?: string | null;
  inspectedAt?: string | null;
  incidentId?: string | null;
  inspectedBy?: {
    id: string;
    name: string | null;
    userName: string;
  } | null;
  incident?: {
    id: string;
    task?: {
      number: string;
      shortDescription: string;
      state: number;
    } | null;
  } | null;
}

const CATEGORIES = [
  { value: "ALL", label: "All Categories", icon: Layers },
  { value: "DATACENTER", label: "Datacenter & Facilities", icon: Server },
  { value: "DATABASE", label: "Database Clusters", icon: Database },
  { value: "BACKUP", label: "Disaster Recovery & Backup", icon: HardDrive },
  { value: "NETWORK", label: "Network & SD-WAN", icon: Wifi },
  { value: "APPLICATION", label: "Business Applications", icon: AppWindow },
];

const SHIFTS = [
  { value: "ALL", label: "All Shifts" },
  { value: "MORNING", label: "Morning Shift (07:00 - 15:00)" },
  { value: "AFTERNOON", label: "Afternoon Shift (15:00 - 23:00)" },
  { value: "NIGHT", label: "Night Shift (23:00 - 07:00)" },
];

export function MorningChecksConsole() {
  const { currentUser } = useUser();
  const [checks, setChecks] = useState<MorningCheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Create Check Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("DATACENTER");
  const [newShift, setNewShift] = useState<string>("MORNING");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Notes Modal
  const [editingNoteCheck, setEditingNoteCheck] = useState<MorningCheckItem | null>(null);
  const [noteText, setNoteText] = useState("");

  // Toast
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const fetchChecks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedShift !== "ALL") params.append("shift", selectedShift);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);

      const res = await fetch(`/api/now/morning-checks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load shift operational checks");
      const json = await res.json();
      setChecks(json.checks || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, [selectedDate, selectedShift, selectedCategory]);

  const handleUpdateStatus = async (
    check: MorningCheckItem,
    status: "PASS" | "DEGRADED" | "FAIL"
  ) => {
    const prevChecks = [...checks];
    const now = new Date().toISOString();

    // Optimistic update
    setChecks(
      checks.map((c) =>
        c.id === check.id
          ? {
              ...c,
              status,
              inspectedAt: now,
              inspectedById: currentUser?.id || null,
              inspectedBy: {
                id: currentUser?.id || "",
                name: currentUser?.name || currentUser?.userName || "Me",
                userName: currentUser?.userName || "user",
              },
            }
          : c
      )
    );

    try {
      const res = await fetch(`/api/now/morning-checks/${check.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          status,
          inspectedById: currentUser?.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      showToast(`Recorded ${status} for "${check.title}"`);
    } catch (err: any) {
      console.error(err);
      setChecks(prevChecks);
      setError(err.message);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNoteCheck) return;
    try {
      const res = await fetch(`/api/now/morning-checks/${editingNoteCheck.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          notes: noteText.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update notes");
      showToast("Check notes saved");
      setEditingNoteCheck(null);
      await fetchChecks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEscalateToIncident = async (check: MorningCheckItem) => {
    if (!confirm(`Create high-priority Incident for failed round "${check.title}"?`)) return;

    try {
      const res = await fetch(`/api/now/morning-checks/${check.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          escalateToIncident: true,
          incidentPayload: {
            short_description: `[Morning Check Failure]: ${check.title}`,
            description: `Automated escalation from shift operational rounds.\nShift: ${check.shift}\nCategory: ${check.category}\nInspection Notes: ${check.notes || "None entered."}\nReported by: ${currentUser?.name || "Operations Staff"}`,
            priority: check.status === "FAIL" ? 1 : 2,
            impact: check.status === "FAIL" ? 1 : 2,
            urgency: 1,
            category: check.category.toLowerCase(),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to escalate check to incident");
      const json = await res.json();
      showToast(
        `Incident ${json.incident?.task?.number || "created"} successfully escalated!`
      );
      await fetchChecks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/now/morning-checks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          shift: newShift,
          checkDate: selectedDate,
          status: "PENDING",
          notes: newNotes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create operational check");
      setIsCreateOpen(false);
      setNewTitle("");
      setNewNotes("");
      showToast("Operational round item added");
      await fetchChecks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const total = checks.length;
  const passCount = checks.filter((c) => c.status === "PASS").length;
  const degradedCount = checks.filter((c) => c.status === "DEGRADED").length;
  const failCount = checks.filter((c) => c.status === "FAIL").length;
  const pendingCount = checks.filter((c) => c.status === "PENDING").length;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-100 min-h-screen text-black font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-mono text-xs text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Swiss Header Bar */}
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase font-extrabold px-2 py-0.5 bg-black text-white">
              ROUNDS &amp; AUDITS
            </span>
            <span className="font-mono text-xs uppercase font-bold text-neutral-500">
              Infrastructure Operations Checklist
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-black">
            Shift Operational Rounds
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
            Shift-based infrastructure readiness verification across Datacenter, Cloud, Backup, Database, and Network clusters. Includes 1-click incident escalation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchChecks}
            className="px-3 py-2 border-2 border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shift Round Check</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border-2 border-red-600 bg-red-50 text-red-900 font-mono text-xs">
          {error}
        </div>
      )}

      {/* Summary Scoreboard Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase">
            Total Checks
          </div>
          <div className="font-mono text-3xl font-black text-black mt-1">{total}</div>
        </div>

        <div className="border-2 border-emerald-600 bg-emerald-50 p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="font-mono text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Passing (Nominal)</span>
          </div>
          <div className="font-mono text-3xl font-black text-emerald-700 mt-1">
            {passCount}
          </div>
        </div>

        <div className="border-2 border-amber-500 bg-amber-50 p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="font-mono text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Degraded Attention</span>
          </div>
          <div className="font-mono text-3xl font-black text-amber-600 mt-1">
            {degradedCount}
          </div>
        </div>

        <div className="border-2 border-red-600 bg-red-50 p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="font-mono text-[10px] font-bold text-red-800 uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Critical Failures</span>
          </div>
          <div className="font-mono text-3xl font-black text-red-600 mt-1">{failCount}</div>
        </div>

        <div className="border-2 border-neutral-300 bg-white p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>Pending Inspection</span>
          </div>
          <div className="font-mono text-3xl font-black text-neutral-600 mt-1">
            {pendingCount}
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-black" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-black px-2.5 py-1 font-mono text-xs bg-white text-black focus:outline-none"
            />
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-1">
            {SHIFTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSelectedShift(s.value)}
                className={`px-2.5 py-1 font-mono text-xs font-bold uppercase transition-colors ${
                  selectedShift === s.value
                    ? "bg-black text-white"
                    : "border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                {s.value}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedCategory(c.value)}
                className={`flex items-center gap-1 px-2.5 py-1 font-mono text-xs font-bold uppercase transition-colors ${
                  selectedCategory === c.value
                    ? "bg-black text-white"
                    : "border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Checks Table / Cards */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] divide-y-2 divide-neutral-200">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-500">
            Loading shift operational checks...
          </div>
        ) : checks.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-500 space-y-2">
            <div>Zero checks found for selected criteria.</div>
            <p className="text-[11px] text-neutral-400">
              Click &quot;Add Shift Round Check&quot; to initialize shift inspection items.
            </p>
          </div>
        ) : (
          checks.map((chk) => (
            <div
              key={chk.id}
              className={`p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                chk.status === "FAIL"
                  ? "bg-red-50/70 border-l-8 border-l-red-600"
                  : chk.status === "DEGRADED"
                  ? "bg-amber-50/60 border-l-8 border-l-amber-500"
                  : chk.status === "PASS"
                  ? "bg-white hover:bg-neutral-50 border-l-8 border-l-emerald-600"
                  : "bg-white hover:bg-neutral-50 border-l-8 border-l-neutral-300"
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                    {chk.category}
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800">
                    {chk.shift}
                  </span>

                  {chk.status === "PASS" ? (
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white">
                      PASS
                    </span>
                  ) : chk.status === "DEGRADED" ? (
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500 text-black">
                      DEGRADED
                    </span>
                  ) : chk.status === "FAIL" ? (
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white">
                      FAIL
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-700">
                      PENDING
                    </span>
                  )}

                  {chk.incident && (
                    <Link
                      href={`/workspace/incident/${chk.incident.id}`}
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-red-700 text-white hover:underline"
                    >
                      <span>
                        INCIDENT: {chk.incident.task?.number || chk.incident.id}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className="font-mono text-sm font-black text-black">{chk.title}</div>

                {chk.notes && (
                  <p className="text-xs text-neutral-700 font-mono bg-white/70 border border-neutral-300 p-2 max-w-2xl">
                    {chk.notes}
                  </p>
                )}

                {chk.inspectedBy && chk.inspectedAt && (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500 pt-1">
                    <UserCheck className="w-3.5 h-3.5 text-neutral-700" />
                    <span>
                      Inspected by{" "}
                      <strong>{chk.inspectedBy.name || chk.inspectedBy.userName}</strong> on{" "}
                      {new Date(chk.inspectedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Fast Status Toggles */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(chk, "PASS")}
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border transition-colors cursor-pointer ${
                    chk.status === "PASS"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300"
                  }`}
                >
                  Pass
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(chk, "DEGRADED")}
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border transition-colors cursor-pointer ${
                    chk.status === "DEGRADED"
                      ? "bg-amber-500 text-black border-amber-600 shadow-xs"
                      : "bg-white hover:bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  Degraded
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(chk, "FAIL")}
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border transition-colors cursor-pointer ${
                    chk.status === "FAIL"
                      ? "bg-red-600 text-white border-red-700 shadow-xs"
                      : "bg-white hover:bg-red-50 text-red-800 border-red-300"
                  }`}
                >
                  Fail
                </button>

                {/* Notes Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingNoteCheck(chk);
                    setNoteText(chk.notes || "");
                  }}
                  className="px-2.5 py-1.5 border border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                  title="Add or edit inspection notes"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Notes</span>
                </button>

                {/* Escalate Button (enabled for Degraded or Fail if not already escalated) */}
                {(chk.status === "FAIL" || chk.status === "DEGRADED") && !chk.incidentId && (
                  <button
                    type="button"
                    onClick={() => handleEscalateToIncident(chk)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                    title="1-Click Create Linked P1/P2 Incident"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Escalate</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Create New Operational Round Check */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateCheck}
            className="w-full max-w-lg border-2 border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black space-y-4"
          >
            <div className="border-b-2 border-black pb-3 flex justify-between items-center">
              <h3 className="font-mono text-sm font-black uppercase text-black">
                + Add Shift Operational Round Item
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="font-mono text-xs font-bold px-2 py-1 hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  Check Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Verify Primary Core Switch BGP Peering"
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white text-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white text-black focus:outline-none"
                  >
                    <option value="DATACENTER">Datacenter</option>
                    <option value="DATABASE">Database</option>
                    <option value="BACKUP">Backup</option>
                    <option value="NETWORK">Network</option>
                    <option value="APPLICATION">Application</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                    Shift *
                  </label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white text-black focus:outline-none"
                  >
                    <option value="MORNING">Morning (07:00 - 15:00)</option>
                    <option value="AFTERNOON">Afternoon (15:00 - 23:00)</option>
                    <option value="NIGHT">Night (23:00 - 07:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  Initial Notes / Inspection Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Commands, threshold values, or links to verify..."
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white text-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-300">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 border border-black font-mono text-xs font-bold uppercase hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase disabled:opacity-50"
              >
                {creating ? "Saving..." : "Add Check"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edit Notes */}
      {editingNoteCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-black space-y-4">
            <div className="border-b-2 border-black pb-3 flex justify-between items-center">
              <h3 className="font-mono text-sm font-black uppercase text-black">
                Inspection Notes // {editingNoteCheck.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNoteCheck(null)}
                className="font-mono text-xs font-bold px-2 py-1 hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Technician Observations &amp; Evidence
              </label>
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter diagnostic details, ping latency, disk percentages..."
                className="w-full border-2 border-black p-2 font-mono text-xs bg-white text-black focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-300">
              <button
                type="button"
                onClick={() => setEditingNoteCheck(null)}
                className="px-3 py-1.5 border border-black font-mono text-xs font-bold uppercase hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
