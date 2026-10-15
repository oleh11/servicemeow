"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  Square,
  Maximize2,
  Check,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Scale,
  Percent,
  Sliders,
} from "lucide-react";

export interface FloorBuildingDimensionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  floor: {
    id: string;
    name: string;
    code: string;
    floorNumber: number;
    areaSqFt?: number | null;
    buildingId?: string | null;
    building?: {
      id: string;
      name: string;
      code?: string;
      buildingType?: string;
      floorsCount?: number | null;
      totalAreaSqFt?: number | null;
    } | null;
    spaces?: Array<{ squareFeet?: number | null; capacity?: number | null }>;
  } | null;
  onSaved?: (updatedFloor: any, updatedBuilding?: any) => void;
}

export function FloorBuildingDimensionsModal({
  isOpen,
  onClose,
  floor,
  onSaved,
}: FloorBuildingDimensionsModalProps) {
  if (!isOpen || !floor) return null;

  // Floor states
  const [floorName, setFloorName] = useState(floor.name || "");
  const [floorCode, setFloorCode] = useState(floor.code || "");
  const [floorNumber, setFloorNumber] = useState<number>(floor.floorNumber ?? 1);
  const [floorAreaSqFt, setFloorAreaSqFt] = useState<number>(floor.areaSqFt || 12000);

  // Building states
  const [buildingId, setBuildingId] = useState(floor.buildingId || floor.building?.id || "");
  const [buildingName, setBuildingName] = useState(floor.building?.name || "Main Campus Building");
  const [buildingCode, setBuildingCode] = useState(floor.building?.code || "BLDG-A");
  const [buildingType, setBuildingType] = useState(floor.building?.buildingType || "Corporate Office Complex");
  const [buildingFloorsCount, setBuildingFloorsCount] = useState<number>(floor.building?.floorsCount || 10);
  const [buildingTotalAreaSqFt, setBuildingTotalAreaSqFt] = useState<number>(floor.building?.totalAreaSqFt || 150000);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sum of room areas
  const allocatedRoomsArea = (floor.spaces || []).reduce(
    (acc, sp) => acc + (sp.squareFeet || 0),
    0
  );
  const unallocatedArea = Math.max(0, floorAreaSqFt - allocatedRoomsArea);
  const efficiencyRatio = floorAreaSqFt > 0
    ? Math.min(100, Math.round((allocatedRoomsArea / floorAreaSqFt) * 1000) / 10)
    : 0;

  const handleQuickAdjust = (delta: number) => {
    setFloorAreaSqFt((prev) => Math.max(500, prev + delta));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Update Floor
      const floorRes = await fetch(`/api/now/table/cmn_floor/${floor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: floorName,
          code: floorCode,
          floor_number: floorNumber,
          area_sq_ft: floorAreaSqFt,
        }),
      });

      if (!floorRes.ok) {
        const json = await floorRes.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update floor dimensions.");
      }
      const updatedFloorData = await floorRes.json();

      // 2. Update Building if buildingId exists
      let updatedBuildingData = null;
      if (buildingId) {
        const bldgRes = await fetch(`/api/now/table/cmn_building/${buildingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: buildingName,
            code: buildingCode,
            building_type: buildingType,
            floors_count: buildingFloorsCount,
            total_area_sq_ft: buildingTotalAreaSqFt,
          }),
        });

        if (bldgRes.ok) {
          updatedBuildingData = await bldgRes.json();
        }
      }

      setSuccessMsg("Floor & Building dimensions successfully updated!");
      setTimeout(() => {
        if (onSaved) {
          onSaved(updatedFloorData.result, updatedBuildingData?.result);
        }
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save dimensions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-none animate-in zoom-in-95 duration-150 text-black">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase px-2 py-0.5 bg-black text-white font-bold">
                DIMENSIONS &amp; SIZE
              </span>
              <span className="font-mono text-xs uppercase font-bold text-neutral-500">
                Floor &amp; Building Scale
              </span>
            </div>
            <h2 className="text-2xl font-extrabold uppercase tracking-tight text-black mt-1">
              Edit Floor &amp; Building Dimensions
            </h2>
            <p className="text-xs text-neutral-600">
              Configure total gross area, usable square footage, floor numbering, and building capacity.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 border border-neutral-300 hover:border-black hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 border-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 border-2 border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Floor Dimensions */}
          <div className="border border-neutral-300 p-5 bg-neutral-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="font-mono text-xs font-bold uppercase text-black flex items-center gap-2">
                <Layers className="w-4 h-4 text-black" />
                <span>01 / Floor Dimensions &amp; Area</span>
              </span>
              <span className="font-mono text-[11px] text-neutral-500">
                Floor ID: {floor.code || floor.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Floor Name
                </label>
                <input
                  type="text"
                  required
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-medium focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Floor Code
                </label>
                <input
                  type="text"
                  required
                  value={floorCode}
                  onChange={(e) => setFloorCode(e.target.value)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Floor Number
                </label>
                <input
                  type="number"
                  required
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Floor Area Input & Quick Adjusters */}
            <div className="pt-2 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="font-bold text-xs uppercase text-black flex items-center gap-1.5">
                  <Square className="w-3.5 h-3.5 text-black" />
                  <span>Total Floor Area (Gross Square Feet)</span>
                </label>
                <span className="font-mono text-xs text-neutral-500">
                  Approx. {Math.round(floorAreaSqFt * 0.092903).toLocaleString()} m²
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="100"
                  step="10"
                  required
                  value={floorAreaSqFt}
                  onChange={(e) => setFloorAreaSqFt(Math.max(100, parseFloat(e.target.value) || 0))}
                  className="flex-1 bg-white border-2 border-black p-2.5 text-base font-mono font-bold text-black focus:outline-none"
                />
                <span className="font-mono text-sm font-bold text-neutral-500 uppercase">ft²</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-mono uppercase text-neutral-400 mr-1">Quick Scale:</span>
                {[-1000, -500, +500, +1000, +2500].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleQuickAdjust(delta)}
                    className="px-2 py-1 border border-neutral-300 hover:border-black text-[11px] font-mono bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} ft²
                  </button>
                ))}
              </div>
            </div>

            {/* Space Allocation Breakdown Card */}
            <div className="border border-neutral-300 bg-white p-3 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 uppercase">Rooms Allocated Area:</span>
                <span className="font-bold text-black">{allocatedRoomsArea.toLocaleString()} ft²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 uppercase">Unallocated / Circulation Area:</span>
                <span className="font-bold text-neutral-700">{unallocatedArea.toLocaleString()} ft²</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                <span className="text-neutral-500 uppercase">Floor Space Utilization:</span>
                <span className={`font-extrabold ${efficiencyRatio > 90 ? "text-amber-600" : "text-emerald-700"}`}>
                  {efficiencyRatio}% Allocated
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Building Dimensions */}
          <div className="border border-neutral-300 p-5 bg-neutral-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="font-mono text-xs font-bold uppercase text-black flex items-center gap-2">
                <Building2 className="w-4 h-4 text-black" />
                <span>02 / Parent Building Dimensions &amp; Size</span>
              </span>
              <span className="font-mono text-[11px] text-neutral-500">
                Building ID: {buildingCode || buildingId || "BLDG-HQ"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold uppercase text-black mb-1">
                  Building Name
                </label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-medium focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Building Code
                </label>
                <input
                  type="text"
                  value={buildingCode}
                  onChange={(e) => setBuildingCode(e.target.value)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Building Type
                </label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-medium focus:outline-none focus:border-black"
                >
                  <option value="Corporate Office Complex">Corporate Office</option>
                  <option value="Hospital & Clinical Center">Hospital / Clinic</option>
                  <option value="Technology Lab & Datacenter">Tech Lab / Datacenter</option>
                  <option value="Research & Development">R&amp;D Facility</option>
                  <option value="Mixed Use Facility">Mixed Use Facility</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Total Floors Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={buildingFloorsCount}
                  onChange={(e) => setBuildingFloorsCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-neutral-400 p-2 text-black font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Building Total Gross Area
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={buildingTotalAreaSqFt}
                    onChange={(e) => setBuildingTotalAreaSqFt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-400 p-2 text-black font-mono focus:outline-none focus:border-black"
                  />
                  <span className="font-mono text-xs font-bold text-neutral-500">ft²</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t-2 border-black pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 border border-black text-black text-xs font-mono uppercase font-bold hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-mono uppercase font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Dimensions..." : "Save & Apply Dimensions"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
