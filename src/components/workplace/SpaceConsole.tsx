"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Layers,
  MapPin,
  Building,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  Calendar,
  Filter,
  Check,
  X,
  Plus,
  Users,
  Search,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Info,
  Maximize2,
  ExternalLink,
  Edit2,
  Tag,
  Briefcase,
  Maximize,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
} from "lucide-react";
import { CadFloorplanEditor, FloorItem, SpaceCoordinateItem } from "./CadFloorplanEditor";
import { FloorBuildingDimensionsModal } from "./FloorBuildingDimensionsModal";

export type HighlightFilter = "none" | "category" | "department" | "division" | "availability" | "capacity";
export type BorderFilter = "none" | "category" | "division" | "department";
export type LabelFilter = "none" | "names" | "capacity" | "area" | "division";

interface RoomCategoryLegend {
  code: string;
  name: string;
  description: string;
  legendColor: string;
  totalAreaSqFt: number;
  roomCount: number;
}

const DEFAULT_CATEGORIES: RoomCategoryLegend[] = [
  { code: "MEETING", name: "Meeting", description: "Conference rooms & video huddles", legendColor: "#f97316", totalAreaSqFt: 1380, roomCount: 3 },
  { code: "OFFICE", name: "Office", description: "Executive & private offices", legendColor: "#10b981", totalAreaSqFt: 2820, roomCount: 7 },
  { code: "OPENPLAN", name: "OpenPlan", description: "Open collaboration benches", legendColor: "#eab308", totalAreaSqFt: 580, roomCount: 1 },
  { code: "PRIMCIRC", name: "Primary Circulation", description: "Main atrium & core hallways", legendColor: "#84cc16", totalAreaSqFt: 2800, roomCount: 1 },
  { code: "SECONDCIRC", name: "Secondary Circulation", description: "Internal room aisles & access", legendColor: "#94a3b8", totalAreaSqFt: 1560, roomCount: 2 },
  { code: "SERV", name: "Service Area", description: "Restrooms, MDF & server closets", legendColor: "#047857", totalAreaSqFt: 650, roomCount: 1 },
  { code: "SUPPORT", name: "Support Area", description: "Storage, mail & print hubs", legendColor: "#78350f", totalAreaSqFt: 420, roomCount: 1 },
  { code: "VERT", name: "Vertical Penetrations", description: "Elevators & stairwells", legendColor: "#dc2626", totalAreaSqFt: 840, roomCount: 2 },
  { code: "WKSTN", name: "Workstation", description: "Electronic systems benching", legendColor: "#2563eb", totalAreaSqFt: 1120, roomCount: 4 },
];

export function SpaceConsole({ className = "" }: { className?: string }) {
  // Spatial Data
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<FloorItem | null>(null);
  const [spaces, setSpaces] = useState<SpaceCoordinateItem[]>([]);
  const [categories, setCategories] = useState<RoomCategoryLegend[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Console Mode & Layer Filters
  const [consoleMode, setConsoleMode] = useState<"space" | "occupancy">("space");
  const [highlightMode, setHighlightMode] = useState<HighlightFilter>("category");
  const [borderMode, setBorderMode] = useState<BorderFilter>("category");
  const [labelMode, setLabelMode] = useState<LabelFilter>("names");

  // Layer Visibility Toggles
  const [showColumns, setShowColumns] = useState(true);
  const [showDoorSwings, setShowDoorSwings] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showHotspotFills, setShowHotspotFills] = useState(true);

  // Viewport / Zoom State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);

  // Left Explorer Navigation State
  const [explorerSearch, setExplorerSearch] = useState("");
  const [vacantOnly, setVacantOnly] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<"organizations" | "categories" | "rooms">("categories");

  // Direct CAD Editor / Bounding Box Mode Toggle
  const [showEditorMode, setShowEditorMode] = useState(false);

  // Batch Allocation Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningCategory, setAssigningCategory] = useState<RoomCategoryLegend | null>(null);
  const [selectedRoomIdsForAssign, setSelectedRoomIdsForAssign] = useState<string[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignToast, setAssignToast] = useState<string | null>(null);

  // Floor & Building Dimensions Modal State
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [dimensionsTargetFloor, setDimensionsTargetFloor] = useState<FloorItem | null>(null);

  // 1. Fetch Spatial Hierarchy & Floor Data
  const fetchSpatialData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/spatial/tree?include_assets=false");
      if (!res.ok) throw new Error("Failed to load spatial tree");
      const data = await res.json();

      const extractedFloors: FloorItem[] = [];
      const regionsList: any[] = Array.isArray(data.result?.tree)
        ? data.result.tree
        : Array.isArray(data.regions)
        ? data.regions
        : Array.isArray(data.result)
        ? data.result
        : Array.isArray(data.tree)
        ? data.tree
        : [];

      regionsList.forEach((reg: any) => {
        (reg.states || []).forEach((st: any) => {
          (st.campuses || []).forEach((camp: any) => {
            (camp.buildings || []).forEach((bld: any) => {
              (bld.floors || []).forEach((fl: any) => {
                extractedFloors.push({
                  ...fl,
                  building: {
                    id: bld.id,
                    name: bld.name,
                    code: bld.code,
                    buildingType: bld.buildingType,
                    floorsCount: bld.floorsCount,
                    totalAreaSqFt: bld.totalAreaSqFt,
                  },
                });
              });
            });
          });
        });
      });

      setFloors(extractedFloors);

      // Prefer HQ Floor 18 (architectural benchmark) or first floor
      const hq18Floor = extractedFloors.find(
        (f) => f.code === "HQ18" || f.name.includes("18")
      );
      const targetId = hq18Floor?.id || extractedFloors[0]?.id || "";
      setSelectedFloorId(targetId);
    } catch (err) {
      console.error("Error loading spatial data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Category Aggregates
  const fetchCategories = useCallback(async (floorId?: string) => {
    try {
      const url = floorId
        ? `/api/now/spatial/categories?floorId=${floorId}`
        : "/api/now/spatial/categories";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchSpatialData();
  }, [fetchSpatialData]);

  // Sync selected floor & its spaces
  useEffect(() => {
    if (!selectedFloorId || floors.length === 0) return;
    const current = floors.find((f) => f.id === selectedFloorId) || null;
    setSelectedFloor(current);
    if (current) {
      setSpaces(current.spaces || []);
      fetchCategories(current.id);
    }
    setSelectedSpaceId(null);
  }, [selectedFloorId, floors, fetchCategories]);

  // Map room category helper
  const getSpaceCategoryCode = (space: SpaceCoordinateItem): string => {
    const t = (space.spaceType || "").toLowerCase().trim();
    if (t.includes("meet") || t.includes("conf") || t.includes("collab") || t.includes("arena")) return "MEETING";
    if (t.includes("exec") || t.includes("office") || t.includes("suite")) return "OFFICE";
    if (t.includes("open") || t.includes("pod") || t.includes("team")) return "OPENPLAN";
    if (t.includes("desk") || t.includes("wkstn") || t.includes("workstation")) return "WKSTN";
    if (t.includes("restroom") || t.includes("serv") || t.includes("mdf") || t.includes("server")) return "SERV";
    if (t.includes("stair") || t.includes("elevator") || t.includes("vert")) return "VERT";
    if (t.includes("circ") || t.includes("atrium") || t.includes("corridor") || t.includes("hall")) return "PRIMCIRC";
    if (t.includes("support") || t.includes("storage")) return "SUPPORT";
    return "OFFICE";
  };

  // Compute dynamic fill color for room hotspot based on Highlight mode
  const getRoomHighlightColor = (space: SpaceCoordinateItem): string => {
    if (highlightMode === "none") return "transparent";

    if (highlightMode === "availability") {
      return space.status === "available" ? "#10b981" : "#ef4444";
    }

    if (highlightMode === "category") {
      const code = getSpaceCategoryCode(space);
      const cat = categories.find((c) => c.code === code);
      return cat?.legendColor || "#6366f1";
    }

    if (highlightMode === "department") {
      const dept = (space.capabilities || "").toLowerCase();
      if (space.name.includes("Executive") || space.spaceType.includes("Executive")) return "#10b981";
      if (space.name.includes("Electronic") || space.name.includes("Lab")) return "#06b6d4";
      if (space.name.includes("Pod") || space.name.includes("Team")) return "#eab308";
      if (space.name.includes("Restroom") || space.name.includes("Facilities")) return "#8b5cf6";
      return "#3b82f6";
    }

    if (highlightMode === "capacity") {
      const cap = space.capacity || 1;
      if (cap >= 15) return "#ef4444";
      if (cap >= 8) return "#f97316";
      if (cap >= 4) return "#eab308";
      return "#10b981";
    }

    return "#6366f1";
  };

  // Filtered spaces based on search & vacant toggle
  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      if (vacantOnly && sp.status !== "available") return false;
      if (!explorerSearch) return true;
      const q = explorerSearch.toLowerCase();
      return (
        sp.name.toLowerCase().includes(q) ||
        sp.spaceNumber.toLowerCase().includes(q) ||
        sp.spaceType.toLowerCase().includes(q)
      );
    });
  }, [spaces, vacantOnly, explorerSearch]);

  // Aggregated Organizations Breakdown
  const organizationsSummary = useMemo(() => {
    const map = new Map<string, { name: string; roomCount: number; totalArea: number; headcount: number }>();

    spaces.forEach((sp) => {
      let dept = "Electronic Systems";
      if (sp.spaceType.toLowerCase().includes("exec")) dept = "Executive Leadership";
      else if (sp.spaceType.toLowerCase().includes("open") || sp.spaceType.toLowerCase().includes("pod")) dept = "Product Engineering";
      else if (sp.spaceType.toLowerCase().includes("serv") || sp.spaceType.toLowerCase().includes("circ")) dept = "Facilities";

      const current = map.get(dept) || { name: dept, roomCount: 0, totalArea: 0, headcount: 0 };
      current.roomCount++;
      current.totalArea += sp.capacity ? sp.capacity * 45 : 350;
      current.headcount += sp.capacity || 2;
      map.set(dept, current);
    });

    return Array.from(map.values());
  }, [spaces]);

  // Total floor metrics
  const totalFloorArea = useMemo(() => {
    return selectedFloor?.areaSqFt || spaces.reduce((acc, s) => acc + (s.capacity ? s.capacity * 50 : 350), 0);
  }, [selectedFloor, spaces]);

  const totalFloorCapacity = useMemo(() => {
    return spaces.reduce((acc, s) => acc + (s.capacity || 0), 0);
  }, [spaces]);

  const occupiedSpacesCount = spaces.filter((s) => s.status !== "available").length;

  // Handle Batch Category Allocation
  const handleExecuteBatchAssign = async () => {
    if (!assigningCategory || selectedRoomIdsForAssign.length === 0) return;
    setSubmittingAssign(true);
    try {
      const res = await fetch("/api/now/spatial/batch-allocate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceIds: selectedRoomIdsForAssign,
          spaceType: assigningCategory.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to batch allocate");

      setAssignToast(`Successfully assigned ${selectedRoomIdsForAssign.length} room(s) to ${assigningCategory.name}`);
      setShowAssignModal(false);
      setSelectedRoomIdsForAssign([]);
      await fetchSpatialData();
    } catch (err: any) {
      alert(err.message || "Failed to allocate spaces");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) || null;
  const currentFloorplanUrl =
    selectedFloor?.floorplanSvgUrl ||
    selectedFloor?.floorplanImageUrl ||
    "/floorplans/hq_floor_18.svg";

  return (
    <div className={`space-y-4 ${className} font-sans text-black`}>
      {/* ======================================================== */}
      {/* ZONE 1: TOP GLOBAL CONTROL & LAYER FILTER BAR            */}
      {/* ======================================================== */}
      <div className="bg-white border-2 border-black p-4 space-y-3 shadow-none">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          {/* Left: Mode Switcher & Floor Dimensions Callout */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-neutral-300">
              <button
                type="button"
                onClick={() => setConsoleMode("space")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
                  consoleMode === "space"
                    ? "bg-black text-white"
                    : "bg-white text-neutral-600 hover:text-black"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>01 / Space &amp; Allocation</span>
                <span className="px-1.5 py-0.2 bg-neutral-200 text-black text-[10px] font-mono font-bold">
                  {spaces.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConsoleMode("occupancy")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
                  consoleMode === "occupancy"
                    ? "bg-black text-white"
                    : "bg-white text-neutral-600 hover:text-black"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>02 / Live Occupancy</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  {occupiedSpacesCount}/{spaces.length}
                </span>
              </button>
            </div>

            {/* Building & Floor Callout */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-xs font-mono font-semibold text-neutral-800">
              <Building className="w-3.5 h-3.5 text-black" />
              <span>
                {selectedFloor?.building?.name || "Global Building"} • {selectedFloor?.name || "Floor 1"}
              </span>
            </div>

            {/* Prominent Floor & Building Dimensions Button */}
            <button
              type="button"
              onClick={() => {
                setDimensionsTargetFloor(selectedFloor);
                setShowDimensionsModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer"
              title="View and edit gross floor area, building total area, and dimensions"
            >
              <Maximize2 className="w-3.5 h-3.5 text-white" />
              <span>📐 Edit Floor &amp; Building Dimensions</span>
              <span className="px-1.5 py-0.2 bg-neutral-700 text-white text-[10px] font-mono">
                {selectedFloor?.areaSqFt ? `${selectedFloor.areaSqFt.toLocaleString()} ft²` : "12,000 ft²"}
              </span>
            </button>
          </div>

          {/* Right: Layer Selectors (Highlights, Borders, Labels) & CAD Tools */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Highlights Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 border border-neutral-300">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">Highlight:</span>
              <select
                value={highlightMode}
                onChange={(e) => setHighlightMode(e.target.value as HighlightFilter)}
                className="bg-transparent text-black font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="category">Room Category</option>
                <option value="department">Department</option>
                <option value="availability">Occupancy Status</option>
                <option value="capacity">Capacity (Pax)</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Borders Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 border border-neutral-300">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">Border:</span>
              <select
                value={borderMode}
                onChange={(e) => setBorderMode(e.target.value as BorderFilter)}
                className="bg-transparent text-black font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="category">Room Category</option>
                <option value="division">Division</option>
                <option value="department">Department</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Labels Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 border border-neutral-300">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">Label:</span>
              <select
                value={labelMode}
                onChange={(e) => setLabelMode(e.target.value as LabelFilter)}
                className="bg-transparent text-black font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="names">Names &amp; Numbers</option>
                <option value="capacity">Capacity (Pax)</option>
                <option value="area">Area (Sq Ft)</option>
                <option value="division">Divisions</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Toggle Full Bounding Box Editor */}
            <button
              type="button"
              onClick={() => setShowEditorMode(!showEditorMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono uppercase font-bold text-xs transition-all cursor-pointer ${
                showEditorMode
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-neutral-400 hover:border-black"
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{showEditorMode ? "Exit CAD Reshaper" : "Reshape & Drag CAD"}</span>
            </button>
          </div>
        </div>

        {/* CAD Layer Visibility Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-neutral-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-black uppercase">Architectural Layers:</span>
            <button
              type="button"
              onClick={() => setShowColumns(!showColumns)}
              className={`px-2 py-0.5 border text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                showColumns ? "bg-black text-white border-black" : "bg-neutral-100 text-neutral-500 border-neutral-300"
              }`}
            >
              Columns: {showColumns ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => setShowDoorSwings(!showDoorSwings)}
              className={`px-2 py-0.5 border text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                showDoorSwings ? "bg-black text-white border-black" : "bg-neutral-100 text-neutral-500 border-neutral-300"
              }`}
            >
              Door Swings: {showDoorSwings ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => setShowFurniture(!showFurniture)}
              className={`px-2 py-0.5 border text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                showFurniture ? "bg-black text-white border-black" : "bg-neutral-100 text-neutral-500 border-neutral-300"
              }`}
            >
              Workstations: {showFurniture ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => setShowHotspotFills(!showHotspotFills)}
              className={`px-2 py-0.5 border text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                showHotspotFills ? "bg-black text-white border-black" : "bg-neutral-100 text-neutral-500 border-neutral-300"
              }`}
            >
              Fills: {showHotspotFills ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span>Gross Floor Area: <strong className="text-black">{totalFloorArea.toLocaleString()} ft²</strong></span>
            <span>•</span>
            <span>Design Capacity: <strong className="text-black">{totalFloorCapacity} pax</strong></span>
          </div>
        </div>

        {/* Feedback alert toast */}
        {assignToast && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs font-mono flex items-center justify-between animate-in fade-in-50">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{assignToast}</span>
            </span>
            <button
              type="button"
              onClick={() => setAssignToast(null)}
              className="text-emerald-800 hover:text-black font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* If Direct Bounding Box Editor mode is toggled, display CadFloorplanEditor */}
      {showEditorMode ? (
        <CadFloorplanEditor
          initialFloorId={selectedFloorId}
          onSaved={() => {
            fetchSpatialData();
            if (selectedFloorId) fetchCategories(selectedFloorId);
          }}
        />
      ) : (
        /* ======================================================== */
        /* ZONE 2 & ZONE 3: 3-ZONE MASTER-DETAIL CONSOLE SPLIT      */
        /* ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ==================================================== */}
          {/* ZONE 2: LEFT MASTER EXPLORER PANEL (5 COLS)          */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Top: Location & Multi-Level Drawing Sheet Picker */}
            <div className="bg-white border border-neutral-300 p-4 space-y-3 shadow-none">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-xs font-mono uppercase font-bold text-black flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-black" />
                  <span>02 / Locations &amp; Drawing Sheets</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                  {floors.length} Architectural Sheets
                </span>
              </div>

              {/* Search & Vacant Toggle Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={explorerSearch}
                    onChange={(e) => setExplorerSearch(e.target.value)}
                    placeholder="Search Building, Floor, Room..."
                    className="w-full bg-neutral-50 border border-neutral-300 pl-8 pr-3 py-1.5 text-xs text-black placeholder:text-neutral-400 font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setVacantOnly(!vacantOnly)}
                  className={`px-3 py-1.5 border text-xs font-mono uppercase font-bold shrink-0 transition-colors cursor-pointer ${
                    vacantOnly
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
                  }`}
                >
                  Vacant only
                </button>
              </div>

              {/* Multi-Level Floor Sheet Grid (Spatial Roster Table) */}
              <div className="overflow-x-auto border border-neutral-300 bg-white max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-[10px] text-neutral-600 font-mono uppercase border-b border-neutral-300 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2.5">Bldg</th>
                      <th className="py-2 px-2">Floor</th>
                      <th className="py-2 px-2">Drawing</th>
                      <th className="py-2 px-2 text-right">Area (ft²)</th>
                      <th className="py-2 px-2 text-center">Cap</th>
                      <th className="py-2 px-2 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                    {floors.map((fl) => {
                      const isSelected = fl.id === selectedFloorId;
                      const drawingCode = fl.code.toLowerCase();
                      const area = fl.areaSqFt || 5136.79;
                      const cap = fl.spaces?.reduce((acc, s) => acc + (s.capacity || 0), 0) || 23;

                      return (
                        <tr
                          key={fl.id}
                          onClick={() => setSelectedFloorId(fl.id)}
                          className={`hover:bg-neutral-50 cursor-pointer transition-colors ${
                            isSelected ? "bg-neutral-900 text-white font-bold" : "text-neutral-900"
                          }`}
                        >
                          <td className="py-2 px-2.5 truncate max-w-[80px]">
                            {fl.building?.name?.includes("HQ") ? "HQ" : "TECH"}
                          </td>
                          <td className="py-2 px-2">{fl.floorNumber}</td>
                          <td className={`py-2 px-2 font-semibold ${isSelected ? "text-emerald-300" : "text-neutral-700"}`}>
                            {drawingCode}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {area.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center">{cap}</td>
                          <td className="py-1.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDimensionsTargetFloor(fl);
                                setShowDimensionsModal(true);
                              }}
                              className={`px-2 py-0.5 border text-[10px] font-mono font-bold uppercase transition-colors ${
                                isSelected
                                  ? "bg-black text-white border-neutral-600 hover:bg-neutral-800"
                                  : "bg-white text-black border-neutral-300 hover:border-black hover:bg-neutral-100"
                              }`}
                              title="Edit Floor and Building Dimensions"
                            >
                              Edit Size
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom: Sub-Tabs Dock (Organizations / Room Categories / Rooms) */}
            <div className="bg-white border border-neutral-300 p-4 space-y-3 shadow-none">
              {/* Tab Switcher */}
              <div className="flex items-center border border-neutral-300 bg-neutral-100 p-0.5 text-xs font-mono font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setInventoryTab("organizations")}
                  className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                    inventoryTab === "organizations"
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  Organizations
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryTab("categories")}
                  className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                    inventoryTab === "categories"
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryTab("rooms")}
                  className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                    inventoryTab === "rooms"
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  Rooms ({filteredSpaces.length})
                </button>
              </div>

              {/* Sub-Tab 1: Organizations Breakdown */}
              {inventoryTab === "organizations" && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {organizationsSummary.map((org) => (
                    <div
                      key={org.name}
                      className="p-2.5 bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-black block">{org.name}</span>
                        <span className="text-[11px] text-neutral-600 font-mono">
                          {org.roomCount} rooms • {org.headcount} headcount
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-black">
                          {org.totalArea.toLocaleString()} ft²
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tab 2: Room Categories & Legend Swatches (With Assign Button) */}
              {inventoryTab === "categories" && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase px-2 pb-1 border-b border-neutral-200 font-bold">
                    <span>Category / Legend</span>
                    <span className="flex items-center gap-4">
                      <span>Area ft²</span>
                      <span>Action</span>
                    </span>
                  </div>

                  {categories.map((cat) => (
                    <div
                      key={cat.code}
                      className="p-2 bg-neutral-50 border border-neutral-200 hover:border-black flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3.5 h-3.5 border border-black/20 shrink-0"
                          style={{ backgroundColor: cat.legendColor }}
                        />
                        <div className="truncate font-mono">
                          <span className="font-bold text-black text-[11px] block truncate">
                            {cat.code}
                          </span>
                          <span className="text-[10px] text-neutral-600 truncate block">
                            {cat.name} ({cat.roomCount || 0})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        <span className="text-[11px] text-neutral-800 font-semibold">
                          {(cat.totalAreaSqFt || 420).toLocaleString()} ft²
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningCategory(cat);
                            setShowAssignModal(true);
                          }}
                          className="px-2 py-1 bg-white hover:bg-black text-black hover:text-white border border-neutral-300 hover:border-black font-bold uppercase text-[10px] transition-colors cursor-pointer"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tab 3: Rooms Inventory List */}
              {inventoryTab === "rooms" && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredSpaces.map((sp) => {
                    const isSelected = selectedSpaceId === sp.id;
                    const catCode = getSpaceCategoryCode(sp);
                    const catColor = categories.find((c) => c.code === catCode)?.legendColor || "#6366f1";

                    return (
                      <div
                        key={sp.id}
                        onClick={() => setSelectedSpaceId(sp.id)}
                        className={`p-2 border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-neutral-900 border-black text-white"
                            : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className="w-2.5 h-2.5 border border-black/30 shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <div className="truncate font-mono">
                            <span className="font-bold text-xs block">
                              {sp.spaceNumber} — {sp.name}
                            </span>
                            <span className={`text-[10px] ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                              {sp.capacity} pax • {sp.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                            isSelected ? "bg-black text-white border-neutral-600" : "bg-neutral-200 text-neutral-800 border-neutral-300"
                          }`}>
                            {catCode}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* ZONE 3: CENTRAL HIGH-FIDELITY CAD STAGE (7 COLS)     */}
          {/* ==================================================== */}
          <div className="lg:col-span-7 space-y-3 font-mono">
            {/* Viewport Toolbar */}
            <div className="bg-white border border-neutral-300 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-neutral-600 text-[11px]">
                  Viewing: <strong className="text-black">{selectedFloor?.name || "Floor 18"}</strong>
                </span>
                <span className="text-neutral-300">|</span>
                <span className="text-[10px] text-neutral-600">
                  Highlight: <strong className="text-black uppercase">{highlightMode}</strong>
                </span>
                <span className="text-neutral-300">|</span>
                {/* Dimensions Edit Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    setDimensionsTargetFloor(selectedFloor);
                    setShowDimensionsModal(true);
                  }}
                  className="px-2 py-0.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  📐 Edit Size ({selectedFloor?.areaSqFt ? `${selectedFloor.areaSqFt.toLocaleString()} ft²` : "12k ft²"})
                </button>
              </div>

              {/* Pan & Zoom Controls */}
              <div className="flex items-center border border-neutral-300 bg-white">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
                  title="Zoom Out"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-2 text-black">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
                  title="Zoom In"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  title="Fit to Canvas"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 border-l border-neutral-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive CAD Drawing Stage Container */}
            <div className="border-2 border-black bg-[#080d19] overflow-hidden shadow-none relative">
              <div
                className="w-full overflow-auto relative p-4 flex items-center justify-center min-h-[520px]"
                style={{ maxHeight: "740px" }}
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out",
                  }}
                  className="relative w-full max-w-[1000px] aspect-[1200/850] overflow-hidden border border-neutral-700 bg-[#090d16] select-none shadow-2xl"
                >
                  {/* High-Fidelity SVG CAD Blueprint */}
                  <img
                    src={currentFloorplanUrl}
                    alt="CAD Blueprint"
                    className="w-full h-full object-contain pointer-events-none select-none opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/floorplans/hq_floor_18.svg";
                    }}
                  />

                  {/* Interactive Hotspot Boundary Polygons & Highlights */}
                  {spaces.map((sp) => {
                    if (
                      sp.floorplanX === null ||
                      sp.floorplanX === undefined ||
                      sp.floorplanY === null ||
                      sp.floorplanY === undefined ||
                      sp.floorplanWidth === null ||
                      sp.floorplanWidth === undefined ||
                      sp.floorplanHeight === null ||
                      sp.floorplanHeight === undefined
                    ) {
                      return null;
                    }

                    const isSelected = selectedSpaceId === sp.id;
                    const isHovered = hoveredSpaceId === sp.id;
                    const fillColor = getRoomHighlightColor(sp);
                    const catCode = getSpaceCategoryCode(sp);
                    const catBorderColor = categories.find((c) => c.code === catCode)?.legendColor || "#6366f1";
                    const isAvailable = sp.status === "available";

                    return (
                      <div
                        key={sp.id}
                        onClick={() => setSelectedSpaceId(sp.id)}
                        onMouseEnter={() => setHoveredSpaceId(sp.id)}
                        onMouseLeave={() => setHoveredSpaceId(null)}
                        style={{
                          left: `${sp.floorplanX}%`,
                          top: `${sp.floorplanY}%`,
                          width: `${sp.floorplanWidth}%`,
                          height: `${sp.floorplanHeight}%`,
                          backgroundColor: showHotspotFills ? `${fillColor}40` : "transparent",
                          borderColor: borderMode === "category" ? catBorderColor : "#6366f1",
                        }}
                        className={`absolute border-2 transition-all duration-150 flex flex-col justify-between p-1 select-none cursor-pointer ${
                          isSelected
                            ? "ring-4 ring-black z-30 shadow-2xl scale-[1.02]"
                            : isHovered
                            ? "ring-2 ring-white z-20"
                            : "z-10 hover:border-white"
                        }`}
                      >
                        {/* Space Header Badge */}
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="px-1 py-0.2 text-[8px] font-bold font-mono bg-black text-white border border-neutral-700">
                            {sp.spaceNumber}
                          </span>
                          <span
                            className={`w-2 h-2 ${
                              isAvailable ? "bg-emerald-400" : "bg-rose-500"
                            }`}
                          />
                        </div>

                        {/* Space Name & Label (Controlled by Label Filter) */}
                        {showLabels && labelMode !== "none" && (
                          <div className="text-center pointer-events-none truncate my-auto px-0.5">
                            {labelMode === "names" && (
                              <>
                                <span className="text-[9px] font-bold text-white drop-shadow-md block truncate">
                                  {sp.name}
                                </span>
                                <span className="text-[7.5px] text-neutral-300 font-mono">
                                  {sp.capacity} pax
                                </span>
                              </>
                            )}

                            {labelMode === "capacity" && (
                              <span className="text-[10px] font-bold text-emerald-300 font-mono">
                                {sp.capacity} PAX
                              </span>
                            )}

                            {labelMode === "area" && (
                              <span className="text-[9px] font-bold text-indigo-300 font-mono">
                                {sp.capacity ? sp.capacity * 45 : 350} ft²
                              </span>
                            )}

                            {labelMode === "division" && (
                              <span className="text-[8px] font-bold text-amber-300 uppercase block truncate">
                                {catCode}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Room Details Slide-Over / Card */}
              {selectedSpace && (
                <div className="bg-white border-t-2 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150 text-black">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-black text-white font-mono font-bold text-xs">
                        {selectedSpace.spaceNumber}
                      </span>
                      <h4 className="font-bold text-black text-sm uppercase">{selectedSpace.name}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                          selectedSpace.status === "available"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                            : "bg-rose-50 text-rose-800 border-rose-400"
                        }`}
                      >
                        {selectedSpace.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 font-mono">
                      Category: <strong className="text-black">{getSpaceCategoryCode(selectedSpace)}</strong> • Capacity: <strong className="text-black">{selectedSpace.capacity || 1} pax</strong> • Area: <strong className="text-black">{selectedSpace.capacity ? selectedSpace.capacity * 45 : 350} ft²</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <button
                      type="button"
                      onClick={() => setShowEditorMode(true)}
                      className="px-3 py-1.5 border border-neutral-400 hover:border-black bg-white hover:bg-neutral-100 text-black font-bold uppercase transition-colors cursor-pointer"
                    >
                      Reshape Bounds
                    </button>
                    <a
                      href={`/portal/reservations?spaceId=${selectedSpace.id}`}
                      className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Space</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BATCH CATEGORY ALLOCATION (SPATIAL ASSIGN TOOL)   */}
      {/* ======================================================== */}
      {showAssignModal && assigningCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-lg w-full p-6 space-y-4 shadow-none animate-in zoom-in-95 duration-150 text-black font-mono">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-bold text-sm text-black uppercase flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 border border-black"
                  style={{ backgroundColor: assigningCategory.legendColor }}
                />
                <span>Batch Allocate to &apos;{assigningCategory.name}&apos;</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-neutral-600 hover:text-black text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Select rooms on <strong>{selectedFloor?.name || "Floor 18"}</strong> to allocate to category{" "}
              <strong style={{ color: assigningCategory.legendColor }}>{assigningCategory.code}</strong>.
            </p>

            {/* Room selection checkboxes */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-neutral-300 p-3 bg-neutral-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 text-[11px] text-neutral-600 uppercase font-bold">
                <span>Select Rooms ({selectedRoomIdsForAssign.length} selected)</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoomIdsForAssign.length === spaces.length) {
                      setSelectedRoomIdsForAssign([]);
                    } else {
                      setSelectedRoomIdsForAssign(spaces.map((s) => s.id));
                    }
                  }}
                  className="text-black hover:underline font-bold uppercase"
                >
                  {selectedRoomIdsForAssign.length === spaces.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {spaces.map((sp) => {
                const isChecked = selectedRoomIdsForAssign.includes(sp.id);
                return (
                  <label
                    key={sp.id}
                    className="flex items-center justify-between p-2 bg-white hover:bg-neutral-100 border border-neutral-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedRoomIdsForAssign((prev) => prev.filter((id) => id !== sp.id));
                          } else {
                            setSelectedRoomIdsForAssign((prev) => [...prev, sp.id]);
                          }
                        }}
                        className="accent-black"
                      />
                      <span className="font-mono font-bold text-black">{sp.spaceNumber}</span>
                      <span className="text-neutral-700 truncate max-w-[200px]">{sp.name}</span>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      {sp.spaceType}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-neutral-300 hover:border-black text-black text-xs uppercase font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchAssign}
                disabled={submittingAssign || selectedRoomIdsForAssign.length === 0}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase text-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submittingAssign ? "Allocating..." : `Allocate (${selectedRoomIdsForAssign.length}) Rooms`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FLOOR & BUILDING DIMENSIONS & SCALE CONFIG        */}
      {/* ======================================================== */}
      <FloorBuildingDimensionsModal
        isOpen={showDimensionsModal}
        onClose={() => {
          setShowDimensionsModal(false);
          setDimensionsTargetFloor(null);
        }}
        floor={
          (dimensionsTargetFloor || selectedFloor)
            ? {
                id: (dimensionsTargetFloor || selectedFloor)!.id,
                name: (dimensionsTargetFloor || selectedFloor)!.name,
                code: (dimensionsTargetFloor || selectedFloor)!.code,
                floorNumber: (dimensionsTargetFloor || selectedFloor)!.floorNumber,
                areaSqFt: (dimensionsTargetFloor || selectedFloor)!.areaSqFt,
                buildingId:
                  (dimensionsTargetFloor || selectedFloor)!.buildingId ||
                  (dimensionsTargetFloor || selectedFloor)!.building?.id,
                building: (dimensionsTargetFloor || selectedFloor)!.building,
                spaces: spaces,
              }
            : null
        }
        onSaved={(updatedFloor, updatedBuilding) => {
          if (updatedFloor) {
            setFloors((prev) =>
              prev.map((f) =>
                f.id === updatedFloor.id
                  ? {
                      ...f,
                      name: updatedFloor.name || f.name,
                      code: updatedFloor.code || f.code,
                      floorNumber:
                        updatedFloor.floorNumber ??
                        updatedFloor.floor_number ??
                        f.floorNumber,
                      areaSqFt:
                        updatedFloor.areaSqFt ??
                        updatedFloor.area_sq_ft ??
                        f.areaSqFt,
                      ...(updatedBuilding ? { building: updatedBuilding } : {}),
                    }
                  : f
              )
            );
            if (selectedFloor?.id === updatedFloor.id) {
              setSelectedFloor((prev) =>
                prev
                  ? {
                      ...prev,
                      name: updatedFloor.name || prev.name,
                      code: updatedFloor.code || prev.code,
                      floorNumber:
                        updatedFloor.floorNumber ??
                        updatedFloor.floor_number ??
                        prev.floorNumber,
                      areaSqFt:
                        updatedFloor.areaSqFt ??
                        updatedFloor.area_sq_ft ??
                        prev.areaSqFt,
                      ...(updatedBuilding ? { building: updatedBuilding } : {}),
                    }
                  : null
              );
            }
          }
          fetchSpatialData();
        }}
      />
    </div>
  );
}
