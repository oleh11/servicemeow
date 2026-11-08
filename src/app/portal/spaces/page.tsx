"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Building2,
  MapPin,
  Map,
  Layers,
  Box,
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Building,
  CalendarCheck2,
  Calendar,
  ArrowRight,
  Sliders,
  Video,
} from "lucide-react";

interface SpaceItem {
  id: string;
  name: string;
  spaceNumber: string;
  spaceType: string;
  status: string;
  capacity: number;
  squareFeet?: number;
  department?: string;
  capabilities?: string | null;
}

interface FloorItem {
  id: string;
  name: string;
  floorNumber: number;
  code: string;
  areaSqFt?: number;
  floorplanSvgUrl?: string;
  spaces: SpaceItem[];
}

interface BuildingItem {
  id: string;
  name: string;
  code: string;
  buildingType?: string;
  floorsCount?: number;
  totalAreaSqFt?: number;
  floors: FloorItem[];
}

interface CampusItem {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  buildings: BuildingItem[];
}

interface StateItem {
  id: string;
  name: string;
  code: string;
  country?: string;
  campuses: CampusItem[];
}

interface RegionItem {
  id: string;
  name: string;
  code: string;
  states: StateItem[];
}

interface SpatialTreeResponse {
  tree: RegionItem[];
  stats: {
    totalRegions: number;
    totalStates: number;
    totalCampuses: number;
    totalBuildings: number;
    totalFloors: number;
    totalSpaces: number;
    totalOccupied: number;
    totalVacant: number;
    occupancyRate: number;
    totalCapacity: number;
    totalAreaSqFt: number;
  };
}

export default function PortalSpacesPage() {
  const [data, setData] = useState<SpatialTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active navigation tier selections
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/now/spatial/tree");
      if (!res.ok) throw new Error("Failed to load spatial directory");
      const json = await res.json();
      setData(json.result);

      const regions: RegionItem[] = json.result.tree || [];
      if (regions.length > 0 && !selectedRegionId) {
        setSelectedRegionId(regions[0].id);
        const states = regions[0].states || [];
        if (states.length > 0) {
          setSelectedStateId(states[0].id);
          const campuses = states[0].campuses || [];
          if (campuses.length > 0) {
            setSelectedCampusId(campuses[0].id);
            const buildings = campuses[0].buildings || [];
            if (buildings.length > 0) {
              setSelectedBuildingId(buildings[0].id);
              const floors = buildings[0].floors || [];
              if (floors.length > 0) {
                setSelectedFloorId(floors[0].id);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const activeRegion = data?.tree.find((r) => r.id === selectedRegionId) || data?.tree[0];
  const activeState = activeRegion?.states.find((s) => s.id === selectedStateId) || activeRegion?.states[0];
  const activeCampus = activeState?.campuses.find((c) => c.id === selectedCampusId) || activeState?.campuses[0];
  const activeBuilding = activeCampus?.buildings.find((b) => b.id === selectedBuildingId) || activeCampus?.buildings[0];
  const activeFloor = activeBuilding?.floors.find((f) => f.id === selectedFloorId) || activeBuilding?.floors[0];

  const rawSpaces = activeFloor?.spaces || [];
  const filteredSpaces = rawSpaces.filter((sp) => {
    if (statusFilter !== "all" && sp.status !== statusFilter) return false;
    if (typeFilter !== "all" && sp.spaceType !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = sp.name.toLowerCase().includes(q);
      const matchNum = sp.spaceNumber.toLowerCase().includes(q);
      const matchDept = sp.department?.toLowerCase().includes(q);
      const matchType = sp.spaceType.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchDept && !matchType) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "vacant":
      case "available":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]">
            <span className="w-1.5 h-1.5 bg-[var(--swiss-emerald)] animate-pulse"></span>
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] border border-[var(--theme-card-border)]">
            <span className="w-1.5 h-1.5 bg-[var(--theme-card-border)]"></span>
            Occupied
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-[var(--theme-accent-light)] text-[var(--swiss-amber)] border border-[var(--swiss-amber)]">
            <span className="w-1.5 h-1.5 bg-[var(--swiss-amber)]"></span>
            Reserved
          </span>
        );
      case "maintenance":
        return (
          <span className="sw-badge-red inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <span className="w-1.5 h-1.5 bg-[var(--swiss-red)]"></span>
            Under Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] border border-[var(--theme-card-border)]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="sw-page">
      {/* Swiss Header */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b-2 border-[var(--theme-text-primary)] pb-5">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm font-bold text-[var(--theme-text-secondary)]">03 /</span>
            <h1 className="text-3xl font-extrabold tracking-tight uppercase text-[var(--theme-text-primary)]">
              Campus Maps &amp; Space Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] mt-1 max-w-2xl">
            Explore corporate campuses, office levels, conference rooms, video collaboration suites, and ergonomic desks across 6 tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="sw-btn"
          >
            &larr; Back to Home
          </Link>
          <Link
            href="/portal/reservations"
            className="sw-btn-primary"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Book a Space &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 6-Tier Hierarchy Breadcrumb Navigator */}
      <div className="p-4 border-2 border-[var(--theme-text-primary)] bg-[var(--theme-card-bg)] flex flex-wrap items-center gap-2.5 text-sm">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--theme-text-primary)] mr-1 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[var(--theme-text-primary)]" /> Spatial Navigator:
        </span>

        {/* Region */}
        <div className="flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" />
          <select
            value={activeRegion?.id || ""}
            onChange={(e) => {
              setSelectedRegionId(e.target.value);
              const r = data?.tree.find((reg) => reg.id === e.target.value);
              if (r?.states[0]) {
                setSelectedStateId(r.states[0].id);
                if (r.states[0].campuses[0]) {
                  setSelectedCampusId(r.states[0].campuses[0].id);
                  if (r.states[0].campuses[0].buildings[0]) {
                    setSelectedBuildingId(r.states[0].campuses[0].buildings[0].id);
                    if (r.states[0].campuses[0].buildings[0].floors[0]) {
                      setSelectedFloorId(r.states[0].campuses[0].buildings[0].floors[0].id);
                    }
                  }
                }
              }
            }}
            className="sw-input px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            {data?.tree.map((r) => (
              <option key={r.id} value={r.id}>
                Region: {r.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[var(--theme-text-secondary)] shrink-0" />

        {/* State */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" />
          <select
            value={activeState?.id || ""}
            onChange={(e) => {
              setSelectedStateId(e.target.value);
              const s = activeRegion?.states.find((st) => st.id === e.target.value);
              if (s?.campuses[0]) {
                setSelectedCampusId(s.campuses[0].id);
                if (s.campuses[0].buildings[0]) {
                  setSelectedBuildingId(s.campuses[0].buildings[0].id);
                  if (s.campuses[0].buildings[0].floors[0]) {
                    setSelectedFloorId(s.campuses[0].buildings[0].floors[0].id);
                  }
                }
              }
            }}
            className="sw-input px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            {activeRegion?.states.map((s) => (
              <option key={s.id} value={s.id}>
                State: {s.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[var(--theme-text-secondary)] shrink-0" />

        {/* Campus */}
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" />
          <select
            value={activeCampus?.id || ""}
            onChange={(e) => {
              setSelectedCampusId(e.target.value);
              const c = activeState?.campuses.find((cam) => cam.id === e.target.value);
              if (c?.buildings[0]) {
                setSelectedBuildingId(c.buildings[0].id);
                if (c.buildings[0].floors[0]) {
                  setSelectedFloorId(c.buildings[0].floors[0].id);
                }
              }
            }}
            className="sw-input px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            {activeState?.campuses.map((c) => (
              <option key={c.id} value={c.id}>
                Campus: {c.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[var(--theme-text-secondary)] shrink-0" />

        {/* Building */}
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" />
          <select
            value={activeBuilding?.id || ""}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              const b = activeCampus?.buildings.find((bld) => bld.id === e.target.value);
              if (b?.floors[0]) {
                setSelectedFloorId(b.floors[0].id);
              }
            }}
            className="sw-input px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            {activeCampus?.buildings.map((b) => (
              <option key={b.id} value={b.id}>
                Building: {b.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[var(--theme-text-secondary)] shrink-0" />

        {/* Floor */}
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" />
          <select
            value={activeFloor?.id || ""}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            className="sw-input px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            {activeBuilding?.floors.map((f) => (
              <option key={f.id} value={f.id}>
                Floor {f.floorNumber} - {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floor Levels Bar */}
      {activeBuilding && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5" /> Levels:
          </span>
          <div className="flex items-center gap-2">
            {activeBuilding.floors.map((fl) => {
              const isSelected = fl.id === activeFloor?.id;
              return (
                <button
                  key={fl.id}
                  onClick={() => setSelectedFloorId(fl.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[var(--theme-text-primary)] text-[var(--theme-page-bg)] font-bold ring-2 ring-[var(--theme-text-primary)]"
                      : "sw-panel text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent-light)]"
                  }`}
                >
                  <span>Level {fl.floorNumber}</span>
                  <span className="opacity-80">({fl.name})</span>
                  <span className={`text-[10px] px-1.5 py-0.5 font-mono font-medium ${
                    isSelected ? "bg-transparent text-[var(--theme-page-bg)] border border-[var(--theme-page-bg)]" : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                  }`}>
                    {fl.spaces.length} spaces
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sw-panel">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--theme-text-secondary)]" />
            <input
              type="text"
              placeholder="Search rooms, desks, departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sw-input w-full pl-9 pr-3 py-1.5 text-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="sw-input px-3 py-1.5 text-xs font-medium cursor-pointer"
          >
            <option value="all">All Space Types</option>
            <option value="Conference Room">Conference Rooms</option>
            <option value="Huddle Room">Huddle Rooms</option>
            <option value="Video Suite">Video Suites</option>
            <option value="Hot Desk">Standing &amp; Hot Desks</option>
            <option value="Focus Pod">Focus Pods</option>
            <option value="Office">Assigned Offices</option>
          </select>
        </div>

        <div className="text-xs text-[var(--theme-text-secondary)] font-medium">
          Showing <strong className="text-[var(--theme-text-primary)] tabular-nums">{filteredSpaces.length}</strong> spaces on Floor {activeFloor?.floorNumber || 4}
        </div>
      </div>

      {/* Spaces Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--theme-text-secondary)] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--theme-text-primary)]" />
          <span>Loading spatial directory...</span>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="p-12 text-center text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-card-border)] bg-[var(--theme-card-bg)]">
          <Box className="w-10 h-10 mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-[var(--theme-text-primary)]">No rooms or desks found</p>
          <p className="text-xs mt-1 text-[var(--theme-text-secondary)]">Try resetting search filters or selecting another building floor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((sp) => {
            return (
              <div
                key={sp.id}
                className="group p-5 sw-panel hover:border-[var(--theme-text-primary)] transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] border border-[var(--theme-card-border)]">
                        {sp.spaceNumber}
                      </span>
                      <h3 className="font-bold text-base text-[var(--theme-text-primary)] group-hover:underline transition-colors mt-2">
                        {sp.name}
                      </h3>
                      <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        {activeBuilding?.name} &bull; Floor {activeFloor?.floorNumber}
                      </p>
                    </div>
                    {getStatusBadge(sp.status)}
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[var(--theme-card-border)] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider">Type</span>
                      <span className="font-semibold text-[var(--theme-text-primary)]">{sp.spaceType}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider">Capacity</span>
                      <span className="font-semibold text-[var(--theme-text-primary)]">{sp.capacity} Persons</span>
                    </div>
                  </div>

                  {sp.department && (
                    <div className="mt-2.5 text-xs text-[var(--theme-text-secondary)]">
                      Department: <strong className="text-[var(--theme-text-primary)] font-medium">{sp.department}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-3.5 border-t border-[var(--theme-card-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/portal/reservations?search=${encodeURIComponent(sp.spaceNumber)}`}
                    className="sw-btn-primary flex-1 py-2 px-3 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reserve Space</span>
                  </Link>

                  <Link
                    href="/portal/reservations?view=floorplan"
                    title="View on Architectural Schematic"
                    className="p-2 border border-[var(--theme-card-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-accent-light)] hover:text-[var(--theme-text-primary)] transition-colors"
                  >
                    <Layers className="w-4 h-4 text-[var(--theme-text-primary)]" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
