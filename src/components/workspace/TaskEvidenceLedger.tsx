"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Terminal,
  Activity,
  GitCommit,
  AlertTriangle,
  MessageSquare,
  Check,
  X,
  Plus,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

export interface EvidenceItem {
  id: string;
  taskId: string;
  evidenceKind: string;
  isDecisive: boolean;
  confidenceScore: number;
  observationSummary: string;
  rawEvidencePayload?: string | null;
  proposedFactField?: string | null;
  proposedFactValue?: string | null;
  isAccepted?: boolean | null;
  decidedAt?: string | null;
  decidedById?: string | null;
  decidedBy?: {
    id: string;
    name: string | null;
    userName: string;
  } | null;
  sysCreatedAt: string;
}

interface TaskEvidenceLedgerProps {
  taskId: string;
  isNew?: boolean;
  onFactAccepted?: (field: string, value: string) => void;
}

export function TaskEvidenceLedger({
  taskId,
  isNew = false,
  onFactAccepted,
}: TaskEvidenceLedgerProps) {
  const { currentUser } = useUser();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  // Log Evidence Form State
  const [isLogging, setIsLogging] = useState(false);
  const [kind, setKind] = useState("log.stacktrace");
  const [summary, setSummary] = useState("");
  const [payload, setPayload] = useState("");
  const [isDecisive, setIsDecisive] = useState(true);
  const [confidence, setConfidence] = useState(0.95);
  const [factField, setFactField] = useState("");
  const [factValue, setFactValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEvidence = async () => {
    if (isNew || !taskId || taskId === "new") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/now/table/task_evidence?sysparm_query=task_id=${taskId}`);
      if (!res.ok) throw new Error("Failed to load evidence ledger");
      const json = await res.json();
      const list = json.result || [];
      // Sort newest first
      list.sort(
        (a: EvidenceItem, b: EvidenceItem) =>
          new Date(b.sysCreatedAt).getTime() - new Date(a.sysCreatedAt).getTime()
      );
      setEvidenceList(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [taskId, isNew]);

  const toggleExpand = (id: string) => {
    setExpandedPayloads((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDecideFact = async (
    item: EvidenceItem,
    accepted: boolean
  ) => {
    const prevList = [...evidenceList];
    const now = new Date().toISOString();

    // Optimistic update
    setEvidenceList(
      evidenceList.map((e) =>
        e.id === item.id
          ? {
              ...e,
              isAccepted: accepted,
              decidedAt: now,
              decidedById: currentUser?.id || null,
              decidedBy: {
                id: currentUser?.id || "",
                name: currentUser?.name || currentUser?.userName || "Me",
                userName: currentUser?.userName || "user",
              },
            }
          : e
      )
    );

    // If accepted and has a proposed field & value, notify parent form
    if (accepted && item.proposedFactField && item.proposedFactValue && onFactAccepted) {
      onFactAccepted(item.proposedFactField, item.proposedFactValue);
    }

    try {
      const res = await fetch(`/api/now/table/task_evidence/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          is_accepted: accepted,
          decided_by_id: currentUser?.id,
          decided_at: now,
        }),
      });

      if (!res.ok) throw new Error("Failed to update evidence item");
    } catch (err: any) {
      console.error("Decision update error:", err);
      setEvidenceList(prevList);
      setError(err.message);
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/now/table/task_evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          task_id: taskId,
          evidence_kind: kind,
          is_decisive: isDecisive,
          confidence_score: confidence,
          observation_summary: summary.trim(),
          raw_evidence_payload: payload.trim() || null,
          proposed_fact_field: factField.trim() || null,
          proposed_fact_value: factValue.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to log evidence");
      }

      setSummary("");
      setPayload("");
      setFactField("");
      setFactValue("");
      setIsLogging(false);
      await fetchEvidence();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvidence = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evidence record?")) return;
    try {
      const res = await fetch(`/api/now/table/task_evidence/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
      });
      if (!res.ok) throw new Error("Failed to delete evidence item");
      await fetchEvidence();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getKindBadge = (kindVal: string) => {
    switch (kindVal) {
      case "log.stacktrace":
        return {
          icon: Terminal,
          label: "STACK TRACE",
          className: "bg-purple-100 text-purple-900 border-purple-300",
        };
      case "ci.ping_failure":
        return {
          icon: Activity,
          label: "CI PING OUTAGE",
          className: "bg-red-100 text-red-900 border-red-300",
        };
      case "git.commit_hash":
        return {
          icon: GitCommit,
          label: "GIT COMMIT REF",
          className: "bg-blue-100 text-blue-900 border-blue-300",
        };
      case "monitor.alert":
        return {
          icon: AlertTriangle,
          label: "MONITOR ALERT",
          className: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "crm.thread_reply":
        return {
          icon: MessageSquare,
          label: "CRM THREAD REPLY",
          className: "bg-emerald-100 text-emerald-900 border-emerald-300",
        };
      default:
        return {
          icon: Layers,
          label: kindVal.toUpperCase(),
          className: "bg-neutral-100 text-neutral-800 border-neutral-300",
        };
    }
  };

  if (isNew) {
    return (
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider">
            Hermes AI Anti-Hallucination Evidence Ledger
          </h3>
        </div>
        <p className="text-xs font-mono text-neutral-500">
          Save this task record to enable Hermes AI observation logging, decisive fact verification, and audit trail extraction.
        </p>
      </div>
    );
  }

  const decisiveCount = evidenceList.filter((e) => e.isDecisive).length;
  const acceptedCount = evidenceList.filter((e) => e.isAccepted === true).length;
  const pendingCount = evidenceList.filter(
    (e) => e.isAccepted === null && Boolean(e.proposedFactField)
  ).length;

  return (
    <div className="space-y-6">
      {/* Swiss Header Card */}
      <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white">
                HERMES AI LEDGER
              </span>
              <span className="font-mono text-xs uppercase font-bold text-neutral-500">
                Anti-Hallucination Evidence & Facts
              </span>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black mt-1">
              Deterministic Diagnostic Evidence Ledger
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-2xl font-black text-black">
                {evidenceList.length}
              </div>
              <div className="font-mono text-[10px] uppercase text-neutral-500">
                {decisiveCount} Decisive · {acceptedCount} Verified
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLogging(!isLogging)}
              className="px-3 py-2 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isLogging ? "Cancel" : "Log Evidence"}</span>
            </button>
          </div>
        </div>

        {/* Fact Verification Alert */}
        {pendingCount > 0 && (
          <div className="mt-4 p-3 bg-purple-50 border-2 border-purple-600 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-extrabold uppercase text-purple-900">
                {pendingCount} Proposed Fact {pendingCount === 1 ? "Awaiting" : "Awaiting"} Human Verification
              </div>
              <p className="text-xs text-purple-900 mt-0.5 leading-relaxed">
                Hermes AI has extracted deterministic facts from live logs and telemetry. Review proposed
                fields below and click <strong>Accept Fact</strong> to inject verified data into this record.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Inline Form to Log Evidence */}
      {isLogging && (
        <form
          onSubmit={handleCreateEvidence}
          className="border-2 border-black bg-neutral-50 p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4"
        >
          <div className="font-mono text-xs font-extrabold uppercase text-black">
            + Log Diagnostic Evidence or Telemetry Observation
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Evidence Kind *
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none"
              >
                <option value="log.stacktrace">log.stacktrace (Error Logs / Stack)</option>
                <option value="ci.ping_failure">ci.ping_failure (Hardware / CI Outage)</option>
                <option value="git.commit_hash">git.commit_hash (Deploy / Commit Regression)</option>
                <option value="monitor.alert">monitor.alert (Synthetic / APM Threshold)</option>
                <option value="crm.thread_reply">crm.thread_reply (Customer Communication)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Confidence Score (0.00 – 1.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isDecisive"
                checked={isDecisive}
                onChange={(e) => setIsDecisive(e.target.checked)}
                className="w-4 h-4 rounded-none border-2 border-black text-black"
              />
              <label
                htmlFor="isDecisive"
                className="font-mono text-xs font-bold uppercase text-black cursor-pointer select-none"
              >
                Decisive Root Fact
              </label>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
              Observation Summary *
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Redis container OOM killed at 14:02 UTC after keyspace spike"
              className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
              Raw Evidence Payload / Log Snippet (Optional)
            </label>
            <textarea
              rows={3}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Paste raw log lines, stack traces, curl outputs, or commit SHAs"
              className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-300">
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Proposed Fact Target Field (Optional)
              </label>
              <input
                type="text"
                value={factField}
                onChange={(e) => setFactField(e.target.value)}
                placeholder="e.g. workaround, root_cause, or close_notes"
                className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Proposed Fact Injected Value (Optional)
              </label>
              <input
                type="text"
                value={factValue}
                onChange={(e) => setFactValue(e.target.value)}
                placeholder="Value to populate when operator clicks Accept"
                className="w-full px-3 py-2 border-2 border-black font-mono text-xs bg-white text-black focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-300">
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="px-3 py-1.5 border border-black font-mono text-xs font-bold uppercase hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Commit Evidence"}
            </button>
          </div>
        </form>
      )}

      {/* Evidence Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="border-2 border-black bg-white p-8 text-center font-mono text-xs text-neutral-500 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            Loading Hermes AI Evidence Ledger...
          </div>
        ) : evidenceList.length === 0 ? (
          <div className="border-2 border-black bg-white p-8 text-center font-mono text-xs text-neutral-500 space-y-2 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div>Zero diagnostic evidence items recorded for this task.</div>
            <p className="text-[11px] text-neutral-400">
              Click &quot;Log Evidence&quot; above to link telemetry, stack traces, or Purr-Assist discoveries.
            </p>
          </div>
        ) : (
          evidenceList.map((item) => {
            const kindMeta = getKindBadge(item.evidenceKind);
            const KindIcon = kindMeta.icon;
            const isExpanded = expandedPayloads[item.id] || false;

            return (
              <div
                key={item.id}
                className={`border-2 border-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors ${
                  item.isDecisive ? "border-l-8 border-l-red-600" : ""
                }`}
              >
                {/* Top Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase px-2 py-0.5 border ${kindMeta.className}`}
                    >
                      <KindIcon className="w-3 h-3" />
                      <span>{kindMeta.label}</span>
                    </span>

                    {item.isDecisive ? (
                      <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white tracking-wider">
                        DECISIVE ROOT FACT
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 tracking-wider">
                        SUPPORTING FACT
                      </span>
                    )}

                    <span className="font-mono text-[10px] font-bold text-neutral-600 border border-neutral-300 px-1.5 py-0.5">
                      CONFIDENCE: {Math.round(item.confidenceScore * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-neutral-500">
                      {new Date(item.sysCreatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvidence(item.id)}
                      className="text-neutral-400 hover:text-red-600 p-1"
                      title="Delete Evidence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Observation Summary */}
                <div className="mt-3">
                  <p className="font-mono text-xs font-bold text-black leading-relaxed">
                    {item.observationSummary}
                  </p>
                </div>

                {/* Raw Payload Collapsible */}
                {item.rawEvidencePayload && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1 font-mono text-[11px] font-bold text-neutral-600 hover:text-black uppercase cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isExpanded ? "Hide Raw Telemetry" : "View Raw Telemetry Snippet"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-neutral-900 border border-black overflow-x-auto text-emerald-400 font-mono text-[11px] leading-snug">
                        <pre className="whitespace-pre-wrap">{item.rawEvidencePayload}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Proposed Fact & Operator Acceptance Section */}
                {item.proposedFactField && (
                  <div className="mt-4 p-3 bg-neutral-50 border-2 border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 bg-black text-white">
                          PROPOSED FACT
                        </span>
                        <span className="font-mono text-xs font-extrabold text-neutral-800">
                          Field: <code className="text-red-600">{item.proposedFactField}</code>
                        </span>
                      </div>
                      <div className="font-mono text-xs text-neutral-700 pl-1">
                        &quot;{item.proposedFactValue}&quot;
                      </div>
                    </div>

                    {/* Decision Button or Decision Badge */}
                    <div className="shrink-0">
                      {item.isAccepted === null || item.isAccepted === undefined ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecideFact(item, true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Fact</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecideFact(item, false)}
                            className="px-2.5 py-1.5 border border-black hover:bg-neutral-200 text-neutral-800 font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : item.isAccepted === true ? (
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-800 font-extrabold bg-emerald-100 border border-emerald-300 px-2 py-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>
                            Verified & Accepted by{" "}
                            {item.decidedBy?.name || item.decidedBy?.userName || "Staff"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-600 font-bold bg-neutral-200 px-2 py-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Rejected by Operator</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
