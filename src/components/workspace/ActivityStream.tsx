"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/user-context";
import { MessageSquare, Lock, Send, Clock, User, Sparkles } from "lucide-react";

interface Note {
  id: string;
  noteType: string; // "work_note" or "customer_comment"
  content: string;
  createdAt: any;
  author?: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
  } | null;
}

interface ActivityStreamProps {
  taskId: string;
  initialNotes: Note[];
  onAddNote?: (noteType: "work_note" | "customer_comment", content: string) => Promise<void>;
}

const CANNED_WORK_NOTES = [
  { label: "🛠️ Diagnostic Complete", text: "Diagnostic & Network Trace completed. No packet loss observed on core gateway." },
  { label: "🔄 Service Restarted", text: "Restarted application daemon and verified service port responsiveness." },
  { label: "📞 Escalated Tier 3", text: "Escalated to Tier 3 Engineering on-call lead for kernel log review." },
  { label: "⏳ Awaiting Vendor", text: "Awaiting vendor security patch release for upstream library." },
];

const CANNED_CUSTOMER_COMMENTS = [
  { label: "ℹ️ Request Info", text: "Hello, could you please provide a screenshot of the error message and the exact time it occurred?" },
  { label: "🔧 Investigating", text: "We are actively investigating this issue and will update you within 30 minutes." },
  { label: "✅ Fix Deployed", text: "The fix has been deployed to production. Please verify if the issue is resolved on your end." },
  { label: "📅 Maintenance Concluded", text: "Scheduled maintenance has concluded. All systems are operational." },
];

export function ActivityStream({ taskId, initialNotes, onAddNote }: ActivityStreamProps) {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<"work_note" | "customer_comment">("work_note");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isDraftingAi, setIsDraftingAi] = useState(false);

  const handleAiDraft = async (tone: "empathetic" | "professional" | "technical" | "concise" = "empathetic") => {
    setIsDraftingAi(true);
    try {
      const res = await fetch("/api/now/ai/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, tone }),
      });
      const data = await res.json();
      if (data.result?.draft) {
        setContent(data.result.draft);
      }
    } catch (err) {
      console.error("AI Draft error:", err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  const handleApplyMacro = (macroText: string) => {
    setContent((prev) => (prev ? `${prev}\n\n${macroText}` : macroText));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onAddNote) {
        await onAddNote(activeTab, content);
      } else {
        // Fallback direct POST to API
        const payload: any = {
          author_id: currentUser.id,
        };
        if (activeTab === "work_note") payload.work_note = content;
        else payload.customer_comment = content;

        const res = await fetch(`/api/now/table/task/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to post note");
      }

      // Optimistic update
      const newNote: Note = {
        id: `temp-${Date.now()}`,
        noteType: activeTab,
        content,
        createdAt: new Date(),
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: currentUser.role,
        },
      };
      setNotes([newNote, ...notes]);
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Note Composition Box */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Tab Header: Work Notes vs Additional Comments */}
        <div className="flex border-b text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("work_note")}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "work_note"
                ? "bg-amber-50 text-amber-900 border-b-2 border-amber-500 font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Work Notes (Internal IT Only)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customer_comment")}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "customer_comment"
                ? "bg-purple-50 text-purple-900 border-b-2 border-purple-500 font-bold"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            <span>Additional Comments (Customer Visible)</span>
          </button>
        </div>

        {/* Text Input Area */}
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          {/* Canned Response Macro Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Macros:</span>
            </span>
            {(activeTab === "work_note" ? CANNED_WORK_NOTES : CANNED_CUSTOMER_COMMENTS).map(
              (macro, mi) => (
                <button
                  key={mi}
                  type="button"
                  onClick={() => handleApplyMacro(macro.text)}
                  className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-colors shrink-0 ${
                    activeTab === "work_note"
                      ? "bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-purple-50/70 hover:bg-purple-100 text-purple-800 border-purple-200"
                  }`}
                  title={macro.text}
                >
                  {macro.label}
                </button>
              )
            )}
            <button
              type="button"
              disabled={isDraftingAi}
              onClick={() => handleAiDraft(activeTab === "customer_comment" ? "empathetic" : "technical")}
              className="ml-auto px-2.5 py-0.5 rounded-full border border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-800 text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 disabled:opacity-50"
              title="Generate contextual customer reply using Hermes AI"
            >
              <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              <span>{isDraftingAi ? "Drafting..." : "✨ AI Draft Response"}</span>
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={
              activeTab === "work_note"
                ? "Type internal troubleshooting steps, diagnostic findings, or handover details..."
                : "Type message to caller / customer. They will see this notification..."
            }
            className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 resize-y ${
              activeTab === "work_note"
                ? "bg-amber-50/30 border-amber-200 focus:ring-amber-500 focus:border-amber-500 placeholder-amber-900/40 text-slate-800"
                : "bg-purple-50/30 border-purple-200 focus:ring-purple-500 focus:border-purple-500 placeholder-purple-900/40 text-slate-800"
            }`}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Posting as: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${
                activeTab === "work_note"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? "Posting..." : "Post Activity"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historical Activity Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Activity Stream History ({notes.length})
        </h4>

        {notes.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-dashed rounded text-center text-xs text-slate-400">
            No entries recorded yet.
          </div>
        ) : (
          notes.map((note) => {
            const isWorkNote = note.noteType === "work_note";
            const dateStr = new Date(note.createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={note.id}
                className={`p-3 rounded-lg border text-xs shadow-sm transition-all ${
                  isWorkNote
                    ? "bg-amber-50/40 border-amber-200/80"
                    : "bg-purple-50/40 border-purple-200/80"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    {note.author?.avatar ? (
                      <img
                        src={note.author.avatar}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px]">
                        <User className="w-3 h-3 text-slate-600" />
                      </div>
                    )}
                    <span className="font-semibold text-slate-800">
                      {note.author?.name || "System Automated"}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                        isWorkNote
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-purple-100 text-purple-800 border-purple-300"
                      }`}
                    >
                      {isWorkNote ? "Work Note" : "Customer Visible"}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {dateStr}
                  </span>
                </div>

                <div className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-1">
                  {note.content}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
