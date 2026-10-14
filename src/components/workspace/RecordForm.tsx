"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { SlaBadge } from "./SlaBadge";
import { ActivityStream } from "./ActivityStream";
import { computeUiPolicies, UiPolicy } from "@/lib/ui-policy-engine";
import { ContextMenu, ContextMenuItem } from "@/components/common/ContextMenu";
import { ShowRecordPayloadModal } from "@/components/common/ShowRecordPayloadModal";
import {
  Save,
  CheckCircle,
  UserCheck,
  ArrowLeft,
  AlertTriangle,
  Server,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  Cat,
  Copy,
  RefreshCw,
  Code2,
  Settings,
  Check,
  Bot,
  History,
  Paperclip,
  GitPullRequest,
} from "lucide-react";
import { AttachmentZone } from "@/components/common/AttachmentZone";
import { ChangeTasksList } from "@/components/workspace/ChangeTasksList";

interface RecordFormProps {
  tableName: string;
  recordId: string; // "new" or a sys_id
}

export function RecordForm({ tableName, recordId }: RecordFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isNew = recordId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "history" | "related" | "resolution" | "attachments" | "change_tasks">("notes");

  // Context menu and payload modal state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
    title?: string;
  }>({ isOpen: false, x: 0, y: 0, items: [] });
  const [payloadModal, setPayloadModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [rawRecord, setRawRecord] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Dynamic UI Policy & Business Rule state
  const [uiPolicies, setUiPolicies] = useState<UiPolicy[]>([]);
  const [formError, setFormError] = useState("");
  const [ruleAlert, setRuleAlert] = useState<string | null>(null);

  // Form State
  const [number, setNumber] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState(1);
  const [impact, setImpact] = useState(2);
  const [urgency, setUrgency] = useState(2);
  const [priority, setPriority] = useState(3);
  const [assignedToId, setAssignedToId] = useState("");
  const [assignmentGroupId, setAssignmentGroupId] = useState("");
  const [callerName, setCallerName] = useState("");
  const [category, setCategory] = useState("inquiry");
  const [subcategory, setSubcategory] = useState("");
  const [cmdbCiId, setCmdbCiId] = useState("");
  const [closeCode, setCloseCode] = useState("Solved (Permanently)");
  const [closeNotes, setCloseNotes] = useState("");

  // Relational Lookups & Dictionary Schema
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [cis, setCis] = useState<any[]>([]);
  const [activityNotes, setActivityNotes] = useState<any[]>([]);
  const [slaInstances, setSlaInstances] = useState<any[]>([]);
  const [changeDetails, setChangeDetails] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  // Audit History state (sys_audit)
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  // Client Scripts state (sys_script_client)
  const [clientScripts, setClientScripts] = useState<any[]>([]);
  const [clientMessages, setClientMessages] = useState<Array<{ type: "info" | "error"; text: string }>>([]);
  const [scriptOverrides, setScriptOverrides] = useState<
    Record<string, { mandatory?: boolean; readOnly?: boolean; visible?: boolean }>
  >({});
  const [ranOnLoad, setRanOnLoad] = useState(false);

  // Purr-Assist AI state (Enterprise GenAI)
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const loadAuditHistory = async () => {
    if (isNew) return;
    try {
      const res = await fetch(`/api/now/table/${tableName}/${recordId}/history`, {
        headers: { "x-user-role": currentUser.role },
      });
      const data = await res.json();
      if (data.result) setAuditHistory(data.result);
    } catch (e) {
      console.error("Audit history load error:", e);
    }
  };

  useEffect(() => {
    // Load lookup data, schema columns, dynamic UI policies & Client Scripts
    Promise.all([
      fetch("/api/now/table/sys_user").then((r) => r.json()),
      fetch("/api/now/table/sys_user_group").then((r) => r.json()),
      fetch("/api/now/table/cmdb_ci").then((r) => r.json()),
      fetch(`/api/now/ui-policies?table=${tableName}`).then((r) => r.json()),
      fetch(`/api/now/schema?table=${tableName}`).then((r) => r.json()),
      fetch(`/api/now/client-scripts?table=${tableName}`).then((r) => r.json()),
    ]).then(([uData, gData, ciData, polData, schemaData, csData]) => {
      if (uData.result) setUsers(uData.result);
      if (gData.result) setGroups(gData.result);
      if (ciData.result) setCis(ciData.result);
      if (polData.result) setUiPolicies(polData.result);
      if (schemaData.result?.columns) setTableColumns(schemaData.result.columns);
      if (csData.result) setClientScripts(csData.result);
    });

    if (!isNew) {
      loadAuditHistory();
      fetch(`/api/now/table/${tableName}/${recordId}`, {
        headers: { "x-user-role": currentUser.role },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.result) {
            const r = data.result;
            setRawRecord(r);
            setNumber(r.number || "");
            setShortDescription(r.shortDescription || r.short_description || "");
            setDescription(r.description || "");
            setState(r.state || 1);
            setImpact(r.impact || 2);
            setUrgency(r.urgency || 2);
            setPriority(r.priority || 3);
            setAssignedToId(r.assignedToId || r.assigned_to_id || "");
            setAssignmentGroupId(r.assignmentGroupId || r.assignment_group_id || "");
            setCloseCode(r.closeCode || r.close_code || "Solved (Permanently)");
            setCloseNotes(r.closeNotes || r.close_notes || "");
            setActivityNotes(r.activityNotes || []);
            setSlaInstances(r.slaInstances || []);
            setApprovals(r.approvals || []);

            let customVals: Record<string, any> = {};
            if (r.dynamicFields) {
              try {
                customVals = JSON.parse(r.dynamicFields);
              } catch {}
            }
            for (const [k, v] of Object.entries(r)) {
              if (k.startsWith("u_")) customVals[k] = v;
            }
            setCustomFields(customVals);

            if (r.incident) {
              setCallerName(r.incident.callerName || "");
              setCategory(r.incident.category || "inquiry");
              setSubcategory(r.incident.subcategory || "");
              setCmdbCiId(r.incident.cmdbCiId || "");
            }

            if (r.changeRequest) {
              setChangeDetails(r.changeRequest);
              setCmdbCiId(r.changeRequest.cmdbCiId || "");
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [tableName, recordId, isNew, currentUser.role]);

  // Client Script Standard g_form Engine
  const createGForm = () => {
    return {
      getTableName: () => tableName,
      getUniqueValue: () => (isNew ? "" : recordId),
      isNewRecord: () => isNew,
      getValue: (field: string) => {
        if (field === "number") return number;
        if (field === "short_description" || field === "shortDescription") return shortDescription;
        if (field === "description") return description;
        if (field === "state") return String(state);
        if (field === "priority") return String(priority);
        if (field === "impact") return String(impact);
        if (field === "urgency") return String(urgency);
        if (field === "category") return category;
        if (field === "subcategory") return subcategory;
        if (field === "caller" || field === "caller_id" || field === "caller_name" || field === "callerName") return callerName;
        if (field === "close_notes" || field === "closeNotes") return closeNotes;
        if (field === "close_code" || field === "closeCode") return closeCode;
        if (field === "assigned_to" || field === "assignedToId") return assignedToId;
        if (field === "assignment_group" || field === "assignmentGroupId") return assignmentGroupId;
        if (field === "cmdb_ci" || field === "cmdbCiId") return cmdbCiId;
        return customFields[field] !== undefined ? String(customFields[field]) : "";
      },
      setValue: (field: string, val: any) => {
        if (field === "number") setNumber(String(val));
        else if (field === "short_description" || field === "shortDescription") setShortDescription(String(val));
        else if (field === "description") setDescription(String(val));
        else if (field === "state") setState(Number(val));
        else if (field === "priority") setPriority(Number(val));
        else if (field === "impact") setImpact(Number(val));
        else if (field === "urgency") setUrgency(Number(val));
        else if (field === "category") setCategory(String(val));
        else if (field === "subcategory") setSubcategory(String(val));
        else if (field === "caller" || field === "caller_id" || field === "caller_name" || field === "callerName") setCallerName(String(val));
        else if (field === "close_notes" || field === "closeNotes") setCloseNotes(String(val));
        else if (field === "close_code" || field === "closeCode") setCloseCode(String(val));
        else if (field === "assigned_to" || field === "assignedToId") setAssignedToId(String(val));
        else if (field === "assignment_group" || field === "assignmentGroupId") setAssignmentGroupId(String(val));
        else if (field === "cmdb_ci" || field === "cmdbCiId") setCmdbCiId(String(val));
        else setCustomFields((prev) => ({ ...prev, [field]: val }));
      },
      setMandatory: (field: string, mandatory: boolean) => {
        setScriptOverrides((prev) => ({
          ...prev,
          [field]: { ...prev[field], mandatory },
        }));
      },
      setReadOnly: (field: string, readOnly: boolean) => {
        setScriptOverrides((prev) => ({
          ...prev,
          [field]: { ...prev[field], readOnly },
        }));
      },
      setVisible: (field: string, visible: boolean) => {
        setScriptOverrides((prev) => ({
          ...prev,
          [field]: { ...prev[field], visible },
        }));
      },
      addErrorMessage: (text: string) => {
        setClientMessages((prev) => [...prev, { type: "error", text }]);
      },
      addInfoMessage: (text: string) => {
        setClientMessages((prev) => [...prev, { type: "info", text }]);
      },
      clearMessages: () => {
        setClientMessages([]);
      },
    };
  };

  const runClientScript = async (script: any, args: any[]) => {
    try {
      const allowedTypes = ["onLoad", "onChange", "onSubmit"];
      if (!allowedTypes.includes(script.type)) {
        console.warn("Invalid client script type:", script.type);
        return;
      }

      const fn = new Function(
        "g_form",
        "oldValue",
        "newValue",
        "scriptType",
        `"use strict";
        try {
          // Shield sensitive browser globals
          const window = undefined;
          const document = undefined;
          const fetch = undefined;
          const localStorage = undefined;
          const sessionStorage = undefined;

          ${script.scriptBody}

          if (scriptType === "onLoad" && typeof onLoad === "function") {
            return onLoad(g_form);
          } else if (scriptType === "onChange" && typeof onChange === "function") {
            return onChange(g_form, oldValue, newValue);
          } else if (scriptType === "onSubmit" && typeof onSubmit === "function") {
            return onSubmit(g_form);
          }
        } catch (err) {
          console.error("Error executing client script (" + (scriptType || "") + "):", err);
        }`
      );
      return await fn(args[0], args[1], args[2], script.type);
    } catch (err) {
      console.error("Client Script compilation error (" + (script.name || "") + "):", err);
    }
  };

  const triggerClientChange = (fieldName: string, oldValue: any, newValue: any) => {
    const g_form = createGForm();
    const matching = clientScripts.filter(
      (s) => s.active && s.type === "onChange" && s.fieldName === fieldName
    );
    for (const script of matching) {
      runClientScript(script, [g_form, oldValue, newValue]);
    }
  };

  // Run onLoad Client Scripts
  useEffect(() => {
    if (!loading && clientScripts.length > 0 && !ranOnLoad) {
      const g_form = createGForm();
      clientScripts
        .filter((s) => s.active && s.type === "onLoad")
        .forEach((s) => runClientScript(s, [g_form]));
      setRanOnLoad(true);
    }
  }, [loading, clientScripts, ranOnLoad]);

  // Purr-Assist AI Handoff & Resolution Engine
  const handlePurrAssist = async (action: "summarize" | "propose_resolution") => {
    setAiLoading(action);
    try {
      const res = await fetch("/api/now/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          record: {
            number,
            shortDescription,
            description,
            category,
            priority,
            state,
            activityNotes,
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        if (action === "summarize") {
          const summary = data.result.summary;
          if (!isNew) {
            await fetch(`/api/now/table/${tableName}/${recordId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", "x-user-role": currentUser.role },
              body: JSON.stringify({ work_note: summary, author_id: currentUser.id }),
            });
            setActivityNotes((prev) => [
              {
                id: "ai-" + Date.now(),
                noteType: "work_note",
                content: summary,
                author: { name: "Purr-Assist AI ✨" },
                createdAt: new Date(),
              },
              ...prev,
            ]);
          }
          showToast("🐱 Purr-Assist AI handoff summary stamped to Work Notes!");
          setActiveTab("notes");
        } else if (action === "propose_resolution") {
          if (data.result.closeNotes) setCloseNotes(data.result.closeNotes);
          if (data.result.closeCode) setCloseCode(data.result.closeCode);
          const summary = data.result.summary;
          if (!isNew) {
            await fetch(`/api/now/table/${tableName}/${recordId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", "x-user-role": currentUser.role },
              body: JSON.stringify({
                work_note: summary,
                close_notes: data.result.closeNotes,
                close_code: data.result.closeCode,
                author_id: currentUser.id,
              }),
            });
            setActivityNotes((prev) => [
              {
                id: "ai-" + Date.now(),
                noteType: "work_note",
                content: summary,
                author: { name: "Purr-Assist AI ✨" },
                createdAt: new Date(),
              },
              ...prev,
            ]);
          }
          showToast("🐱 Purr-Assist AI proposed resolution applied & logged!");
          setActiveTab("resolution");
        }
      }
    } catch (err) {
      console.error("Purr-Assist error:", err);
    } finally {
      setAiLoading(null);
    }
  };

  // Dynamically compute form field states using active UI Policies + Client Script overrides
  const formValues: Record<string, any> = {
    ...customFields,
    number,
    state,
    category,
    subcategory,
    impact,
    urgency,
    priority,
    caller_name: callerName,
    callerName,
    short_description: shortDescription,
    shortDescription,
    description,
    assigned_to: assignedToId,
    assigned_to_id: assignedToId,
    assignedToId,
    assignment_group: assignmentGroupId,
    assignment_group_id: assignmentGroupId,
    assignmentGroupId,
    cmdb_ci: cmdbCiId,
    cmdb_ci_id: cmdbCiId,
    cmdbCiId,
    close_notes: closeNotes,
    closeNotes,
    close_code: closeCode,
    closeCode,
    risk: changeDetails?.risk,
  };
  const { fields: uiPolicyFields, triggeredPolicies } = computeUiPolicies(uiPolicies, formValues);

  // Combined UI Policy + Client Script field attributes
  const effectiveFields: Record<string, { mandatory?: boolean; readOnly?: boolean; visible?: boolean }> = {
    ...uiPolicyFields,
  };
  for (const [k, v] of Object.entries(scriptOverrides)) {
    effectiveFields[k] = {
      ...effectiveFields[k],
      mandatory: v.mandatory !== undefined ? v.mandatory : effectiveFields[k]?.mandatory,
      readOnly: v.readOnly !== undefined ? v.readOnly : effectiveFields[k]?.readOnly,
      visible: v.visible !== undefined ? v.visible : effectiveFields[k]?.visible,
    };
  }

  // Recalculate priority automatically on impact/urgency change
  const handleImpactUrgencyChange = (newImpact: number, newUrgency: number) => {
    const oldP = priority;
    setImpact(newImpact);
    setUrgency(newUrgency);
    let newP = 3;
    if (newImpact === 1 && newUrgency === 1) newP = 1;
    else if ((newImpact === 1 && newUrgency === 2) || (newImpact === 2 && newUrgency === 1)) newP = 2;
    else if ((newImpact === 1 && newUrgency === 3) || (newImpact === 2 && newUrgency === 2) || (newImpact === 3 && newUrgency === 1)) newP = 3;
    else if ((newImpact === 2 && newUrgency === 3) || (newImpact === 3 && newUrgency === 2)) newP = 4;
    else newP = 5;
    setPriority(newP);
    triggerClientChange("priority", String(oldP), String(newP));
    triggerClientChange("impact", String(impact), String(newImpact));
    triggerClientChange("urgency", String(urgency), String(newUrgency));
  };

  const handleSave = async (extraPayload: any = {}) => {
    // Run Client Script onSubmit hooks
    const g_form = createGForm();
    for (const script of clientScripts.filter((s) => s.active && s.type === "onSubmit")) {
      const allowed = await runClientScript(script, [g_form]);
      if (allowed === false) {
        setFormError(`🐱 Client Script '${script.name}' aborted form submission.`);
        return;
      }
    }

    // Dynamic UI Policy and Client Script mandatory validations
    const effectiveValues = { ...formValues, ...extraPayload };
    for (const [fieldName, uiState] of Object.entries(effectiveFields)) {
      if (uiState.mandatory) {
        const val = effectiveValues[fieldName];
        if (val === undefined || val === null || String(val).trim() === "") {
          const displayLabel = fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          setFormError(`🐱 Mandatory Policy Enforced: '${displayLabel}' is required under active rules!`);
          if (fieldName.includes("close")) setActiveTab("resolution");
          return;
        }
      }
    }

    const effectiveState = extraPayload.state !== undefined ? extraPayload.state : state;
    const effectiveCloseNotes = extraPayload.close_notes !== undefined ? extraPayload.close_notes : closeNotes;
    const effectiveCloseCode = extraPayload.close_code !== undefined ? extraPayload.close_code : closeCode;

    if (effectiveState === 6) {
      if (!effectiveCloseNotes || !effectiveCloseNotes.trim()) {
        setFormError("🐱 Mandatory Policy Enforced: Resolution Notes ('close_notes') are required when state is Resolved!");
        setActiveTab("resolution");
        return;
      }
      if (!effectiveCloseCode || !effectiveCloseCode.trim()) {
        setFormError("🐱 Mandatory Policy Enforced: Resolution Code ('close_code') is required when state is Resolved!");
        setActiveTab("resolution");
        return;
      }
    }

    setFormError("");
    setSaving(true);
    try {
      const payload = {
        ...customFields,
        short_description: shortDescription,
        description,
        state,
        impact,
        urgency,
        priority,
        assigned_to_id: assignedToId || null,
        assignment_group_id: assignmentGroupId || null,
        category,
        subcategory: subcategory || null,
        cmdb_ci_id: cmdbCiId || null,
        close_code: closeCode,
        close_notes: closeNotes,
        caller_name: callerName || currentUser.name,
        ...extraPayload,
      };

      if (isNew) {
        const res = await fetch(`/api/now/table/${tableName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const executed = data.executedRules || data.result?.executedRules;
        if (executed && executed.length > 0) {
          setRuleAlert(`🐾 ServiceMeow Business Rules Executed: ${executed.map((r: any) => r.name).join(", ")}`);
        }
        if (data.result?.sys_id) {
          router.push(`/workspace/${tableName}/${data.result.sys_id}`);
        }
      } else {
        const res = await fetch(`/api/now/table/${tableName}/${recordId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": currentUser.role,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          const executed = data.executedRules || data.result?.executedRules;
          if (executed && executed.length > 0) {
            setRuleAlert(`🐾 ServiceMeow Business Rules Executed: ${executed.map((r: any) => r.name).join(", ")}`);
            setTimeout(() => setRuleAlert(null), 6000);
          }
          await loadAuditHistory();
          router.refresh();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignToMe = () => {
    setAssignedToId(currentUser.id);
    handleSave({ assigned_to_id: currentUser.id, work_note: `Self-assigned ticket to ${currentUser.name}` });
  };

  const handleResolve = () => {
    setState(6);
    if (!closeNotes.trim()) {
      setActiveTab("resolution");
      setFormError("🐱 ServiceMeow UI Policy Enforced: Resolution Notes are mandatory to resolve. Please fill in resolution details.");
      return;
    }
    handleSave({
      state: 6,
      close_code: closeCode,
      close_notes: closeNotes,
      customer_comment: `Ticket marked as Resolved. Solution: ${closeNotes}`,
    });
  };

  const handleCabApproval = async (decision: "approved" | "rejected") => {
    if (approvals.length === 0) return;
    const approvalId = approvals[0].id;
    await fetch(`/api/now/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: decision, comments: `Decision confirmed by ${currentUser.name}` }),
    });
    router.refresh();
  };

  const handleFormContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems: ContextMenuItem[] = [
      {
        label: "Save",
        icon: Save,
        onClick: () => handleSave(),
      },
      {
        label: "Reload Form",
        icon: RefreshCw,
        onClick: () => router.refresh(),
      },
      { divider: true, label: "" },
      {
        label: "Copy sys_id",
        icon: Copy,
        disabled: isNew,
        onClick: () => {
          navigator.clipboard.writeText(recordId);
          showToast(`Copied sys_id (${recordId.substring(0, 12)}...)`);
        },
      },
      {
        label: "Copy URL",
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(window.location.href);
          showToast("Copied Form URL to clipboard");
        },
      },
      {
        label: "Show XML / JSON Payload",
        icon: Code2,
        disabled: isNew,
        onClick: () => setPayloadModal(true),
      },
      ...(currentUser.role === "admin"
        ? [
            { divider: true, label: "" },
            {
              label: "Configure",
              icon: Settings,
              children: [
                {
                  label: "Form UI Policies",
                  onClick: () => router.push(`/studio?tab=ui_policies&table=${tableName}`),
                },
                {
                  label: "Business Rules",
                  onClick: () => router.push(`/studio?tab=business_rules&table=${tableName}`),
                },
                {
                  label: "Table Dictionary",
                  onClick: () => router.push(`/studio?tab=schema&table=${tableName}`),
                },
              ],
            },
          ]
        : []),
    ];

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      items: menuItems,
      title: `${number || "Form"} Header Context`,
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading record from ServiceMeow Table API...
      </div>
    );
  }

  return (
    <div
      className="p-6 min-h-screen space-y-5 relative"
      style={{
        backgroundColor: "var(--theme-page-bg, #f8f9fa)",
        color: "var(--theme-text-primary, #1f1f1f)",
      }}
    >
      {/* Top Banner & Header Action Bar with Right-Click Context Menu (M3 Outlined Card: rounded-[16px]) */}
      <div
        onContextMenu={handleFormContextMenu}
        className="p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] flex flex-col md:flex-row md:items-center justify-between gap-4 select-none cursor-default"
        style={{
          backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
        }}
      >
        <div className="flex items-center space-x-3.5">
          <Link
            href={`/workspace/${tableName}`}
            className="p-2 border rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold font-mono tracking-tight text-[var(--md-sys-color-on-surface)]">
                {isNew ? `New ${tableName.replace("_", " ")}` : number}
              </h1>
              {!isNew && (
                <>
                  <span
                    className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium border"
                    style={{
                      backgroundColor:
                        state === 6
                          ? "var(--md-sys-color-state-resolved-bg, #dcfce7)"
                          : state === 2
                          ? "var(--md-sys-color-state-progress-bg, #fef3c7)"
                          : "var(--md-sys-color-state-new-bg, #e0f2fe)",
                      color:
                        state === 6
                          ? "var(--md-sys-color-state-resolved-fg, #15803d)"
                          : state === 2
                          ? "var(--md-sys-color-state-progress-fg, #92400e)"
                          : "var(--md-sys-color-state-new-fg, #0369a1)",
                      borderColor: "transparent",
                    }}
                  >
                    {state === 1 ? "New" : state === 2 ? "In Progress" : state === 3 ? "On Hold" : state === 6 ? "Resolved" : "Closed"}
                  </span>

                  <span
                    className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium border"
                    style={{
                      backgroundColor:
                        priority === 1
                          ? "var(--md-sys-color-p1-bg, #fee2e2)"
                          : priority === 2
                          ? "var(--md-sys-color-p2-bg, #ffedd5)"
                          : "var(--md-sys-color-p3-bg, #fef9c3)",
                      color:
                        priority === 1
                          ? "var(--md-sys-color-p1-fg, #991b1b)"
                          : priority === 2
                          ? "var(--md-sys-color-p2-fg, #9a3412)"
                          : "var(--md-sys-color-p3-fg, #854d0e)",
                      borderColor: "transparent",
                    }}
                  >
                    Priority {priority}
                  </span>
                </>
              )}
            </div>
            <p
              className="text-xs truncate max-w-xl mt-0.5"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            >
              {shortDescription || "Unsaved ITIL draft"}
            </p>
          </div>
        </div>

        {/* Action Buttons (M3 Pill Buttons) */}
        <div className="flex items-center space-x-2 shrink-0">
          {!isNew && state !== 6 && state !== 7 && (
            <>
              <button
                type="button"
                onClick={handleAssignToMe}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                  color: "var(--md-sys-color-on-surface, #1d1b20)",
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign to Me</span>
              </button>

              <button
                type="button"
                onClick={handleResolve}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all shadow-xs"
                style={{
                  backgroundColor: "var(--md-sys-color-secondary-container, #dbe2f9)",
                  color: "var(--md-sys-color-on-secondary-container, #141b2c)",
                }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            </>
          )}

          {/* CAB Approval buttons if Change Request and Approver */}
          {changeDetails && approvals.length > 0 && approvals[0].state === "requested" && (
            <div
              className="flex items-center space-x-1.5 pl-2 border-l"
              style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            >
              <button
                type="button"
                onClick={() => handleCabApproval("approved")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full text-xs shadow-xs"
              >
                Approve (CAB)
              </button>
              <button
                type="button"
                onClick={() => handleCabApproval("rejected")}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full text-xs shadow-xs"
              >
                Reject (CAB)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 font-medium rounded-full text-xs transition-all shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] disabled:opacity-50"
            style={{
              backgroundColor: "var(--md-sys-color-primary, #0b57d0)",
              color: "var(--md-sys-color-on-primary, #ffffff)",
            }}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Record"}</span>
          </button>
        </div>
      </div>

      {/* Purr-Assist AI Action Bar (M3 Tertiary Container Card: rounded-[16px]) */}
      <div
        className="p-4 rounded-[16px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: "var(--md-sys-color-tertiary-container, #fbd7fc)",
          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          color: "var(--md-sys-color-on-tertiary-container, #29132d)",
        }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--md-sys-color-tertiary, #715573)",
              color: "#ffffff",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span>Purr-Assist AI Copilot</span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                }}
              >
                M3 Generative Intelligence
              </span>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              Generative triage intelligence: handoff summarization & autonomous resolution proposals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={aiLoading !== null}
            onClick={() => handlePurrAssist("summarize")}
            className="px-4 py-2 rounded-full font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            style={{
              backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
              color: "var(--md-sys-color-on-surface, #1d1b20)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiLoading === "summarize" ? "Analyzing..." : "Summarize Handoff"}</span>
          </button>
          <button
            type="button"
            disabled={aiLoading !== null}
            onClick={() => handlePurrAssist("propose_resolution")}
            className="px-4 py-2 rounded-full font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            style={{
              backgroundColor: "var(--md-sys-color-primary, #0b57d0)",
              color: "var(--md-sys-color-on-primary, #ffffff)",
            }}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{aiLoading === "propose_resolution" ? "Generating..." : "Generate Resolution"}</span>
          </button>
        </div>
      </div>

      {/* Client Script Messages Banner */}
      {clientMessages.map((msg, idx) => (
        <div
          key={idx}
          className={`p-3 rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in ${
            msg.type === "error"
              ? "bg-rose-50 border border-rose-300 text-rose-800"
              : "bg-blue-50 border border-blue-300 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-semibold">{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setClientMessages((prev) => prev.filter((_, i) => i !== idx))}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Alert Banners: Validation Errors, Business Rules Feedback, Active UI Policies */}
      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError("")}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {ruleAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <Cat className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{ruleAlert}</span>
        </div>
      )}

      {triggeredPolicies.length > 0 && (
        <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="font-semibold">Dynamic UI Policies Active:</span>
            <div className="flex flex-wrap gap-1.5">
              {triggeredPolicies.map((p) => (
                <span
                  key={p.id}
                  className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-purple-600 font-mono hidden sm:inline">sys_ui_policy</span>
        </div>
      )}

      {/* SLA Status Widget if present */}
      {!isNew && slaInstances.length > 0 && (
        <SlaBadge slaInstance={slaInstances[0]} />
      )}

      {/* 2-Column ITIL Form (M3 Outlined Container Card: rounded-[16px]) */}
      <div
        className="p-6 rounded-[16px] border shadow-[var(--md-sys-elevation-1)] space-y-5"
        style={{
          backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider border-b pb-2"
          style={{
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
            color: "var(--md-sys-color-primary, #0b57d0)",
          }}
        >
          General Record Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left Column */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number</label>
              <input
                type="text"
                disabled
                value={number || "Auto-assigned upon creation"}
                className="w-full bg-slate-100 border rounded px-2.5 py-1.5 font-mono text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Caller / Requester <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={uiPolicyFields.caller_name?.readOnly}
                value={callerName}
                onChange={(e) => {
                  const nv = e.target.value;
                  triggerClientChange("caller_name", callerName, nv);
                  setCallerName(nv);
                }}
                placeholder="e.g. Alex Chen"
                className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                disabled={uiPolicyFields.category?.readOnly}
                value={category}
                onChange={(e) => {
                  const nc = e.target.value;
                  triggerClientChange("category", category, nc);
                  setCategory(nc);
                }}
                className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="inquiry">Inquiry / Help</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="network">Network</option>
                <option value="database">Database</option>
              </select>
            </div>

            {/* Dynamically controlled Subcategory field via UI Policy */}
            {(uiPolicyFields.subcategory?.visible !== false && (uiPolicyFields.subcategory?.visible === true || category === "software" || category === "network")) && (
              <div className="animate-in fade-in duration-200">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Subcategory {uiPolicyFields.subcategory?.mandatory && <span className="text-red-500 font-bold">*</span>}
                  </span>
                  <span className="text-[10px] text-purple-600 font-mono flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> UI Policy Controlled
                  </span>
                </label>
                <input
                  type="text"
                  disabled={uiPolicyFields.subcategory?.readOnly}
                  value={subcategory}
                  onChange={(e) => {
                    const nv = e.target.value;
                    triggerClientChange("subcategory", subcategory, nv);
                    setSubcategory(nv);
                  }}
                  placeholder="e.g. vpn, replication, authorization"
                  className="w-full bg-white border border-purple-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-purple-500 disabled:bg-slate-100"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Configuration Item (CMDB CI)
              </label>
              <select
                disabled={uiPolicyFields.cmdb_ci?.readOnly || uiPolicyFields.cmdbCiId?.readOnly || uiPolicyFields.cmdb_ci_id?.readOnly}
                value={cmdbCiId}
                onChange={(e) => {
                  const nv = e.target.value;
                  triggerClientChange("cmdb_ci", cmdbCiId, nv);
                  setCmdbCiId(nv);
                }}
                className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
              >
                <option value="">-- None Selected --</option>
                {cis.map((ci) => (
                  <option key={ci.id} value={ci.id}>
                    {ci.name} ({ci.ciClass.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Impact</label>
                <select
                  disabled={uiPolicyFields.impact?.readOnly}
                  value={impact}
                  onChange={(e) => handleImpactUrgencyChange(parseInt(e.target.value, 10), urgency)}
                  className="w-full bg-white border rounded px-2 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
                >
                  <option value="1">1 - High</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - Low</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                <select
                  disabled={uiPolicyFields.urgency?.readOnly}
                  value={urgency}
                  onChange={(e) => handleImpactUrgencyChange(impact, parseInt(e.target.value, 10))}
                  className="w-full bg-white border rounded px-2 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
                >
                  <option value="1">1 - High</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - Low</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <input
                  type="text"
                  disabled
                  value={`P${priority}`}
                  className="w-full bg-slate-100 border rounded px-2 py-1.5 text-center font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <select
                disabled={uiPolicyFields.state?.readOnly}
                value={state}
                onChange={(e) => {
                  const ns = parseInt(e.target.value, 10);
                  triggerClientChange("state", String(state), String(ns));
                  setState(ns);
                }}
                className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
              >
                <option value="1">1 - New</option>
                <option value="2">2 - In Progress</option>
                <option value="3">3 - On Hold</option>
                <option value="6">6 - Resolved</option>
                <option value="7">7 - Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assignment Group</label>
              <select
                disabled={uiPolicyFields.assignment_group?.readOnly || uiPolicyFields.assignmentGroupId?.readOnly || uiPolicyFields.assignment_group_id?.readOnly}
                value={assignmentGroupId}
                onChange={(e) => {
                  const nv = e.target.value;
                  triggerClientChange("assignment_group", assignmentGroupId, nv);
                  setAssignmentGroupId(nv);
                }}
                className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
              >
                <option value="">-- None Selected --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned To</label>
              <select
                disabled={uiPolicyFields.assigned_to?.readOnly || uiPolicyFields.assignedToId?.readOnly || uiPolicyFields.assigned_to_id?.readOnly}
                value={assignedToId}
                onChange={(e) => {
                  const nv = e.target.value;
                  triggerClientChange("assigned_to", assignedToId, nv);
                  setAssignedToId(nv);
                }}
                className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Short Description & Description */}
        <div className="space-y-3 pt-2 border-t">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">
              Short Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={uiPolicyFields.short_description?.readOnly || uiPolicyFields.shortDescription?.readOnly}
              value={shortDescription}
              onChange={(e) => {
                const nv = e.target.value;
                triggerClientChange("short_description", shortDescription, nv);
                setShortDescription(nv);
              }}
              placeholder="Concise summary of the event or issue"
              className="w-full bg-white border rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">
              Detailed Description / Technical Symptoms
            </label>
            <textarea
              rows={3}
              disabled={uiPolicyFields.description?.readOnly}
              value={description}
              onChange={(e) => {
                const nv = e.target.value;
                triggerClientChange("description", description, nv);
                setDescription(nv);
              }}
              placeholder="Full log traces, reproduction steps, or environment scope..."
              className="w-full bg-white border rounded p-2.5 text-xs text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Extended & Custom Attributes */}
      {tableColumns.filter((c: any) => c.isCustom || c.columnName.startsWith("u_")).length > 0 && (
        <div className="bg-white p-5 rounded-lg border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Extended & Custom Attributes (
                {tableColumns.filter((c: any) => c.isCustom || c.columnName.startsWith("u_")).length}
                )
              </span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              sys_dictionary: u_*
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {tableColumns
              .filter((c: any) => c.isCustom || c.columnName.startsWith("u_"))
              .map((col: any) => {
                const val = customFields[col.columnName] ?? col.defaultVal ?? "";
                return (
                  <div key={col.columnName}>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {col.columnLabel} {col.isMandatory && <span className="text-red-500 font-bold">*</span>}
                      <span className="text-[10px] text-slate-400 font-mono ml-1 font-normal">
                        ({col.columnName})
                      </span>
                    </label>

                    {col.columnType === "boolean" ? (
                      <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                        <input
                          type="checkbox"
                          disabled={col.isReadOnly}
                          checked={val === true || val === "true"}
                          onChange={(e) => {
                            const nv = e.target.checked;
                            triggerClientChange(col.columnName, val, nv);
                            setCustomFields({ ...customFields, [col.columnName]: nv });
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-700 text-xs">Enabled / Active</span>
                      </label>
                    ) : col.columnType === "text" ? (
                      <textarea
                        rows={2}
                        disabled={col.isReadOnly}
                        value={val}
                        onChange={(e) => {
                          const nv = e.target.value;
                          triggerClientChange(col.columnName, val, nv);
                          setCustomFields({ ...customFields, [col.columnName]: nv });
                        }}
                        className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
                      />
                    ) : (
                      <input
                        type={
                          col.columnType === "integer"
                            ? "number"
                            : col.columnType === "datetime"
                            ? "datetime-local"
                            : "text"
                        }
                        disabled={col.isReadOnly}
                        value={val}
                        onChange={(e) => {
                          const nv = e.target.value;
                          triggerClientChange(col.columnName, val, nv);
                          setCustomFields({ ...customFields, [col.columnName]: nv });
                        }}
                        className="w-full bg-white border rounded px-2.5 py-1.5 text-slate-900 focus:outline-emerald-500 disabled:bg-slate-100"
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tabs: Activity Stream, Resolution Info, Related Records (M3 Outlined Container) */}
      {!isNew && (
        <div
          className="rounded-[16px] border shadow-[var(--md-sys-elevation-1)] overflow-hidden"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div
            className="flex border-b text-xs font-semibold px-4 space-x-6"
            style={{
              backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
              borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
            }}
          >
            <button
              onClick={() => setActiveTab("notes")}
              className={`relative py-3.5 transition-colors ${
                activeTab === "notes"
                  ? "text-[var(--md-sys-color-primary,#0b57d0)] font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Activity Stream ({activityNotes.length})
              {activeTab === "notes" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--md-sys-color-primary,#0b57d0)] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`relative py-3.5 transition-colors flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "text-[var(--md-sys-color-primary,#0b57d0)] font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <History className="w-3.5 h-3.5 opacity-70" />
              <span>History (sys_audit)</span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                style={{
                  backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                  color: "var(--md-sys-color-on-surface-variant, #49454f)",
                }}
              >
                {auditHistory.length}
              </span>
              {activeTab === "history" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--md-sys-color-primary,#0b57d0)] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("resolution")}
              className={`relative py-3.5 transition-colors ${
                activeTab === "resolution"
                  ? "text-[var(--md-sys-color-primary,#0b57d0)] font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Resolution Information
              {activeTab === "resolution" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--md-sys-color-primary,#0b57d0)] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("related")}
              className={`relative py-3.5 transition-colors ${
                activeTab === "related"
                  ? "text-[var(--md-sys-color-primary,#0b57d0)] font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Related Lists & Approvals ({approvals.length})
              {activeTab === "related" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--md-sys-color-primary,#0b57d0)] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("attachments")}
              className={`relative py-3.5 transition-colors flex items-center gap-1.5 ${
                activeTab === "attachments"
                  ? "text-[var(--md-sys-color-primary,#0b57d0)] font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attachments (sys_attachment)</span>
              {activeTab === "attachments" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--md-sys-color-primary,#0b57d0)] rounded-t-full" />
              )}
            </button>
            {tableName === "change_request" && (
              <button
                onClick={() => setActiveTab("change_tasks")}
                className={`relative py-3.5 transition-colors flex items-center gap-1.5 ${
                  activeTab === "change_tasks"
                    ? "text-[var(--md-sys-color-primary,#0b57d0)] font-bold"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 text-purple-600" />
                <span>Change Tasks & CAB</span>
                {activeTab === "change_tasks" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-purple-600 rounded-t-full" />
                )}
              </button>
            )}
          </div>

          <div className="p-4">
            {activeTab === "notes" && (
              <ActivityStream taskId={recordId} initialNotes={activityNotes} />
            )}

            {activeTab === "history" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] border-b pb-2">
                  <span className="font-semibold text-slate-700">Real-Time Audit History (sys_audit)</span>
                  <button
                    type="button"
                    onClick={loadAuditHistory}
                    className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh History
                  </button>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic">
                    No field changes recorded in sys_audit for this document yet.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px] border-b">
                        <tr>
                          <th className="p-2.5">Field</th>
                          <th className="p-2.5">Old Value</th>
                          <th className="p-2.5">New Value</th>
                          <th className="p-2.5">Updated By</th>
                          <th className="p-2.5">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-[11px]">
                        {auditHistory.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-slate-800">{a.fieldName}</td>
                            <td className="p-2.5 font-mono text-slate-500 max-w-[200px] truncate">{a.oldValue ?? "—"}</td>
                            <td className="p-2.5 font-mono text-emerald-700 font-bold max-w-[200px] truncate">{a.newValue ?? "—"}</td>
                            <td className="p-2.5 text-slate-700 font-medium">{a.userName || "System"}</td>
                            <td className="p-2.5 text-slate-500 font-mono">{new Date(a.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "resolution" && (
              <div className="space-y-3 text-xs max-w-xl">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Resolution Code {(uiPolicyFields.close_code?.mandatory || state === 6) && <span className="text-red-500 font-bold">*</span>}
                    </span>
                    {(uiPolicyFields.close_code?.mandatory || state === 6) && (
                      <span className="text-[10px] text-purple-600 font-mono flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> UI Policy Mandatory
                      </span>
                    )}
                  </label>
                  <select
                    value={closeCode}
                    disabled={uiPolicyFields.close_code?.readOnly}
                    onChange={(e) => {
                      const nv = e.target.value;
                      triggerClientChange("close_code", closeCode, nv);
                      setCloseCode(nv);
                    }}
                    className="w-full bg-white border rounded px-2.5 py-1.5 focus:outline-emerald-500 disabled:bg-slate-100"
                  >
                    <option value="Solved (Permanently)">Solved (Permanently)</option>
                    <option value="Solved (Work Around)">Solved (Work Around)</option>
                    <option value="Not Solved (Not Reproducible)">Not Solved (Not Reproducible)</option>
                    <option value="Closed / Resolved by Caller">Closed / Resolved by Caller</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Resolution Notes {(uiPolicyFields.close_notes?.mandatory || state === 6) && <span className="text-red-500 font-bold">*</span>}
                    </span>
                    {(uiPolicyFields.close_notes?.mandatory || state === 6) && (
                      <span className="text-[10px] text-purple-600 font-mono font-semibold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> UI Policy: Close Notes Mandatory on Resolve
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={4}
                    disabled={uiPolicyFields.close_notes?.readOnly}
                    value={closeNotes}
                    onChange={(e) => {
                      const nv = e.target.value;
                      triggerClientChange("close_notes", closeNotes, nv);
                      setCloseNotes(nv);
                      if (formError) setFormError("");
                    }}
                    placeholder="Document root cause solution or permanent remedy..."
                    className={`w-full bg-white border rounded p-2 text-xs focus:outline-emerald-500 disabled:bg-slate-100 ${
                      (uiPolicyFields.close_notes?.mandatory || state === 6) && !closeNotes.trim()
                        ? "border-purple-400 bg-purple-50/20"
                        : "border-slate-300"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors shadow-xs"
                >
                  Save Resolution Details
                </button>
              </div>
            )}

            {activeTab === "related" && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">Change Approvals (CAB)</h4>
                  {approvals.length === 0 ? (
                    <p className="text-slate-400 italic">No formal approvals required for this task.</p>
                  ) : (
                    <table className="w-full border rounded text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2">Approver</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">State</th>
                          <th className="p-2">Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {approvals.map((app) => (
                          <tr key={app.id}>
                            <td className="p-2 font-medium">{app.approver?.name}</td>
                            <td className="p-2 uppercase font-mono">{app.approvalType}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  app.state === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : app.state === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {app.state}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600">{app.comments || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="space-y-4">
                <AttachmentZone tableName={tableName} recordId={recordId} />
              </div>
            )}

            {activeTab === "change_tasks" && tableName === "change_request" && (
              <div className="space-y-4">
                <ChangeTasksList changeRequestId={recordId} changeState={state} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Floating Right-Click Context Menu */}
      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          title={contextMenu.title}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        />
      )}

      {/* Show Payload Modal */}
      {payloadModal && (
        <ShowRecordPayloadModal
          isOpen={payloadModal}
          recordData={rawRecord || { id: recordId, number, shortDescription, state, priority, impact, urgency }}
          recordTitle={number || recordId}
          onClose={() => setPayloadModal(false)}
        />
      )}
    </div>
  );
}
