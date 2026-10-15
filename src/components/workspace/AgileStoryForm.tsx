"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Kanban,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  User,
  Clock,
  Target,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface AgileStoryFormProps {
  recordId: string; // "new" or cuid
}

const STORY_STATES = [
  { value: "1", label: "1 - Backlog" },
  { value: "2", label: "2 - Sprint Ready" },
  { value: "3", label: "3 - In Progress" },
  { value: "4", label: "4 - Testing & QA" },
  { value: "7", label: "7 - Complete" },
];

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

export function AgileStoryForm({ recordId }: AgileStoryFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Story Fields
  const [number, setNumber] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("1");
  const [priority, setPriority] = useState("3");
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [sprintId, setSprintId] = useState("");
  const [epicName, setEpicName] = useState("");
  const [assignee, setAssignee] = useState(currentUser.name || "System Administrator");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");

  // Lookups
  const [sprints, setSprints] = useState<any[]>([]);
  const [epics, setEpics] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/now/table/rm_sprint").then((r) => r.json()).catch(() => ({ result: [] })),
      fetch("/api/now/table/rm_epic").then((r) => r.json()).catch(() => ({ result: [] })),
    ]).then(([sprintData, epicData]) => {
      if (sprintData.result) setSprints(sprintData.result);
      if (epicData.result) setEpics(epicData.result);
    });

    if (!isNew) {
      fetch(`/api/now/table/rm_story/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const s = data.result;
            setNumber(s.number || "");
            setShortDescription(s.shortDescription || s.short_description || "");
            setDescription(s.description || "");
            setState(String(s.state || "1"));
            setPriority(String(s.priority || "3"));
            setStoryPoints(s.story_points ? Number(s.story_points) : (s.storyPoints ? Number(s.storyPoints) : 3));
            setSprintId(s.sprint_id || "");
            setEpicName(s.epic_name || "");
            setAssignee(s.assigned_to || s.assignedTo?.display_value || "");
            setAcceptanceCriteria(s.acceptance_criteria || "");
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortDescription.trim()) {
      setErrorMsg("Story summary is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const sprintObj = sprints.find((s) => s.id === sprintId || s.number === sprintId);

    const payload = {
      short_description: shortDescription.trim(),
      description: description.trim(),
      state,
      priority,
      story_points: Number(storyPoints),
      sprint_id: sprintId || null,
      sprint_name: sprintObj ? sprintObj.name : null,
      epic_name: epicName || null,
      assigned_to: assignee || null,
      acceptance_criteria: acceptanceCriteria.trim(),
    };

    try {
      const url = isNew ? "/api/now/table/rm_story" : `/api/now/table/rm_story/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save Agile Story");
      }

      const data = await res.json();
      showToast(isNew ? "Story created successfully" : "Story updated");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/rm_story/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Story '${number || shortDescription}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/rm_story/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/agile");
    } catch (err: any) {
      alert(err.message || "Could not delete story");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-black">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING STORY SPECIFICATION...
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
                AGILE // rm_story
              </span>
              <span className="h-1 w-1 bg-black" />
              <span className="font-mono text-xs font-black uppercase text-black">
                {isNew ? "NEW USER STORY" : `${number} // ${shortDescription}`}
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
            <span>{saving ? "SAVING..." : isNew ? "CREATE STORY" : "SAVE SPEC"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="mx-auto max-w-5xl p-6">
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 border-2 border-black bg-red-100 p-4 font-mono text-xs text-red-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Kanban className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  01 // User Story Specification
                </h2>
              </div>
              {number && <span className="font-mono text-xs font-bold text-neutral-600">{number}</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  User Story Summary *
                </label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="As a [persona], I want [action] so that [business value]"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Description / Implementation Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical notes, mockups, architectural approach..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Agile Kanban State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {STORY_STATES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Story Points (Fibonacci)
                </label>
                <div className="flex gap-1.5">
                  {FIBONACCI_POINTS.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setStoryPoints(pt)}
                      className={`flex-1 py-1.5 font-mono text-xs font-bold border-2 border-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                        storyPoints === pt
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Assigned Sprint
                </label>
                <select
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">-- Backlog (No Sprint) --</option>
                  {sprints.map((s) => (
                    <option key={s.id || s.number} value={s.id || s.number}>
                      {s.number ? `[${s.number}] ` : ""}{s.name} ({s.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Strategic Epic Initiative
                </label>
                <input
                  type="text"
                  list="epic-list"
                  value={epicName}
                  onChange={(e) => setEpicName(e.target.value)}
                  placeholder="Select or enter Epic name..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
                <datalist id="epic-list">
                  {epics.map((ep) => (
                    <option key={ep.id || ep.number} value={ep.short_description || ep.name || ep.number} />
                  ))}
                  <option value="Workplace & Spatial Hub Architecture" />
                  <option value="Platform Architecture & Studio IDE" />
                  <option value="Agile Project Management Engine" />
                </datalist>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Assignee
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Acceptance Criteria (Given / When / Then)
                </label>
                <textarea
                  rows={4}
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  placeholder="Given an authenticated user, when they click ..., then the system should ..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
