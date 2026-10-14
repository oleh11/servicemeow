"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  GitPullRequest,
  ShoppingBag,
  AlertCircle,
  MessageSquare,
  X,
  Search,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface ApprovalItem {
  id: string;
  taskId: string;
  state: "requested" | "approved" | "rejected";
  comments?: string;
  approvalType: string;
  createdAt: string;
  approver?: { name: string; email: string };
  task: {
    id: string;
    number: string;
    sysClassName: string;
    shortDescription: string;
    priority: number;
    openedBy?: { name: string; email: string };
    changeRequest?: any;
    incident?: any;
  };
}

export default function ApprovalsHubPage() {
  const { currentUser } = useUser();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<"requested" | "all">("requested");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApprovalForReject, setSelectedApprovalForReject] = useState<ApprovalItem | null>(null);
  const [rejectComments, setRejectComments] = useState("");

  useEffect(() => {
    loadApprovals();
  }, [filterState]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/now/approvals?state=${filterState}`);
      if (res.ok) {
        const json = await res.json();
        setApprovals(json.result || []);
      }
    } catch (e) {
      console.error("Error loading approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId: string, state: "approved" | "rejected", comments?: string) => {
    setProcessingId(approvalId);
    try {
      const res = await fetch(`/api/now/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, comments }),
      });
      if (res.ok) {
        await loadApprovals();
      }
    } catch (e) {
      console.error("Error submitting approval decision:", e);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.task?.number.toLowerCase().includes(q) ||
      a.task?.shortDescription.toLowerCase().includes(q) ||
      (a.task?.openedBy?.name || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = approvals.filter((a) => a.state === "requested").length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900">Governance & Change Approvals Hub</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              sysapproval_approver
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and dispatch CAB change approvals, manager sign-offs, and service fulfillment authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadApprovals}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border text-xs">
          <button
            onClick={() => setFilterState("requested")}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              filterState === "requested"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending My Review ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterState("all")}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              filterState === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>All Historical Records</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket number, requester..."
            className="w-full bg-slate-50 border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-500"
          />
        </div>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
          <h3 className="font-bold text-sm text-slate-800">All Clear! No Approvals Pending</h3>
          <p className="text-slate-500 text-xs">You have no requests currently awaiting your review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map((a) => {
            const isPending = a.state === "requested";
            const isApproved = a.state === "approved";
            const isRejected = a.state === "rejected";
            const isProcessing = processingId === a.id;

            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isProcessing ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 text-sm">{a.task?.number}</span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.2 rounded font-mono text-[10px] font-semibold uppercase">
                      {a.task?.sysClassName || "task"}
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.2 rounded font-mono text-[10px] border border-purple-200">
                      {a.approvalType.toUpperCase()} Approval
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded font-mono text-[10px] font-bold ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800"
                          : isRejected
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {a.state.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-xs leading-snug">
                    {a.task?.shortDescription}
                  </h3>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Requested by: {a.task?.openedBy?.name || "System Operator"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </span>
                    {a.comments && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 italic truncate max-w-xs">
                          "{a.comments}"
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/workspace/${a.task?.sysClassName || "task"}/${a.task?.id}`}
                    target="_blank"
                    className="p-2 border rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                    title="Inspect Ticket Details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {isPending && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedApprovalForReject(a);
                          setRejectComments("");
                          setRejectModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDecision(a.id, "approved", "Approved by authorized approver.")}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedApprovalForReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Reject Approval for {selectedApprovalForReject.task?.number}
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              Provide justification or required modifications for rejecting this approval request.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rejection Comments *</label>
              <textarea
                rows={3}
                required
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="e.g. Backout plan incomplete; please attach verification script."
                className="w-full border rounded-lg p-2.5 text-slate-800 focus:outline-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border rounded-full text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDecision(selectedApprovalForReject.id, "rejected", rejectComments);
                  setRejectModalOpen(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-full shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
