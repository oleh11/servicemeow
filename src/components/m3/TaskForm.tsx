"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Trash2,
  Sparkles,
  Clock,
  Layers,
  MessageSquare,
  ShieldCheck,
  Activity,
  Send,
  AlertTriangle,
  Server,
  UserCheck,
  Paperclip,
  ListChecks,
} from "lucide-react";
import { AttachmentZone } from "@/components/common/AttachmentZone";
import { ReferenceField } from "./ReferenceField";
import { M3OutlinedTextField } from "./M3OutlinedTextField";
import { ReferenceValue } from "@/lib/schema";
import { useUser } from "@/lib/user-context";
import { TaskChecklist } from "@/components/workspace/TaskChecklist";
import { TaskEvidenceLedger } from "@/components/workspace/TaskEvidenceLedger";

export interface TaskFormProps {
  tableName?: string; // defaults to "incident"
  recordId: string; // "new" or a cuid/id
  onSaved?: (savedRecord: any) => void;
}

export function TaskForm({
  tableName = "incident",
  recordId,
  onSaved,
}: TaskFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "stream" | "related" | "attachments" | "checklist" | "evidence">("details");
  const [incompleteMandatoryCount, setIncompleteMandatoryCount] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState("");
  const [formError, setFormError] = useState("");

  // Record Form Values
  const [number, setNumber] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<number>(1);
  const [impact, setImpact] = useState<number>(2);
  const [urgency, setUrgency] = useState<number>(2);
  const [priority, setPriority] = useState<number>(3);

  // References
  const [caller, setCaller] = useState<ReferenceValue | null>(null);
  const [cmdbCi, setCmdbCi] = useState<ReferenceValue | null>(null);
  const [assignmentGroup, setAssignmentGroup] = useState<ReferenceValue | null>(null);
  const [assignedTo, setAssignedTo] = useState<ReferenceValue | null>(null);

  // ITIL Details
  const [category, setCategory] = useState("inquiry");
  const [subcategory, setSubcategory] = useState("");
  const [closeCode, setCloseCode] = useState("Solved (Permanently)");
  const [closeNotes, setCloseNotes] = useState("");

  // Activity Stream & SLAs
  const [activityNotes, setActivityNotes] = useState<any[]>([]);
  const [slaInstances, setSlaInstances] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<"work_note" | "customer_comment">("work_note");
  const [submittingNote, setSubmittingNote] = useState(false);

  // AI Assist State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Auto-calculate Priority: Matrix (1x1 = 1, 1x2 = 2, 2x1 = 2, etc.)
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

  // Load record data
  useEffect(() => {
    if (isNew) {
      setNumber("Auto-generated (INC)");
      if (currentUser) {
        setCaller({
          value: currentUser.id,
          display_value: currentUser.name || currentUser.userName || currentUser.email,
        });
      }
      return;
    }

    const fetchRecord = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/now/table/${tableName}/${recordId}`, {
          headers: {
            "x-user-role": currentUser?.role || "admin",
          },
        });
        if (!res.ok) throw new Error("Failed to load task record");
        const json = await res.json();
        const data = json.result;

        setNumber(data.number || "");
        setShortDescription(data.shortDescription || data.short_description || "");
        setDescription(data.description || "");
        setState(Number(data.state) || 1);
        setImpact(Number(data.impact) || 2);
        setUrgency(Number(data.urgency) || 2);
        setPriority(Number(data.priority) || 3);

        // References
        if (data.assignedTo) {
          setAssignedTo({
            value: data.assignedTo.id,
            display_value: data.assignedTo.name || data.assignedTo.userName || data.assignedTo.email,
          });
        }
        if (data.assignmentGroup) {
          setAssignmentGroup({
            value: data.assignmentGroup.id,
            display_value: data.assignmentGroup.name,
          });
        }
        if (data.incident?.caller) {
          setCaller({
            value: data.incident.caller.id,
            display_value: data.incident.caller.name || data.incident.caller.userName,
          });
        } else if (data.caller_id) {
          setCaller(
            typeof data.caller_id === "object"
              ? data.caller_id
              : { value: data.caller_id, display_value: data.caller_id }
          );
        }
        if (data.cmdbCi) {
          setCmdbCi({
            value: data.cmdbCi.id,
            display_value: data.cmdbCi.name,
          });
        } else if (data.incident?.cmdbCi) {
          setCmdbCi({
            value: data.incident.cmdbCi.id,
            display_value: data.incident.cmdbCi.name,
          });
        }

        // Incident details
        if (data.incident) {
          setCategory(data.incident.category || "inquiry");
          setSubcategory(data.incident.subcategory || "");
        }
        setCloseCode(data.closeCode || data.close_code || "Solved (Permanently)");
        setCloseNotes(data.closeNotes || data.close_notes || "");

        // Activity stream notes & SLAs
        if (data.activityNotes) setActivityNotes(data.activityNotes);
        if (data.slaInstances) setSlaInstances(data.slaInstances);
      } catch (err: any) {
        console.error("Load task error:", err);
        setFormError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [tableName, recordId, isNew, currentUser]);

  // Save / Update Record
  const handleSave = async (extraPayload: Record<string, any> = {}) => {
    if (!shortDescription.trim()) {
      setFormError("Short description is mandatory");
      return;
    }
    if (state === 6 && !closeNotes.trim()) {
      setFormError("Close notes are mandatory when resolving an incident");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      short_description: shortDescription,
      description,
      state,
      impact,
      urgency,
      priority,
      caller_id: caller?.value || null,
      cmdb_ci_id: cmdbCi?.value || null,
      assignment_group_id: assignmentGroup?.value || null,
      assigned_to_id: assignedTo?.value || null,
      category,
      subcategory,
      close_code: closeCode,
      close_notes: closeNotes,
      ...extraPayload,
    };

    try {
      const url = isNew ? `/api/now/table/${tableName}` : `/api/now/table/${tableName}/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
          "x-user-name": currentUser?.name || currentUser?.userName || "Admin",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        if (res.status === 422 && errJson.incomplete_items) {
          setActiveTab("checklist");
          throw new Error(
            `SOP Gatekeeper Blocked Resolution: Incomplete mandatory steps: ${errJson.incomplete_items.join(
              ", "
            )}`
          );
        }
        throw new Error(errJson.error || "Failed to save record");
      }

      const json = await res.json();
      showToast(isNew ? "Record successfully created" : "Record updated");

      if (isNew && json.result?.sys_id) {
        router.push(`/workspace/${tableName}/${json.result.sys_id}`);
      } else if (onSaved) {
        onSaved(json.result);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFactAccepted = (field: string, value: string) => {
    if (field === "close_notes" || field === "closeNotes") {
      setCloseNotes(value);
    } else if (field === "close_code" || field === "closeCode") {
      setCloseCode(value);
    } else if (field === "description") {
      setDescription((prev) => (prev ? `${prev}\n\n[Verified Fact]: ${value}` : value));
    }
    showToast(`Incorporated verified fact into ${field}`);
  };

  // Add Activity Note
  const handleAddNote = async () => {
    if (!newNoteContent.trim() || isNew) return;
    setSubmittingNote(true);

    try {
      const res = await fetch(`/api/now/table/${tableName}/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "admin",
          "x-user-id": currentUser?.id || "",
        },
        body: JSON.stringify({
          [newNoteType]: newNoteContent,
          author_id: currentUser?.id,
        }),
      });

      if (res.ok) {
        setNewNoteContent("");
        // Reload activity notes
        const refRes = await fetch(`/api/now/table/${tableName}/${recordId}`);
        const refJson = await refRes.json();
        if (refJson.result?.activityNotes) {
          setActivityNotes(refJson.result.activityNotes);
        }
        showToast("Note posted to activity stream");
      }
    } catch (err) {
      console.error("Failed to post note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Purr-Assist AI GenAI Copilot
  const handleAiAssist = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/now/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskNumber: number,
          shortDescription,
          description,
          category,
          cmdbCi: cmdbCi?.display_value,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary || data.suggestedResolution || "AI analysis completed.");
        if (data.proposedCloseCode) setCloseCode(data.proposedCloseCode);
        if (data.proposedCloseNotes) setCloseNotes(data.proposedCloseNotes);
        showToast("AI Copilot recommendations populated");
      }
    } catch (err) {
      console.error("AI Copilot error:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  // State Chip Helper
  const getStateChipStyle = (st: number) => {
    switch (st) {
      case 1:
        return "bg-[var(--md-sys-color-state-new-bg)] text-[var(--md-sys-color-state-new-fg)] border-blue-200";
      case 2:
        return "bg-[var(--md-sys-color-state-progress-bg)] text-[var(--md-sys-color-state-progress-fg)] border-amber-200";
      case 3:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 6:
        return "bg-[var(--md-sys-color-state-resolved-bg)] text-[var(--md-sys-color-state-resolved-fg)] border-emerald-200";
      case 7:
        return "bg-[var(--md-sys-color-state-closed-bg)] text-[var(--md-sys-color-state-closed-fg)] border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStateLabel = (st: number) => {
    const labels: Record<number, string> = {
      1: "New",
      2: "In Progress",
      3: "On Hold",
      6: "Resolved",
      7: "Closed",
      8: "Canceled",
    };
    return labels[st] || `State ${st}`;
  };

  const getPriorityChipStyle = (p: number) => {
    switch (p) {
      case 1:
        return "bg-[var(--md-sys-color-p1-bg)] text-[var(--md-sys-color-p1-fg)]";
      case 2:
        return "bg-[var(--md-sys-color-p2-bg)] text-[var(--md-sys-color-p2-fg)]";
      case 3:
        return "bg-[var(--md-sys-color-p3-bg)] text-[var(--md-sys-color-p3-fg)]";
      default:
        return "bg-[var(--md-sys-color-p4-bg)] text-[var(--md-sys-color-p4-fg)]";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-[var(--md-sys-color-on-surface-variant)]">
        <div className="w-10 h-10 border-3 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium">Loading task record...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-neutral-100 text-black font-sans min-h-screen">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 border-2 border-black bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] text-xs font-mono font-bold uppercase flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Top App Bar (Swiss Grid Header)                                           */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between px-6 py-4 border-b-2 border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
        {/* Left: Navigation & Record Identity */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/workspace/${tableName}`}
            className="p-2 border-2 border-black bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase font-extrabold px-2 py-0.5 bg-black text-white">
                {tableName.toUpperCase()}
              </span>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-black">
                {number || (isNew ? `New ${tableName}` : recordId)}
              </h1>

              {/* State Pill */}
              <span className="px-2 py-0.5 font-mono text-[11px] font-bold border border-black uppercase bg-neutral-100 text-black">
                {getStateLabel(state)}
              </span>

              {/* Priority Chip */}
              <span className="px-2 py-0.5 font-mono text-[11px] font-bold border border-black uppercase bg-neutral-100 text-black">
                P{priority}
              </span>
            </div>

            <p className="text-xs font-mono text-neutral-500 mt-0.5">
              ITSM Incident • joined table inheritance on task.id
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          {/* AI Copilot Action */}
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={aiGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white hover:bg-neutral-100 text-black font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            title="Ask AI Copilot for triage & solution suggestions"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiGenerating ? "animate-spin text-amber-500" : ""}`} />
            {aiGenerating ? "Analyzing..." : "Purr-Assist AI"}
          </button>

          {/* Quick Resolve Button */}
          {state !== 6 && state !== 7 && !isNew && (
            <button
              type="button"
              onClick={() => {
                setState(6);
                showToast("Incident marked Resolved. Please enter close notes.");
              }}
              className="px-3.5 py-1.5 border-2 border-black bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
            >
              Resolve
            </button>
          )}

          {/* Primary Save Button */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 border-2 border-black bg-[#eb0029] hover:bg-black text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : isNew ? "Submit" : "Save"}
          </button>
        </div>
      </header>

      {/* Form Error Banner */}
      {formError && (
        <div className="mx-6 mt-4 p-4 border-2 border-red-600 bg-red-100 text-red-950 flex items-center justify-between text-xs font-mono font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            onClick={() => setFormError("")}
            className="p-1 hover:bg-black/10 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Suggestion Box */}
      {aiSummary && (
        <div className="mx-6 mt-4 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] text-xs font-mono">
          <div className="flex items-center gap-2 font-extrabold uppercase text-black mb-1">
            <Sparkles className="w-4 h-4 text-[#eb0029]" />
            Purr-Assist AI Insights
          </div>
          <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
            {aiSummary}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Swiss Grid Tab Bar                                                        */}
      {/* ========================================================================= */}
      <div className="px-6 border-b-2 border-black bg-neutral-100">
        <div className="flex space-x-2 overflow-x-auto py-2">
          {[
            { id: "details", label: "Record Details", icon: null, badge: null },
            { id: "stream", label: "Activity Stream", icon: MessageSquare, badge: activityNotes.length },
            { id: "related", label: "Related Lists & SLAs", icon: Layers, badge: slaInstances.length },
            { id: "attachments", label: "Attachments", icon: Paperclip, badge: null },
            { id: "checklist", label: "SOP Checklist", icon: ListChecks, badge: incompleteMandatoryCount > 0 ? incompleteMandatoryCount : null },
            { id: "evidence", label: "Evidence Ledger", icon: Sparkles, badge: null },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-2 border-black cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-black text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    : "bg-white hover:bg-neutral-100 text-black shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                {Boolean(tab.badge) && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold ${isActive ? "bg-white text-black" : "bg-black text-white"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Tab Contents                                                              */}
      {/* ========================================================================= */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
        {activeTab === "details" && (
          <div className="space-x-0 space-y-6">
            {/* Top Full Width: Short Description */}
            <M3OutlinedTextField
              label="Short Description *"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Critical database connection pool exhausted in production"
              showClear
              onClear={() => setShortDescription("")}
            />

            {/* 2-Column Responsive Form Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Foundation & Identification */}
              <div className="space-y-5">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--md-sys-color-primary)]">
                  Caller & Target Configuration
                </h3>

                {/* Number */}
                <M3OutlinedTextField
                  label="Number"
                  value={number}
                  readOnly
                  disabled
                  helperText="Generated atomically by sys_number counter"
                />

                {/* Caller Reference Field */}
                <ReferenceField
                  label="Caller"
                  targetTable="sys_user"
                  value={caller}
                  onChange={(val) => setCaller(val)}
                  required
                  helperText="Search sys_user by name or email"
                />

                {/* Category */}
                <div className="relative flex flex-col font-sans">
                  <div className="relative flex items-center min-h-[56px] px-4 rounded-[8px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]">
                    <label className="absolute -top-2.5 left-4 px-1 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-primary)]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none pt-2 cursor-pointer"
                    >
                      <option value="inquiry">Inquiry / Help</option>
                      <option value="software">Software Application</option>
                      <option value="hardware">Hardware / Server</option>
                      <option value="network">Network & Firewall</option>
                      <option value="database">Database & Storage</option>
                      <option value="security">Security Vulnerability</option>
                    </select>
                  </div>
                </div>

                {/* Subcategory */}
                <M3OutlinedTextField
                  label="Subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. DNS resolution, SSL cert, disk space"
                />

                {/* Configuration Item Reference Field */}
                <ReferenceField
                  label="Configuration Item (cmdb_ci)"
                  targetTable="cmdb_ci"
                  value={cmdbCi}
                  onChange={(val) => setCmdbCi(val)}
                  helperText="Link target server, database, or service"
                />
              </div>

              {/* Right Column: Assignment & ITIL States */}
              <div className="space-y-5">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--md-sys-color-primary)]">
                  State, Priority & Routing
                </h3>

                {/* State Dropdown */}
                <div className="relative flex flex-col font-sans">
                  <div className="relative flex items-center min-h-[56px] px-4 rounded-[8px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]">
                    <label className="absolute -top-2.5 left-4 px-1 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-primary)]">
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(Number(e.target.value))}
                      className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none pt-2 cursor-pointer font-medium"
                    >
                      <option value={1}>1 - New</option>
                      <option value={2}>2 - In Progress</option>
                      <option value={3}>3 - On Hold</option>
                      <option value={6}>6 - Resolved</option>
                      <option value={7}>7 - Closed</option>
                      <option value={8}>8 - Canceled</option>
                    </select>
                  </div>
                </div>

                {/* Impact x Urgency Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative flex flex-col font-sans">
                    <div className="relative flex items-center min-h-[56px] px-3 rounded-[8px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
                      <label className="absolute -top-2.5 left-3 px-1 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-primary)]">
                        Impact
                      </label>
                      <select
                        value={impact}
                        onChange={(e) => handleImpactChange(Number(e.target.value))}
                        className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none pt-2 cursor-pointer"
                      >
                        <option value={1}>1 - High</option>
                        <option value={2}>2 - Medium</option>
                        <option value={3}>3 - Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative flex flex-col font-sans">
                    <div className="relative flex items-center min-h-[56px] px-3 rounded-[8px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
                      <label className="absolute -top-2.5 left-3 px-1 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-primary)]">
                        Urgency
                      </label>
                      <select
                        value={urgency}
                        onChange={(e) => handleUrgencyChange(Number(e.target.value))}
                        className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none pt-2 cursor-pointer"
                      >
                        <option value={1}>1 - High</option>
                        <option value={2}>2 - Medium</option>
                        <option value={3}>3 - Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Calculated Priority */}
                <M3OutlinedTextField
                  label="Calculated Priority"
                  value={`P${priority} - ${
                    priority === 1
                      ? "Critical (Major Incident)"
                      : priority === 2
                      ? "High"
                      : priority === 3
                      ? "Moderate"
                      : "Low"
                  }`}
                  readOnly
                  disabled
                  helperText="Derived from ITIL Impact x Urgency matrix"
                />

                {/* Assignment Group Reference Field */}
                <ReferenceField
                  label="Assignment Group"
                  targetTable="sys_user_group"
                  value={assignmentGroup}
                  onChange={(val) => {
                    setAssignmentGroup(val);
                    // Clear assigned to if group changed to prevent mismatch
                    setAssignedTo(null);
                  }}
                  helperText="Direct group queue ownership"
                />

                {/* Assigned To Reference Field with DYNAMIC REFERENCE QUALIFIER */}
                <ReferenceField
                  label="Assigned To"
                  targetTable="sys_user"
                  value={assignedTo}
                  onChange={(val) => setAssignedTo(val)}
                  dependentField={assignmentGroup ? "assignment_group" : undefined}
                  dependentValue={assignmentGroup ? assignmentGroup.value : undefined}
                  dependentLabel="Assignment Group"
                  dependentDisplayValue={assignmentGroup ? assignmentGroup.display_value : undefined}
                  helperText={
                    assignmentGroup
                      ? `Filtered by members of ${assignmentGroup.display_value}`
                      : "Select an assignment group first to filter eligible assignees"
                  }
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="relative flex flex-col font-sans">
              <div className="relative p-4 rounded-[8px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]">
                <label className="absolute -top-2.5 left-4 px-1 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-primary)]">
                  Detailed Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none resize-y placeholder:text-[var(--md-sys-color-on-surface-variant)]/60"
                  placeholder="Provide technical symptoms, error traces, reproduction steps, or diagnostic output..."
                />
              </div>
            </div>

            {/* Resolution Section: Visible or Mandated on Resolve */}
            {(state === 6 || state === 7) && (
              <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolution Information (Mandated on State = Resolved)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative flex flex-col font-sans">
                    <div className="relative flex items-center min-h-[56px] px-4 rounded-[8px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
                      <label className="absolute -top-2.5 left-4 px-1 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-primary)]">
                        Close Code *
                      </label>
                      <select
                        value={closeCode}
                        onChange={(e) => setCloseCode(e.target.value)}
                        className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none pt-2 cursor-pointer"
                      >
                        <option value="Solved (Permanently)">Solved (Permanently)</option>
                        <option value="Solved (Workaround)">Solved (Workaround)</option>
                        <option value="Not Solved (Not Reproducible)">Not Solved (Not Reproducible)</option>
                        <option value="Closed / Resolved by Caller">Closed / Resolved by Caller</option>
                      </select>
                    </div>
                  </div>

                  <M3OutlinedTextField
                    label="Close Notes *"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Describe how the issue was fixed..."
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Stream Tab */}
        {activeTab === "stream" && (
          <div className="space-y-6 max-w-4xl">
            {/* Note Input Box */}
            <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-[var(--md-sys-elevation-1)]">
              <div className="flex items-center space-x-3 mb-3">
                <button
                  type="button"
                  onClick={() => setNewNoteType("work_note")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    newNoteType === "work_note"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                >
                  Work Notes (Internal Fulfillers)
                </button>
                <button
                  type="button"
                  onClick={() => setNewNoteType("customer_comment")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    newNoteType === "customer_comment"
                      ? "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-tertiary)]"
                      : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                >
                  Customer Comments (Public to Caller)
                </button>
              </div>

              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                placeholder={
                  newNoteType === "work_note"
                    ? "Add internal technical troubleshooting findings..."
                    : "Add note visible to the caller..."
                }
                className="w-full p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)]"
              />

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={submittingNote || !newNoteContent.trim() || isNew}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)] disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingNote ? "Posting..." : "Post Note"}
                </button>
              </div>
            </div>

            {/* Note Timeline */}
            <div className="space-y-4">
              {activityNotes.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
                  No activity stream notes recorded yet.
                </div>
              ) : (
                activityNotes.map((note) => {
                  const isWorkNote = note.noteType === "work_note";
                  return (
                    <div
                      key={note.id}
                      className={`p-4 rounded-2xl border text-sm transition-all ${
                        isWorkNote
                          ? "bg-amber-50/60 border-amber-200 text-amber-950"
                          : "bg-[var(--md-sys-color-tertiary-container)]/30 border-[var(--md-sys-color-tertiary)]/30 text-[var(--md-sys-color-on-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2 text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                          {note.author?.name || "System Automation"}
                        </span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{note.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Related Lists & SLAs Tab */}
        {activeTab === "related" && (
          <div className="space-y-6">
            {/* SLA Instances */}
            <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] shadow-[var(--md-sys-elevation-1)]">
              <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                Service Level Agreements (task_sla)
              </h3>

              {slaInstances.length === 0 ? (
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  No active SLA attached to this incident.
                </p>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                      <th className="py-2.5 px-3">SLA Definition</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Breach Deadline</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                    {slaInstances.map((inst) => {
                      const isBreached = new Date() > new Date(inst.breachTime);
                      return (
                        <tr key={inst.id}>
                          <td className="py-3 px-3 font-medium text-[var(--md-sys-color-on-surface)]">
                            {inst.slaDefinition?.name || "Standard Incident SLA"}
                          </td>
                          <td className="py-3 px-3 text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                            {inst.stage || "resolution"}
                          </td>
                          <td className="py-3 px-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                            {new Date(inst.breachTime).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isBreached
                                  ? "bg-red-100 text-red-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isBreached ? "Breached" : "In Progress"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Linked Configuration Item Details */}
            {cmdbCi && (
              <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] shadow-[var(--md-sys-elevation-1)]">
                <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-2">
                  <Server className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  Configuration Item Details: {cmdbCi.display_value}
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-4">
                  Foreign key reference to cmdb_ci with relational dependency inspection.
                </p>
                <div className="flex gap-2">
                  <a
                    href={`/cmdb`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]"
                  >
                    Inspect in CMDB Dependency Map
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "attachments" && (
          <div className="space-y-4">
            <AttachmentZone tableName={tableName} recordId={recordId} />
          </div>
        )}

        {activeTab === "checklist" && (
          <div className="space-y-6">
            <TaskChecklist
              taskId={recordId}
              isNew={isNew}
              onIncompleteMandatoryChange={setIncompleteMandatoryCount}
            />
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-6">
            <TaskEvidenceLedger
              taskId={recordId}
              isNew={isNew}
              onFactAccepted={handleFactAccepted}
            />
          </div>
        )}
      </main>
    </div>
  );
}
