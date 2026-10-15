"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Send,
  HelpCircle,
  Check,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface ProblemFormProps {
  recordId: string; // "new" or cuid
}

const PROBLEM_STATES = [
  { value: 1, label: "1 - New / Unassigned" },
  { value: 2, label: "2 - Assessing / Root Cause Investigation" },
  { value: 3, label: "3 - Workaround Established" },
  { value: 4, label: "4 - Known Error (KEDB)" },
  { value: 6, label: "6 - Resolved / Permanent Fix Deployed" },
  { value: 7, label: "7 - Closed" },
];

export function ProblemForm({ recordId }: ProblemFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Base Task Fields
  const [number, setNumber] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<number>(1);
  const [impact, setImpact] = useState<number>(2);
  const [urgency, setUrgency] = useState<number>(2);
  const [priority, setPriority] = useState<number>(3);
  const [assignedToId, setAssignedToId] = useState("");
  const [assignmentGroupId, setAssignmentGroupId] = useState("");
  const [cmdbCiId, setCmdbCiId] = useState("");

  // Problem Specific Fields
  const [rootCause, setRootCause] = useState("");
  const [workaround, setWorkaround] = useState("");
  const [isKnownError, setIsKnownError] = useState(false);

  // Lookups & Relations
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [cis, setCis] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activityNotes, setActivityNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const calculatePriority = (imp: number, urg: number) => {
    if (imp === 1 && urg === 1) return 1;
    if ((imp === 1 && urg === 2) || (imp === 2 && urg === 1)) return 2;
    if (imp === 3 && urg === 3) return 4;
    return 3;
  };

  const handleImpactChange = (val: number) => {
    setImpact(val);
    setPriority(calculatePriority(val, urgency));
  };

  const handleUrgencyChange = (val: number) => {
    setUrgency(val);
    setPriority(calculatePriority(impact, val));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/now/table/sys_user").then((r) => r.json()),
      fetch("/api/now/table/sys_user_group").then((r) => r.json()),
      fetch("/api/now/table/cmdb_ci").then((r) => r.json()),
    ]).then(([uData, gData, ciData]) => {
      if (uData.result) setUsers(uData.result);
      if (gData.result) setGroups(gData.result);
      if (ciData.result) setCis(ciData.result);
    });

    if (!isNew) {
      fetch(`/api/now/table/problem/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const p = data.result;
            setNumber(p.number || "");
            setShortDescription(p.shortDescription || p.short_description || "");
            setDescription(p.description || "");
            setState(p.state ? Number(p.state) : 1);
            setImpact(p.impact ? Number(p.impact) : 2);
            setUrgency(p.urgency ? Number(p.urgency) : 2);
            setPriority(p.priority ? Number(p.priority) : 3);
            setAssignedToId(p.assignedToId || p.assigned_to?.value || "");
            setAssignmentGroupId(p.assignmentGroupId || p.assignment_group?.value || "");
            setCmdbCiId(p.cmdbCiId || p.cmdb_ci_id?.value || "");

            // Problem details
            setRootCause(p.rootCause || p.root_cause || "");
            setWorkaround(p.workaround || "");
            setIsKnownError(p.isKnownError !== undefined ? p.isKnownError : Boolean(p.is_known_error));

            if (p.problem?.incidents) setIncidents(p.problem.incidents);
            if (p.activityNotes) setActivityNotes(p.activityNotes);
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortDescription.trim()) {
      setErrorMsg("Short description is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      short_description: shortDescription.trim(),
      description: description.trim(),
      state,
      impact,
      urgency,
      priority,
      assigned_to_id: assignedToId || null,
      assignment_group_id: assignmentGroupId || null,
      cmdb_ci_id: cmdbCiId || null,
      root_cause: rootCause.trim() || null,
      workaround: workaround.trim() || null,
      is_known_error: isKnownError,
    };

    try {
      const url = isNew ? "/api/now/table/problem" : `/api/now/table/problem/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save Problem");
      }

      const data = await res.json();
      showToast(isNew ? "Problem created successfully" : "Problem updated");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/problem/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isNew) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/now/table/problem/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_note: newNote.trim(),
          author_id: currentUser.id,
        }),
      });

      if (res.ok) {
        setActivityNotes((prev) => [
          {
            id: String(Date.now()),
            content: newNote.trim(),
            noteType: "work_note",
            createdAt: new Date().toISOString(),
            author: { name: currentUser.name },
          },
          ...prev,
        ]);
        setNewNote("");
        showToast("Work note added to problem record");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Problem '${number || shortDescription}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/problem/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/problem");
    } catch (err: any) {
      alert(err.message || "Could not delete Problem");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-neutral-600">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING PROBLEM SPECIFICATION...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-black font-sans pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-mono text-xs text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Swiss Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-black bg-white/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/workspace/problem"
            className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white hover:bg-neutral-100 text-black transition-colors"
            title="Back to Problems List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs uppercase font-extrabold bg-black text-white px-2 py-0.5">
                PROBLEM
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500 uppercase">
                {isNew ? "NEW PROBLEM INVESTIGATION" : `${number} // ${shortDescription}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-9 items-center gap-1.5 border-2 border-red-600 bg-white hover:bg-red-50 px-3 font-mono text-xs font-bold uppercase text-red-600 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex h-9 items-center gap-2 border-2 border-black bg-black px-5 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)]"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "SAVING..." : isNew ? "CREATE PROBLEM" : "SAVE SPEC"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="mx-auto max-w-6xl p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-3 border-2 border-red-600 bg-red-50 p-4 font-mono text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Core Problem Details */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-black">
                  01 // Problem Overview &amp; Classification
                </h2>
              </div>
              {number && <span className="font-mono text-xs text-black font-extrabold bg-neutral-100 px-2 py-0.5 border border-black">{number}</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Short Description / Problem Summary *
                </label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Recurring memory leak in TLS terminating ingress proxy under high load"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Detailed Problem Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Elaborate on the underlying failure symptoms, affected enterprise services, and pattern of disruption..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Investigation State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(Number(e.target.value))}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {PROBLEM_STATES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Configuration Item (CMDB)
                </label>
                <select
                  value={cmdbCiId}
                  onChange={(e) => setCmdbCiId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- No CI Linked --</option>
                  {cis.map((ci) => (
                    <option key={ci.id} value={ci.id}>
                      {ci.name} ({ci.ciClass || "CI"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Assigned Investigator (sys_user)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- Unassigned --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Assignment Group (sys_user_group)
                </label>
                <select
                  value={assignmentGroupId}
                  onChange={(e) => setAssignmentGroupId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- No Group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Priority Matrix */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-black">
                02 // Impact &amp; Urgency Priority Matrix
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-600">Calculated Priority:</span>
                <span className={`px-2.5 py-0.5 font-mono text-xs font-bold border-2 ${
                  priority === 1 ? "bg-red-600 text-white border-red-600" :
                  priority === 2 ? "bg-amber-500 text-black border-amber-600" :
                  "bg-neutral-100 text-black border-black"
                }`}>
                  P{priority} - {priority === 1 ? "Critical" : priority === 2 ? "High" : priority === 3 ? "Moderate" : "Low"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Business Impact
                </label>
                <select
                  value={impact}
                  onChange={(e) => handleImpactChange(Number(e.target.value))}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value={1}>1 - High (Extensive department / company-wide stoppage)</option>
                  <option value={2}>2 - Medium (Significant localized degradation)</option>
                  <option value={3}>3 - Low (Minor / single workstream)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => handleUrgencyChange(Number(e.target.value))}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value={1}>1 - High (Immediate resolution demanded)</option>
                  <option value={2}>2 - Medium (Workaround partially mitigates)</option>
                  <option value={3}>3 - Low (Scheduled maintenance acceptable)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Root Cause Analysis & Known Error Database (KEDB) */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-black">
                  03 // Root Cause Analysis &amp; KEDB Resolution
                </h2>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isKnownError}
                  onChange={(e) => setIsKnownError(e.target.checked)}
                  className="h-4 w-4 border-2 border-black text-black rounded-none focus:ring-0"
                />
                <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                  Publish to Known Error Database (KEDB)
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Root Cause Analysis (RCA)
                </label>
                <textarea
                  rows={4}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Document the underlying technical root cause discovered during post-incident review or telemetry profiling..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Workaround / Interim Remediation Procedure
                </label>
                <textarea
                  rows={4}
                  value={workaround}
                  onChange={(e) => setWorkaround(e.target.value)}
                  placeholder="Step-by-step instructions for engineers or service desk staff to circumvent the problem while a permanent software patch is engineered..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Activity Stream & Linked Incidents */}
          {!isNew && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Activity Notes */}
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-black" />
                    <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-black">
                      Work Notes &amp; Timeline
                    </h2>
                  </div>
                </div>

                <div className="mb-4">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add investigation work note..."
                    className="w-full border-2 border-black bg-white p-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={submittingNote || !newNote.trim()}
                      className="flex items-center gap-1.5 border-2 border-black bg-black px-3 py-1 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    >
                      <Send className="h-3 w-3" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-neutral-200">
                  {activityNotes.length === 0 ? (
                    <p className="font-mono text-xs text-neutral-500">No notes posted yet.</p>
                  ) : (
                    activityNotes.map((note) => (
                      <div key={note.id} className="pt-2 text-xs font-mono">
                        <div className="flex justify-between text-neutral-500 text-[10px]">
                          <span className="font-bold text-black">{note.author?.name || "System"}</span>
                          <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-1 text-neutral-800 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Linked Incidents */}
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-black" />
                    <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-black">
                      Linked Incidents ({incidents.length})
                    </h2>
                  </div>
                </div>

                {incidents.length === 0 ? (
                  <p className="border-2 border-dashed border-neutral-300 p-6 text-center font-mono text-xs text-neutral-500">
                    NO INCIDENTS CURRENTLY ATTACHED TO THIS PROBLEM
                  </p>
                ) : (
                  <ul className="divide-y divide-neutral-200 border-2 border-black">
                    {incidents.map((inc: any) => (
                      <li key={inc.id} className="p-3 font-mono text-xs flex justify-between items-center hover:bg-neutral-100">
                        <span className="text-black font-extrabold">{inc.task?.number || inc.id}</span>
                        <span className="text-neutral-600 truncate max-w-[200px]">{inc.task?.shortDescription}</span>
                        <Link href={`/workspace/incident/${inc.task?.id || inc.id}`} className="text-xs font-bold text-black hover:underline uppercase">
                          View &rarr;
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
