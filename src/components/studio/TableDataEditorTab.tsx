"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Table,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  Download,
  SlidersHorizontal,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Database,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Save,
  RotateCcw,
  Building2,
  MapPin,
  Kanban,
  Wrench,
  BookOpen,
  Users,
  Compass,
  FolderTree,
  ChevronDown,
} from "lucide-react";
import { TABLE_METADATA } from "@/lib/schema";

export interface TableInfo {
  name: string;
  label: string;
  category: "workplace" | "agile" | "itil" | "cmdb" | "catalog" | "system";
  superClass?: string | null;
  description?: string;
}

export const AVAILABLE_TABLES: TableInfo[] = [
  // Connected Workplace & 6-Tier Spatial Hierarchy
  { name: "cmn_region", label: "Regions (cmn_region)", category: "workplace", description: "Tier 1: Global geographic regions (Americas, EMEA, APAC)" },
  { name: "cmn_state", label: "States / Provinces (cmn_state)", category: "workplace", description: "Tier 2: States, provinces, or administrative territories" },
  { name: "cmn_campus", label: "Campuses (cmn_campus)", category: "workplace", description: "Tier 3: Corporate campuses, tech parks & medical centers" },
  { name: "cmn_building", label: "Buildings (cmn_building)", category: "workplace", description: "Tier 4: Enterprise facility towers & office centers" },
  { name: "cmn_floor", label: "Floors / Levels (cmn_floor)", category: "workplace", description: "Tier 5: Architectural storeys & floorplan schematic levels" },
  { name: "cmn_space", label: "Spaces & Rooms (cmn_space)", category: "workplace", description: "Tier 6: Meeting rooms, desks, labs & collaborative zones" },
  { name: "cmn_location", label: "Unified Locations (cmn_location)", category: "workplace", description: "Parent-child hierarchical location tree and delivery points" },
  { name: "cmn_reservation", label: "Space Reservations (cmn_reservation)", category: "workplace", description: "Booked meeting rooms, desks & hot-seat reservation schedules" },

  // Agile Project Management
  { name: "rm_story", label: "Agile Stories (rm_story)", category: "agile", superClass: "task", description: "Sprint user stories, points, velocity and acceptance criteria" },
  { name: "rm_sprint", label: "Agile Sprints (rm_sprint)", category: "agile", description: "Timeboxed sprint iterations, start/end dates and capacity" },
  { name: "rm_epic", label: "Agile Epics (rm_epic)", category: "agile", superClass: "task", description: "High-level strategic initiatives grouping user stories" },
  { name: "rm_project", label: "Projects & Releases (rm_project)", category: "agile", superClass: "task", description: "Portfolio projects, major releases and milestones" },

  // ITIL Operations & ServiceOps
  { name: "incident", label: "Incident Management (incident)", category: "itil", superClass: "task", description: "Service disruptions, outages, triage and restoration" },
  { name: "change_request", label: "Change Requests (change_request)", category: "itil", superClass: "task", description: "ITIL CAB change proposals, risk assessments and schedules" },
  { name: "problem", label: "Problem Management (problem)", category: "itil", superClass: "task", description: "Root cause analysis and known error database (KEDB)" },
  { name: "task", label: "Base Platform Tasks (task)", category: "itil", description: "Core base table inherited by all ITIL and Agile work items" },
  { name: "sc_task", label: "Catalog Tasks (sc_task)", category: "itil", superClass: "task", description: "Fulfillment work orders generated from catalog requests" },
  { name: "sc_request", label: "Service Requests (sc_request)", category: "itil", superClass: "task", description: "Parent basket of employee orders and service intakes" },
  { name: "sc_req_item", label: "Requested Items (sc_req_item)", category: "itil", superClass: "task", description: "Individual catalog items ordered within a service request" },
  { name: "change_task", label: "Change Tasks (change_task)", category: "itil", superClass: "task", description: "Discrete implementation and backout tasks for change requests" },

  // CMDB & Assets
  { name: "cmdb_ci", label: "Configuration Items (cmdb_ci)", category: "cmdb", description: "Servers, databases, network gear, applications and CI topology" },

  // Knowledge & Catalog
  { name: "kb_knowledge", label: "Knowledge Articles (kb_knowledge)", category: "catalog", description: "Published self-service guides, FAQs and troubleshooting articles" },
  { name: "sc_cat_item", label: "Service Catalog Items (sc_cat_item)", category: "catalog", description: "Orderable software, hardware, devices and corporate services" },

  // Users, Security & Identity
  { name: "sys_user", label: "Users & Personas (sys_user)", category: "system", description: "Employee, fulfiller, approver and administrator account profiles" },
  { name: "sys_user_group", label: "User Groups (sys_user_group)", category: "system", description: "Assignment groups, CAB teams and service desk routing pools" },
];

export const CATEGORY_CONFIG: Record<
  TableInfo["category"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  workplace: { label: "Workplace & Spatial Locations", icon: Building2, color: "text-indigo-600 dark:text-indigo-400" },
  agile: { label: "Agile Project Management", icon: Kanban, color: "text-amber-600 dark:text-amber-400" },
  itil: { label: "ITIL Service Operations", icon: Wrench, color: "text-blue-600 dark:text-blue-400" },
  cmdb: { label: "CMDB & Infrastructure", icon: Database, color: "text-cyan-600 dark:text-cyan-400" },
  catalog: { label: "Knowledge & Catalog", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400" },
  system: { label: "Users & Security", icon: Users, color: "text-purple-600 dark:text-purple-400" },
};

export const DEFAULT_COLUMNS: Record<string, string[]> = {
  cmn_region: ["name", "code", "active", "description", "createdAt"],
  cmn_state: ["name", "code", "country", "createdAt"],
  cmn_campus: ["name", "code", "city", "address", "createdAt"],
  cmn_building: ["name", "code", "buildingType", "floorsCount", "totalAreaSqFt"],
  cmn_floor: ["name", "floorNumber", "code", "areaSqFt"],
  cmn_space: ["name", "spaceNumber", "spaceType", "status", "capacity", "department"],
  cmn_location: ["name", "fullPath", "locationType", "city", "country"],
  cmn_reservation: ["number", "subject", "startTime", "endTime", "status", "attendeesCount"],
  rm_story: ["number", "short_description", "state", "priority", "story_points", "sprint_name", "epic_name", "assigned_to"],
  rm_sprint: ["number", "name", "state", "startDate", "endDate", "capacityPoints"],
  rm_epic: ["number", "short_description", "state", "priority", "assigned_to"],
  rm_project: ["number", "short_description", "state", "priority", "assigned_to"],
  incident: ["number", "short_description", "state", "priority", "category", "assigned_to", "sys_created_on"],
  change_request: ["number", "short_description", "state", "priority", "risk", "type", "assigned_to"],
  problem: ["number", "short_description", "state", "priority", "assigned_to", "sys_created_on"],
  task: ["number", "sys_class_name", "short_description", "state", "priority", "assigned_to"],
  sc_task: ["number", "short_description", "state", "priority", "assigned_to", "sys_created_on"],
  sc_request: ["number", "short_description", "state", "priority", "sys_created_on"],
  sc_req_item: ["number", "short_description", "state", "priority", "sys_created_on"],
  change_task: ["number", "short_description", "state", "priority", "assigned_to"],
  cmdb_ci: ["name", "ciClass", "assetTag", "status", "operationalStatus", "ipAddress"],
  kb_knowledge: ["number", "shortDescription", "topic", "workflowState", "views"],
  sc_cat_item: ["name", "category", "price", "active", "shortDescription"],
  sys_user: ["name", "user_name", "email", "role", "department", "active"],
  sys_user_group: ["name", "description", "roles", "active"],
};

interface TableDataEditorTabProps {
  initialTable?: string;
  isPortalView?: boolean;
}

export function TableDataEditorTab({ initialTable = "cmn_space", isPortalView = false }: TableDataEditorTabProps) {
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Left Sidebar Explorer State
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [tableSearch, setTableSearch] = useState<string>("");

  // Search & Sorting inside Table Grid
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("sys_created_on");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection & Batch Delete
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Inline Editing State: { rowId, column, value }
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string; value: any } | null>(null);
  const [savingCellId, setSavingCellId] = useState<string | null>(null);
  const [savedSuccessCell, setSavedSuccessCell] = useState<string | null>(null);

  // Column Personalizer Modal
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Add Row Modal State
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [creatingRow, setCreatingRow] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check URL query param on mount so each table has a direct bookmarkable URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get("table");
      if (urlTable && AVAILABLE_TABLES.some((t) => t.name === urlTable)) {
        setSelectedTable(urlTable);
      }
    }
  }, []);

  // Update URL parameter when user selects a different table
  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("table", tblName);
      window.history.pushState({}, "", url.toString());
    } catch {}
  };

  // Load visible columns from localStorage or defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`servicemeow_view_${selectedTable}`);
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      } else {
        setVisibleColumns(DEFAULT_COLUMNS[selectedTable] || ["number", "name", "state", "sys_created_on"]);
      }
    } catch {
      setVisibleColumns(DEFAULT_COLUMNS[selectedTable] || ["number", "name", "state", "sys_created_on"]);
    }
  }, [selectedTable]);

  // Save customized columns to localStorage
  const saveCustomizedColumns = (cols: string[]) => {
    setVisibleColumns(cols);
    try {
      localStorage.setItem(`servicemeow_view_${selectedTable}`, JSON.stringify(cols));
      showToast("View columns updated and saved to preferences");
    } catch {}
    setColumnModalOpen(false);
  };

  // Fetch Table Records
  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/now/table/${selectedTable}?sysparm_limit=100`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || `Failed to load records for table '${selectedTable}'`);
      }
      const data = await res.json();
      const rows = data.result || [];
      setRecords(rows);

      // Extract all unique keys across records to populate available columns
      const keysSet = new Set<string>();
      rows.forEach((r: any) => {
        Object.keys(r).forEach((k) => {
          if (!k.startsWith("_") && k !== "incident" && k !== "change_request" && k !== "problem" && k !== "sla_instances") {
            keysSet.add(k);
          }
        });
      });

      // Ensure default columns are in the list
      const defaults = DEFAULT_COLUMNS[selectedTable] || [];
      defaults.forEach((k) => keysSet.add(k));

      const allCols = Array.from(keysSet);
      setAvailableColumns(allCols);

      if (visibleColumns.length === 0) {
        setVisibleColumns(defaults.length > 0 ? defaults : allCols.slice(0, 7));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedRowIds(new Set());
    setEditingCell(null);
    setCurrentPage(1);
    fetchTableData();
  }, [selectedTable]);

  // Handle Inline Save
  const handleInlineSave = async (recordId: string, column: string, newValue: any) => {
    setSavingCellId(`${recordId}-${column}`);
    try {
      const payload: Record<string, any> = { [column]: newValue };
      const res = await fetch(`/api/now/table/${selectedTable}/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update record cell");
      }

      // Optimistically update local records state
      setRecords((prev) =>
        prev.map((r) => {
          const rowId = r.id || r.sys_id;
          if (rowId === recordId) {
            return { ...r, [column]: newValue };
          }
          return r;
        })
      );

      setSavedSuccessCell(`${recordId}-${column}`);
      setTimeout(() => setSavedSuccessCell(null), 1500);
      showToast(`Updated ${column} on record ${recordId.substring(0, 8)}...`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingCellId(null);
      setEditingCell(null);
    }
  };

  // Handle Delete Single Record
  const handleDeleteRow = async (recordId: string) => {
    if (!confirm("Are you sure you want to permanently delete this record?")) return;
    try {
      const res = await fetch(`/api/now/table/${selectedTable}/${recordId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete record");
      }

      setRecords((prev) => prev.filter((r) => (r.id || r.sys_id) !== recordId));
      showToast("Record successfully deleted from database");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Handle Batch Delete Selected Records
  const handleBatchDelete = async () => {
    if (selectedRowIds.size === 0) return;
    if (!confirm(`Delete ${selectedRowIds.size} selected records from '${selectedTable}'?`)) return;

    let successCount = 0;
    for (const id of Array.from(selectedRowIds)) {
      try {
        const res = await fetch(`/api/now/table/${selectedTable}/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch {}
    }

    setRecords((prev) => prev.filter((r) => !selectedRowIds.has(r.id || r.sys_id)));
    setSelectedRowIds(new Set());
    showToast(`Batch deleted ${successCount} records.`);
  };

  // Handle Create New Record
  const handleCreateRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRow(true);
    try {
      const res = await fetch(`/api/now/table/${selectedTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRowData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to insert record");
      }

      const json = await res.json();
      if (json.result) {
        setRecords((prev) => [json.result, ...prev]);
        setIsAddRowOpen(false);
        setNewRowData({});
        showToast(`Record ${json.result.number || json.result.name || "created"} successfully added!`);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setCreatingRow(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = visibleColumns.join(",");
    const rows = filteredRecords.map((r) =>
      visibleColumns
        .map((col) => {
          let val = r[col];
          if (val && typeof val === "object") {
            val = val.display_value || val.name || JSON.stringify(val);
          }
          if (val === null || val === undefined) val = "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedTable}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredRecords.length} records to ${selectedTable}.csv`);
  };

  // Filter & Sort Records
  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        Object.values(row).some((val: any) => {
          if (!val) return false;
          if (typeof val === "object") {
            return String(val?.display_value || val?.name || "").toLowerCase().includes(q);
          }
          return String(val).toLowerCase().includes(q);
        })
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (valA && typeof valA === "object") valA = valA?.display_value || valA?.name || "";
        if (valB && typeof valB === "object") valB = valB?.display_value || valB?.name || "";
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (sortDirection === "asc") {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
    }

    return result;
  }, [records, searchQuery, sortField, sortDirection]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(paginatedRecords.map((r) => r.id || r.sys_id)));
    }
  };

  const currentTableMeta = AVAILABLE_TABLES.find((t) => t.name === selectedTable);

  // Filtered tables for the left Table Directory Sidebar
  const filteredTablesList = useMemo(() => {
    if (!tableSearch.trim()) return AVAILABLE_TABLES;
    const q = tableSearch.toLowerCase().trim();
    return AVAILABLE_TABLES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.label.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }, [tableSearch]);

  const categoryGroups = useMemo(() => {
    const groups: { category: TableInfo["category"]; config: typeof CATEGORY_CONFIG[TableInfo["category"]]; tables: TableInfo[] }[] = [];
    const categories: TableInfo["category"][] = ["workplace", "agile", "itil", "cmdb", "catalog", "system"];

    for (const cat of categories) {
      const tbls = filteredTablesList.filter((t) => t.category === cat);
      if (tbls.length > 0) {
        groups.push({
          category: cat,
          config: CATEGORY_CONFIG[cat],
          tables: tbls,
        });
      }
    }
    return groups;
  }, [filteredTablesList]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-500/50 text-rose-800 dark:text-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Flex Layout: Left Table Directory Explorer + Right Table Data Grid */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* LEFT: Table Directory Explorer Sidebar */}
        {showSidebar && (
          <aside className="w-full lg:w-72 shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[820px]">
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Table Directory
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {AVAILABLE_TABLES.length} tables
              </span>
            </div>

            {/* Sidebar Table Filter Search */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tables by name..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Grouped Table List */}
            <div className="p-2 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
              {categoryGroups.map((group) => {
                const CatIcon = group.config.icon;
                return (
                  <div key={group.category} className="pt-2.5 first:pt-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <CatIcon className={`w-3.5 h-3.5 ${group.config.color}`} />
                      <span>{group.config.label}</span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {group.tables.map((tbl) => {
                        const isCurrent = selectedTable === tbl.name;
                        return (
                          <button
                            key={tbl.name}
                            onClick={() => handleSelectTable(tbl.name)}
                            title={tbl.description}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isCurrent
                                ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-700/60 shadow-xs"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
                            }`}
                          >
                            <span className="truncate">{tbl.label.split(" (")[0]}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ml-1 shrink-0 ${
                                isCurrent
                                  ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {tbl.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* RIGHT: Main Excel Data Grid & Controls */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Top Controls Toolbar Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Table Header & Info */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                title={showSidebar ? "Hide Table Directory" : "Show Table Directory"}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>

              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 dark:text-white text-base">
                      {currentTableMeta?.label || selectedTable}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                      {records.length} records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {currentTableMeta?.description || `Explore and edit live records from table '${selectedTable}'`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Tools */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search table rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:border-indigo-500 outline-hidden w-48 sm:w-56"
                />
              </div>

              {/* Customize Columns Button */}
              <button
                onClick={() => setColumnModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                title="Personalize and customize visible table columns"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Columns</span>
              </button>

              {/* Export CSV - High Priority End-of-Day extraction */}
              <button
                onClick={handleExportCsv}
                disabled={records.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                title="Extract and download all visible records as CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>

              {/* Refresh */}
              <button
                onClick={fetchTableData}
                disabled={loading}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Refresh table records"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`} />
              </button>

              {/* Batch Delete */}
              {selectedRowIds.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer animate-in fade-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedRowIds.size})</span>
                </button>
              )}

              {/* Add Row Button */}
              <button
                onClick={() => setIsAddRowOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Record</span>
              </button>
            </div>
          </div>

          {/* Excel Data Grid Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {loading ? (
              <div className="py-24 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <p className="text-sm font-medium">Loading {selectedTable} data records...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold">{error}</p>
                <button
                  onClick={fetchTableData}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No records found in table '{selectedTable}'</p>
                <p className="text-xs text-slate-500 mt-1">Click "+ Add Record" above to append the first row or clear filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[650px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-slate-100 dark:scrollbar-track-slate-900">
                <table className="w-full text-left border-collapse text-xs">
                  {/* Header */}
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-20 border-b border-slate-200 dark:border-slate-800 shadow-xs">
                    <tr>
                      {/* Select All Checkbox */}
                      <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-800/80">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.size === paginatedRecords.length && paginatedRecords.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </th>

                      {/* Row Index # */}
                      <th className="py-2.5 px-2.5 w-12 text-slate-500 font-mono text-[10px] text-center border-r border-slate-200 dark:border-slate-800/80">
                        #
                      </th>

                      {/* Dynamic Columns */}
                      {visibleColumns.map((col) => {
                        const isSorted = sortField === col;
                        return (
                          <th
                            key={col}
                            onClick={() => {
                              if (sortField === col) {
                                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSortField(col);
                                setSortDirection("asc");
                              }
                            }}
                            className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/80 select-none hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="capitalize">{col.replace(/_/g, " ")}</span>
                              <span className="text-slate-400">
                                {isSorted ? (
                                  sortDirection === "asc" ? (
                                    <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />
                                )}
                              </span>
                            </div>
                          </th>
                        );
                      })}

                      {/* Actions Column */}
                      <th className="py-2.5 px-3 w-16 text-center text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                    {paginatedRecords.map((row, idx) => {
                      const rowId = row.id || row.sys_id;
                      const isSelected = selectedRowIds.has(rowId);
                      const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={rowId}
                          className={`transition-colors group ${
                            isSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/20"
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800/40">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(rowId)}
                              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Line Number */}
                          <td className="py-2 px-2.5 text-center text-slate-500 font-mono text-[10px] border-r border-slate-200 dark:border-slate-800/40">
                            {globalIdx}
                          </td>

                          {/* Cells */}
                          {visibleColumns.map((col) => {
                            const cellKey = `${rowId}-${col}`;
                            const isEditing = editingCell?.rowId === rowId && editingCell?.column === col;
                            const isSaving = savingCellId === cellKey;
                            const isSuccess = savedSuccessCell === cellKey;

                            let rawVal = row[col];
                            let displayVal = rawVal;
                            if (rawVal && typeof rawVal === "object") {
                              displayVal = rawVal.display_value || rawVal.name || JSON.stringify(rawVal);
                            }

                            const isStateCol = col === "state" || col === "status";
                            const isPriorityCol = col === "priority";

                            return (
                              <td
                                key={col}
                                onDoubleClick={() => {
                                  if (col !== "sys_id" && col !== "id" && col !== "number") {
                                    setEditingCell({ rowId, column: col, value: rawVal ?? "" });
                                  }
                                }}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800/40 relative transition-all ${
                                  isSuccess ? "bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-500" : ""
                                }`}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1 min-w-[120px]">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingCell.value}
                                      onChange={(e) =>
                                        setEditingCell({ ...editingCell, value: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleInlineSave(rowId, col, editingCell.value);
                                        } else if (e.key === "Escape") {
                                          setEditingCell(null);
                                        }
                                      }}
                                      onBlur={() => handleInlineSave(rowId, col, editingCell.value)}
                                      className="w-full bg-white dark:bg-slate-950 border border-indigo-500 text-slate-900 dark:text-white text-xs px-2 py-1 rounded outline-hidden shadow-xs"
                                    />
                                    <button
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleInlineSave(rowId, col, editingCell.value);
                                      }}
                                      className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-1 group/cell">
                                    <span
                                      className={`truncate max-w-xs ${
                                        col === "number"
                                          ? "font-mono font-bold text-indigo-600 dark:text-indigo-400"
                                          : isPriorityCol
                                          ? "font-mono font-semibold text-amber-600 dark:text-amber-300"
                                          : isStateCol
                                          ? "text-slate-800 dark:text-slate-200 font-medium"
                                          : "text-slate-700 dark:text-slate-300"
                                      }`}
                                      title={String(displayVal ?? "")}
                                    >
                                      {displayVal !== null && displayVal !== undefined && displayVal !== "" ? (
                                        String(displayVal)
                                      ) : (
                                        <span className="text-slate-400 italic">null</span>
                                      )}
                                    </span>

                                    {/* Inline Edit Pencil on Hover */}
                                    {col !== "id" && col !== "sys_id" && col !== "number" && (
                                      <button
                                        onClick={() => setEditingCell({ rowId, column: col, value: rawVal ?? "" })}
                                        className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-opacity cursor-pointer"
                                        title="Double click or click to edit inline"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Row Action Buttons */}
                          <td className="py-1.5 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteRow(rowId)}
                              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Pagination Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div>
                Showing{" "}
                <strong className="text-slate-900 dark:text-white">
                  {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </strong>{" "}
                to{" "}
                <strong className="text-slate-900 dark:text-white">
                  {Math.min(currentPage * pageSize, filteredRecords.length)}
                </strong>{" "}
                of <strong className="text-slate-900 dark:text-white">{filteredRecords.length}</strong> total records
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded px-2 py-0.5"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Customize Columns View Personalizer */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Customize View Columns</h3>
              </div>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select which database fields should appear in the live grid view for{" "}
              <strong className="text-slate-800 dark:text-white font-mono">{selectedTable}</strong>. Preferences are saved automatically.
            </p>

            {/* Column Checkboxes Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/60">
              {availableColumns.map((col) => {
                const isChecked = visibleColumns.includes(col);
                return (
                  <label
                    key={col}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          if (visibleColumns.length > 1) {
                            setVisibleColumns(visibleColumns.filter((c) => c !== col));
                          }
                        } else {
                          setVisibleColumns([...visibleColumns, col]);
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                    <span className="font-mono text-slate-700 dark:text-slate-200 capitalize">{col.replace(/_/g, " ")}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const defaults = DEFAULT_COLUMNS[selectedTable] || availableColumns.slice(0, 6);
                  saveCustomizedColumns(defaults);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => saveCustomizedColumns(visibleColumns)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Save &amp; Apply View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Record Quick Form */}
      {isAddRowOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRow}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Record into '{selectedTable}'</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRowOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the field values below to append a new live record directly to the database.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {/* Primary Short Description / Name */}
              {selectedTable.startsWith("rm_") || currentTableMeta?.superClass === "task" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the record..."
                    value={newRowData.short_description || ""}
                    onChange={(e) => setNewRowData({ ...newRowData, short_description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Record Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Unique name..."
                    value={newRowData.name || ""}
                    onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Story specific fields if rm_story */}
              {selectedTable === "rm_story" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Story Points</label>
                    <select
                      value={newRowData.story_points || 3}
                      onChange={(e) => setNewRowData({ ...newRowData, story_points: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden"
                    >
                      {[1, 2, 3, 5, 8, 13, 21].map((pts) => (
                        <option key={pts} value={pts}>
                          {pts} Points
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select
                      value={newRowData.priority || 3}
                      onChange={(e) => setNewRowData({ ...newRowData, priority: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden"
                    >
                      <option value={1}>1 - Critical</option>
                      <option value={2}>2 - High</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={4}>4 - Low</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Space specific fields if cmn_space */}
              {selectedTable === "cmn_space" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Space Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 402, W-12"
                      value={newRowData.space_number || ""}
                      onChange={(e) => setNewRowData({ ...newRowData, space_number: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 8"
                      value={newRowData.capacity || 4}
                      onChange={(e) => setNewRowData({ ...newRowData, capacity: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Description / Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or details..."
                  value={newRowData.description || ""}
                  onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddRowOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingRow}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                {creatingRow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save to Database</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
