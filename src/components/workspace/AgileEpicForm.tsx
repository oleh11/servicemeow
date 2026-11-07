"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  Sparkles,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface AgileEpicFormProps {
  recordId: string; // "new" or cuid
}

export function AgileEpicForm({ recordId }: AgileEpicFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Epic Fields
  const [number, setNumber] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("2");
  const [state, setState] = useState("1");
  const [owner, setOwner] = useState(currentUser.name || "Product Director");
  const [targetDate, setTargetDate] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/now/table/rm_epic/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const ep = data.result;
            setNumber(ep.number || "");
            setShortDescription(ep.shortDescription || ep.short_description || ep.name || "");
            setDescription(ep.description || "");
            setPriority(String(ep.priority || "2"));
            setState(String(ep.state || "1"));
            setOwner(ep.owner || ep.assignedTo?.display_value || "");
            setTargetDate(ep.target_date || ep.targetDate || "");
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortDescription.trim()) {
      setErrorMsg("Epic name/summary is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      short_description: shortDescription.trim(),
      description: description.trim(),
      priority,
      state,
      owner: owner.trim(),
      target_date: targetDate || null,
    };

    try {
      const url = isNew ? "/api/now/table/rm_epic" : `/api/now/table/rm_epic/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save epic");
      }

      const data = await res.json();
      showToast(isNew ? "Epic created successfully" : "Epic updated");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/rm_epic/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Epic '${number || shortDescription}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/rm_epic/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/agile");
    } catch (err: any) {
      alert(err.message || "Could not delete epic");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-black">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING EPIC SPECIFICATION...
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
                EPIC // rm_epic
              </span>
              <span className="h-1 w-1 bg-black" />
              <span className="font-mono text-xs font-black uppercase text-black">
                {isNew ? "NEW STRATEGIC EPIC" : `${number} // ${shortDescription}`}
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
            <span>{saving ? "SAVING..." : isNew ? "CREATE EPIC" : "SAVE SPEC"}</span>
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
              <Layers className="h-4 w-4 text-black" />
              <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                Epic Strategic Initiative Specification
              </h2>
            </div>
            {number && <span className="font-mono text-xs font-bold text-neutral-600">{number}</span>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Epic Initiative Name *
              </label>
              <input
                type="text"
                required
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="e.g. NextGen Microservices & Event Stream Engine"
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Business Objective & Executive Summary
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe business outcomes, target KPIs, and multi-quarter strategic value..."
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="1">1 - Critical Strategic Focus</option>
                  <option value="2">2 - High Business Priority</option>
                  <option value="3">3 - Moderate Priority</option>
                  <option value="4">4 - Low / Backlog</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Executive Owner / Product Lead
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Target Quarter / Completion Date
                </label>
                <input
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  placeholder="e.g. Q4 2026"
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
