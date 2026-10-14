"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Building2,
  Building,
  Layers,
  Box,
  Map as MapIcon,
  Plus,
  Search,
  RefreshCw,
  GitFork,
  ChevronRight,
  ChevronDown,
  Edit2,
  Check,
  X,
  Trash2,
  ExternalLink,
  ArrowRight,
  FolderTree,
  List,
  Columns,
  Sparkles,
  AlertCircle,
  CornerDownRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from "lucide-react";

interface ChildLocation {
  id: string;
  name: string;
  locationType?: string | null;
  fullPath?: string | null;
  city?: string | null;
  state?: string | null;
}

interface ParentLocation {
  id: string;
  name: string;
  fullPath?: string | null;
  locationType?: string | null;
}

interface LocationRecord {
  id: string;
  name: string;
  locationType: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  fullPath?: string | null;
  parentId?: string | null;
  parent?: ParentLocation | null;
  children?: ChildLocation[];
  _count?: {
    children: number;
  };
  regionId?: string | null;
  campusId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  spaceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const LOCATION_TYPES = [
  { value: "region", label: "Region (Tier 1)", icon: MapIcon, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { value: "state", label: "State / Province (Tier 2)", icon: MapPin, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { value: "campus", label: "Campus (Tier 3)", icon: Building2, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  { value: "building", label: "Building (Tier 4)", icon: Building, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { value: "floor", label: "Floor & Level (Tier 5)", icon: Layers, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { value: "space", label: "Space & Room (Tier 6)", icon: Box, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { value: "site", label: "Site / Facility", icon: MapPin, color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
  { value: "datacenter", label: "Data Center", icon: Building, color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  { value: "office", label: "Office", icon: Box, color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
];

export default function UnifiedLocationsPage() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // View Mode: "list" | "tree" | "split"
  const [viewMode, setViewMode] = useState<"list" | "tree" | "split">("list");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [onlyRoots, setOnlyRoots] = useState(false);

  // Expanded rows in list view
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Tree expanded nodes
  const [treeExpandedIds, setTreeExpandedIds] = useState<Set<string>>(new Set());

  // Selected Location for Split view or modal
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Quick Inline Edit State: { id: string, field: "name" | "type" | "parent" | "city" | "state" }
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLocationParentId, setNewLocationParentId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("building");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newCountry, setNewCountry] = useState("United States");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/now/table/cmn_location?sysparm_limit=500");
      const data = await res.json();
      if (data.result) {
        setLocations(data.result);
        if (!selectedLocationId && data.result.length > 0) {
          setSelectedLocationId(data.result[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleSyncLocations = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/now/spatial/sync-locations", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(`Sync complete: ${data.message}`);
        await loadLocations();
      } else {
        showToast(`Sync failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Inline Cell Save
  const saveInlineCell = async (id: string, field: string, val: string) => {
    try {
      let body: any = {};
      if (field === "name") body.name = val.trim();
      else if (field === "type") body.location_type = val;
      else if (field === "parent") body.parent_id = val === "none" ? null : val;
      else if (field === "city") body.city = val.trim();
      else if (field === "state") body.state = val.trim();

      const res = await fetch(`/api/now/table/cmn_location/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.result) {
        setLocations((prev) =>
          prev.map((loc) => (loc.id === id ? { ...loc, ...data.result } : loc))
        );
        showToast("Location updated successfully");
      } else {
        showToast(data.error || "Failed to update location");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save inline edit");
    } finally {
      setEditingCell(null);
    }
  };

  // Create Location Handler
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreateSubmitting(true);
      const res = await fetch("/api/now/table/cmn_location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          location_type: newType,
          parent_id: newLocationParentId || null,
          street: newStreet.trim() || null,
          city: newCity.trim() || null,
          state: newState.trim() || null,
          country: newCountry.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.result) {
        showToast(`Created location: ${data.result.name}`);
        setIsCreateModalOpen(false);
        setNewName("");
        setNewStreet("");
        setNewCity("");
        setNewState("");
        setNewLocationParentId(null);
        await loadLocations();
      } else {
        showToast(data.error || "Failed to create location");
      }
    } catch (err: any) {
      showToast(err.message || "Error creating location");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Delete Location Handler
  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Child locations will become root nodes.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/now/table/cmn_location/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.result) {
        showToast(`Deleted "${name}"`);
        setLocations((prev) => prev.filter((l) => l.id !== id));
      } else {
        showToast(data.error || "Failed to delete location");
      }
    } catch (err: any) {
      showToast(err.message || "Error deleting location");
    }
  };

  // Open Create Child Modal
  const handleOpenAddChild = (parentLoc: LocationRecord) => {
    setNewLocationParentId(parentLoc.id);
    // Suggest next sensible type based on parent type
    if (parentLoc.locationType === "region") setNewType("state");
    else if (parentLoc.locationType === "state") setNewType("campus");
    else if (parentLoc.locationType === "campus") setNewType("building");
    else if (parentLoc.locationType === "building") setNewType("floor");
    else if (parentLoc.locationType === "floor") setNewType("space");
    else setNewType("space");

    setIsCreateModalOpen(true);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTreeNodeExpand = (id: string) => {
    setTreeExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Locations for List View
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (onlyRoots && loc.parentId) return false;
      if (typeFilter !== "all" && loc.locationType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = loc.name?.toLowerCase().includes(q);
        const matchPath = loc.fullPath?.toLowerCase().includes(q);
        const matchCity = loc.city?.toLowerCase().includes(q);
        const matchParent = loc.parent?.name?.toLowerCase().includes(q);
        if (!matchName && !matchPath && !matchCity && !matchParent) return false;
      }
      return true;
    });
  }, [locations, onlyRoots, typeFilter, searchQuery]);

  // Build hierarchy tree map
  const { rootNodes, childrenMap } = useMemo(() => {
    const childrenMap = new Map<string, LocationRecord[]>();
    const rootNodes: LocationRecord[] = [];

    for (const loc of locations) {
      if (!loc.parentId) {
        rootNodes.push(loc);
      } else {
        const list = childrenMap.get(loc.parentId) || [];
        list.push(loc);
        childrenMap.set(loc.parentId, list);
      }
    }

    return { rootNodes, childrenMap };
  }, [locations]);

  const selectedLocation = useMemo(() => {
    return locations.find((l) => l.id === selectedLocationId) || locations[0] || null;
  }, [locations, selectedLocationId]);

  const getTypeMeta = (type: string) => {
    return (
      LOCATION_TYPES.find((t) => t.value === type) || {
        value: type,
        label: type,
        icon: MapPin,
        color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      }
    );
  };

  // Auto-expand roots on first load
  useEffect(() => {
    if (rootNodes.length > 0 && treeExpandedIds.size === 0) {
      const initial = new Set<string>();
      rootNodes.forEach((r) => initial.add(r.id));
      setTreeExpandedIds(initial);
    }
  }, [rootNodes]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 text-white shadow-2xl text-xs font-medium animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Unified Locations &amp; Hierarchy
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  cmn_location
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage physical locations, edit inline, and build out multi-tier parent-child relationships.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Locations: <strong>{locations.length}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <MapIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Root Nodes: <strong>{rootNodes.length}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hierarchical Links: <strong>{locations.filter((l) => l.parentId).length}</strong></span>
            </span>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Editable List</span>
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "tree"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Hierarchy Tree</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "split"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Tree + Detail</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncLocations}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            title="Synchronize all 6 spatial tiers (Regions -> States -> Campuses -> Buildings -> Floors -> Spaces) into unified locations"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync from Spatial Tiers"}</span>
          </button>

          {/* New Location Button */}
          <button
            onClick={() => {
              setNewLocationParentId(null);
              setNewType("building");
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Location</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EDITABLE LIST VIEW */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search locations, paths, cities, parents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="all">All Location Types</option>
                {LOCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Only Roots Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyRoots}
                  onChange={(e) => setOnlyRoots(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Root Locations Only</span>
              </label>
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong className="text-slate-100">{filteredLocations.length}</strong> of{" "}
              {locations.length} locations &bull;{" "}
              <span className="text-indigo-400">Click any cell to edit inline</span>
            </div>
          </div>

          {/* High-Density Editable Data Grid */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] select-none">
                    <th className="p-3 w-8 text-center"></th>
                    <th className="p-3 min-w-[200px]">Location Name</th>
                    <th className="p-3 min-w-[140px]">Type (Tier)</th>
                    <th className="p-3 min-w-[180px]">Parent Location (Relationship)</th>
                    <th className="p-3 min-w-[240px]">Breadcrumb Hierarchy Path</th>
                    <th className="p-3 min-w-[100px] text-center">Children</th>
                    <th className="p-3 min-w-[140px]">City / State</th>
                    <th className="p-3 w-28 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No locations found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc) => {
                      const typeMeta = getTypeMeta(loc.locationType);
                      const TypeIcon = typeMeta.icon;
                      const isExpanded = expandedRowIds.has(loc.id);
                      const directChildren = childrenMap.get(loc.id) || [];
                      const childCount = directChildren.length || loc._count?.children || 0;

                      return (
                        <React.Fragment key={loc.id}>
                          <tr className="hover:bg-slate-800/30 transition-colors group">
                            {/* Expand row chevron */}
                            <td className="p-3 text-center align-middle">
                              {childCount > 0 ? (
                                <button
                                  onClick={() => toggleRowExpand(loc.id)}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Expand child locations"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-3.5 h-3.5 inline-block opacity-20">&bull;</span>
                              )}
                            </td>

                            {/* Location Name Cell (Inline Editable) */}
                            <td className="p-3 align-middle font-medium text-white">
                              {editingCell?.id === loc.id && editingCell.field === "name" ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={cellEditValue}
                                    onChange={(e) => setCellEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveInlineCell(loc.id, "name", cellEditValue);
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-xs text-white focus:outline-hidden w-full font-medium"
                                  />
                                  <button
                                    onClick={() => saveInlineCell(loc.id, "name", cellEditValue)}
                                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingCell({ id: loc.id, field: "name" });
                                    setCellEditValue(loc.name);
                                  }}
                                  className="flex items-center gap-2 group/cell cursor-pointer py-1 rounded hover:bg-slate-800/60 px-1 -mx-1"
                                  title="Click to rename location"
                                >
                                  <span className="font-semibold text-slate-100">{loc.name}</span>
                                  <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </td>

                            {/* Location Type Cell (Dropdown Editable) */}
                            <td className="p-3 align-middle">
                              {editingCell?.id === loc.id && editingCell.field === "type" ? (
                                <select
                                  autoFocus
                                  value={cellEditValue}
                                  onChange={(e) => saveInlineCell(loc.id, "type", e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  className="px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-xs text-white focus:outline-hidden"
                                >
                                  {LOCATION_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCell({ id: loc.id, field: "type" });
                                    setCellEditValue(loc.locationType);
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${typeMeta.color}`}
                                  title="Click to change location type"
                                >
                                  <TypeIcon className="w-3 h-3" />
                                  <span>{typeMeta.label.split(" (")[0]}</span>
                                </button>
                              )}
                            </td>

                            {/* Parent Location (Relationship Selector) */}
                            <td className="p-3 align-middle">
                              {editingCell?.id === loc.id && editingCell.field === "parent" ? (
                                <select
                                  autoFocus
                                  value={cellEditValue}
                                  onChange={(e) => saveInlineCell(loc.id, "parent", e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  className="px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-xs text-white focus:outline-hidden max-w-[200px]"
                                >
                                  <option value="none">-- None (Root Node) --</option>
                                  {locations
                                    .filter((candidate) => candidate.id !== loc.id && candidate.parentId !== loc.id)
                                    .map((candidate) => (
                                      <option key={candidate.id} value={candidate.id}>
                                        {candidate.name} ({candidate.locationType})
                                      </option>
                                    ))}
                                </select>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCell({ id: loc.id, field: "parent" });
                                    setCellEditValue(loc.parentId || "none");
                                  }}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-left transition-colors group/parent cursor-pointer"
                                  title="Click to change parent relationship (re-parent)"
                                >
                                  {loc.parent ? (
                                    <>
                                      <GitFork className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      <span className="text-indigo-300 font-medium truncate max-w-[150px]">
                                        {loc.parent.name}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-slate-500 italic text-[11px]">None (Root Location)</span>
                                  )}
                                  <Edit2 className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover/parent:opacity-100 transition-opacity ml-1" />
                                </button>
                              )}
                            </td>

                            {/* Hierarchy Path Breadcrumb */}
                            <td className="p-3 align-middle text-slate-300 font-mono text-[11px] truncate max-w-[240px]">
                              <span title={loc.fullPath || loc.name}>
                                {loc.fullPath || loc.name}
                              </span>
                            </td>

                            {/* Children Count Pill */}
                            <td className="p-3 align-middle text-center">
                              {childCount > 0 ? (
                                <button
                                  onClick={() => toggleRowExpand(loc.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                                  title="Click to view sub-locations"
                                >
                                  <span>{childCount}</span>
                                  <span className="font-normal text-[10px]">sub</span>
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[10px]">—</span>
                              )}
                            </td>

                            {/* City / State (Inline Editable) */}
                            <td className="p-3 align-middle text-slate-400">
                              {editingCell?.id === loc.id && editingCell.field === "city" ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={cellEditValue}
                                    onChange={(e) => setCellEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveInlineCell(loc.id, "city", cellEditValue);
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-xs text-white focus:outline-hidden w-28"
                                  />
                                  <button
                                    onClick={() => saveInlineCell(loc.id, "city", cellEditValue)}
                                    className="p-1 rounded bg-emerald-600 text-white"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingCell({ id: loc.id, field: "city" });
                                    setCellEditValue(loc.city || "");
                                  }}
                                  className="cursor-pointer hover:text-slate-200 transition-colors truncate"
                                  title="Click to edit city"
                                >
                                  {loc.city ? (
                                    <span>
                                      {loc.city}
                                      {loc.state ? `, ${loc.state}` : ""}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 italic">No address</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="p-3 align-middle text-right pr-4">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenAddChild(loc)}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                                  title="Add Child Sub-Location"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(loc.id, loc.name)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                  title="Delete Location"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Accordion Row for Child Sub-Locations */}
                          {isExpanded && childCount > 0 && (
                            <tr className="bg-slate-950/60 border-y border-slate-800">
                              <td colSpan={8} className="p-4 pl-12">
                                <div className="space-y-2 border-l-2 border-indigo-500/40 pl-4 py-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <CornerDownRight className="w-3.5 h-3.5" />
                                      Direct Children of {loc.name} ({directChildren.length})
                                    </span>
                                    <button
                                      onClick={() => handleOpenAddChild(loc)}
                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Child Location</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {directChildren.map((child) => {
                                      const cMeta = getTypeMeta(child.locationType || "space");
                                      const CIcon = cMeta.icon;
                                      return (
                                        <div
                                          key={child.id}
                                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`p-1.5 rounded-lg ${cMeta.color}`}>
                                              <CIcon className="w-3 h-3" />
                                            </div>
                                            <div className="overflow-hidden">
                                              <span className="font-semibold text-xs text-white truncate block">
                                                {child.name}
                                              </span>
                                              <span className="text-[10px] text-slate-400 capitalize block">
                                                {child.locationType}
                                              </span>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleOpenAddChild(child)}
                                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                                            title="Add child under this node"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE HIERARCHY TREE BUILDER */}
      {viewMode === "tree" && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                <span>Multi-Tier Spatial Relationship Tree</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full ancestral tree view. Click [+] to expand branches, add child nodes, or reorganize relationships.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allIds = new Set<string>(locations.map((l) => l.id));
                  setTreeExpandedIds(allIds);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={() => setTreeExpandedIds(new Set())}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Render Recursive Tree */}
          <div className="space-y-1">
            {rootNodes.map((root) => (
              <TreeNodeItem
                key={root.id}
                node={root}
                childrenMap={childrenMap}
                expandedIds={treeExpandedIds}
                toggleExpand={toggleTreeNodeExpand}
                getTypeMeta={getTypeMeta}
                onAddChild={handleOpenAddChild}
                onDelete={handleDeleteLocation}
                locations={locations}
                onSaveParent={saveInlineCell}
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SPLIT EXPLORER (TREE + DETAIL EDITOR) */}
      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Tree Navigator */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spatial Hierarchy Tree</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{locations.length} nodes</span>
            </div>

            <div className="space-y-1">
              {rootNodes.map((root) => (
                <TreeNodeItem
                  key={root.id}
                  node={root}
                  childrenMap={childrenMap}
                  expandedIds={treeExpandedIds}
                  toggleExpand={toggleTreeNodeExpand}
                  getTypeMeta={getTypeMeta}
                  onAddChild={handleOpenAddChild}
                  onDelete={handleDeleteLocation}
                  locations={locations}
                  onSaveParent={saveInlineCell}
                  selectedId={selectedLocation?.id}
                  onSelectNode={(id) => setSelectedLocationId(id)}
                />
              ))}
            </div>
          </div>

          {/* Right Panel: Selected Location Detail Card & Children Manager */}
          <div className="lg:col-span-7 space-y-6">
            {selectedLocation ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const tMeta = getTypeMeta(selectedLocation.locationType);
                      const TIcon = tMeta.icon;
                      return (
                        <div className={`p-3 rounded-xl ${tMeta.color}`}>
                          <TIcon className="w-6 h-6" />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedLocation.name}</h2>
                      <p className="text-xs text-indigo-400 font-mono mt-0.5">
                        {selectedLocation.fullPath || selectedLocation.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddChild(selectedLocation)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Child</span>
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(selectedLocation.id, selectedLocation.name)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Delete Location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Location Name</label>
                    <input
                      type="text"
                      value={selectedLocation.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocations((prev) =>
                          prev.map((l) => (l.id === selectedLocation.id ? { ...l, name: val } : l))
                        );
                      }}
                      onBlur={(e) => saveInlineCell(selectedLocation.id, "name", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Location Type (Tier)</label>
                    <select
                      value={selectedLocation.locationType}
                      onChange={(e) => saveInlineCell(selectedLocation.id, "type", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      {LOCATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Location (Re-Parent)</label>
                    <select
                      value={selectedLocation.parentId || "none"}
                      onChange={(e) => saveInlineCell(selectedLocation.id, "parent", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    >
                      <option value="none">-- None (Root Location) --</option>
                      {locations
                        .filter((cand) => cand.id !== selectedLocation.id && cand.parentId !== selectedLocation.id)
                        .map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.name} ({cand.locationType})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={selectedLocation.street || ""}
                      placeholder="e.g. 100 Tech Enterprise Blvd"
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocations((prev) =>
                          prev.map((l) => (l.id === selectedLocation.id ? { ...l, street: val } : l))
                        );
                      }}
                      onBlur={(e) => saveInlineCell(selectedLocation.id, "street", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      value={selectedLocation.city || ""}
                      placeholder="e.g. San Jose"
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocations((prev) =>
                          prev.map((l) => (l.id === selectedLocation.id ? { ...l, city: val } : l))
                        );
                      }}
                      onBlur={(e) => saveInlineCell(selectedLocation.id, "city", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={selectedLocation.state || ""}
                      placeholder="e.g. CA"
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocations((prev) =>
                          prev.map((l) => (l.id === selectedLocation.id ? { ...l, state: val } : l))
                        );
                      }}
                      onBlur={(e) => saveInlineCell(selectedLocation.id, "state", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Direct Children Sub-List */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Direct Children Sub-Locations ({(childrenMap.get(selectedLocation.id) || []).length})</span>
                    </h3>
                    <button
                      onClick={() => handleOpenAddChild(selectedLocation)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Sub-Location</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(childrenMap.get(selectedLocation.id) || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">
                        No child locations yet under {selectedLocation.name}. Click &quot;Add Sub-Location&quot; to build out this branch.
                      </p>
                    ) : (
                      (childrenMap.get(selectedLocation.id) || []).map((child) => {
                        const cm = getTypeMeta(child.locationType);
                        const CIcon = cm.icon;
                        return (
                          <div
                            key={child.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className={`p-1.5 rounded-lg ${cm.color}`}>
                                <CIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="overflow-hidden">
                                <span className="font-semibold text-xs text-white block truncate">
                                  {child.name}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {child.locationType} &bull; {child.city || "No city"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedLocationId(child.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition-colors"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(child.id, child.name)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
                Select a location to inspect and edit relationships.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE LOCATION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Location</h3>
                  <p className="text-xs text-slate-400">Add a location into the unified hierarchy.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Coast Innovation Hub, Building C, Suite 402"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {LOCATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Location (Relationship)</label>
                  <select
                    value={newLocationParentId || ""}
                    onChange={(e) => setNewLocationParentId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                  >
                    <option value="">-- None (Root Node) --</option>
                    {locations.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} ({cand.locationType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 Market St"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. CA"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {createSubmitting ? "Creating..." : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Recursive Tree Node Component
interface TreeNodeItemProps {
  node: LocationRecord;
  childrenMap: Map<string, LocationRecord[]>;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  getTypeMeta: (type: string) => any;
  onAddChild: (node: LocationRecord) => void;
  onDelete: (id: string, name: string) => void;
  locations: LocationRecord[];
  onSaveParent: (id: string, field: string, val: string) => void;
  selectedId?: string;
  onSelectNode?: (id: string) => void;
}

function TreeNodeItem({
  node,
  childrenMap,
  expandedIds,
  toggleExpand,
  getTypeMeta,
  onAddChild,
  onDelete,
  locations,
  onSaveParent,
  selectedId,
  onSelectNode,
}: TreeNodeItemProps) {
  const children = childrenMap.get(node.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const typeMeta = getTypeMeta(node.locationType);
  const TypeIcon = typeMeta.icon;

  const [isReparenting, setIsReparenting] = useState(false);

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center justify-between p-2 rounded-xl transition-colors group ${
          isSelected
            ? "bg-indigo-600/20 border border-indigo-500/50"
            : "hover:bg-slate-800/40 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {/* Expand / Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-5 text-center text-slate-600 text-[10px]">&bull;</span>
          )}

          {/* Type Badge & Icon */}
          <div className={`p-1.5 rounded-lg ${typeMeta.color} shrink-0`}>
            <TypeIcon className="w-3 h-3" />
          </div>

          {/* Node Name */}
          <div
            onClick={() => onSelectNode && onSelectNode(node.id)}
            className="cursor-pointer overflow-hidden flex items-center gap-2"
          >
            <span className="font-semibold text-xs text-white hover:text-indigo-300 transition-colors truncate">
              {node.name}
            </span>
            <span className="text-[10px] text-slate-500 font-mono capitalize">
              ({node.locationType})
            </span>
          </div>

          {/* Child count badge */}
          {hasChildren && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              {children.length}
            </span>
          )}
        </div>

        {/* Tree Node Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick Re-parent selector */}
          {isReparenting ? (
            <select
              autoFocus
              defaultValue={node.parentId || "none"}
              onChange={(e) => {
                onSaveParent(node.id, "parent", e.target.value);
                setIsReparenting(false);
              }}
              onBlur={() => setIsReparenting(false)}
              className="px-2 py-0.5 rounded bg-slate-950 border border-indigo-500 text-[10px] text-white focus:outline-hidden font-mono"
            >
              <option value="none">-- None (Make Root) --</option>
              {locations
                .filter((cand) => cand.id !== node.id && cand.parentId !== node.id)
                .map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.name}
                  </option>
                ))}
            </select>
          ) : (
            <button
              onClick={() => setIsReparenting(true)}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
              title="Change Parent (Move node)"
            >
              <GitFork className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => onAddChild(node)}
            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Add Child Sub-Location"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(node.id, node.name)}
            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recursive Children */}
      {isExpanded && hasChildren && (
        <div className="pl-6 border-l-2 border-slate-800 space-y-1 ml-3.5 py-0.5">
          {children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              childrenMap={childrenMap}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              getTypeMeta={getTypeMeta}
              onAddChild={onAddChild}
              onDelete={onDelete}
              locations={locations}
              onSaveParent={onSaveParent}
              selectedId={selectedId}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
