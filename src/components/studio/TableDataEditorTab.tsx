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
} from "lucide-react";
import { TABLE_METADATA } from "@/lib/schema";

interface TableInfo {
  name: string;
  label: string;
  category: "itil" | "agile" | "workplace" | "system";
  superClass?: string | null;
}

const AVAILABLE_TABLES: TableInfo[] = [
  // ITIL Operations
  { name: "incident", label: "Incident Management", category: "itil", superClass: "task" },
  { name: "change_request", label: "Change Requests", category: "itil", superClass: "task" },
  { name: "problem", label: "Problem Management", category: "itil", superClass: "task" },
  { name: "task", label: "Base Platform Tasks", category: "itil" },
  { name: "sc_task", label: "Catalog Tasks", category: "itil", superClass: "task" },
  { name: "sc_request", label: "Service Requests", category: "itil", superClass: "task" },
  { name: "sc_req_item", label: "Requested Items", category: "itil", superClass: "task" },
  { name: "change_task", label: "Change Tasks", category: "itil", superClass: "task" },

  // Agile & Project Management
  { name: "rm_story", label: "Agile Stories (rm_story)", category: "agile", superClass: "task" },
  { name: "rm_sprint", label: "Agile Sprints (rm_sprint)", category: "agile" },
  { name: "rm_epic", label: "Agile Epics (rm_epic)", category: "agile", superClass: "task" },
  { name: "rm_project", label: "Projects & Releases (rm_project)", category: "agile", superClass: "task" },

  // Workplace & CMDB
  { name: "cmdb_ci", label: "Configuration Items (CMDB)", category: "workplace" },
  { name: "cmn_location", label: "Unified Locations", category: "workplace" },
  { name: "cmn_building", label: "Buildings", category: "workplace" },
  { name: "cmn_floor", label: "Floors / Levels", category: "workplace" },
  { name: "cmn_space", label: "Spaces & Rooms", category: "workplace" },
  { name: "cmn_reservation", label: "Space Reservations", category: "workplace" },

  // System & Security
  { name: "sys_user", label: "Users (sys_user)", category: "system" },
  { name: "sys_user_group", label: "Groups (sys_user_group)", category: "system" },
  { name: "kb_knowledge", label: "Knowledge Articles", category: "system" },
];

const DEFAULT_COLUMNS: Record<string, string[]> = {
  incident: ["number", "short_description", "state", "priority", "category", "assigned_to", "sys_created_on"],
  change_request: ["number", "short_description", "state", "priority", "risk", "type", "assigned_to"],
  problem: ["number", "short_description", "state", "priority", "assigned_to", "sys_created_on"],
  task: ["number", "sys_class_name", "short_description", "state", "priority", "assigned_to"],
  sc_task: ["number", "short_description", "state", "priority", "assigned_to", "sys_created_on"],
  rm_story: ["number", "short_description", "state", "priority", "story_points", "sprint_name", "epic_name", "assigned_to"],
  rm_sprint: ["number", "name", "state", "startDate", "endDate", "capacityPoints"],
  rm_epic: ["number", "short_description", "state", "priority", "assigned_to"],
  rm_project: ["number", "short_description", "state", "priority", "assigned_to"],
  cmdb_ci: ["name", "ciClass", "assetTag", "status", "operationalStatus", "ipAddress"],
  cmn_location: ["name", "fullPath", "locationType", "city", "country"],
  cmn_building: ["name", "code", "buildingType", "floorsCount", "totalAreaSqFt"],
  cmn_floor: ["name", "floorNumber", "code", "areaSqFt"],
  cmn_space: ["name", "spaceNumber", "spaceType", "status", "capacity", "department"],
  cmn_reservation: ["number", "subject", "startTime", "endTime", "status", "attendeesCount"],
  sys_user: ["name", "user_name", "email", "role", "department", "active"],
  sys_user_group: ["name", "description", "roles", "active"],
  kb_knowledge: ["number", "shortDescription", "topic", "workflowState", "views"],
};

export function TableDataEditorTab({ initialTable = "rm_story" }: { initialTable?: string }) {
  const [selectedTable, setSelectedTable] = useState<string>(initialTable);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Sorting
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
        throw new Error(errJson.error || "Failed to load table records");
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

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/90 border-rose-500/50 text-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Table Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Database Table Records</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white font-bold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/40 outline-hidden cursor-pointer"
                >
                  <optgroup label="Agile Project Management">
                    {AVAILABLE_TABLES.filter((t) => t.category === "agile").map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="ITIL Core & ServiceOps">
                    {AVAILABLE_TABLES.filter((t) => t.category === "itil").map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="CMDB & Spatial Workplace">
                    {AVAILABLE_TABLES.filter((t) => t.category === "workplace").map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Security & System">
                    {AVAILABLE_TABLES.filter((t) => t.category === "system").map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {records.length} records
                </span>
              </div>
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
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-hidden w-48 sm:w-60"
            />
          </div>

          {/* Customize Columns Button */}
          <button
            onClick={() => setColumnModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Personalize and customize visible table columns"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Customize View</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-40"
            title="Download visible table data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchTableData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Refresh table records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          {/* Batch Delete */}
          {selectedRowIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedRowIds.size})</span>
            </button>
          )}

          {/* Add Row Button */}
          <button
            onClick={() => setIsAddRowOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Record</span>
          </button>
        </div>
      </div>

      {/* Excel Data Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium">Loading {selectedTable} data records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={fetchTableData}
              className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-200">No records found in table '{selectedTable}'</p>
            <p className="text-xs text-slate-500 mt-1">Click "+ Add Record" above to append the first row.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[650px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              {/* Header */}
              <thead className="sticky top-0 bg-slate-950 z-20 border-b border-slate-800 shadow-xs">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.size === paginatedRecords.length && paginatedRecords.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>

                  {/* Row Index # */}
                  <th className="py-2.5 px-2.5 w-12 text-slate-500 font-mono text-[10px] text-center border-r border-slate-800/80">
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
                        className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-300 border-r border-slate-800/80 select-none hover:bg-slate-900 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="capitalize">{col.replace(/_/g, " ")}</span>
                          <span className="text-slate-500">
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="w-3 h-3 text-indigo-400" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-indigo-400" />
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
                  <th className="py-2.5 px-3 w-16 text-center text-[10px] font-mono text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedRecords.map((row, idx) => {
                  const rowId = row.id || row.sys_id;
                  const isSelected = selectedRowIds.has(rowId);
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={rowId}
                      className={`transition-colors group ${
                        isSelected ? "bg-indigo-950/20" : "hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center border-r border-slate-800/40">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowId)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Line Number */}
                      <td className="py-2 px-2.5 text-center text-slate-500 font-mono text-[10px] border-r border-slate-800/40">
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

                        // Determine if choice pill formatting applies
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
                            className={`py-1.5 px-3 border-r border-slate-800/40 relative transition-all ${
                              isSuccess ? "bg-emerald-950/50 ring-1 ring-emerald-400" : ""
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
                                  className="w-full bg-slate-950 border border-indigo-500 text-white text-xs px-2 py-1 rounded outline-hidden shadow-xs"
                                />
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInlineSave(rowId, col, editingCell.value);
                                  }}
                                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1 group/cell">
                                <span
                                  className={`truncate max-w-xs ${
                                    col === "number"
                                      ? "font-mono font-bold text-indigo-400"
                                      : isPriorityCol
                                      ? "font-mono font-semibold text-amber-300"
                                      : isStateCol
                                      ? "text-slate-200 font-medium"
                                      : "text-slate-300"
                                  }`}
                                  title={String(displayVal ?? "")}
                                >
                                  {displayVal !== null && displayVal !== undefined && displayVal !== "" ? (
                                    String(displayVal)
                                  ) : (
                                    <span className="text-slate-600 italic">null</span>
                                  )}
                                </span>

                                {/* Inline Edit Pencil on Hover */}
                                {col !== "id" && col !== "sys_id" && col !== "number" && (
                                  <button
                                    onClick={() => setEditingCell({ rowId, column: col, value: rawVal ?? "" })}
                                    className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-opacity"
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
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
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
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div>
            Showing{" "}
            <strong className="text-white">
              {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{" "}
            to{" "}
            <strong className="text-white">
              {Math.min(currentPage * pageSize, filteredRecords.length)}
            </strong>{" "}
            of <strong className="text-white">{filteredRecords.length}</strong> total records
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
                className="bg-slate-900 border border-slate-800 text-white rounded px-2 py-0.5"
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
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Customize Columns View Personalizer */}
      {columnModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Customize View Columns</h3>
              </div>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select which database fields should appear in the live grid view for{" "}
              <strong className="text-white font-mono">{selectedTable}</strong>. Preferences are saved automatically.
            </p>

            {/* Column Checkboxes Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/60">
              {availableColumns.map((col) => {
                const isChecked = visibleColumns.includes(col);
                return (
                  <label
                    key={col}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs"
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
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                    <span className="font-mono text-slate-200 capitalize">{col.replace(/_/g, " ")}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const defaults = DEFAULT_COLUMNS[selectedTable] || availableColumns.slice(0, 6);
                  saveCustomizedColumns(defaults);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to System Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => saveCustomizedColumns(visibleColumns)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Save &amp; Apply View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Record Quick Form */}
      {isAddRowOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRow}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Add New Record into '{selectedTable}'</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRowOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter the field values below to append a new live record directly to the database.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {/* Primary Short Description / Name */}
              {selectedTable.startsWith("rm_") || currentTableMeta?.superClass === "task" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Description <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the record..."
                    value={newRowData.short_description || ""}
                    onChange={(e) => setNewRowData({ ...newRowData, short_description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Record Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Unique name..."
                    value={newRowData.name || ""}
                    onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Story specific fields if rm_story */}
              {selectedTable === "rm_story" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Story Points</label>
                    <select
                      value={newRowData.story_points || 3}
                      onChange={(e) => setNewRowData({ ...newRowData, story_points: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden"
                    >
                      {[1, 2, 3, 5, 8, 13, 21].map((pts) => (
                        <option key={pts} value={pts}>
                          {pts} Points
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                    <select
                      value={newRowData.priority || 3}
                      onChange={(e) => setNewRowData({ ...newRowData, priority: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden"
                    >
                      <option value={1}>1 - Critical</option>
                      <option value={2}>2 - High</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={4}>4 - Low</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Description / Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or details..."
                  value={newRowData.description || ""}
                  onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddRowOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingRow}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
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
