"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  Zap,
  HardDrive,
  Cpu,
  Layers,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Sliders,
  Maximize2,
} from "lucide-react";

interface MountedCI {
  id: string;
  name: string;
  ciClass: string;
  ipAddress?: string;
  status: string;
  tier?: string;
  rackUnitStart: number;
  rackUnitHeight: number;
}

interface Rack {
  id: string;
  name: string;
  site: string;
  uHeight: number;
  maxPowerWatts: number;
  status: string;
  notes?: string;
  mountedCis: MountedCI[];
}

export default function DatacenterRackElevationPage() {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [unmountedCis, setUnmountedCis] = useState<any[]>([]);
  const [selectedRackIndex, setSelectedRackIndex] = useState(0);
  const [selectedCi, setSelectedCi] = useState<MountedCI | null>(null);
  const [loading, setLoading] = useState(true);

  // Mount modal state
  const [mountModalOpen, setMountModalOpen] = useState(false);
  const [selectedCiIdToMount, setSelectedCiIdToMount] = useState("");
  const [mountUnitStart, setMountUnitStart] = useState(1);
  const [mountUnitHeight, setMountUnitHeight] = useState(1);
  const [mounting, setMounting] = useState(false);

  useEffect(() => {
    loadRacks();
  }, []);

  const loadRacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/cmdb/racks");
      if (res.ok) {
        const json = await res.json();
        setRacks(json.result?.racks || []);
        setUnmountedCis(json.result?.unmountedCis || []);
      }
    } catch (e) {
      console.error("Error loading racks:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMountCi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRack || !selectedCiIdToMount) return;

    setMounting(true);
    try {
      const res = await fetch("/api/now/cmdb/racks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mount_ci",
          rackId: currentRack.id,
          ciId: selectedCiIdToMount,
          rackUnitStart: mountUnitStart,
          rackUnitHeight: mountUnitHeight,
        }),
      });

      if (res.ok) {
        setMountModalOpen(false);
        await loadRacks();
      }
    } catch (e) {
      console.error("Error mounting CI:", e);
    } finally {
      setMounting(false);
    }
  };

  const handleUnmountCi = async (ciId: string) => {
    if (!confirm("Are you sure you want to unmount this CI from the rack?")) return;
    try {
      const res = await fetch("/api/now/cmdb/racks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unmount_ci", ciId }),
      });
      if (res.ok) {
        setSelectedCi(null);
        await loadRacks();
      }
    } catch (e) {
      console.error("Error unmounting CI:", e);
    }
  };

  const currentRack = racks[selectedRackIndex] || null;

  // Build 42U rack slots map
  const totalU = currentRack?.uHeight || 42;
  const occupiedSlotsMap: Record<number, { ci: MountedCI; isHead: boolean }> = {};

  if (currentRack?.mountedCis) {
    for (const ci of currentRack.mountedCis) {
      const start = ci.rackUnitStart;
      const height = ci.rackUnitHeight || 1;
      for (let offset = 0; offset < height; offset++) {
        const slot = start + offset;
        occupiedSlotsMap[slot] = {
          ci,
          isHead: offset === height - 1, // top of the mounted chassis
        };
      }
    }
  }

  const occupiedCount = Object.keys(occupiedSlotsMap).length;
  const utilizationPercent = Math.round((occupiedCount / totalU) * 100);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900">Datacenter 42U Rack Elevations</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              cmdb_ci_rack
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual rack elevation diagrams mapping hardware configuration items, chassis slot positions, and power loads.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/workspace/cmdb"
            className="px-3.5 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Topology</span>
          </Link>

          <button
            onClick={() => setMountModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mount CI to Rack</span>
          </button>

          <button
            onClick={loadRacks}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Rack Selector Tabs & Utilization Metrics */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border">
        {/* Rack Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {racks.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRackIndex(idx);
                setSelectedCi(null);
              }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                selectedRackIndex === idx
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border hover:bg-slate-100"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{r.name}</span>
            </button>
          ))}
        </div>

        {/* Rack Telemetry Stat Chips */}
        {currentRack && (
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Space:</span>
              <span className="font-bold text-slate-900">
                {occupiedCount}U / {totalU}U ({utilizationPercent}%)
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold text-slate-900">
                {(occupiedCount * 220).toLocaleString()}W / {currentRack.maxPowerWatts}W
              </span>
            </div>
            <span>•</span>
            <span className="text-[11px] text-slate-500 font-sans">{currentRack.site}</span>
          </div>
        )}
      </div>

      {/* Main Rack Diagram + Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Rack Chassis Visualization (Cols 2) */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold font-mono text-sm tracking-wide">{currentRack?.name}</span>
              <span className="text-slate-500 text-xs font-mono">({currentRack?.site})</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{totalU}U Standard 19" EIA Rack</span>
          </div>

          {/* Vertical Slots Loop (42 down to 1) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
            {Array.from({ length: totalU }).map((_, i) => {
              const uNumber = totalU - i;
              const slotData = occupiedSlotsMap[uNumber];

              if (!slotData) {
                // Empty Slot
                return (
                  <div
                    key={uNumber}
                    onClick={() => {
                      setMountUnitStart(uNumber);
                      setMountModalOpen(true);
                    }}
                    className="h-7 border-b border-slate-850 flex items-center justify-between px-3 text-[10px] font-mono text-slate-600 hover:bg-slate-850 hover:text-slate-300 transition-colors cursor-pointer group"
                  >
                    <span className="font-bold w-6">{uNumber}U</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                      + Mount CI
                    </span>
                    <span className="text-slate-700">Empty</span>
                  </div>
                );
              }

              // Only render the head element once for multi-U chassis
              if (!slotData.isHead && occupiedSlotsMap[uNumber + 1]?.ci.id === slotData.ci.id) {
                return null;
              }

              const { ci } = slotData;
              const height = ci.rackUnitHeight || 1;
              const isSelected = selectedCi?.id === ci.id;

              return (
                <div
                  key={uNumber}
                  style={{ height: `${height * 28}px` }}
                  onClick={() => setSelectedCi(ci)}
                  className={`border-b border-slate-800 flex items-center justify-between px-3 text-xs font-mono transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-indigo-600/30 border-l-4 border-l-indigo-400 shadow-inner"
                      : "bg-slate-850 hover:bg-slate-800 border-l-4 border-l-emerald-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400 w-6">
                      {height > 1 ? `${ci.rackUnitStart}-${ci.rackUnitStart + height - 1}U` : `${uNumber}U`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-white tracking-wide">{ci.name}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                        {ci.ciClass}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {ci.ipAddress && <span>{ci.ipAddress}</span>}
                    <span className="text-indigo-400 font-semibold">{height}U</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected CI Inspector Panel (Col 1) */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center justify-between">
              <span>Chassis Inspector</span>
              {selectedCi && (
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {selectedCi.rackUnitHeight}U Mounted
                </span>
              )}
            </h3>

            {selectedCi ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                    Configuration Item
                  </span>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">{selectedCi.name}</h4>
                  <p className="text-xs text-blue-600 font-mono font-semibold">{selectedCi.ciClass}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot Range:</span>
                    <span className="font-bold text-slate-800">
                      {selectedCi.rackUnitStart}U to {selectedCi.rackUnitStart + selectedCi.rackUnitHeight - 1}U
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Address:</span>
                    <span className="text-slate-800">{selectedCi.ipAddress || "10.0.4.12"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operating Status:</span>
                    <span className="text-emerald-700 font-bold">{selectedCi.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Power:</span>
                    <span className="text-slate-800">{selectedCi.rackUnitHeight * 220} Watts</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href={`/workspace/cmdb_ci/${selectedCi.id}`}
                    target="_blank"
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open CI in CMDB</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleUnmountCi(selectedCi.id)}
                    className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                  >
                    Unmount from Rack
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Server className="w-8 h-8 mx-auto opacity-40" />
                <p>Click on any mounted chassis in the rack diagram to inspect specifications.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mount CI Modal */}
      {mountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Mount Configuration Item to Rack</h3>
              <button onClick={() => setMountModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMountCi} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Unmounted Hardware CI *
                </label>
                <select
                  required
                  value={selectedCiIdToMount}
                  onChange={(e) => setSelectedCiIdToMount(e.target.value)}
                  className="w-full border rounded-lg p-2 text-slate-800 focus:outline-blue-500"
                >
                  <option value="">-- Choose CI to mount --</option>
                  {unmountedCis.map((ci) => (
                    <option key={ci.id} value={ci.id}>
                      {ci.name} [{ci.ciClass}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Unit (1-42) *</label>
                  <input
                    type="number"
                    min="1"
                    max={totalU}
                    required
                    value={mountUnitStart}
                    onChange={(e) => setMountUnitStart(parseInt(e.target.value) || 1)}
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Height (U) *</label>
                  <select
                    value={mountUnitHeight}
                    onChange={(e) => setMountUnitHeight(parseInt(e.target.value) || 1)}
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-blue-500 font-mono"
                  >
                    <option value={1}>1U (Standard Server/Switch)</option>
                    <option value={2}>2U (Dual-Socket Server)</option>
                    <option value={4}>4U (Storage / High Density)</option>
                    <option value={8}>8U (Blade Enclosure)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setMountModalOpen(false)}
                  className="px-4 py-2 border rounded-full text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mounting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-xs"
                >
                  {mounting ? "Mounting..." : "Mount to Rack"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
