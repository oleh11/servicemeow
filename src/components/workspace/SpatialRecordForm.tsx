"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  MapPin,
  Building2,
  Building,
  Layers,
  Box,
  Map as MapIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Compass,
  FolderTree,
} from "lucide-react";

interface SpatialRecordFormProps {
  tableName: string;
  recordId: string; // "new" or a sys_id / cuid
}

interface MetaInfo {
  title: string;
  tier: string;
  tierNum: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  parentTable?: string;
  parentField?: string;
  parentLabel?: string;
  childTable?: string;
  childLabel?: string;
}

const SPATIAL_META: Record<string, MetaInfo> = {
  cmn_region: {
    title: "Region",
    tier: "Tier 1 • Continental / Geographical Region",
    tierNum: 1,
    icon: MapIcon,
    color: "text-purple-400",
    badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    childTable: "cmn_state",
    childLabel: "States & Provinces",
  },
  cmn_state: {
    title: "State / Province",
    tier: "Tier 2 • State or Provincial Jurisdiction",
    tierNum: 2,
    icon: MapPin,
    color: "text-blue-400",
    badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    parentTable: "cmn_region",
    parentField: "regionId",
    parentLabel: "Parent Region",
    childTable: "cmn_campus",
    childLabel: "Campuses in this State",
  },
  cmn_campus: {
    title: "Campus",
    tier: "Tier 3 • Facility Campus & Site Grounds",
    tierNum: 3,
    icon: Building2,
    color: "text-indigo-400",
    badgeBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
    parentTable: "cmn_state",
    parentField: "stateId",
    parentLabel: "State / Province",
    childTable: "cmn_building",
    childLabel: "Buildings on this Campus",
  },
  cmn_building: {
    title: "Building",
    tier: "Tier 4 • Physical Structure / Pavilion",
    tierNum: 4,
    icon: Building,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    parentTable: "cmn_campus",
    parentField: "campusId",
    parentLabel: "Parent Campus",
    childTable: "cmn_floor",
    childLabel: "Floors & Levels in this Building",
  },
  cmn_floor: {
    title: "Floor / Level",
    tier: "Tier 5 • Architectural Story / Floorplate",
    tierNum: 5,
    icon: Layers,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    parentTable: "cmn_building",
    parentField: "buildingId",
    parentLabel: "Parent Building",
    childTable: "cmn_space",
    childLabel: "Spaces & Rooms on this Floor",
  },
  cmn_space: {
    title: "Space & Room",
    tier: "Tier 6 • Usable Spatial Unit / Room / Desk",
    tierNum: 6,
    icon: Box,
    color: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    parentTable: "cmn_floor",
    parentField: "floorId",
    parentLabel: "Parent Floor",
  },
  cmn_location: {
    title: "Unified Location",
    tier: "Enterprise Hierarchy • Unified Location Model",
    tierNum: 0,
    icon: Compass,
    color: "text-indigo-400",
    badgeBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
    parentTable: "cmn_location",
    parentField: "parentId",
    parentLabel: "Parent Location",
  },
  cmn_reservation: {
    title: "Space Reservation",
    tier: "Workplace Operations • Room & Desk Booking",
    tierNum: 0,
    icon: Calendar,
    color: "text-violet-400",
    badgeBg: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    parentTable: "cmn_space",
    parentField: "spaceId",
    parentLabel: "Booked Space / Room",
  },
};

const AMENITY_OPTIONS = [
  { id: "teams", label: "Teams Room" },
  { id: "zoom", label: "Zoom Room" },
  { id: "standing_desk", label: "Standing Desk" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "projector", label: "4K Projector" },
  { id: "telepresence", label: "Telepresence" },
  { id: "dual_monitors", label: "Dual 4K Monitors" },
];

export function SpatialRecordForm({ tableName, recordId }: SpatialRecordFormProps) {
  const router = useRouter();
  const isNew = recordId === "new";
  const meta = SPATIAL_META[tableName] || {
    title: tableName.replace("cmn_", "").toUpperCase(),
    tier: "Spatial Entity",
    tierNum: 0,
    icon: MapPin,
    color: "text-slate-400",
    badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const IconComponent = meta.icon;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Parent options for dropdown
  const [parentOptions, setParentOptions] = useState<Array<{ id: string; name: string; code?: string; fullPath?: string }>>([]);

  // Form Fields State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("United States");
  const [active, setActive] = useState(true);

  // Hierarchy FK
  const [parentId, setParentId] = useState("");

  // Campus fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Building fields
  const [buildingType, setBuildingType] = useState("hospital");
  const [floorsCount, setFloorsCount] = useState<number | string>(1);
  const [totalAreaSqFt, setTotalAreaSqFt] = useState<number | string>("");

  // Floor fields
  const [floorNumber, setFloorNumber] = useState<number | string>(1);
  const [areaSqFt, setAreaSqFt] = useState<number | string>("");
  const [floorplanSvgUrl, setFloorplanSvgUrl] = useState("");
  const [floorplanImageUrl, setFloorplanImageUrl] = useState("");

  // Space fields
  const [spaceNumber, setSpaceNumber] = useState("");
  const [spaceType, setSpaceType] = useState("room");
  const [status, setStatus] = useState("available");
  const [capacity, setCapacity] = useState<number | string>(1);
  const [squareFeet, setSquareFeet] = useState<number | string>("");
  const [department, setDepartment] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  // Location fields
  const [locationType, setLocationType] = useState("building");
  const [street, setStreet] = useState("");
  const [locState, setLocState] = useState("");

  // Reservation fields
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendeesCount, setAttendeesCount] = useState<number | string>(1);
  const [reservationStatus, setReservationStatus] = useState("confirmed");

  // Related Child Records (loaded in edit mode)
  const [childRecords, setChildRecords] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load parent options if applicable
  useEffect(() => {
    if (!meta.parentTable) return;

    fetch(`/api/now/table/${meta.parentTable}?sysparm_limit=200`)
      .then((res) => res.json())
      .then((data) => {
        if (data.result && Array.isArray(data.result)) {
          setParentOptions(data.result);
        }
      })
      .catch((err) => console.error("Failed to load parent options:", err));
  }, [meta.parentTable]);

  // Load existing record if editing
  useEffect(() => {
    if (isNew) return;

    setLoading(true);
    fetch(`/api/now/table/${tableName}/${recordId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const r = data.result;
        if (!r) return;

        setName(r.name || "");
        setCode(r.code || "");
        setDescription(r.description || "");
        setCountry(r.country || "United States");
        if (r.active !== undefined) setActive(Boolean(r.active));

        // Foreign keys
        if (tableName === "cmn_state") {
          setParentId(r.regionId || r.region_id || "");
          if (r.campuses) setChildRecords(r.campuses);
        } else if (tableName === "cmn_region") {
          if (r.states) setChildRecords(r.states);
        } else if (tableName === "cmn_campus") {
          setParentId(r.stateId || r.state_id || "");
          setAddress(r.address || "");
          setCity(r.city || "");
          setZipCode(r.zipCode || r.zip_code || "");
          if (r.latitude) setLatitude(String(r.latitude));
          if (r.longitude) setLongitude(String(r.longitude));
          if (r.buildings) setChildRecords(r.buildings);
        } else if (tableName === "cmn_building") {
          setParentId(r.campusId || r.campus_id || "");
          setBuildingType(r.buildingType || r.building_type || "hospital");
          setFloorsCount(r.floorsCount !== undefined ? r.floorsCount : 1);
          if (r.totalAreaSqFt) setTotalAreaSqFt(String(r.totalAreaSqFt));
          if (r.floors) setChildRecords(r.floors);
        } else if (tableName === "cmn_floor") {
          setParentId(r.buildingId || r.building_id || "");
          setFloorNumber(r.floorNumber !== undefined ? r.floorNumber : 1);
          if (r.areaSqFt) setAreaSqFt(String(r.areaSqFt));
          setFloorplanSvgUrl(r.floorplanSvgUrl || r.floorplan_svg_url || "");
          setFloorplanImageUrl(r.floorplanImageUrl || r.floorplan_image_url || "");
          if (r.spaces) setChildRecords(r.spaces);
        } else if (tableName === "cmn_space") {
          setParentId(r.floorId || r.floor_id || "");
          setSpaceNumber(r.spaceNumber || r.space_number || "");
          setSpaceType(r.spaceType || r.space_type || "room");
          setStatus(r.status || "available");
          setCapacity(r.capacity !== undefined ? r.capacity : 1);
          if (r.squareFeet) setSquareFeet(String(r.squareFeet));
          setDepartment(r.department || "");
          setImageUrl(r.imageUrl || r.image_url || "");
          if (r.capabilities) {
            try {
              const caps = typeof r.capabilities === "string" ? JSON.parse(r.capabilities) : r.capabilities;
              if (Array.isArray(caps)) setSelectedAmenities(caps);
            } catch {}
          }
        } else if (tableName === "cmn_location") {
          setParentId(r.parentId || r.parent_id || "");
          setLocationType(r.locationType || r.location_type || "building");
          setStreet(r.street || "");
          setCity(r.city || "");
          setLocState(r.state || "");
          setCountry(r.country || "United States");
          if (r.children) setChildRecords(r.children);
        } else if (tableName === "cmn_reservation") {
          setParentId(r.spaceId || r.space_id || "");
          setSubject(r.subject || "");
          if (r.startTime) setStartTime(new Date(r.startTime).toISOString().slice(0, 16));
          if (r.endTime) setEndTime(new Date(r.endTime).toISOString().slice(0, 16));
          setAttendeesCount(r.attendeesCount !== undefined ? r.attendeesCount : 1);
          setReservationStatus(r.status || "confirmed");
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load record details: " + err.message);
      })
      .finally(() => setLoading(false));
  }, [tableName, recordId, isNew]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validation
    if (tableName !== "cmn_reservation" && !name.trim()) {
      setErrorMsg("Record Name is required.");
      return;
    }

    if (tableName === "cmn_state") {
      if (!code.trim()) {
        setErrorMsg("State Code (e.g. CA, NY, TX) is required.");
        return;
      }
    } else if (tableName === "cmn_region") {
      if (!code.trim()) {
        setErrorMsg("Region Code (e.g. REG-AMER) is required.");
        return;
      }
    } else if (tableName === "cmn_space") {
      if (!spaceNumber.trim()) {
        setErrorMsg("Space Number / Room Code is required.");
        return;
      }
    } else if (tableName === "cmn_reservation") {
      if (!parentId) {
        setErrorMsg("A Space / Room must be selected for the reservation.");
        return;
      }
      if (!subject.trim()) {
        setErrorMsg("Reservation Subject is required.");
        return;
      }
      if (!startTime || !endTime) {
        setErrorMsg("Start time and end time are required.");
        return;
      }
      if (new Date(endTime) <= new Date(startTime)) {
        setErrorMsg("End time must be after start time.");
        return;
      }
    }

    setSaving(true);
    try {
      let payload: Record<string, any> = {};

      if (tableName === "cmn_state") {
        payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          country: country.trim(),
          region_id: parentId || null,
        };
      } else if (tableName === "cmn_region") {
        payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
          active,
        };
      } else if (tableName === "cmn_campus") {
        payload = {
          name: name.trim(),
          code: code.trim().toUpperCase() || name.trim().toUpperCase().replace(/\s+/g, "_"),
          state_id: parentId || null,
          address: address.trim() || null,
          city: city.trim() || null,
          zip_code: zipCode.trim() || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        };
      } else if (tableName === "cmn_building") {
        payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          campus_id: parentId || null,
          building_type: buildingType,
          floors_count: Number(floorsCount) || 1,
          total_area_sq_ft: totalAreaSqFt ? parseFloat(String(totalAreaSqFt)) : null,
        };
      } else if (tableName === "cmn_floor") {
        payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          floor_number: Number(floorNumber) || 1,
          building_id: parentId || null,
          area_sq_ft: areaSqFt ? parseFloat(String(areaSqFt)) : null,
          floorplan_svg_url: floorplanSvgUrl.trim() || null,
          floorplan_image_url: floorplanImageUrl.trim() || null,
        };
      } else if (tableName === "cmn_space") {
        payload = {
          name: name.trim(),
          space_number: spaceNumber.trim().toUpperCase(),
          floor_id: parentId || null,
          space_type: spaceType,
          status,
          capacity: Number(capacity) || 1,
          square_feet: squareFeet ? parseFloat(String(squareFeet)) : null,
          department: department.trim() || null,
          capabilities: JSON.stringify(selectedAmenities),
          image_url: imageUrl.trim() || null,
        };
      } else if (tableName === "cmn_location") {
        payload = {
          name: name.trim(),
          location_type: locationType,
          parent_id: parentId || null,
          street: street.trim() || null,
          city: city.trim() || null,
          state: locState.trim() || null,
          country: country.trim() || "United States",
        };
      } else if (tableName === "cmn_reservation") {
        payload = {
          space_id: parentId,
          subject: subject.trim(),
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          attendees_count: Number(attendeesCount) || 1,
          status: reservationStatus,
        };
      }

      const url = isNew ? `/api/now/table/${tableName}` : `/api/now/table/${tableName}/${recordId}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save record");
      }

      showToast(`🐾 Successfully ${isNew ? "created" : "updated"} ${meta.title}!`);

      if (isNew) {
        const createdId = data.result?.sys_id || data.result?.id;
        if (createdId) {
          router.push(`/workspace/${tableName}/${createdId}`);
        } else {
          router.push(`/workspace/${tableName}`);
        }
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${meta.title} (${name || code})? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/now/table/${tableName}/${recordId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete record");
      }
      showToast(`🐾 Deleted ${meta.title}`);
      router.push(`/workspace/${tableName}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delete record.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading {meta.title} record details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${tableName}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {meta.title} List</span>
            </Link>
            <span className="text-slate-400 font-mono text-xs">•</span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              sys_table: {tableName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${meta.badgeBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isNew ? `New ${meta.title}` : name || code || "Record Detail"}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
                  {meta.tier}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isNew
                  ? `Configure and create a new ${meta.title} in the workplace spatial topology.`
                  : `Managing spatial entity (${code || recordId}) with relational links and child assets.`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>
          )}

          <Link
            href={`/workspace/${tableName}`}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : isNew ? `Create ${meta.title}` : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold">Validation Notice: </strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column: Fields */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>General Entity Information</span>
            </h3>

            {/* Standard Name & Code Fields for State, Region, Campus, Building, Floor */}
            {tableName !== "cmn_reservation" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {meta.title} Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      tableName === "cmn_state"
                        ? "e.g. California"
                        : tableName === "cmn_region"
                        ? "e.g. Americas"
                        : tableName === "cmn_campus"
                        ? "e.g. Silicon Valley Health Sciences Campus"
                        : tableName === "cmn_building"
                        ? "e.g. Pavilion A - Surgical & Critical Care"
                        : tableName === "cmn_floor"
                        ? "e.g. Level 3 - Operating Suites & Surgery"
                        : tableName === "cmn_space"
                        ? "e.g. Robotic Surgery Suite 1"
                        : "Name"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tableName === "cmn_space" ? "Space / Room Number" : "Unique Code"}{" "}
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tableName === "cmn_space" ? spaceNumber : code}
                    onChange={(e) =>
                      tableName === "cmn_space" ? setSpaceNumber(e.target.value) : setCode(e.target.value)
                    }
                    placeholder={
                      tableName === "cmn_state"
                        ? "e.g. US-CA or CA"
                        : tableName === "cmn_region"
                        ? "e.g. REG-AMER"
                        : tableName === "cmn_campus"
                        ? "e.g. CAMPUS-SF-MB"
                        : tableName === "cmn_building"
                        ? "e.g. BLDG-A"
                        : tableName === "cmn_floor"
                        ? "e.g. FL-03"
                        : "e.g. OR-302"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    System identifier used for spatial matching and Table API integration.
                  </p>
                </div>
              </div>
            )}

            {/* Parent Hierarchy Selector (if table has a parent tier) */}
            {meta.parentTable && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{meta.parentLabel} (Hierarchical Ancestor)</span>
                  <Link
                    href={`/workspace/${meta.parentTable}`}
                    className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Browse {meta.parentTable.replace("cmn_", "")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Select {meta.parentLabel} --</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.fullPath ? opt.fullPath : opt.code ? `${opt.name} (${opt.code})` : opt.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Establishes the foreign key relationship and parent-child hierarchy in the spatial topology.
                </p>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_state */}
            {tableName === "cmn_state" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States or US"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_region */}
            {tableName === "cmn_region" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide operational scope, timezones, and regional facility notes..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="region-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="region-active" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Active Region (Available for state and campus assignments)
                  </label>
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_campus */}
            {tableName === "cmn_campus" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 500 Parnassus Ave"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. San Francisco"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Zip / Postal Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="e.g. 94143"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g. 37.7631"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g. -122.4578"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_building */}
            {tableName === "cmn_building" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Building Type</label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  >
                    <option value="hospital">Hospital / Acute Care</option>
                    <option value="clinic">Outpatient Clinic</option>
                    <option value="lab">Research & Pathology Lab</option>
                    <option value="office">Corporate Office</option>
                    <option value="datacenter">Mission-Critical Data Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Floors Count</label>
                  <input
                    type="number"
                    min={1}
                    value={floorsCount}
                    onChange={(e) => setFloorsCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Total Area (Sq Ft)</label>
                  <input
                    type="number"
                    step="any"
                    value={totalAreaSqFt}
                    onChange={(e) => setTotalAreaSqFt(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_floor */}
            {tableName === "cmn_floor" && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Floor Level Number</label>
                    <input
                      type="number"
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(e.target.value)}
                      placeholder="e.g. 3 (0 for Ground, -1 for Basement)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Floor Area (Sq Ft)</label>
                    <input
                      type="number"
                      step="any"
                      value={areaSqFt}
                      onChange={(e) => setAreaSqFt(e.target.value)}
                      placeholder="e.g. 24000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Floorplan CAD / SVG Drawing URL
                  </label>
                  <input
                    type="text"
                    value={floorplanSvgUrl}
                    onChange={(e) => setFloorplanSvgUrl(e.target.value)}
                    placeholder="e.g. /floorplans/tech_tower_l4.svg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used by the CAD / Drawing Floorplan view for room coordinates and spatial hotspot mapping.
                  </p>
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_space */}
            {tableName === "cmn_space" && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Space Type</label>
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value="room">Standard Meeting Room</option>
                      <option value="operating_room">Operating Suite (OR)</option>
                      <option value="icu">Intensive Care Unit (ICU)</option>
                      <option value="patient_room">Patient Care Room</option>
                      <option value="lab">Pathology / Clinical Lab</option>
                      <option value="conference">Executive Conference Room</option>
                      <option value="office">Private Office</option>
                      <option value="desk">Hot Desk / Collaboration Bench</option>
                      <option value="server_room">Server & Telecomm Room</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Occupancy Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="decontamination">Decontamination</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Maximum Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Surgical Services, Critical Care, Engineering"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Room Size (Sq Ft)</label>
                    <input
                      type="number"
                      step="any"
                      value={squareFeet}
                      onChange={(e) => setSquareFeet(e.target.value)}
                      placeholder="e.g. 650"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Amenities / Capabilities Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Equipped Amenities & Hardware Capabilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_location */}
            {tableName === "cmn_location" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location Tier</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  >
                    <option value="region">Region (Tier 1)</option>
                    <option value="state">State / Province (Tier 2)</option>
                    <option value="campus">Campus (Tier 3)</option>
                    <option value="building">Building (Tier 4)</option>
                    <option value="floor">Floor & Level (Tier 5)</option>
                    <option value="space">Space & Room (Tier 6)</option>
                    <option value="site">Site / Facility</option>
                    <option value="datacenter">Data Center</option>
                    <option value="office">Corporate Office</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 100 Innovation Way"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. San Jose"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">State / Province</label>
                    <input
                      type="text"
                      value={locState}
                      onChange={(e) => setLocState(e.target.value)}
                      placeholder="e.g. CA"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TABLE SPECIFIC FIELDS: cmn_reservation */}
            {tableName === "cmn_reservation" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Meeting / Reservation Subject <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Cardiovascular Surgical Planning"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Attendees Count</label>
                    <input
                      type="number"
                      min={1}
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                    <select
                      value={reservationStatus}
                      onChange={(e) => setReservationStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending Approval</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Spatial Hierarchy Context Card & Child Assets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Spatial Hierarchy Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Spatial Hierarchy Placement</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Classification Tier</span>
                <span className="font-semibold text-slate-900 dark:text-white">{meta.tierNum > 0 ? `Tier ${meta.tierNum}` : "Entity"}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Database Schema</span>
                <span className="font-mono text-[11px] text-indigo-400">{tableName}</span>
              </div>
              {meta.parentLabel && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">{meta.parentLabel}</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {parentOptions.find((p) => p.id === parentId)?.name || <span className="opacity-50">Not Set</span>}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/20 text-[11px] text-indigo-800 dark:text-indigo-300">
              💡 <strong>Connected Workplace Architecture:</strong> Changes made here reflect immediately across the CAD floorplan view, daily calendar matrix, and unified location hierarchy (`cmn_location`).
            </div>
          </div>

          {/* Child Records Card (in Edit Mode) */}
          {!isNew && meta.childTable && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {meta.childLabel} ({childRecords.length})
                </h3>
                <Link
                  href={`/workspace/${meta.childTable}/new`}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </Link>
              </div>

              {childRecords.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No child assets linked yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {childRecords.map((child: any) => (
                    <Link
                      key={child.id}
                      href={`/workspace/${meta.childTable}/${child.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-xs group"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                        {child.name || child.spaceNumber || child.code}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
