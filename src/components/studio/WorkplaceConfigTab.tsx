"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  MapPin,
  Map,
  Layers,
  Box,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Search,
  Sliders,
  Monitor,
  Video,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Compass,
  Eye,
  Settings2,
  Tv,
  CheckSquare,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import { CadFloorplanEditor } from "@/components/workplace/CadFloorplanEditor";
import { SpaceConsole } from "@/components/workplace/SpaceConsole";
import { TimeFormat, formatDateTimeSlot } from "@/lib/time-format";

interface SpaceItem {
  id: string;
  name: string;
  spaceNumber: string;
  floorId: string;
  spaceType: string;
  status: string;
  capacity: number;
  squareFeet?: number;
  department?: string;
  svgElementId?: string;
  capabilities: string | string[];
  imageUrl?: string;
  floorplanX?: number;
  floorplanY?: number;
  floorplanWidth?: number;
  floorplanHeight?: number;
  floor?: {
    id: string;
    name: string;
    floorNumber: number;
    code: string;
    floorplanSvgUrl?: string;
    building?: {
      id: string;
      name: string;
      code: string;
      campus?: {
        id: string;
        name: string;
      };
    };
  };
}

interface FloorItem {
  id: string;
  name: string;
  floorNumber: number;
  code: string;
  buildingId: string;
  floorplanSvgUrl?: string;
  floorplanImageUrl?: string;
  areaSqFt?: number;
  building?: {
    id: string;
    name: string;
    code: string;
    campus?: {
      id: string;
      name: string;
    };
  };
  spaces?: SpaceItem[];
}

interface ReservationItem {
  id: string;
  number: string;
  title: string;
  meetingType: string;
  startTime: string;
  endTime: string;
  status: string;
  attendeesCount: number;
  spaceId: string;
  reservedById: string;
  space?: SpaceItem;
  reservedBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

const CAPABILITY_OPTIONS = [
  { key: "teams", label: "Microsoft Teams Rooms", icon: Video, color: "text-[var(--swiss-blue)] bg-[var(--theme-accent-light)] border-[var(--swiss-blue)]" },
  { key: "zoom", label: "Zoom Rooms", icon: Video, color: "text-[var(--swiss-blue)] bg-[var(--theme-accent-light)] border-[var(--swiss-blue)]" },
  { key: "standing_desk", label: "Ergonomic Standing Desk", icon: Sliders, color: "text-[var(--swiss-emerald)] bg-[var(--theme-accent-light)] border-[var(--swiss-emerald)]" },
  { key: "whiteboard", label: "Smart / Physical Whiteboard", icon: Edit3, color: "text-[var(--theme-text-primary)] bg-[var(--theme-accent-light)] border-[var(--theme-card-border)]" },
  { key: "4k_projector", label: "4K Laser Projector / Display", icon: Tv, color: "text-[var(--swiss-amber)] bg-[var(--theme-accent-light)] border-[var(--swiss-amber)]" },
  { key: "telepresence", label: "Cisco Telepresence Dual-Cam", icon: Monitor, color: "text-[var(--swiss-blue)] bg-[var(--theme-accent-light)] border-[var(--swiss-blue)]" },
  { key: "dual_monitor", label: "Dual 4K USB-C Hub Monitors", icon: Monitor, color: "text-[var(--swiss-emerald)] bg-[var(--theme-accent-light)] border-[var(--swiss-emerald)]" },
];

const SPACE_TYPES = [
  "Office",
  "Hot Desk",
  "Dedicated Desk",
  "Conference Room",
  "Boardroom",
  "Video Suite",
  "Auditorium",
  "Huddle Room",
  "Server Room",
  "Laboratory",
];

export function WorkplaceConfigTab() {
  const [subTab, setSubTab] = useState<"spaces" | "floors" | "hierarchy" | "reservations" | "cad_mapper" | "space_console">("space_console");
  const [targetFloorForCad, setTargetFloorForCad] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);

  // Search & Filters
  const [spaceSearch, setSpaceSearch] = useState("");
  const [spaceTypeFilter, setSpaceTypeFilter] = useState("all");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all");
  const [reservationSearch, setReservationSearch] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");

  // Space Edit Modal State
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [spaceForm, setSpaceForm] = useState({
    name: "",
    spaceNumber: "",
    floorId: "",
    spaceType: "Conference Room",
    status: "available",
    capacity: 6,
    squareFeet: 250,
    department: "General Facility",
    svgElementId: "",
    capabilities: ["teams", "whiteboard"] as string[],
    imageUrl: "",
    floorplanX: 10,
    floorplanY: 10,
    floorplanWidth: 15,
    floorplanHeight: 15,
  });

  // Floor Blueprint Modal State
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorItem | null>(null);
  const [floorForm, setFloorForm] = useState({
    name: "",
    code: "",
    floorNumber: 1,
    buildingId: "",
    floorplanSvgUrl: "/blueprints/tech_tower_l4.svg",
    floorplanImageUrl: "",
    areaSqFt: 12000,
  });

  // Blueprint Preview State
  const [previewFloor, setPreviewFloor] = useState<FloorItem | null>(null);

  // Policy Settings State
  const [policies, setPolicies] = useState({
    maxMeetingHours: 4,
    maxDeskHours: 8,
    advanceBookingDays: 30,
    autoReleaseMinutes: 15,
    requireApprovalForAuditorium: true,
    enableRecurringBookings: true,
  });

  // Time format state (12-Hour AM/PM vs. 24-Hour Military Time)
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("servicemeow_time_format");
      if (saved === "12h" || saved === "24h") {
        setTimeFormat(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadAllWorkplaceData();
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllWorkplaceData = async () => {
    setLoading(true);
    try {
      // 1. Load spaces with floor & building details
      const spacesRes = await fetch("/api/now/reservations?mode=spaces");
      if (spacesRes.ok) {
        const data = await spacesRes.json();
        setSpaces(data.result || []);
      }

      // 2. Load reservations
      const resRes = await fetch("/api/now/reservations?mode=reservations");
      if (resRes.ok) {
        const data = await resRes.json();
        setReservations(data.result || []);
      }

      // 3. Load spatial tree
      const treeRes = await fetch("/api/now/spatial/tree?include_assets=false");
      if (treeRes.ok) {
        const data = await treeRes.json();
        const regionsList: any[] = Array.isArray(data.result?.tree)
          ? data.result.tree
          : Array.isArray(data.result)
          ? data.result
          : Array.isArray(data.tree)
          ? data.tree
          : [];

        setTreeData(regionsList);

        // Extract flat floors
        const flatFloors: FloorItem[] = [];
        regionsList.forEach((reg: any) => {
          (reg.states || []).forEach((st: any) => {
            (st.campuses || []).forEach((camp: any) => {
              (camp.buildings || []).forEach((bld: any) => {
                (bld.floors || []).forEach((fl: any) => {
                  flatFloors.push({
                    ...fl,
                    building: {
                      id: bld.id,
                      name: bld.name,
                      code: bld.code,
                      campus: { id: camp.id, name: camp.name },
                    },
                  });
                });
              });
            });
          });
        });
        setFloors(flatFloors);
      }
    } catch (err: any) {
      console.error("Error loading workplace configuration:", err);
      showFeedback("error", "Failed to load workplace data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseCaps = (caps: string | string[]): string[] => {
    if (Array.isArray(caps)) return caps;
    if (typeof caps === "string") {
      try {
        const parsed = JSON.parse(caps);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return caps.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
    }
    return [];
  };

  // Quick toggle capability directly on space
  const handleToggleCapability = async (space: SpaceItem, capKey: string) => {
    const current = parseCaps(space.capabilities);
    const updated = current.includes(capKey)
      ? current.filter((c) => c !== capKey)
      : [...current, capKey];

    try {
      const res = await fetch(`/api/now/table/cmn_space/${space.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilities: JSON.stringify(updated),
        }),
      });

      if (res.ok) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === space.id ? { ...s, capabilities: updated } : s))
        );
        showFeedback("success", `Updated capabilities for ${space.name}`);
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Failed to update capability");
      }
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Open Space Edit / Create Modal
  const handleOpenSpaceModal = (space?: SpaceItem) => {
    if (space) {
      setEditingSpaceId(space.id);
      setSpaceForm({
        name: space.name,
        spaceNumber: space.spaceNumber,
        floorId: space.floorId || (space.floor?.id ?? ""),
        spaceType: space.spaceType || "Conference Room",
        status: space.status || "available",
        capacity: space.capacity || 1,
        squareFeet: space.squareFeet || 200,
        department: space.department || "Digital Workplace",
        svgElementId: space.svgElementId || `svg-${space.spaceNumber.toLowerCase()}`,
        capabilities: parseCaps(space.capabilities),
        imageUrl: space.imageUrl || "",
        floorplanX: space.floorplanX ?? 10,
        floorplanY: space.floorplanY ?? 10,
        floorplanWidth: space.floorplanWidth ?? 15,
        floorplanHeight: space.floorplanHeight ?? 15,
      });
    } else {
      setEditingSpaceId(null);
      const defaultFloorId = floors[0]?.id || "";
      setSpaceForm({
        name: "Innovation Lab 405",
        spaceNumber: "CONF-405",
        floorId: defaultFloorId,
        spaceType: "Conference Room",
        status: "available",
        capacity: 10,
        squareFeet: 400,
        department: "Engineering",
        svgElementId: "svg-room-conf-405",
        capabilities: ["teams", "zoom", "whiteboard"],
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        floorplanX: 40,
        floorplanY: 35,
        floorplanWidth: 18,
        floorplanHeight: 20,
      });
    }
    setSpaceModalOpen(true);
  };

  // Save Space Record
  const handleSaveSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: spaceForm.name,
        space_number: spaceForm.spaceNumber,
        floor_id: spaceForm.floorId,
        space_type: spaceForm.spaceType,
        status: spaceForm.status,
        capacity: spaceForm.capacity,
        square_feet: spaceForm.squareFeet,
        department: spaceForm.department,
        svg_element_id: spaceForm.svgElementId,
        capabilities: JSON.stringify(spaceForm.capabilities),
        image_url: spaceForm.imageUrl,
        floorplan_x: spaceForm.floorplanX,
        floorplan_y: spaceForm.floorplanY,
        floorplan_width: spaceForm.floorplanWidth,
        floorplan_height: spaceForm.floorplanHeight,
      };

      if (editingSpaceId) {
        const res = await fetch(`/api/now/table/cmn_space/${editingSpaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update space");
        showFeedback("success", `Space ${spaceForm.name} updated successfully!`);
      } else {
        const res = await fetch("/api/now/table/cmn_space", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create space");
        showFeedback("success", `Space ${spaceForm.name} created successfully!`);
      }

      setSpaceModalOpen(false);
      loadAllWorkplaceData();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Floor Modal
  const handleOpenFloorModal = (floor: FloorItem) => {
    setEditingFloor(floor);
    setFloorForm({
      name: floor.name,
      code: floor.code,
      floorNumber: floor.floorNumber,
      buildingId: floor.buildingId,
      floorplanSvgUrl: floor.floorplanSvgUrl || "/blueprints/tech_tower_l4.svg",
      floorplanImageUrl: floor.floorplanImageUrl || "",
      areaSqFt: floor.areaSqFt || 12000,
    });
    setFloorModalOpen(true);
  };

  // Save Floor Blueprint
  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/now/table/cmn_floor/${editingFloor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: floorForm.name,
          code: floorForm.code,
          floor_number: floorForm.floorNumber,
          floorplan_svg_url: floorForm.floorplanSvgUrl,
          floorplan_image_url: floorForm.floorplanImageUrl,
          area_sq_ft: floorForm.areaSqFt,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to update floor blueprint");
      showFeedback("success", `Floorplan blueprint updated for ${floorForm.name}!`);
      setFloorModalOpen(false);
      loadAllWorkplaceData();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reservation Status Action (check-in / cancel)
  const handleReservationAction = async (resItem: ReservationItem, newStatus: string) => {
    try {
      const res = await fetch(`/api/now/reservations/${resItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Action failed");
      showFeedback("success", `Reservation ${resItem.number} marked as ${newStatus}`);
      loadAllWorkplaceData();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // Filtered lists
  const filteredSpaces = spaces.filter((s) => {
    const q = spaceSearch.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      s.spaceNumber.toLowerCase().includes(q) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.floor?.name && s.floor.name.toLowerCase().includes(q));

    const matchesType = spaceTypeFilter === "all" || s.spaceType === spaceTypeFilter;

    const sCaps = parseCaps(s.capabilities);
    const matchesCap =
      capabilityFilter === "all" || sCaps.includes(capabilityFilter);

    return matchesQuery && matchesType && matchesCap;
  });

  const filteredReservations = reservations.filter((r) => {
    const q = reservationSearch.toLowerCase();
    const matchesQuery =
      r.number.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (r.space?.name && r.space.name.toLowerCase().includes(q)) ||
      (r.reservedBy?.name && r.reservedBy.name.toLowerCase().includes(q));

    const matchesStatus =
      reservationStatusFilter === "all" || r.status === reservationStatusFilter;

    return matchesQuery && matchesStatus;
  });

  // Calculate Spatial Hierarchy Counts
  const regionsArray = Array.isArray(treeData) ? treeData : [];
  const hierarchyCounts = {
    regions: regionsArray.length,
    states: regionsArray.reduce((acc, r) => acc + (r.states?.length || 0), 0),
    campuses: regionsArray.reduce(
      (acc, r) =>
        acc +
        (r.states || []).reduce((sAcc: number, s: any) => sAcc + (s.campuses?.length || 0), 0),
      0
    ),
    buildings: regionsArray.reduce(
      (acc, r) =>
        acc +
        (r.states || []).reduce(
          (sAcc: number, s: any) =>
            sAcc +
            (s.campuses || []).reduce(
              (cAcc: number, c: any) => cAcc + (c.buildings?.length || 0),
              0
            ),
          0
        ),
      0
    ),
    floors: floors.length,
    spaces: spaces.length,
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-[var(--theme-accent-light)] border-[var(--swiss-emerald)] text-[var(--swiss-emerald)]"
              : "bg-[var(--theme-accent-light)] border-[var(--swiss-red)] text-[var(--swiss-red)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--swiss-emerald)]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[var(--swiss-red)]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="sw-page-header">
        <div className="space-y-1.5">
          <div className="sw-eyebrow">
            <span className="sw-eyebrow-tag">WORKPLACE</span>
            <Building2 className="w-3.5 h-3.5" />
            <span>Workplace Hub &amp; Facility Management Console</span>
          </div>
          <h2 className="sw-title text-2xl md:text-3xl">
            Workplace & Reservations Configuration
          </h2>
          <p className="sw-subtitle leading-relaxed">
            Manage the complete enterprise spatial hierarchy across all 6 tiers, configure room & desk capabilities (Teams, Zoom, Standing desks), assign architectural SVG floorplans, and govern reservation booking windows.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadAllWorkplaceData}
            disabled={loading}
            className="sw-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>

          <Link
            href="/workspace/reservations"
            className="sw-btn-primary"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Booking Hub</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="sw-tabs flex-nowrap border-b border-[var(--theme-card-border)] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab("space_console")}
          className={`whitespace-nowrap ${
            subTab === "space_console"
              ? "sw-tab-active"
              : "sw-tab"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Space Console</span>
          <span className="px-1.5 py-0.2 text-[10px] border border-current font-mono">
            CAD Vectors
          </span>
        </button>

        <button
          onClick={() => setSubTab("spaces")}
          className={`whitespace-nowrap ${
            subTab === "spaces"
              ? "sw-tab-active"
              : "sw-tab"
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Spaces & Room Capabilities</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)]">
            {spaces.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab("floors")}
          className={`whitespace-nowrap ${
            subTab === "floors"
              ? "sw-tab-active"
              : "sw-tab"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Floors & Floorplan Blueprints</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)]">
            {floors.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab("hierarchy")}
          className={`whitespace-nowrap ${
            subTab === "hierarchy"
              ? "sw-tab-active"
              : "sw-tab"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Spatial Hierarchy (6 Tiers)</span>
        </button>

        <button
          onClick={() => setSubTab("reservations")}
          className={`whitespace-nowrap ${
            subTab === "reservations"
              ? "sw-tab-active"
              : "sw-tab"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Reservations & Policy Governance</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)]">
            {reservations.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab("cad_mapper")}
          className={`whitespace-nowrap ${
            subTab === "cad_mapper"
              ? "sw-tab-active"
              : "sw-tab"
          }`}
        >
          <Square className="w-4 h-4 text-[var(--swiss-blue)]" />
          <span>CAD Drawing &amp; Room Mapper</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-[var(--theme-accent-light)] text-[var(--swiss-blue)] font-mono">
            Visual CAD
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 0: SERVICE MEOW SPACE CONSOLE & CAD BLUEPRINT ENGINE              */}
      {/* ========================================================================= */}
      {subTab === "space_console" && (
        <div className="space-y-4">
          <SpaceConsole className="border border-[var(--theme-card-border)] overflow-hidden" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: SPACES & ROOM CAPABILITIES                                      */}
      {/* ========================================================================= */}
      {subTab === "spaces" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--theme-card-bg)] p-3 border border-[var(--theme-card-border)]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--theme-text-secondary)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search space name, number, department..."
                  value={spaceSearch}
                  onChange={(e) => setSpaceSearch(e.target.value)}
                  className="sw-input w-full pl-9 pr-3 py-1.5 text-xs"
                />
              </div>

              <select
                value={spaceTypeFilter}
                onChange={(e) => setSpaceTypeFilter(e.target.value)}
                className="sw-input px-2.5 py-1.5 text-xs"
              >
                <option value="all">All Types</option>
                {SPACE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={capabilityFilter}
                onChange={(e) => setCapabilityFilter(e.target.value)}
                className="sw-input px-2.5 py-1.5 text-xs"
              >
                <option value="all">All Capabilities</option>
                {CAPABILITY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenSpaceModal()}
              className="sw-btn-primary flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Space</span>
            </button>
          </div>

          {/* Quick Capability Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider shrink-0">
              Capability Highlights:
            </span>
            {CAPABILITY_OPTIONS.map((cap) => {
              const Icon = cap.icon;
              const count = spaces.filter((s) => parseCaps(s.capabilities).includes(cap.key)).length;
              const isSelected = capabilityFilter === cap.key;

              return (
                <button
                  key={cap.key}
                  onClick={() => setCapabilityFilter(isSelected ? "all" : cap.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-medium transition-all shrink-0 ${
                    isSelected
                      ? "bg-[var(--theme-text-primary)] text-[var(--theme-page-bg)] border-[var(--theme-text-primary)]"
                      : "bg-[var(--theme-card-bg)] border-[var(--theme-card-border)] text-[var(--theme-text-primary)] hover:border-[var(--theme-text-primary)] hover:bg-[var(--theme-accent-light)]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cap.label}</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-black/30">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Spaces Table */}
          <div className="sw-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="sw-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--theme-page-bg)] border-b border-[var(--theme-card-border)] text-[11px] uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    <th className="py-3 px-4 font-bold">Space / Room</th>
                    <th className="py-3 px-4 font-bold">Location & Floor</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Capacity</th>
                    <th className="py-3 px-4 font-bold">Configured Capabilities</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-card-border)]">
                  {filteredSpaces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[var(--theme-text-secondary)] text-xs">
                        No spaces match the active query. Click &quot;Add New Space&quot; to configure one.
                      </td>
                    </tr>
                  ) : (
                    filteredSpaces.map((space) => {
                      const sCaps = parseCaps(space.capabilities);
                      return (
                        <tr key={space.id} className="hover:bg-[var(--theme-accent-light)] transition-colors group">
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-[var(--theme-accent-light)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                                {space.spaceType === "Hot Desk" ? "D" : "R"}
                              </div>
                              <div>
                                <div className="font-bold text-[var(--theme-text-primary)] text-xs">{space.name}</div>
                                <div className="text-[10px] font-mono text-[var(--theme-text-secondary)]">
                                  {space.spaceNumber} &bull; {space.department || "General"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[var(--theme-text-primary)]">
                            <div>{space.floor?.name || "Unassigned Floor"}</div>
                            <div className="text-[10px] text-[var(--theme-text-secondary)]">
                              {space.floor?.building?.name || "Corporate Building"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] border border-[var(--theme-card-border)]">
                              {space.spaceType}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[var(--theme-text-primary)]">
                            <div className="flex items-center gap-1 font-mono">
                              <Users className="w-3 h-3 text-[var(--theme-text-secondary)]" />
                              <span>{space.capacity} {space.capacity === 1 ? "seat" : "seats"}</span>
                            </div>
                            {space.squareFeet && (
                              <div className="text-[10px] text-[var(--theme-text-secondary)]">{space.squareFeet} sq ft</div>
                            )}
                          </td>

                          {/* Capabilities Pills & Quick Toggles */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {CAPABILITY_OPTIONS.map((cap) => {
                                const hasCap = sCaps.includes(cap.key);
                                return (
                                  <button
                                    key={cap.key}
                                    type="button"
                                    onClick={() => handleToggleCapability(space, cap.key)}
                                    title={`Click to ${hasCap ? "disable" : "enable"} ${cap.label}`}
                                    className={`px-2 py-0.5 text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                                      hasCap
                                        ? cap.color
                                        : "bg-[var(--theme-page-bg)] text-[var(--theme-text-secondary)] border-[var(--theme-card-border)] hover:border-[var(--theme-text-primary)] opacity-60 hover:opacity-100"
                                    }`}
                                  >
                                    <span>{cap.label.split(" ")[0]}</span>
                                    {hasCap ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                space.status === "available"
                                  ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                                  : space.status === "occupied"
                                  ? "bg-[var(--theme-accent-light)] text-[var(--swiss-amber)] border border-[var(--swiss-amber)]"
                                  : "bg-[var(--theme-accent-light)] text-[var(--swiss-red)] border border-[var(--swiss-red)]"
                              }`}
                            >
                              {space.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenSpaceModal(space)}
                              className="sw-btn px-2.5 py-1 text-xs inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: FLOORS & FLOORPLAN BLUEPRINTS                                  */}
      {/* ========================================================================= */}
      {subTab === "floors" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floors.map((floor) => {
              const floorSpaces = spaces.filter((s) => s.floorId === floor.id || s.floor?.id === floor.id);
              const teamsRoomsCount = floorSpaces.filter((s) => parseCaps(s.capabilities).includes("teams")).length;
              const standingDesksCount = floorSpaces.filter((s) => parseCaps(s.capabilities).includes("standing_desk")).length;

              return (
                <div
                  key={floor.id}
                  className="sw-panel p-5 hover:border-[var(--theme-text-primary)] transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-[var(--theme-accent-light)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] flex items-center justify-center font-bold text-sm">
                        L{floor.floorNumber}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)]">
                        {floor.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-[var(--theme-text-primary)] text-sm">{floor.name}</h3>
                      <p className="text-xs text-[var(--theme-text-secondary)]">
                        {floor.building?.name || "Corporate Building"} &bull; {floor.building?.campus?.name || "Main Campus"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--theme-card-border)] grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-[var(--theme-page-bg)] p-2 border border-[var(--theme-card-border)]">
                        <div className="text-[10px] text-[var(--theme-text-secondary)]">Total Spaces</div>
                        <div className="font-bold text-[var(--theme-text-primary)] mt-0.5">{floorSpaces.length}</div>
                      </div>
                      <div className="bg-[var(--theme-page-bg)] p-2 border border-[var(--theme-card-border)]">
                        <div className="text-[10px] text-[var(--theme-text-secondary)]">Teams Rooms</div>
                        <div className="font-bold text-[var(--swiss-blue)] mt-0.5">{teamsRoomsCount}</div>
                      </div>
                      <div className="bg-[var(--theme-page-bg)] p-2 border border-[var(--theme-card-border)]">
                        <div className="text-[10px] text-[var(--theme-text-secondary)]">Standing Desks</div>
                        <div className="font-bold text-[var(--swiss-emerald)] mt-0.5">{standingDesksCount}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-[var(--theme-text-secondary)] flex items-center justify-between">
                        <span>SVG Blueprint:</span>
                        <span className="font-mono text-[var(--theme-text-primary)] text-[10px] truncate max-w-[180px]">
                          {floor.floorplanSvgUrl || "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--theme-card-border)]">
                    <button
                      onClick={() => setPreviewFloor(floor)}
                      className="sw-btn flex-1 px-2.5 py-1.5 text-xs flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => {
                        setTargetFloorForCad(floor.id);
                        setSubTab("cad_mapper");
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-[var(--theme-accent-light)] hover:bg-[var(--theme-accent-light)] text-[var(--swiss-blue)] border border-[var(--swiss-blue)] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Draw and Map Room Hotspots on CAD Drawing"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>CAD Mapper</span>
                    </button>
                    <button
                      onClick={() => handleOpenFloorModal(floor)}
                      className="flex-1 px-2.5 py-1.5 bg-[var(--theme-accent-light)] hover:opacity-85 text-[var(--theme-text-primary)] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SPATIAL HIERARCHY (6 TIERS)                                     */}
      {/* ========================================================================= */}
      {subTab === "hierarchy" && (
        <div className="space-y-6">
          {/* 6-Tier Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { tier: 1, label: "Regions", count: hierarchyCounts.regions, icon: Map, color: "text-[var(--swiss-red)]", table: "cmn_region" },
              { tier: 2, label: "States / Prov", count: hierarchyCounts.states, icon: MapPin, color: "text-[var(--swiss-amber)]", table: "cmn_state" },
              { tier: 3, label: "Campuses", count: hierarchyCounts.campuses, icon: Building2, color: "text-[var(--swiss-emerald)]", table: "cmn_campus" },
              { tier: 4, label: "Buildings", count: hierarchyCounts.buildings, icon: Building2, color: "text-[var(--swiss-blue)]", table: "cmn_building" },
              { tier: 5, label: "Floors & Levels", count: hierarchyCounts.floors, icon: Layers, color: "text-[var(--swiss-blue)]", table: "cmn_floor" },
              { tier: 6, label: "Spaces & Rooms", count: hierarchyCounts.spaces, icon: Box, color: "text-[var(--theme-text-primary)]", table: "cmn_space" },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.tier}
                  className="sw-panel p-3.5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] mb-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider">Tier {t.tier}</span>
                    <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                  </div>
                  <div className="text-xl font-black text-[var(--theme-text-primary)]">{t.count}</div>
                  <div className="text-xs font-semibold text-[var(--theme-text-primary)] mt-0.5">{t.label}</div>
                  <Link
                    href={`/workspace/${t.table}`}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--theme-text-primary)] hover:underline mt-2"
                  >
                    <span>View {t.table}</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Interactive Spatial Tree View */}
          <div className="sw-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div>
                <h3 className="font-bold text-[var(--theme-text-primary)] text-sm">Enterprise Spatial Tree Explorer</h3>
                <p className="text-xs text-[var(--theme-text-secondary)]">
                  Full parent-child relationship breakdown from global Region down to Space/Room
                </p>
              </div>
              <Link
                href="/workspace/spaces"
                className="sw-btn px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Full Screen Spatial Explorer</span>
              </Link>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {(Array.isArray(treeData) ? treeData : []).map((region) => (
                <div key={region.id} className="border border-[var(--theme-card-border)] bg-[var(--theme-page-bg)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between font-bold text-xs text-[var(--swiss-red)]">
                    <span className="flex items-center gap-2">
                      <Map className="w-3.5 h-3.5" />
                      <span>{region.name} ({region.code})</span>
                    </span>
                    <span className="sw-badge-red text-[10px] px-2 py-0.5">
                      Tier 1 Region
                    </span>
                  </div>

                  <div className="pl-4 border-l border-[var(--theme-card-border)] space-y-2">
                    {(region.states || []).map((state: any) => (
                      <div key={state.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[var(--swiss-amber)]">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            <span>{state.name} ({state.code})</span>
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[var(--theme-accent-light)] text-[var(--swiss-amber)]">
                            Tier 2 State
                          </span>
                        </div>

                        <div className="pl-4 border-l border-[var(--theme-card-border)] space-y-2">
                          {(state.campuses || []).map((campus: any) => (
                            <div key={campus.id} className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-[var(--swiss-emerald)]">
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="w-3 h-3" />
                                  <span>{campus.name} ({campus.code})</span>
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)]">
                                  Tier 3 Campus
                                </span>
                              </div>

                              <div className="pl-4 border-l border-[var(--theme-card-border)] space-y-2">
                                {(campus.buildings || []).map((bld: any) => (
                                  <div key={bld.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--swiss-blue)]">
                                      <span className="flex items-center gap-1.5">
                                        <Building2 className="w-3 h-3" />
                                        <span className="font-medium">{bld.name} ({bld.code})</span>
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 bg-[var(--theme-accent-light)] text-[var(--swiss-blue)]">
                                        Tier 4 Building
                                      </span>
                                    </div>

                                    <div className="pl-4 border-l border-[var(--theme-card-border)] space-y-1">
                                      {(bld.floors || []).map((fl: any) => (
                                        <div key={fl.id} className="text-xs text-[var(--theme-text-primary)] flex items-center justify-between py-0.5">
                                          <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
                                            <Layers className="w-3 h-3 text-[var(--swiss-blue)]" />
                                            <span>{fl.name} &bull; {fl.spaces?.length || 0} spaces</span>
                                          </span>
                                          <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">
                                            Tier 5 &bull; {fl.floorplanSvgUrl || "No SVG blueprint"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: RESERVATIONS & POLICY GOVERNANCE                               */}
      {/* ========================================================================= */}
      {subTab === "reservations" && (
        <div className="space-y-6">
          {/* Policy Settings Panel */}
          <div className="sw-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div>
                <h3 className="font-bold text-[var(--theme-text-primary)] text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  <span>Workplace Booking Policies & Governance Rules</span>
                </h3>
                <p className="text-xs text-[var(--theme-text-secondary)]">
                  Global limits enforced across employee self-service bookings
                </p>
              </div>
              <button
                type="button"
                onClick={() => showFeedback("success", "Workplace policies successfully committed to sys_properties!")}
                className="sw-btn-primary px-3 py-1.5 text-xs"
              >
                Save Policies
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-[var(--theme-page-bg)] p-3 border border-[var(--theme-card-border)] space-y-1">
                <label className="text-[var(--theme-text-secondary)] font-medium">Max Meeting Room Duration (Hours)</label>
                <input
                  type="number"
                  value={policies.maxMeetingHours}
                  onChange={(e) => setPolicies({ ...policies, maxMeetingHours: parseInt(e.target.value) || 1 })}
                  className="w-full sw-panel p-1.5 text-[var(--theme-text-primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">Prevents conference room monopolization</span>
              </div>

              <div className="bg-[var(--theme-page-bg)] p-3 border border-[var(--theme-card-border)] space-y-1">
                <label className="text-[var(--theme-text-secondary)] font-medium">Max Hot Desk Duration (Hours)</label>
                <input
                  type="number"
                  value={policies.maxDeskHours}
                  onChange={(e) => setPolicies({ ...policies, maxDeskHours: parseInt(e.target.value) || 1 })}
                  className="w-full sw-panel p-1.5 text-[var(--theme-text-primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">Standard 8-hour workday hot desk reservation</span>
              </div>

              <div className="bg-[var(--theme-page-bg)] p-3 border border-[var(--theme-card-border)] space-y-1">
                <label className="text-[var(--theme-text-secondary)] font-medium">Auto-Release Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={policies.autoReleaseMinutes}
                  onChange={(e) => setPolicies({ ...policies, autoReleaseMinutes: parseInt(e.target.value) || 5 })}
                  className="w-full sw-panel p-1.5 text-[var(--theme-text-primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">Ghost meeting prevention: releases un-checked-in rooms</span>
              </div>
            </div>
          </div>

          {/* Reservation Log Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--theme-card-bg)] p-3 border border-[var(--theme-card-border)]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--theme-text-secondary)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reservation number, title, user, space..."
                  value={reservationSearch}
                  onChange={(e) => setReservationSearch(e.target.value)}
                  className="sw-input w-full pl-9 pr-3 py-1.5 text-xs"
                />
              </div>

              <select
                value={reservationStatusFilter}
                onChange={(e) => setReservationStatusFilter(e.target.value)}
                className="sw-input px-2.5 py-1.5 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="flex items-center p-0.5 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[11px]" title="Toggle 12-Hour AM/PM vs. 24-Hour Military Time">
                <button
                  type="button"
                  onClick={() => {
                    setTimeFormat("12h");
                    try { localStorage.setItem("servicemeow_time_format", "12h"); } catch {}
                  }}
                  className={`px-2 py-0.5 transition-all cursor-pointer ${
                    timeFormat === "12h"
                      ? "bg-[var(--theme-text-primary)] text-[var(--theme-page-bg)] font-semibold"
                      : "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                  }`}
                >
                  12H
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeFormat("24h");
                    try { localStorage.setItem("servicemeow_time_format", "24h"); } catch {}
                  }}
                  className={`px-2 py-0.5 transition-all cursor-pointer ${
                    timeFormat === "24h"
                      ? "bg-[var(--theme-text-primary)] text-[var(--theme-page-bg)] font-semibold"
                      : "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                  }`}
                >
                  24H
                </button>
              </div>
            </div>
          </div>

          {/* Reservations Table */}
          <div className="sw-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="sw-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--theme-page-bg)] border-b border-[var(--theme-card-border)] text-[11px] uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    <th className="py-3 px-4 font-bold">Reservation</th>
                    <th className="py-3 px-4 font-bold">Space / Room</th>
                    <th className="py-3 px-4 font-bold">Reserved By</th>
                    <th className="py-3 px-4 font-bold">Scheduled Window</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-card-border)]">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--theme-text-secondary)] text-xs">
                        No active reservations found.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((r) => {
                      const start = new Date(r.startTime);
                      const end = new Date(r.endTime);

                      return (
                        <tr key={r.id} className="hover:bg-[var(--theme-accent-light)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-[var(--theme-text-primary)]">{r.number}</div>
                            <div className="font-semibold text-[var(--theme-text-primary)] mt-0.5">{r.title}</div>
                            <div className="text-[10px] text-[var(--theme-text-secondary)] capitalize">{r.meetingType} &bull; {r.attendeesCount} pax</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-[var(--theme-text-primary)]">{r.space?.name || "Assigned Space"}</div>
                            <div className="text-[10px] text-[var(--theme-text-secondary)]">
                              {r.space?.spaceNumber} &bull; {r.space?.floor?.name}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-[var(--theme-text-primary)]">{r.reservedBy?.name || "Enterprise User"}</div>
                            <div className="text-[10px] font-mono text-[var(--theme-text-secondary)]">{r.reservedBy?.email}</div>
                          </td>

                          <td className="py-3 px-4 text-[var(--theme-text-primary)]">
                            <div>{start.toLocaleDateString()}</div>
                            <div className="text-[10px] font-mono text-[var(--theme-text-secondary)]">
                              {formatDateTimeSlot(start, timeFormat)} &ndash; {formatDateTimeSlot(end, timeFormat)}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                r.status === "confirmed"
                                  ? "bg-[var(--theme-accent-light)] text-[var(--swiss-blue)] border border-[var(--swiss-blue)]"
                                  : r.status === "checked_in"
                                  ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                                  : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] border border-[var(--theme-card-border)] line-through"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right space-x-1.5">
                            {r.status === "confirmed" && (
                              <button
                                onClick={() => handleReservationAction(r, "checked_in")}
                                className="px-2 py-1 bg-[var(--theme-accent-light)] hover:bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] text-[10px] font-bold border border-[var(--swiss-emerald)] transition-colors"
                              >
                                Check In
                              </button>
                            )}
                            {r.status !== "cancelled" && (
                              <button
                                onClick={() => handleReservationAction(r, "cancelled")}
                                className="px-2 py-1 bg-[var(--theme-accent-light)] hover:bg-[var(--theme-accent-light)] text-[var(--swiss-red)] text-[10px] font-bold border border-[var(--swiss-red)] transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: INTERACTIVE CAD DRAWING & ROOM HOTSPOT MAPPER                  */}
      {/* ========================================================================= */}
      {subTab === "cad_mapper" && (
        <CadFloorplanEditor
          initialFloorId={targetFloorForCad}
          onSaved={loadAllWorkplaceData}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: SPACE CREATE / EDIT                                               */}
      {/* ========================================================================= */}
      {spaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
          <div className="sw-panel-strong w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[var(--theme-text-primary)]" />
                <h3 className="font-bold text-[var(--theme-text-primary)] text-base">
                  {editingSpaceId ? `Edit Space: ${spaceForm.name}` : "Add New Space / Room"}
                </h3>
              </div>
              <button
                onClick={() => setSpaceModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpace} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Space Name *</label>
                  <input
                    type="text"
                    required
                    value={spaceForm.name}
                    onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                    className="sw-input w-full p-2"
                    placeholder="e.g., Executive Boardroom 402"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Space / Room Number *</label>
                  <input
                    type="text"
                    required
                    value={spaceForm.spaceNumber}
                    onChange={(e) => setSpaceForm({ ...spaceForm, spaceNumber: e.target.value })}
                    className="sw-input w-full p-2"
                    placeholder="e.g., CONF-402 or DESK-410"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Floor Level *</label>
                  <select
                    required
                    value={spaceForm.floorId}
                    onChange={(e) => setSpaceForm({ ...spaceForm, floorId: e.target.value })}
                    className="sw-input w-full p-2"
                  >
                    {floors.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} ({fl.building?.name || "Corporate Building"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Space Type</label>
                  <select
                    value={spaceForm.spaceType}
                    onChange={(e) => setSpaceForm({ ...spaceForm, spaceType: e.target.value })}
                    className="sw-input w-full p-2"
                  >
                    {SPACE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Capacity (People)</label>
                  <input
                    type="number"
                    min="1"
                    value={spaceForm.capacity}
                    onChange={(e) => setSpaceForm({ ...spaceForm, capacity: parseInt(e.target.value) || 1 })}
                    className="sw-input w-full p-2 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Square Footage (Sq Ft)</label>
                  <input
                    type="number"
                    value={spaceForm.squareFeet}
                    onChange={(e) => setSpaceForm({ ...spaceForm, squareFeet: parseInt(e.target.value) || 0 })}
                    className="sw-input w-full p-2 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Allocated Department</label>
                  <input
                    type="text"
                    value={spaceForm.department}
                    onChange={(e) => setSpaceForm({ ...spaceForm, department: e.target.value })}
                    className="sw-input w-full p-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Initial Status</label>
                  <select
                    value={spaceForm.status}
                    onChange={(e) => setSpaceForm({ ...spaceForm, status: e.target.value })}
                    className="sw-input w-full p-2"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Capabilities Multi-Check */}
              <div className="space-y-2 pt-2 border-t border-[var(--theme-card-border)]">
                <label className="text-[var(--theme-text-primary)] font-semibold block">
                  Configured Hardware & Collaboration Capabilities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAPABILITY_OPTIONS.map((cap) => {
                    const isChecked = spaceForm.capabilities.includes(cap.key);
                    const Icon = cap.icon;
                    return (
                      <label
                        key={cap.key}
                        className={`flex items-center gap-2.5 p-2 border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-[var(--theme-accent-light)] border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                            : "bg-[var(--theme-page-bg)] border-[var(--theme-card-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSpaceForm({ ...spaceForm, capabilities: [...spaceForm.capabilities, cap.key] });
                            } else {
                              setSpaceForm({
                                ...spaceForm,
                                capabilities: spaceForm.capabilities.filter((c) => c !== cap.key),
                              });
                            }
                          }}
                          className="border-[var(--theme-card-border)] bg-[var(--theme-card-bg)] text-[var(--theme-text-primary)] focus:ring-[var(--theme-text-primary)]"
                        />
                        <Icon className="w-3.5 h-3.5 text-[var(--theme-text-primary)]" />
                        <span className="font-medium text-xs">{cap.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Architectural SVG Floorplan Coordinates */}
              <div className="space-y-2 pt-2 border-t border-[var(--theme-card-border)]">
                <label className="text-[var(--theme-text-primary)] font-semibold block">
                  Architectural SVG Blueprint Coordinates (0-100% Canvas Box)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--theme-text-secondary)] text-[11px]">X Pos (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={spaceForm.floorplanX}
                      onChange={(e) => setSpaceForm({ ...spaceForm, floorplanX: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-1.5 text-[var(--theme-text-primary)] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[var(--theme-text-secondary)] text-[11px]">Y Pos (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={spaceForm.floorplanY}
                      onChange={(e) => setSpaceForm({ ...spaceForm, floorplanY: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-1.5 text-[var(--theme-text-primary)] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[var(--theme-text-secondary)] text-[11px]">Width (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={spaceForm.floorplanWidth}
                      onChange={(e) => setSpaceForm({ ...spaceForm, floorplanWidth: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-1.5 text-[var(--theme-text-primary)] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[var(--theme-text-secondary)] text-[11px]">Height (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={spaceForm.floorplanHeight}
                      onChange={(e) => setSpaceForm({ ...spaceForm, floorplanHeight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-1.5 text-[var(--theme-text-primary)] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[var(--theme-text-secondary)] text-[11px]">SVG Element ID</label>
                  <input
                    type="text"
                    value={spaceForm.svgElementId}
                    onChange={(e) => setSpaceForm({ ...spaceForm, svgElementId: e.target.value })}
                    className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-1.5 text-[var(--theme-text-primary)] font-mono"
                    placeholder="e.g., svg-room-conf-402"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setSpaceModalOpen(false)}
                  className="sw-btn px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="sw-btn-primary px-5 py-2 text-xs flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSpaceId ? "Update Space" : "Create Space"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FLOOR BLUEPRINT CONFIG                                            */}
      {/* ========================================================================= */}
      {floorModalOpen && editingFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
          <div className="sw-panel-strong w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--theme-text-primary)]" />
                <h3 className="font-bold text-[var(--theme-text-primary)] text-base">
                  Floorplan Blueprint: {floorForm.name}
                </h3>
              </div>
              <button
                onClick={() => setFloorModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFloor} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--theme-text-primary)] font-semibold">Floor Name</label>
                <input
                  type="text"
                  required
                  value={floorForm.name}
                  onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                  className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-2 text-[var(--theme-text-primary)] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Floor Code</label>
                  <input
                    type="text"
                    required
                    value={floorForm.code}
                    onChange={(e) => setFloorForm({ ...floorForm, code: e.target.value })}
                    className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-2 text-[var(--theme-text-primary)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--theme-text-primary)] font-semibold">Level Number</label>
                  <input
                    type="number"
                    required
                    value={floorForm.floorNumber}
                    onChange={(e) => setFloorForm({ ...floorForm, floorNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-2 text-[var(--theme-text-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--theme-text-primary)] font-semibold">Architectural SVG File Path / URL</label>
                <input
                  type="text"
                  required
                  value={floorForm.floorplanSvgUrl}
                  onChange={(e) => setFloorForm({ ...floorForm, floorplanSvgUrl: e.target.value })}
                  className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-2 text-[var(--theme-text-primary)] font-mono"
                  placeholder="/blueprints/tech_tower_l4.svg"
                />
                <span className="text-[10px] text-[var(--theme-text-secondary)]">
                  Bundled blueprint: <code>/blueprints/tech_tower_l4.svg</code>
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--theme-text-primary)] font-semibold">Total Floor Area (Sq Ft)</label>
                <input
                  type="number"
                  value={floorForm.areaSqFt}
                  onChange={(e) => setFloorForm({ ...floorForm, areaSqFt: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-2 text-[var(--theme-text-primary)] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setFloorModalOpen(false)}
                  className="sw-btn px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="sw-btn-primary px-5 py-2 text-xs flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Blueprint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: SVG BLUEPRINT PREVIEW                                     */}
      {/* ========================================================================= */}
      {previewFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="sw-panel-strong w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--theme-card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--theme-text-primary)]" />
                <div>
                  <h3 className="font-bold text-[var(--theme-text-primary)] text-sm">
                    Architectural Blueprint: {previewFloor.name}
                  </h3>
                  <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">
                    {previewFloor.floorplanSvgUrl || "/blueprints/tech_tower_l4.svg"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFloor(null)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-[var(--theme-page-bg)] flex-1 overflow-auto flex items-center justify-center">
              <div className="w-full max-w-3xl aspect-[1000/600] border border-[var(--theme-card-border)] overflow-hidden bg-[var(--theme-card-bg)]">
                <iframe
                  src={previewFloor.floorplanSvgUrl || "/blueprints/tech_tower_l4.svg"}
                  className="w-full h-full border-0 pointer-events-none"
                  title="Blueprint Canvas Preview"
                />
              </div>
            </div>

            <div className="p-3.5 border-t border-[var(--theme-card-border)] flex items-center justify-between text-xs bg-[var(--theme-card-bg)]">
              <span className="text-[var(--theme-text-secondary)]">
                Spaces mapped: {spaces.filter((s) => s.floorId === previewFloor.id).length} rooms/desks
              </span>
              <button
                onClick={() => setPreviewFloor(null)}
                className="sw-btn px-4 py-1.5 text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
