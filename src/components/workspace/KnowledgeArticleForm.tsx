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
  Eye,
  ThumbsUp,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  User,
  Check,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface KnowledgeArticleFormProps {
  recordId: string; // "new" or cuid
}

const CATEGORIES = [
  "General",
  "Network",
  "Hardware",
  "Software",
  "Cloud Services",
  "Workplace & Facilities",
  "Security & Access",
  "How-To",
  "Policy",
];

export function KnowledgeArticleForm({ recordId }: KnowledgeArticleFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // Form State
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [authorId, setAuthorId] = useState("");
  const [views, setViews] = useState(0);
  const [helpfulVotes, setHelpfulVotes] = useState(0);

  // Lookups
  const [users, setUsers] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetch("/api/now/table/sys_user")
      .then((r) => r.json())
      .then((data) => {
        if (data.result) {
          setUsers(data.result);
          if (isNew && !authorId) {
            setAuthorId(currentUser.id || data.result[0]?.id || "");
          }
        }
      });

    if (!isNew) {
      fetch(`/api/now/table/kb_knowledge/${recordId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const a = data.result;
            setNumber(a.number || "");
            setTitle(a.title || a.short_description || "");
            setCategory(a.category || "General");
            setContent(a.content || "");
            setIsPublished(a.is_published !== undefined ? a.is_published : (a.isPublished !== undefined ? a.isPublished : true));
            setAuthorId(a.author_id || a.author?.value || a.authorId || "");
            setViews(a.views || 0);
            setHelpfulVotes(a.helpful_votes || a.helpfulVotes || 0);
          }
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }
  }, [recordId, isNew, currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Article title is required.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Article content body cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      title: title.trim(),
      short_description: title.trim(),
      category,
      content,
      is_published: isPublished,
      author_id: authorId || currentUser.id,
      views,
      helpful_votes: helpfulVotes,
    };

    try {
      const url = isNew ? "/api/now/table/kb_knowledge" : `/api/now/table/kb_knowledge/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save Knowledge Article");
      }

      const data = await res.json();
      showToast(isNew ? "Knowledge Article published" : "Article updated successfully");

      if (isNew && data.result?.sys_id) {
        router.push(`/workspace/kb_knowledge/${data.result.sys_id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Article '${number || title}'?`)) return;

    try {
      const res = await fetch(`/api/now/table/kb_knowledge/${recordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/workspace/kb_knowledge");
    } catch (err: any) {
      alert(err.message || "Could not delete article");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 font-mono text-xs text-black">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-black" />
        LOADING KNOWLEDGE SPECIFICATION...
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
            href="/workspace/kb_knowledge"
            className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
            title="Back to Knowledge Base"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                KNOWLEDGE MGMT // kb_knowledge
              </span>
              <span className="h-1 w-1 bg-black" />
              <span className="font-mono text-xs font-black uppercase text-black">
                {isNew ? "NEW KNOWLEDGE ARTICLE" : `${number} // ${title}`}
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
            <span>{saving ? "SAVING..." : isNew ? "PUBLISH ARTICLE" : "SAVE SPEC"}</span>
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
          {/* Metadata Section */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  01 // Article Identity & Taxonomy
                </h2>
              </div>
              {number && <span className="font-mono text-xs font-bold text-neutral-600">{number}</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Article Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How to connect to Corporate Wi-Fi via 802.1X EAP-TLS Certificates"
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Topic Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase text-black">
                  Author / Technical Owner
                </label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 border-2 border-black text-black rounded-none focus:ring-0"
                  />
                  <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                    Published to Self-Service Portal
                  </span>
                </label>
              </div>
            </div>

            {!isNew && (
              <div className="mt-4 flex items-center gap-6 border-t-2 border-black pt-3 font-mono text-xs text-neutral-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <Eye className="h-3.5 w-3.5 text-black" />
                  <span>{views} Lifetime Reads</span>
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <ThumbsUp className="h-3.5 w-3.5 text-black" />
                  <span>{helpfulVotes} Helpful Votes</span>
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Markdown Editor & Preview */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-black" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  02 // Article Body (Markdown Supported)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1 font-mono text-xs uppercase border-2 border-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                    !previewMode
                      ? "bg-black text-white font-bold"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  Write Raw
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1 font-mono text-xs uppercase border-2 border-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                    previewMode
                      ? "bg-black text-white font-bold"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  Render Preview
                </button>
              </div>
            </div>

            {!previewMode ? (
              <div>
                <textarea
                  rows={16}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`### Overview\nProvide a high-level summary of the resolution or guideline...\n\n### Prerequisites\n- Active corporate directory credentials\n- Approved change request\n\n### Step-by-Step Instructions\n1. Launch terminal or system settings.\n2. Execute configuration commands...`}
                  className="w-full border-2 border-black bg-white p-4 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors leading-relaxed"
                />
                <p className="mt-2 font-mono text-[10px] text-neutral-500 font-bold uppercase">
                  Supports GitHub-flavored markdown: ### Headers, **Bold**, Lists, `Code`, and Tables.
                </p>
              </div>
            ) : (
              <div className="border-2 border-black bg-white p-6 font-sans text-sm text-black leading-relaxed min-h-[300px]">
                {content ? (
                  <div className="prose max-w-none whitespace-pre-wrap font-sans text-xs">
                    {content}
                  </div>
                ) : (
                  <p className="font-mono text-xs font-bold text-neutral-500 uppercase">NO CONTENT ENTERED YET TO PREVIEW</p>
                )}
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
