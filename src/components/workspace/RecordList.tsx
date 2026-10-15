"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterBuilder } from "./FilterBuilder";
import { SlaBadge } from "./SlaBadge";
import { ContextMenu, ContextMenuItem } from "@/components/common/ContextMenu";
import { ShowRecordPayloadModal } from "@/components/common/ShowRecordPayloadModal";
import { useUser } from "@/lib/user-context";
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
  FilterX,
  Copy,
  ExternalLink,
  Code2,
  UserCheck,
  Settings,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  Download,
  FileSpreadsheet,
  FileJson,
  ListFilter,
} from "lucide-react";

interface RecordListProps {
  tableName: string;
  tableTitle: string;
}

export function RecordList({ tableName, tableTitle }: RecordListProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [activePreset, setActivePreset] = useState<string>("all");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
    title?: string;
  }>({ isOpen: false, x: 0, y: 0, items: [] });

  // Payload Modal State
  const [payloadModal, setPayloadModal] = useState<{
    isOpen: boolean;
    recordData: any;
    recordTitle: string;
  }>({ isOpen: false, recordData: null, recordTitle: "" });

  // Toast Notification
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      showToast("No records available to export");
      return;
    }
    const sample = records[0];
    const columns = Object.keys(sample).filter(
      (k) => typeof sample[k] !== "object" || sample[k] === null
    );

    const csvLines = [
      columns.join(","),
      ...records.map((row) =>
        columns
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tableName}_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
    showToast(`Exported ${records.length} records as CSV`);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (!records || records.length === 0) {
      showToast("No records available to export");
      return;
    }
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tableName}_export_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
    showToast(`Exported ${records.length} records as JSON`);
  };

  // Copy Data to Clipboard
  const handleCopyData = () => {
    if (!records || records.length === 0) {
      showToast("No records available to copy");
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(records, null, 2));
    setExportDropdownOpen(false);
    showToast(`Copied ${records.length} records JSON to clipboard`);
  };

  // Handle Preset Quick Filter Selection
  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    let q = "";
    if (presetId === "my") {
      q = `assigned_to=${currentUser.id}`;
    } else if (presetId === "unassigned") {
      q = `assigned_toISEMPTY`;
    } else if (presetId === "critical") {
      q = `priority=1^ORpriority=2`;
    } else if (presetId === "active") {
      q = `state=1^ORstate=2`;
    } else if (presetId === "resolved") {
      q = `state=6^ORstate=7`;
    }
    setFilterQuery(q);
    fetchRecords(q);
  };

  const fetchRecords = async (query = filterQuery) => {
    setLoading(true);
    try {
      const url = `/api/now/table/${tableName}${query ? `?sysparm_query=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.result) {
        setRecords(data.result);
      }
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableName === "cmn_location") {
      router.replace("/workspace/cmn_location");
      return;
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get("sysparm_query");
      const priority = params.get("priority");
      const cab = params.get("cab");
      const knownError = params.get("known_error");

      let initialQuery = qParam || "";
      if (priority) {
        initialQuery = initialQuery ? `${initialQuery}^priority=${priority}` : `priority=${priority}`;
      }
      if (cab) {
        initialQuery = initialQuery ? `${initialQuery}^cabApprovalState=${cab}` : `cabApprovalState=${cab}`;
      }
      if (knownError === "true") {
        initialQuery = initialQuery ? `${initialQuery}^isKnownError=true` : `isKnownError=true`;
      }

      if (initialQuery) {
        setFilterQuery(initialQuery);
        fetchRecords(initialQuery);
        return;
      }
    }
    fetchRecords();
  }, [tableName]);

  const handleApplyFilter = (q: string) => {
    setFilterQuery(q);
    fetchRecords(q);
  };

  const addFilterCondition = (field: string, op: "=" | "!=", val: string) => {
    const newCond = `${field}${op}${val}`;
    const nextQuery = filterQuery ? `${filterQuery}^${newCond}` : newCond;
    handleApplyFilter(nextQuery);
    showToast(`Filter applied: ${field} ${op === "=" ? "is" : "is not"} ${val}`);
  };

  // Cell right-click handler (interactive context menu)
  const handleCellContextMenu = (
    e: React.MouseEvent,
    rec: any,
    colField: string,
    colVal: string | number,
    displayVal: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems: ContextMenuItem[] = [
      {
        label: `Show Matching ('${displayVal}')`,
        icon: Filter,
        onClick: () => addFilterCondition(colField, "=", String(colVal)),
      },
      {
        label: `Filter Out ('${displayVal}')`,
        icon: FilterX,
        onClick: () => addFilterCondition(colField, "!=", String(colVal)),
      },
      { divider: true, label: "" },
      {
        label: "Open Record",
        icon: ExternalLink,
        onClick: () => router.push(`/workspace/${tableName}/${rec.sys_id}`),
      },
      {
        label: "Open in New Tab",
        icon: ExternalLink,
        onClick: () => window.open(`/workspace/${tableName}/${rec.sys_id}`, "_blank"),
      },
      {
        label: "Copy sys_id",
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(rec.sys_id);
          showToast(`Copied sys_id (${rec.sys_id.substring(0, 12)}...) to clipboard`);
        },
      },
      {
        label: "Copy URL",
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(`${window.location.origin}/workspace/${tableName}/${rec.sys_id}`);
          showToast("Copied record URL to clipboard");
        },
      },
      {
        label: "Show XML / JSON Payload",
        icon: Code2,
        onClick: () => {
          setPayloadModal({
            isOpen: true,
            recordData: rec,
            recordTitle: rec.number || rec.sys_id,
          });
        },
      },
      { divider: true, label: "" },
      {
        label: "Assign to Me",
        icon: UserCheck,
        onClick: async () => {
          try {
            await fetch(`/api/now/table/${tableName}/${rec.sys_id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assigned_to_id: currentUser.id }),
            });
            showToast(`Assigned ${rec.number} to ${currentUser.name}`);
            fetchRecords();
          } catch (err) {
            console.error(err);
          }
        },
      },
      ...(currentUser.role === "admin"
        ? [
            { divider: true, label: "" },
            {
              label: "Configure",
              icon: Settings,
              children: [
                {
                  label: "Business Rules",
                  onClick: () => router.push(`/studio?tab=business_rules&table=${tableName}`),
                },
                {
                  label: "UI Policies",
                  onClick: () => router.push(`/studio?tab=ui_policies&table=${tableName}`),
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
      title: `${rec.number || "Record"} Context`,
    });
  };

  // Column header right-click handler
  const handleHeaderContextMenu = (e: React.MouseEvent, colField: string, colLabel: string) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems: ContextMenuItem[] = [
      {
        label: `Sort (A to Z) on ${colLabel}`,
        icon: ArrowDownAZ,
        onClick: () => {
          const nextQuery = filterQuery ? `${filterQuery}^ORDERBY${colField}` : `ORDERBY${colField}`;
          handleApplyFilter(nextQuery);
        },
      },
      {
        label: `Sort (Z to A) on ${colLabel}`,
        icon: ArrowUpAZ,
        onClick: () => {
          const nextQuery = filterQuery ? `${filterQuery}^ORDERBYDESC${colField}` : `ORDERBYDESC${colField}`;
          handleApplyFilter(nextQuery);
        },
      },
      ...(currentUser.role === "admin"
        ? [
            { divider: true, label: "" },
            {
              label: "Configure Dictionary Column",
              icon: Settings,
              onClick: () => router.push(`/studio?tab=schema&table=${tableName}`),
            },
          ]
        : []),
    ];

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      items: menuItems,
      title: `${colLabel} Column`,
    });
  };

  const getPriorityBadge = (priority: string | number) => {
    const p = String(priority);
    switch (p) {
      case "1":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-p1-bg,#fee2e2)] text-[var(--md-sys-color-p1-fg,#991b1b)] border border-red-300">
            P1 - Critical
          </span>
        );
      case "2":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-p2-bg,#ffedd5)] text-[var(--md-sys-color-p2-fg,#9a3412)] border border-amber-300">
            P2 - High
          </span>
        );
      case "3":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-p3-bg,#fef9c3)] text-[var(--md-sys-color-p3-fg,#854d0e)] border border-yellow-300">
            P3 - Moderate
          </span>
        );
      case "4":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-p4-bg,#f0fdf4)] text-[var(--md-sys-color-p4-fg,#166534)] border border-emerald-300">
            P4 - Low
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            P5 - Planning
          </span>
        );
    }
  };

  const getStatePill = (state: string | number) => {
    const s = String(state);
    switch (s) {
      case "1":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-state-new-bg,#e0f2fe)] text-[var(--md-sys-color-state-new-fg,#0369a1)] border border-sky-300">
            New
          </span>
        );
      case "2":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-state-progress-bg,#fef3c7)] text-[var(--md-sys-color-state-progress-fg,#92400e)] border border-amber-300">
            In Progress
          </span>
        );
      case "3":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
            On Hold
          </span>
        );
      case "6":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-state-resolved-bg,#dcfce7)] text-[var(--md-sys-color-state-resolved-fg,#15803d)] border border-emerald-300">
            Resolved
          </span>
        );
      case "7":
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-[var(--md-sys-color-state-closed-bg,#f1f5f9)] text-[var(--md-sys-color-state-closed-fg,#475569)] border border-slate-300">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-[8px] text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            Open
          </span>
        );
    }
  };

  const isSpatialTable = tableName.startsWith("cmn_");

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.number?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.code?.toLowerCase().includes(q) ||
      r.spaceNumber?.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q) ||
      r.short_description?.toLowerCase().includes(q) ||
      r.assigned_to?.display_value?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="space-y-4 p-6 min-h-screen relative"
      style={{
        backgroundColor: "var(--theme-page-bg, #f8f9fa)",
        color: "var(--theme-text-primary, #1f1f1f)",
      }}
    >
      {/* Toast Alert (M3 Snackbar: rounded-full pill) */}
      {toastMsg && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-full px-5 py-3 shadow-2xl text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-150"
          style={{
            backgroundColor: "var(--md-sys-color-on-surface, #1d1b20)",
            color: "var(--md-sys-color-surface, #fdfbff)",
          }}
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Header (M3 Outlined Container Card: rounded-[16px]) */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-[16px] border shadow-[var(--md-sys-elevation-1)]"
        style={{
          backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
        }}
      >
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
              {tableTitle}
            </h1>
            <span
              className="text-xs font-mono px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--md-sys-color-surface-container-high, #ece6f0)",
                borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                color: "var(--md-sys-color-on-surface-variant, #49454f)",
              }}
            >
              sys_table: {tableName}
            </span>
          </div>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
          >
            Right-click any cell for <strong>Show Matching</strong>, <strong>Filter Out</strong>, or <strong>Copy sys_id</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {/* Quick Search (M3 Pill Search Bar: 40px) */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in list..."
              className="w-full rounded-full py-2 pl-9 pr-4 text-xs transition-all border outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--md-sys-color-surface-container-high, #ece6f0)",
                borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                color: "var(--md-sys-color-on-surface, #1d1b20)",
              }}
            />
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-2.5"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            />
          </div>

          <button
            onClick={() => fetchRecords()}
            className="p-2 border rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            title="Refresh list"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
            />
          </button>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen((prev) => !prev)}
              className="p-2 border rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
              title="Export Table Data (CSV / JSON)"
            >
              <Download
                className="w-4 h-4"
                style={{ color: "var(--md-sys-color-on-surface, #1d1b20)" }}
              />
            </button>

            {exportDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Export Options
                </div>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <FileJson className="w-3.5 h-3.5 text-sky-600" />
                  <span>Export as JSON</span>
                </button>
                <div className="border-t my-1 border-slate-100 dark:border-slate-800" />
                <button
                  onClick={handleCopyData}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Copy to Clipboard</span>
                </button>
              </div>
            )}
          </div>

          {/* New Record Button (M3 Filled Button: rounded-full, 40px) */}
          <Link
            href={`/workspace/${tableName}/new`}
            className="inline-flex items-center gap-1.5 font-medium px-5 py-2 rounded-full text-xs transition-all shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] shrink-0"
            style={{
              backgroundColor: "var(--md-sys-color-primary, #0b57d0)",
              color: "var(--md-sys-color-on-primary, #ffffff)",
            }}
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </Link>
        </div>
      </div>

      {/* Quick Filter Presets Toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
          <ListFilter className="w-3.5 h-3.5" />
          <span>Presets:</span>
        </span>
        {[
          { id: "all", label: "All Records" },
          { id: "my", label: "Assigned to Me" },
          { id: "unassigned", label: "Unassigned" },
          { id: "critical", label: "Critical P1/P2" },
          { id: "active", label: "In Progress" },
          { id: "resolved", label: "Resolved / Closed" },
        ].map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                isActive
                  ? "bg-sky-500 text-white border-sky-600 shadow-xs font-bold"
                  : "bg-white/80 dark:bg-slate-800/80 hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Filter / Condition Breadcrumb */}
      <FilterBuilder
        tableName={tableName}
        onApplyFilter={handleApplyFilter}
        activeConditions={[]}
      />

      {/* High-Density Data Grid with Right-Click Context Menus (M3 Card Container) */}
      <div
        className="rounded-[16px] border shadow-[var(--md-sys-elevation-1)] overflow-hidden"
        style={{
          backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="border-b text-[11px] font-bold uppercase tracking-wider select-none"
                style={{
                  backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
                  borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                  color: "var(--md-sys-color-on-surface-variant, #49454f)",
                }}
              >
                {isSpatialTable ? (
                  tableName === "cmn_space" ? (
                    <>
                      <th className="py-3 px-3.5">Space Number</th>
                      <th className="py-3 px-3.5 min-w-[200px]">Space / Room Name</th>
                      <th className="py-3 px-3.5">Space Type</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Capacity</th>
                      <th className="py-3 px-3.5">Floor / Level</th>
                    </>
                  ) : tableName === "cmn_building" ? (
                    <>
                      <th className="py-3 px-3.5">Building Code</th>
                      <th className="py-3 px-3.5 min-w-[220px]">Building Name</th>
                      <th className="py-3 px-3.5">Campus</th>
                      <th className="py-3 px-3.5">Building Type</th>
                      <th className="py-3 px-3.5">Floors Count</th>
                    </>
                  ) : tableName === "cmn_floor" ? (
                    <>
                      <th className="py-3 px-3.5">Floor Code</th>
                      <th className="py-3 px-3.5 min-w-[220px]">Floor Name</th>
                      <th className="py-3 px-3.5">Floor Number</th>
                      <th className="py-3 px-3.5">Building</th>
                      <th className="py-3 px-3.5">Spaces Count</th>
                    </>
                  ) : tableName === "cmn_campus" ? (
                    <>
                      <th className="py-3 px-3.5">Campus Code</th>
                      <th className="py-3 px-3.5 min-w-[220px]">Campus Name</th>
                      <th className="py-3 px-3.5">State</th>
                      <th className="py-3 px-3.5">City</th>
                      <th className="py-3 px-3.5">Address</th>
                    </>
                  ) : tableName === "cmn_state" ? (
                    <>
                      <th className="py-3 px-3.5">State Code</th>
                      <th className="py-3 px-3.5 min-w-[220px]">State / Province Name</th>
                      <th className="py-3 px-3.5">Region</th>
                      <th className="py-3 px-3.5">Country</th>
                      <th className="py-3 px-3.5">Campuses</th>
                    </>
                  ) : tableName === "cmn_region" ? (
                    <>
                      <th className="py-3 px-3.5">Region Code</th>
                      <th className="py-3 px-3.5 min-w-[220px]">Region Name</th>
                      <th className="py-3 px-3.5 min-w-[240px]">Description</th>
                      <th className="py-3 px-3.5">States Count</th>
                      <th className="py-3 px-3.5">Active</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-3.5">Number / Key</th>
                      <th className="py-3 px-3.5 min-w-[200px]">Subject / Name</th>
                      <th className="py-3 px-3.5">Space</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Time Interval</th>
                    </>
                  )
                ) : (
                  <>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "number", "Number")}
                    >
                      Number
                    </th>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "priority", "Priority")}
                    >
                      Priority
                    </th>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "state", "State")}
                    >
                      State
                    </th>
                    <th
                      className="py-3 px-3.5 min-w-[280px] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "short_description", "Short Description")}
                    >
                      Short Description
                    </th>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "assigned_to", "Assigned To")}
                    >
                      Assigned To
                    </th>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "cmdb_ci", "Configuration Item")}
                    >
                      Configuration Item
                    </th>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onContextMenu={(e) => handleHeaderContextMenu(e, "sys_created_on", "Created")}
                    >
                      Created
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center italic text-xs"
                    style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                  >
                    Loading records from database...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center italic text-xs"
                    style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                  >
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const recId = rec.sys_id || rec.id;
                  if (isSpatialTable) {
                    if (tableName === "cmn_space") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.spaceNumber}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.name}</td>
                          <td className="py-3 px-3.5 text-slate-300">{rec.spaceType}</td>
                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.status === "available" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono">{rec.capacity || 1}</td>
                          <td className="py-3 px-3.5 text-slate-400">{rec.floor?.name || "Floor"}</td>
                        </tr>
                      );
                    }
                    if (tableName === "cmn_building") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.code}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.name}</td>
                          <td className="py-3 px-3.5 text-slate-300">{rec.campus?.name || "Campus"}</td>
                          <td className="py-3 px-3.5 text-slate-400">{rec.buildingType}</td>
                          <td className="py-3 px-3.5 font-mono">{rec.floors?.length || rec.floorsCount || 1}</td>
                        </tr>
                      );
                    }
                    if (tableName === "cmn_floor") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.code}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.name}</td>
                          <td className="py-3 px-3.5 font-mono">Level {rec.floorNumber}</td>
                          <td className="py-3 px-3.5 text-slate-300">{rec.building?.name || "Building"}</td>
                          <td className="py-3 px-3.5 font-mono">{rec.spaces?.length || 0}</td>
                        </tr>
                      );
                    }
                    if (tableName === "cmn_campus") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.code}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.name}</td>
                          <td className="py-3 px-3.5 text-slate-300">{rec.state?.name || "State"}</td>
                          <td className="py-3 px-3.5 text-slate-400">{rec.city || "—"}</td>
                          <td className="py-3 px-3.5 text-slate-400">{rec.address || "—"}</td>
                        </tr>
                      );
                    }
                    if (tableName === "cmn_state") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.code}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.name}</td>
                          <td className="py-3 px-3.5 text-slate-300">{rec.region?.name || "Region"}</td>
                          <td className="py-3 px-3.5 text-slate-400">{rec.country || "US"}</td>
                          <td className="py-3 px-3.5 font-mono">{rec.campuses?.length || 0}</td>
                        </tr>
                      );
                    }
                    if (tableName === "cmn_region") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.code}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.name}</td>
                          <td className="py-3 px-3.5 text-slate-400 truncate max-w-xs">{rec.description || "—"}</td>
                          <td className="py-3 px-3.5 font-mono">{rec.states?.length || 0}</td>
                          <td className="py-3 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              {rec.active !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                    if (tableName === "cmn_reservation") {
                      return (
                        <tr
                          key={recId}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                        >
                          <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">{rec.number}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-100">{rec.subject}</td>
                          <td className="py-3 px-3.5 text-slate-300">{rec.space?.name || "Space"}</td>
                          <td className="py-3 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                            {new Date(rec.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(rec.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    }
                  }

                  const ciName =
                    rec.incident?.cmdbCi?.name ||
                    rec.change_request?.cmdbCi?.name ||
                    "—";

                  return (
                    <tr
                      key={recId}
                      className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/workspace/${tableName}/${recId}`)}
                    >
                      {/* Number Cell */}
                      <td
                        className="py-3 px-3.5 font-mono font-bold group-hover:underline"
                        style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
                        onContextMenu={(e) => handleCellContextMenu(e, rec, "number", rec.number, rec.number)}
                      >
                        <Link href={`/workspace/${tableName}/${recId}`} onClick={(e) => e.stopPropagation()}>
                          {rec.number}
                        </Link>
                      </td>

                      {/* Priority Cell */}
                      <td
                        className="py-3 px-3.5"
                        onContextMenu={(e) => handleCellContextMenu(e, rec, "priority", rec.priority, `Priority ${rec.priority}`)}
                      >
                        {getPriorityBadge(rec.priority)}
                      </td>

                      {/* State Cell */}
                      <td
                        className="py-3 px-3.5"
                        onContextMenu={(e) => handleCellContextMenu(e, rec, "state", rec.state, `State ${rec.state}`)}
                      >
                        {getStatePill(rec.state)}
                      </td>

                      {/* Short Description Cell */}
                      <td
                        className="py-3 px-3.5 font-medium truncate max-w-md"
                        style={{ color: "var(--md-sys-color-on-surface, #1d1b20)" }}
                        onContextMenu={(e) => handleCellContextMenu(e, rec, "short_description", rec.short_description, rec.short_description)}
                      >
                        {rec.short_description}
                      </td>

                      {/* Assigned To Cell */}
                      <td
                        className="py-3 px-3.5"
                        style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        onContextMenu={(e) => handleCellContextMenu(e, rec, "assigned_to", rec.assigned_to?.value || "", rec.assigned_to?.display_value || "Unassigned")}
                      >
                        {rec.assigned_to?.display_value || <span className="opacity-60 italic">Unassigned</span>}
                      </td>

                      {/* Configuration Item Cell */}
                      <td
                        className="py-3 px-3.5 font-mono text-[11px]"
                        style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        onContextMenu={(e) => handleCellContextMenu(e, rec, "cmdb_ci", rec.incident?.cmdbCiId || "", ciName)}
                      >
                        {ciName}
                      </td>

                      {/* Created Date Cell */}
                      <td
                        className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap"
                        style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                      >
                        {new Date(rec.sys_created_on).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between text-xs"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
            color: "var(--md-sys-color-on-surface-variant, #49454f)",
          }}
        >
          <span>
            Total records: <strong>{filteredRecords.length}</strong>
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--md-sys-color-primary, #0b57d0)" }}
          >
            Right-Click Enabled • Material Design 3 Data Grid 🐾
          </span>
        </div>
      </div>

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
      {payloadModal.isOpen && (
        <ShowRecordPayloadModal
          isOpen={payloadModal.isOpen}
          recordData={payloadModal.recordData}
          recordTitle={payloadModal.recordTitle}
          onClose={() => setPayloadModal({ ...payloadModal, isOpen: false })}
        />
      )}
    </div>
  );
}
