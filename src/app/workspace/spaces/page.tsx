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
  Server,
  Users,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
} from "lucide-react";

interface CIItem {
  id: string;
  name: string;
  assetTag?: string;
  ciClass: string;
  status: string;
  operationalStatus: string;
}

interface SpaceItem {
  id: string;
  name: string;
  spaceNumber: string;
  spaceType: string;
  status: string;
  capacity: number;
  squareFeet?: number;
  department?: string;
  svgElementId?: string;
  configurationItems?: CIItem[];
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
    totalAssets: number;
  };
}

export default function SpacesExplorerPage() {
  const [data, setData] = useState<SpatialTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active navigation tier selections
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedSpace, setSelectedSpace] = useState<SpaceItem | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/now/spatial/tree");
      if (!res.ok) throw new Error("Failed to load spatial hierarchy");
      const json = await res.json();
      setData(json.result);

      // Auto-select first available tier defaults
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

  // Compute active objects
  const activeRegion = data?.tree.find((r) => r.id === selectedRegionId) || data?.tree[0];
  const activeState = activeRegion?.states.find((s) => s.id === selectedStateId) || activeRegion?.states[0];
  const activeCampus = activeState?.campuses.find((c) => c.id === selectedCampusId) || activeState?.campuses[0];
  const activeBuilding = activeCampus?.buildings.find((b) => b.id === selectedBuildingId) || activeCampus?.buildings[0];
  const activeFloor = activeBuilding?.floors.find((f) => f.id === selectedFloorId) || activeBuilding?.floors[0];

  // Filter spaces on active floor
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
    switch (status) {
      case "occupied":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Occupied</span>;
      case "vacant":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">Vacant</span>;
      case "reserved":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-500 border border-purple-500/30">Reserved</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">Maintenance</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{status}</span>;
    }
  };

  const getSpaceTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("surgery") || t.includes("operating") || t.includes("icu") || t.includes("clinical")) {
      return <ShieldCheck className="w-4 h-4 text-rose-400" />;
    }
    if (t.includes("server") || t.includes("data") || t.includes("mdf") || t.includes("idf")) {
      return <Server className="w-4 h-4 text-cyan-400" />;
    }
    if (t.includes("conference") || t.includes("meeting")) {
      return <Users className="w-4 h-4 text-purple-400" />;
    }
    return <Box className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
      {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <Compass className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">Workplace Hub &amp; Spatial Explorer</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enterprise 6-Tier Spatial Hierarchy: Region &rarr; State &rarr; Campus &rarr; Building &rarr; Floor &rarr; Space / Room
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTree}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium hover:bg-muted transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/workspace/cmn_space"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              Manage All Spaces
            </Link>
          </div>
        </div>

        {/* Executive Stats KPIs */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regions / States</span>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {data.stats.totalRegions} <span className="text-sm text-muted-foreground">/ {data.stats.totalStates}</span>
              </div>
              <span className="text-xs text-muted-foreground">Global footprint</span>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campuses</span>
              <div className="text-2xl font-bold mt-1 text-foreground">{data.stats.totalCampuses}</div>
              <span className="text-xs text-muted-foreground">Operating sites</span>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buildings & Floors</span>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {data.stats.totalBuildings} <span className="text-sm text-muted-foreground">/ {data.stats.totalFloors}</span>
              </div>
              <span className="text-xs text-muted-foreground">Facilities</span>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Spaces</span>
              <div className="text-2xl font-bold mt-1 text-foreground">{data.stats.totalSpaces}</div>
              <span className="text-xs text-muted-foreground">Rooms & zones</span>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupancy Rate</span>
              <div className="text-2xl font-bold mt-1 text-emerald-500">{data.stats.occupancyRate}%</div>
              <span className="text-xs text-muted-foreground">
                {data.stats.totalOccupied} occupied &bull; {data.stats.totalVacant} vacant
              </span>
            </div>

            <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Space Assets (CMDB)</span>
              <div className="text-2xl font-bold mt-1 text-cyan-500">{data.stats.totalAssets}</div>
              <span className="text-xs text-muted-foreground">Assigned CIs</span>
            </div>
          </div>
        )}

        {/* 6-Tier Hierarchy Breadcrumb Navigator */}
        <div className="p-4 rounded-xl border bg-muted/30 flex flex-wrap items-center gap-2 text-sm shadow-xs">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> 6-Tier Hierarchy:
          </span>

          {/* Tier 1: Region */}
          <div className="flex items-center gap-1">
            <Map className="w-3.5 h-3.5 text-muted-foreground" />
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
              className="bg-background border rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {data?.tree.map((r) => (
                <option key={r.id} value={r.id}>
                  Region: {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />

          {/* Tier 2: State */}
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
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
              className="bg-background border rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {activeRegion?.states.map((s) => (
                <option key={s.id} value={s.id}>
                  State: {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />

          {/* Tier 3: Campus */}
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
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
              className="bg-background border rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {activeState?.campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  Campus: {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />

          {/* Tier 4: Building */}
          <div className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={activeBuilding?.id || ""}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                const b = activeCampus?.buildings.find((bld) => bld.id === e.target.value);
                if (b?.floors[0]) {
                  setSelectedFloorId(b.floors[0].id);
                }
              }}
              className="bg-background border rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {activeCampus?.buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  Bldg: {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />

          {/* Tier 5: Floor */}
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={activeFloor?.id || ""}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="bg-background border rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {activeBuilding?.floors.map((f) => (
                <option key={f.id} value={f.id}>
                  Floor {f.floorNumber} - {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Floor Selection Bar */}
        {activeBuilding && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Levels:
            </span>
            {activeBuilding.floors.map((fl) => {
              const isSelected = fl.id === activeFloor?.id;
              return (
                <button
                  key={fl.id}
                  onClick={() => setSelectedFloorId(fl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="font-bold">L{fl.floorNumber}</span>
                  <span>{fl.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/30 text-current">
                    {fl.spaces.length} spaces
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl border bg-card/60 shadow-xs">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rooms, numbers, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-background text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg bg-background px-3 py-1.5 text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-lg bg-background px-3 py-1.5 text-xs font-medium"
            >
              <option value="all">All Space Types</option>
              <option value="Operating Room">Operating Room</option>
              <option value="ICU / Clinical">ICU / Clinical</option>
              <option value="Server Room">Server Room / MDF</option>
              <option value="Conference Room">Conference Room</option>
              <option value="Office">Office</option>
              <option value="Lab">Laboratory</option>
            </select>
          </div>

          <div className="text-xs text-muted-foreground self-end md:self-auto">
            Showing <span className="font-bold text-foreground">{filteredSpaces.length}</span> of{" "}
            {rawSpaces.length} spaces on Floor {activeFloor?.floorNumber || 1}
          </div>
        </div>

        {/* Main Content Area: Floorplan / Room Grid + Detail Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Cards / Floor Layout View */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl border bg-card shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-base">
                    Floorplan Space Grid &bull; {activeBuilding?.name} (Floor {activeFloor?.floorNumber})
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">Click a room to inspect details & assets</span>
              </div>

              {filteredSpaces.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground border border-dashed rounded-lg">
                  <Box className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="font-medium">No spaces found matching criteria</p>
                  <p className="text-xs mt-1">Try resetting search filters or select a different floor</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredSpaces.map((sp) => {
                    const isSelected = selectedSpace?.id === sp.id;
                    const assetCount = sp.configurationItems?.length || 0;
                    return (
                      <div
                        key={sp.id}
                        onClick={() => setSelectedSpace(sp)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                            : "bg-background/80 hover:border-primary/50 hover:bg-muted/40 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-md bg-muted text-foreground">
                              {getSpaceTypeIcon(sp.spaceType)}
                            </span>
                            <div>
                              <span className="text-xs font-mono font-bold text-primary">
                                {sp.spaceNumber}
                              </span>
                              <h3 className="font-medium text-sm line-clamp-1">{sp.name}</h3>
                            </div>
                          </div>
                          {getStatusBadge(sp.status)}
                        </div>

                        <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                          <span>{sp.spaceType}</span>
                          {sp.department && <span className="truncate max-w-[100px]">{sp.department}</span>}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Capacity: {sp.capacity || 1}</span>
                          <span className="flex items-center gap-1 font-mono text-cyan-400">
                            <Server className="w-3 h-3" /> {assetCount} CIs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Space Detail & CMDB Assets Drawer */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border bg-card shadow-xs sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-base">Space & Asset Inspection</h3>
                </div>
                {selectedSpace && (
                  <Link
                    href={`/workspace/cmn_space`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Open Table <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!selectedSpace ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Compass className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-medium">No space selected</p>
                  <p className="text-xs mt-1">Select any space on the floorplan to inspect CMDB assets and occupancy</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded-sm bg-primary/10">
                        {selectedSpace.spaceNumber}
                      </span>
                      {getStatusBadge(selectedSpace.status)}
                    </div>
                    <h2 className="text-lg font-bold mt-2">{selectedSpace.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSpace.spaceType} &bull; {selectedSpace.department || "General Facility"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border bg-muted/40">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Capacity</span>
                      <span className="text-sm font-bold">{selectedSpace.capacity || 1} Persons</span>
                    </div>
                    <div className="p-2.5 rounded-lg border bg-muted/40">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Area</span>
                      <span className="text-sm font-bold">{selectedSpace.squareFeet ? `${selectedSpace.squareFeet} sq ft` : "N/A"}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Full Spatial Path:</span>
                    <p className="font-mono text-[11px] text-foreground leading-relaxed">
                      {activeRegion?.name} &gt; {activeState?.name} &gt; {activeCampus?.name} &gt; {activeBuilding?.name} &gt; Floor {activeFloor?.floorNumber} &gt; {selectedSpace.spaceNumber}
                    </p>
                  </div>

                  {/* CMDB Assets assigned to this space */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inside this Space ({selectedSpace.configurationItems?.length || 0})</span>
                      </div>
                      <Link
                        href={`/workspace/cmdb_ci`}
                        className="text-[10px] text-primary hover:underline"
                      >
                        CMDB &rarr;
                      </Link>
                    </div>

                    {!selectedSpace.configurationItems || selectedSpace.configurationItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg">
                        No CMDB configuration items assigned to this space yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selectedSpace.configurationItems.map((ci) => (
                          <div
                            key={ci.id}
                            className="p-2.5 rounded-lg border bg-background hover:border-primary/40 transition text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium text-foreground">{ci.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {ci.ciClass} &bull; Tag: {ci.assetTag || "N/A"}
                              </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {ci.operationalStatus || ci.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
