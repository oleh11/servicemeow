"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  FolderKanban,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface KnowledgeBaseFormProps {
  recordId: string; // "new" or cuid
}

export function KnowledgeBaseForm({ recordId }: KnowledgeBaseFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState(currentUser.name || "System Administrator");
  const [active, setActive] = useState(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/now/table/kb_knowledge_base/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const kb = data.result;
            setNumber(kb.number || "");
            setName(kb.name || "");
            setDescription(kb.description || "");
            setOwner(kb.owner || "");
            setActive(kb.active !== undefined ? Boolean(kb.active) : true);
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Knowledge Base name is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      owner: owner.trim(),
      active,
    };

    try {
      const url = isNew ? "/api/now/table/kb_knowledge_base" : `/api/now/table/kb_knowledge_base/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save Knowledge Base");
      }

      const data = await res.json();
      showToast(isNew ? "Knowledge Base created successfully" : "Knowledge Base updated");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/kb_knowledge_base/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Knowledge Base '${name}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/kb_knowledge_base/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/kb_knowledge_base");
    } catch (err: any) {
      alert(err.message || "Could not delete Knowledge Base");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-black">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING KNOWLEDGE BASE SPECIFICATION...
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
            href="/workspace/kb_knowledge_base"
            className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
            title="Back to Knowledge Bases"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                KNOWLEDGE BASE // kb_knowledge_base
              </span>
              <span className="h-1 w-1 bg-black" />
              <span className="font-mono text-xs font-black uppercase text-black">
                {isNew ? "NEW KNOWLEDGE REPOSITORY" : `${number || name}`}
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
            <span>{saving ? "SAVING..." : isNew ? "CREATE REPOSITORY" : "SAVE SPEC"}</span>
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
              <FolderKanban className="h-4 w-4 text-black" />
              <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                Knowledge Repository Configuration
              </h2>
            </div>
            {number && <span className="font-mono text-xs font-bold text-neutral-600">{number}</span>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Knowledge Base Title / Label *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. IT Technical Documentation & Runbooks"
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Repository Purpose & Scope
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe which departments, applications, and operating systems this knowledge base covers..."
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                Owner / Managing Lead
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Documentation Team Lead"
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 border-2 border-black text-black rounded-none focus:ring-0"
                />
                <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                  Active (Exposed across Search & Employee Intake)
                </span>
              </label>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
