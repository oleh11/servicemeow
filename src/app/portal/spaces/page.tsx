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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Occupied
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Reserved
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Under Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/50 shadow-xs">
              <Compass className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Campus Maps &amp; Space Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Explore corporate campuses, office levels, conference rooms, video collaboration suites, and ergonomic desks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
          >
            &larr; Employee Portal
          </Link>
          <Link
            href="/portal/reservations"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Book a Space</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6-Tier Hierarchy Breadcrumb Navigator */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center gap-2.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Spatial Navigator:
        </span>

        {/* Region */}
        <div className="flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5 text-slate-400" />
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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-hidden cursor-pointer"
          >
            {data?.tree.map((r) => (
              <option key={r.id} value={r.id}>
                Region: {r.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />

        {/* State */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-hidden cursor-pointer"
          >
            {activeRegion?.states.map((s) => (
              <option key={s.id} value={s.id}>
                State: {s.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />

        {/* Campus */}
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-hidden cursor-pointer"
          >
            {activeState?.campuses.map((c) => (
              <option key={c.id} value={c.id}>
                Campus: {c.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />

        {/* Building */}
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={activeBuilding?.id || ""}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              const b = activeCampus?.buildings.find((bld) => bld.id === e.target.value);
              if (b?.floors[0]) {
                setSelectedFloorId(b.floors[0].id);
              }
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-hidden cursor-pointer"
          >
            {activeCampus?.buildings.map((b) => (
              <option key={b.id} value={b.id}>
                Building: {b.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />

        {/* Floor */}
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={activeFloor?.id || ""}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-hidden cursor-pointer"
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5" /> Levels:
          </span>
          <div className="flex items-center gap-2">
            {activeBuilding.floors.map((fl) => {
              const isSelected = fl.id === activeFloor?.id;
              return (
                <button
                  key={fl.id}
                  onClick={() => setSelectedFloorId(fl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs font-bold ring-2 ring-indigo-500/20"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs"
                  }`}
                >
                  <span>Level {fl.floorNumber}</span>
                  <span className="opacity-80">({fl.name})</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search rooms, desks, departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all cursor-pointer"
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

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <strong className="text-slate-900 dark:text-slate-100 tabular-nums">{filteredSpaces.length}</strong> spaces on Floor {activeFloor?.floorNumber || 4}
        </div>
      </div>

      {/* Spaces Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          <span>Loading spatial directory...</span>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
          <Box className="w-10 h-10 mx-auto opacity-30 mb-2" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No rooms or desks found</p>
          <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Try resetting search filters or selecting another building floor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((sp) => {
            return (
              <div
                key={sp.id}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                        {sp.spaceNumber}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-2">
                        {sp.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeBuilding?.name} &bull; Floor {activeFloor?.floorNumber}
                      </p>
                    </div>
                    {getStatusBadge(sp.status)}
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{sp.spaceType}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Capacity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{sp.capacity} Persons</span>
                    </div>
                  </div>

                  {sp.department && (
                    <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                      Department: <strong className="text-slate-700 dark:text-slate-300 font-medium">{sp.department}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/portal/reservations?search=${encodeURIComponent(sp.spaceNumber)}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reserve Space</span>
                  </Link>

                  <Link
                    href="/portal/reservations?view=floorplan"
                    title="View on Architectural Schematic"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs"
                  >
                    <Layers className="w-4 h-4 text-indigo-500" />
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
