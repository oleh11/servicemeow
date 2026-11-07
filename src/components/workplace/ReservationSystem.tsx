"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Grid,
  Map as MapIcon,
  Video,
  Monitor,
  Tv,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Building2,
  Sparkles,
  Download,
  Check,
  Info,
  CalendarCheck2,
  CalendarX2,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  Compass,
  Clock,
  Square,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { CadFloorplanEditor } from "./CadFloorplanEditor";
import {
  TimeFormat,
  STANDARD_TIME_OPTIONS,
  CALENDAR_HOURLY_SLOTS,
  formatTimeSlot,
  formatTimeOption,
  formatInterval,
  formatDateTimeSlot,
  formatReservationWindow,
  toMilitaryCallout,
} from "@/lib/time-format";

interface Reservation {
  id: string;
  number: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "checked_in" | "cancelled" | "completed";
  attendeesCount: number;
  capabilitiesNeeded?: string | null;
  notes?: string | null;
  reservedBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  space?: {
    id: string;
    name: string;
    spaceNumber: string;
  };
}

interface Space {
  id: string;
  name: string;
  spaceNumber: string;
  spaceType: string;
  status: string;
  capacity: number;
  squareFeet?: number | null;
  department?: string | null;
  capabilities?: string | null;
  parsedCapabilities: string[];
  imageUrl?: string | null;
  floorplanX?: number | null;
  floorplanY?: number | null;
  floorplanWidth?: number | null;
  floorplanHeight?: number | null;
  svgElementId?: string | null;
  isAvailable: boolean;
  floor?: {
    id: string;
    name: string;
    floorNumber: number;
    code: string;
    floorplanSvgUrl?: string | null;
    floorplanImageUrl?: string | null;
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
  reservations: Reservation[];
}

const AVAILABLE_CAPABILITIES = [
  { id: "teams", label: "Teams", icon: Video, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { id: "zoom", label: "Zoom", icon: Video, color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  { id: "standing_desk", label: "Standing desk", icon: Monitor, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { id: "whiteboard", label: "Whiteboard", icon: FileText, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { id: "4k_projector", label: "4K Projector", icon: Tv, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { id: "telepresence", label: "Telepresence", icon: Tv, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  { id: "dual_monitor", label: "Dual Monitor", icon: Monitor, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { id: "microphones", label: "Microphones", icon: Sparkles, color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
];

interface ReservationSystemProps {
  isFulfiller?: boolean;
}

function ReservationContent({ isFulfiller = false }: ReservationSystemProps) {
  const searchParams = useSearchParams();

  // Read initial view from query param if available
  const initialView = (searchParams?.get("view") as "catalog" | "calendar" | "floorplan") || "catalog";
  const [activeView, setActiveView] = useState<"catalog" | "calendar" | "floorplan">(initialView);
  const { currentUser, isWorkplaceAdmin, isAnyAdmin } = useUser();
  const [cadEditorOpen, setCadEditorOpen] = useState(false);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleToggleTimeFormat = (fmt: TimeFormat) => {
    setTimeFormat(fmt);
    try {
      localStorage.setItem("servicemeow_time_format", fmt);
    } catch {}
  };

  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:30");

  // Read initial capabilities from search params if present
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(() => {
    const capParam = searchParams?.get("capabilities");
    if (capParam) {
      return capParam.split(",").map((s) => s.trim().toLowerCase());
    }
    return [];
  });

  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>("all");
  const [minCapacity, setMinCapacity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal & Selection States
  const [bookingModalSpace, setBookingModalSpace] = useState<Space | null>(null);
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingAttendees, setBookingAttendees] = useState(2);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [hoveredFloorplanSpace, setHoveredFloorplanSpace] = useState<Space | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  // Load spaces and reservations
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${endTime}:00`);

      const params = new URLSearchParams();
      if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
        params.set("startTime", startDateTime.toISOString());
        params.set("endTime", endDateTime.toISOString());
      }
      if (selectedCapabilities.length > 0) {
        params.set("capabilities", selectedCapabilities.join(","));
      }
      if (spaceTypeFilter !== "all") {
        params.set("spaceType", spaceTypeFilter);
      }
      if (minCapacity > 1) {
        params.set("minCapacity", minCapacity.toString());
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const [spacesRes, resRes] = await Promise.all([
        fetch(`/api/now/reservations?${params.toString()}`),
        fetch(`/api/now/reservations?mode=reservations&startTime=${startDateTime.toISOString()}&endTime=${endDateTime.toISOString()}`)
      ]);

      const spacesData = await spacesRes.json();
      const resData = await resRes.json();

      if (spacesData.result) {
        setSpaces(spacesData.result);
      } else {
        throw new Error(spacesData.error || "Failed to load spaces");
      }

      if (resData.result) {
        setAllReservations(resData.result);
      }
    } catch (err: any) {
      console.error("Error fetching reservation data:", err);
      setError(err.message || "Failed to load reservation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, startTime, endTime, selectedCapabilities, spaceTypeFilter, minCapacity, searchQuery]);

  const toggleCapability = (capId: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capId) ? prev.filter((id) => id !== capId) : [...prev, capId]
    );
  };

  const handleOpenBooking = (space: Space, customStart?: string, customEnd?: string) => {
    setBookingModalSpace(space);
    if (customStart) setStartTime(customStart);
    if (customEnd) setEndTime(customEnd);
    setBookingSubject(`Meeting in ${space.name}`);
    setBookingAttendees(Math.min(space.capacity, 4));
    setBookingNotes("");
    setBookingError(null);
    setBookingSuccess(null);
  };

  const handleConfirmReservation = async () => {
    if (!bookingModalSpace) return;
    try {
      setBookingSubmitting(true);
      setBookingError(null);

      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        setBookingError("End time must be after start time");
        setBookingSubmitting(false);
        return;
      }

      const res = await fetch("/api/now/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: bookingModalSpace.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          subject: bookingSubject,
          attendeesCount: bookingAttendees,
          capabilitiesNeeded: selectedCapabilities,
          notes: bookingNotes,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setBookingError(data.error || "Conflict: Space is already booked during this time interval.");
        setBookingSubmitting(false);
        return;
      }

      if (!res.ok) {
        setBookingError(data.error || "Failed to confirm reservation");
        setBookingSubmitting(false);
        return;
      }

      setBookingSuccess(`Confirmed! Reservation ${data.result.number} created.`);
      setTimeout(() => {
        setBookingModalSpace(null);
        loadData();
      }, 1200);
    } catch (err: any) {
      setBookingError(err.message || "An unexpected error occurred while booking.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      const res = await fetch(`/api/now/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const handleCheckIn = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/now/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked_in" }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Check-in failed:", err);
    }
  };

  const totalSpacesCount = spaces.length;
  const availableCount = spaces.filter((s) => s.isAvailable).length;
  const reservedCount = totalSpacesCount - availableCount;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 min-h-screen bg-white text-black border border-neutral-300 font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-white shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-black">03 /</span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black uppercase">
                  {isFulfiller ? "Workplace & Space Reservations" : "Book a Meeting Room or Desk"}
                </h1>
                <span className="font-mono px-2 py-0.5 text-[10px] uppercase font-bold bg-neutral-100 text-black border border-neutral-300">
                  {isFulfiller ? "Facilities Console" : "Self-Service"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Reserve conference rooms, video collaboration suites, and ergonomic standing desks across all 3 interactive views.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Controls & Action Links */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!isFulfiller && (
            <Link
              href="/portal"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 text-neutral-800 hover:border-black hover:bg-neutral-100 text-xs font-mono uppercase font-bold transition-colors"
            >
              <span>&larr; Employee Portal</span>
            </Link>
          )}

          {isFulfiller && (
            <Link
              href="/workspace/spaces"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 text-neutral-800 hover:border-black hover:bg-neutral-100 text-xs font-mono uppercase font-bold transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-black" />
              <span>Spatial Architecture &rarr;</span>
            </Link>
          )}

          <button
            onClick={() => setShowMyBookings(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-800 hover:border-black hover:bg-neutral-100 text-xs font-mono uppercase font-bold transition-colors cursor-pointer"
          >
            <CalendarCheck2 className="w-4 h-4 text-black" />
            <span>My Bookings</span>
          </button>

          {/* Time Format Switcher (12H AM/PM vs. 24H Military Time) */}
          <div
            className="flex items-center p-0.5 border border-neutral-300 bg-neutral-100 font-mono text-xs"
            title="Toggle room & desk booking time format"
          >
            <div className="flex items-center px-2 py-1 text-neutral-600 text-xs gap-1 border-r border-neutral-300 mr-1">
              <Clock className="w-3.5 h-3.5 text-black" />
              <span className="hidden xl:inline font-bold uppercase">Format:</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleTimeFormat("12h")}
              className={`px-2 py-0.5 text-xs uppercase font-bold transition-all cursor-pointer ${
                timeFormat === "12h"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              12H (AM/PM)
            </button>
            <button
              type="button"
              onClick={() => handleToggleTimeFormat("24h")}
              className={`px-2 py-0.5 text-xs uppercase font-bold transition-all cursor-pointer ${
                timeFormat === "24h"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              24H (Mil)
            </button>
          </div>

          <div className="flex items-center p-0.5 border border-neutral-300 bg-neutral-100 font-mono">
            <button
              onClick={() => setActiveView("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold transition-all cursor-pointer ${
                activeView === "catalog"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>01 / Room List</span>
            </button>
            <button
              onClick={() => setActiveView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold transition-all cursor-pointer ${
                activeView === "calendar"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>02 / Calendar</span>
            </button>
            <button
              onClick={() => setActiveView("floorplan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold transition-all cursor-pointer ${
                activeView === "floorplan"
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>03 / Floor Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Capability Selector Card */}
      <div className="p-4 bg-white border border-neutral-300 space-y-4">
        {/* Row 1: Date, Time Window, Space Type, Capacity, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-600 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-600">Start Time</label>
              {timeFormat === "24h" && (
                <span className="text-[10px] font-mono text-black font-bold">{toMilitaryCallout(startTime)}</span>
              )}
            </div>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
            >
              {STANDARD_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeOption(t, timeFormat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-600">End Time</label>
              {timeFormat === "24h" && (
                <span className="text-[10px] font-mono text-black font-bold">{toMilitaryCallout(endTime)}</span>
              )}
            </div>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
            >
              {STANDARD_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeOption(t, timeFormat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-600 mb-1">Space Type</label>
            <select
              value={spaceTypeFilter}
              onChange={(e) => setSpaceTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
            >
              <option value="all">ALL SPACE TYPES</option>
              <option value="Conference Room">CONFERENCE ROOMS</option>
              <option value="Huddle Room">HUDDLE ROOMS</option>
              <option value="Video Suite">VIDEO SUITES</option>
              <option value="Hot Desk">STANDING &amp; HOT DESKS</option>
              <option value="Focus Pod">FOCUS PODS</option>
              <option value="Auditorium">AUDITORIUM / ARENA</option>
              <option value="Innovation Lab">INNOVATION LABS</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-neutral-600 mb-1">Search Room / Desk</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-400" />
              <input
                type="text"
                placeholder="Room # or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Capabilities Filter Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-neutral-600 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-black" />
              Required Capabilities
            </span>
            {selectedCapabilities.length > 0 && (
              <button
                onClick={() => setSelectedCapabilities([])}
                className="text-xs font-mono uppercase text-black hover:underline font-bold"
              >
                Clear Filters ({selectedCapabilities.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_CAPABILITIES.map((cap) => {
              const isSelected = selectedCapabilities.includes(cap.id);
              const CapIcon = cap.icon;
              return (
                <button
                  key={cap.id}
                  onClick={() => toggleCapability(cap.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-black text-white border-black"
                      : "bg-white border-neutral-300 text-neutral-700 hover:border-black hover:text-black"
                  }`}
                >
                  <CapIcon className="w-3 h-3" />
                  <span>{cap.label}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Filter Summary Pills */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-neutral-200 text-xs font-mono text-neutral-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-600"></span>
              <span>AVAILABLE: <strong className="text-black font-bold">{availableCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-600"></span>
              <span>BOOKED: <strong className="text-black font-bold">{reservedCount}</strong></span>
            </div>
            <div>
              TOTAL: <strong className="text-black font-bold">{totalSpacesCount}</strong>
            </div>
          </div>
          <div className="text-neutral-600 flex items-center gap-1.5 font-mono text-xs">
            <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
            <span>
              WINDOW: <strong className="text-black">{selectedDate}</strong> &bull;{" "}
              <strong className="text-black">{formatInterval(startTime, endTime, timeFormat)}</strong>
            </span>
            <span className="ml-1 text-[10px] px-1 py-0.2 bg-neutral-200 text-black font-mono uppercase font-bold">
              {timeFormat === "24h" ? "24H MIL" : "12H AM/PM"}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-900 font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <div>{error}</div>
        </div>
      )}

      {/* VIEW 1: CATALOG VIEW */}
      {activeView === "catalog" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-24 text-neutral-600 font-mono text-xs uppercase gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Scanning room &amp; desk availability...</span>
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-300 p-8 space-y-3">
              <CalendarX2 className="w-8 h-8 mx-auto text-neutral-400" />
              <h3 className="text-sm font-bold uppercase font-mono text-black">No matching spaces found</h3>
              <p className="text-xs font-mono text-neutral-500 max-w-md mx-auto">
                Try loosening your capability filters or choosing another time window.
              </p>
              <button
                onClick={() => {
                  setSelectedCapabilities([]);
                  setSpaceTypeFilter("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-black text-white text-xs font-mono uppercase font-bold hover:bg-neutral-800 rounded-none cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.map((sp) => (
                <div
                  key={sp.id}
                  className="bg-white border border-neutral-300 hover:border-black transition-all flex flex-col group rounded-none"
                >
                  {/* Space Image Header */}
                  <div className="relative h-44 w-full bg-neutral-100 border-b border-neutral-300 overflow-hidden">
                    <img
                      src={sp.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"}
                      alt={sp.name}
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Top Status Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-black text-white">
                        {sp.spaceNumber}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-white/90 text-black border border-neutral-300">
                        {sp.spaceType}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      {sp.isAvailable ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white"></span>
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-rose-600 text-white flex items-center gap-1">
                          Booked
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono font-bold text-white bg-black/80 px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-300" />
                        <span>CAPACITY: <strong>{sp.capacity}</strong></span>
                      </div>
                      {sp.squareFeet && (
                        <span>{sp.squareFeet} SQ FT</span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-black uppercase tracking-tight">{sp.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{sp.floor?.building?.name || "Tech Tower"} &bull; FLOOR {sp.floor?.floorNumber || 4}</span>
                      </div>

                      {/* Capabilities Tag Cloud */}
                      <div className="mt-3">
                        <div className="text-[10px] font-mono font-bold uppercase text-neutral-500 mb-1">Capabilities:</div>
                        <div className="flex flex-wrap gap-1">
                          {sp.parsedCapabilities.length > 0 ? (
                            sp.parsedCapabilities.map((cap) => {
                              const found = AVAILABLE_CAPABILITIES.find((c) => c.id === cap.toLowerCase());
                              return (
                                <span
                                  key={cap}
                                  className="px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center gap-1"
                                >
                                  {found && <found.icon className="w-2.5 h-2.5" />}
                                  {found ? found.label : cap}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400">Standard desk / space</span>
                          )}
                        </div>
                      </div>

                      {/* Conflicting reservation details if booked */}
                      {!sp.isAvailable && sp.reservations.length > 0 && (
                        <div className="mt-3 p-2 bg-rose-50 border border-rose-200 text-xs font-mono text-rose-900">
                          <div className="font-bold flex items-center justify-between">
                            <span>RESERVED:</span>
                            <span className="text-[10px]">
                              {formatDateTimeSlot(sp.reservations[0].startTime, timeFormat)} – {formatDateTimeSlot(sp.reservations[0].endTime, timeFormat)}
                            </span>
                          </div>
                          <div className="truncate text-[11px] mt-0.5">{sp.reservations[0].subject}</div>
                          <div className="text-neutral-500 text-[10px]">
                            Holder: {sp.reservations[0].reservedBy?.name || "Staff Member"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-neutral-200 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBooking(sp)}
                        disabled={!sp.isAvailable}
                        className={`flex-1 py-2 px-3 text-xs font-mono uppercase font-bold transition-all flex items-center justify-center gap-1.5 rounded-none ${
                          sp.isAvailable
                            ? "bg-black hover:bg-neutral-800 text-white cursor-pointer"
                            : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
                        }`}
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>{sp.isAvailable ? "Reserve Space" : "Unavailable"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView("floorplan");
                          setHoveredFloorplanSpace(sp);
                        }}
                        title="Locate on Architectural Floorplan"
                        className="p-2 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black cursor-pointer rounded-none transition-colors"
                      >
                        <MapIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CALENDAR SCHEDULE VIEW */}
      {activeView === "calendar" && (
        <div className="border border-neutral-300 bg-white overflow-hidden rounded-none">
          {/* Calendar Header */}
          <div className="p-3 border-b border-neutral-300 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-black" />
              <div>
                <h2 className="text-xs font-mono uppercase font-bold text-black tracking-wider">Daily Space Occupancy Matrix</h2>
                <p className="text-[10px] font-mono text-neutral-500">Click any vacant time slot to reserve instantly.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="p-1 bg-white border border-neutral-300 hover:border-black text-black cursor-pointer rounded-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono uppercase font-bold text-black px-2">
                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="p-1 bg-white border border-neutral-300 hover:border-black text-black cursor-pointer rounded-none"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 text-[10px] font-mono uppercase text-neutral-700">
                  <th className="p-2.5 w-56 font-bold sticky left-0 bg-neutral-100 z-10 border-r border-neutral-300 text-black">
                    Room / Space
                  </th>
                  {CALENDAR_HOURLY_SLOTS.slice(0, -1).map((t, idx) => {
                    const nextT = CALENDAR_HOURLY_SLOTS[idx + 1];
                    return (
                      <th key={t} className="p-2 font-bold text-center border-r border-neutral-300 w-32">
                        <div className="font-mono text-black text-[10px]">
                          {formatTimeSlot(t, timeFormat)} – {formatTimeSlot(nextT, timeFormat)}
                        </div>
                        {timeFormat === "24h" && (
                          <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                            {toMilitaryCallout(t).replace(" hrs", "")}–{toMilitaryCallout(nextT)}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {spaces.map((sp) => {
                  return (
                    <tr key={sp.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Space Title Cell */}
                      <td className="p-2.5 font-mono sticky left-0 bg-white z-10 border-r border-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-bold">
                            {sp.spaceNumber}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[140px] text-black uppercase">{sp.name}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1.5 font-mono">
                          <span>CAP: {sp.capacity}</span>
                          <span>&bull;</span>
                          <span className="truncate">{sp.spaceType}</span>
                        </div>
                      </td>

                      {/* Hourly Cells */}
                      {CALENDAR_HOURLY_SLOTS.slice(0, -1).map((slotHour, idx) => {
                        const slotNextHour = CALENDAR_HOURLY_SLOTS[idx + 1];
                        const cellStart = new Date(`${selectedDate}T${slotHour}:00`).getTime();
                        const cellEnd = new Date(`${selectedDate}T${slotNextHour}:00`).getTime();

                        const overlappingRes = allReservations.find((r) => {
                          if (r.space?.id !== sp.id || r.status === "cancelled") return false;
                          const rStart = new Date(r.startTime).getTime();
                          const rEnd = new Date(r.endTime).getTime();
                          return rStart < cellEnd && rEnd > cellStart;
                        });

                        return (
                          <td
                            key={slotHour}
                            className="p-1 border-r border-neutral-200 align-middle text-center"
                          >
                            {overlappingRes ? (
                              <div
                                title={`${overlappingRes.subject} (${overlappingRes.status})\nTime: ${formatReservationWindow(overlappingRes.startTime, overlappingRes.endTime, timeFormat)}\nReserved by: ${overlappingRes.reservedBy?.name || "Staff"}`}
                                className="h-10 bg-rose-50 border border-rose-300 text-rose-900 p-1 flex flex-col justify-between text-left hover:bg-rose-100 transition-colors cursor-pointer rounded-none font-mono"
                                onClick={() => alert(`Reservation: ${overlappingRes.number}\nSubject: ${overlappingRes.subject}\nTime: ${formatReservationWindow(overlappingRes.startTime, overlappingRes.endTime, timeFormat)}\nHolder: ${overlappingRes.reservedBy?.name || "N/A"}\nStatus: ${overlappingRes.status}`)}
                              >
                                <span className="font-bold text-[10px] truncate leading-tight text-black">
                                  {overlappingRes.subject}
                                </span>
                                <span className="text-[9px] text-rose-700 truncate">
                                  {overlappingRes.reservedBy?.name || "Reserved"}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenBooking(sp, slotHour, slotNextHour)}
                                title={`Book ${sp.name} for ${formatInterval(slotHour, slotNextHour, timeFormat)}`}
                                className="w-full h-10 border border-dashed border-neutral-300 hover:border-black hover:bg-neutral-100 text-neutral-400 hover:text-black flex items-center justify-center gap-1 transition-all rounded-none font-mono text-[10px] uppercase font-bold group cursor-pointer"
                              >
                                <Plus className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                                <span className="hidden group-hover:inline">Book</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: PDF / PICTURE / FLOORPLAN VIEW */}
      {activeView === "floorplan" && (
        <div className="border border-neutral-300 bg-white p-4 space-y-4 rounded-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-300">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-black" />
                <h2 className="text-xs font-mono uppercase font-bold text-black tracking-wider">Architectural Schematic &amp; Floorplan</h2>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                Interactive spatial blueprint with real-time green (available) and red (reserved) occupancy pins. Click any room or desk to book directly.
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-[10px] font-mono text-black font-semibold">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span>WINDOW: {formatInterval(startTime, endTime, timeFormat)}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-neutral-200 text-black uppercase font-mono font-bold">
                  {timeFormat === "24h" ? "24H MIL" : "12H AM/PM"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(isWorkplaceAdmin || isAnyAdmin) && (
                <button
                  type="button"
                  onClick={() => setCadEditorOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer rounded-none"
                  title="Draw and adjust room boundary hotspots directly on this CAD drawing"
                >
                  <Square className="w-3 h-3 text-white" />
                  <span>CAD Room Mapper</span>
                </button>
              )}
              <a
                href={
                  spaces.find((s) => s.floor?.floorplanSvgUrl)?.floor?.floorplanSvgUrl ||
                  spaces.find((s) => s.floor?.floorplanImageUrl)?.floor?.floorplanImageUrl ||
                  "/floorplans/tech_tower_l4.svg"
                }
                target="_blank"
                download="floorplan_schematic.svg"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 hover:border-black text-black text-xs font-mono uppercase font-bold transition-colors cursor-pointer rounded-none"
              >
                <Download className="w-3 h-3 text-black" />
                <span>Export Vector CAD</span>
              </a>
            </div>
          </div>

          {/* Interactive SVG / Picture Canvas */}
          <div className="relative w-full rounded-none overflow-hidden border border-neutral-300 bg-neutral-950 aspect-[1000/600]">
            <img
              src={
                spaces.find((s) => s.floor?.floorplanSvgUrl)?.floor?.floorplanSvgUrl ||
                spaces.find((s) => s.floor?.floorplanImageUrl)?.floor?.floorplanImageUrl ||
                "/floorplans/tech_tower_l4.svg"
              }
              alt="Floorplan Blueprint"
              className="w-full h-full object-contain pointer-events-none select-none opacity-90"
            />

            {/* Interactive Coordinate Hotspots Layer */}
            {spaces.map((sp) => {
              if (
                sp.floorplanX === null ||
                sp.floorplanY === null ||
                sp.floorplanWidth === null ||
                sp.floorplanHeight === null
              ) {
                return null;
              }

              const isAvailable = sp.isAvailable;
              const isHovered = hoveredFloorplanSpace?.id === sp.id;

              return (
                <div
                  key={sp.id}
                  onClick={() => handleOpenBooking(sp)}
                  onMouseEnter={() => setHoveredFloorplanSpace(sp)}
                  onMouseLeave={() => setHoveredFloorplanSpace(null)}
                  style={{
                    left: `${sp.floorplanX}%`,
                    top: `${sp.floorplanY}%`,
                    width: `${sp.floorplanWidth}%`,
                    height: `${sp.floorplanHeight}%`,
                  }}
                  className={`absolute rounded-none border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between p-1.5 select-none ${
                    isAvailable
                      ? isHovered
                        ? "bg-emerald-500/30 border-emerald-400 z-20 scale-[1.01]"
                        : "bg-emerald-500/15 border-emerald-500/70 hover:bg-emerald-500/25"
                      : isHovered
                      ? "bg-rose-500/30 border-rose-400 z-20 scale-[1.01]"
                      : "bg-rose-500/15 border-rose-500/70 hover:bg-rose-500/25"
                  }`}
                >
                  {/* Pin Header */}
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="px-1 py-0.2 bg-black text-white text-[9px] font-mono font-bold rounded-none">
                      {sp.spaceNumber}
                    </span>
                    <span
                      className={`w-2 h-2 ${
                        isAvailable ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                      }`}
                    ></span>
                  </div>

                  {/* Pin Center / Label */}
                  <div className="text-center pointer-events-none">
                    <span className="text-[10px] font-mono font-bold text-white uppercase drop-shadow-md truncate block">
                      {sp.name}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-neutral-300 font-bold">
                      {isAvailable ? "Click to Book" : "Reserved"}
                    </span>
                  </div>

                  {/* Capabilities micro badges */}
                  <div className="flex items-center justify-center gap-1 pointer-events-none overflow-hidden">
                    {sp.parsedCapabilities.slice(0, 3).map((cap) => (
                      <span
                        key={cap}
                        className="px-1 py-0.2 text-[8px] font-mono uppercase font-bold bg-black/90 text-neutral-200 rounded-none"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floorplan Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-neutral-200 text-xs font-mono">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-600 rounded-none"></span>
                <span className="text-neutral-700 font-bold text-[10px] uppercase">Available (Click to Reserve)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-500/20 border border-rose-600 rounded-none"></span>
                <span className="text-neutral-700 font-bold text-[10px] uppercase">Booked / In Use</span>
              </div>
            </div>

            <div className="md:col-span-2 text-neutral-500 flex items-center justify-end gap-1.5 text-[10px] uppercase font-mono">
              <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>Hovering any zone displays instant capabilities; clicking initiates conflict-checked reservation.</span>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingModalSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border-2 border-black p-6 text-black space-y-4 rounded-none shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-mono font-bold uppercase rounded-none">
                  {bookingModalSpace.spaceNumber}
                </span>
                <h3 className="text-base font-bold text-black uppercase font-mono mt-1">{bookingModalSpace.name}</h3>
                <p className="text-xs font-mono text-neutral-500">
                  {bookingModalSpace.floor?.building?.name || "Tech Tower"} &bull; FLOOR {bookingModalSpace.floor?.floorNumber || 4} &bull; CAP: {bookingModalSpace.capacity}
                </p>
              </div>
              <button
                onClick={() => setBookingModalSpace(null)}
                className="p-1 text-neutral-500 hover:text-black cursor-pointer rounded-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error or Success Banner */}
            {bookingError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-mono flex items-center gap-2 rounded-none">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}
            {bookingSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono flex items-center gap-2 rounded-none">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-neutral-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={bookingSubject}
                  onChange={(e) => setBookingSubject(e.target.value)}
                  placeholder="e.g. Executive Strategy Session"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-neutral-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-neutral-600 mb-1">Attendees</label>
                  <input
                    type="number"
                    min={1}
                    max={bookingModalSpace.capacity}
                    value={bookingAttendees}
                    onChange={(e) => setBookingAttendees(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Time Window & Format Switcher */}
              <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200 rounded-none">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                  <span className="font-mono text-[10px] uppercase font-bold text-black flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Booking Time Window</span>
                  </span>
                  <div className="flex items-center p-0.5 bg-white border border-neutral-300 rounded-none text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleToggleTimeFormat("12h")}
                      className={`px-2 py-0.5 rounded-none transition-all cursor-pointer ${
                        timeFormat === "12h"
                          ? "bg-black text-white font-bold"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      12H (AM/PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleTimeFormat("24h")}
                      className={`px-2 py-0.5 rounded-none transition-all cursor-pointer ${
                        timeFormat === "24h"
                          ? "bg-black text-white font-bold"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      24H (MIL)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-neutral-600 mb-1 text-[10px] font-mono uppercase font-bold">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
                    >
                      {STANDARD_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTimeOption(t, timeFormat)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1 text-[10px] font-mono uppercase font-bold">End Time</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
                    >
                      {STANDARD_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTimeOption(t, timeFormat)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration Preview */}
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-neutral-600">
                  <span className="flex items-center gap-1">
                    <span>WINDOW:</span>
                    <strong className="text-black font-mono">{formatInterval(startTime, endTime, timeFormat)}</strong>
                  </span>
                  {timeFormat === "24h" && (
                    <span className="text-black font-mono font-bold">
                      [{toMilitaryCallout(startTime)} &ndash; {toMilitaryCallout(endTime)}]
                    </span>
                  )}
                </div>
              </div>

              {/* Space Capabilities Notice */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-neutral-600 mb-1">Equipped Capabilities</label>
                <div className="flex flex-wrap gap-1 p-2 bg-neutral-50 border border-neutral-200 rounded-none">
                  {bookingModalSpace.parsedCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-white text-neutral-800 border border-neutral-300 font-semibold rounded-none"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-neutral-600 mb-1">Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Teams room video link needed, whiteboard markers requested..."
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-none text-black text-xs font-mono focus:outline-hidden focus:border-black"
                ></textarea>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingModalSpace(null)}
                className="px-4 py-2 border border-neutral-300 hover:border-black text-black text-xs font-mono uppercase font-bold rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={bookingSubmitting}
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-mono uppercase font-bold disabled:opacity-50 flex items-center gap-1.5 rounded-none cursor-pointer"
              >
                {bookingSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY BOOKINGS DRAWER */}
      {showMyBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white border-l-2 border-black p-6 flex flex-col justify-between text-black rounded-none shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-black" />
                  <h3 className="text-xs font-mono uppercase font-bold text-black tracking-wider">Active Reservations</h3>
                </div>
                <button
                  onClick={() => setShowMyBookings(false)}
                  className="p-1 text-neutral-500 hover:text-black cursor-pointer rounded-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1 font-mono text-xs">
                {allReservations.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 text-xs font-mono uppercase">
                    No active reservations recorded.
                  </div>
                ) : (
                  allReservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 border border-neutral-300 bg-neutral-50 space-y-1.5 rounded-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-black">{res.number}</span>
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-none border ${
                            res.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : res.status === "checked_in"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-neutral-200 text-neutral-700 border-neutral-300"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="font-bold text-black uppercase text-xs">{res.subject}</div>

                      <div className="text-neutral-600 text-[11px]">
                        SPACE: <strong className="text-black">{res.space?.name}</strong> ({res.space?.spaceNumber})
                      </div>

                      <div className="text-neutral-600 flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="font-mono text-black font-semibold">
                          {formatReservationWindow(res.startTime, res.endTime, timeFormat)}
                        </span>
                      </div>

                      {res.reservedBy && (
                        <div className="text-neutral-500 text-[10px]">
                          Booked by: <span className="text-neutral-800 font-semibold">{res.reservedBy.name}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-neutral-200 flex items-center justify-end gap-1.5">
                        {res.status === "confirmed" && (
                          <button
                            onClick={() => handleCheckIn(res.id)}
                            className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 text-[10px] font-mono uppercase font-bold cursor-pointer rounded-none"
                          >
                            Check In
                          </button>
                        )}
                        {res.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            className="px-2.5 py-1 border border-neutral-300 hover:border-black text-neutral-800 text-[10px] font-mono uppercase font-bold cursor-pointer rounded-none"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowMyBookings(false)}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-xs font-mono uppercase font-bold cursor-pointer rounded-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Interactive CAD Hotspot Editor for Workplace Admins */}
      {cadEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-none w-full max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4 text-black" />
                <h3 className="font-mono uppercase font-bold text-black text-xs tracking-wider">
                  Interactive CAD Floorplan &amp; Room Hotspot Mapper
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCadEditorOpen(false);
                  loadData();
                }}
                className="px-3 py-1 bg-black hover:bg-neutral-800 text-white text-xs font-mono uppercase font-bold rounded-none transition-colors cursor-pointer"
              >
                ✕ Close Editor
              </button>
            </div>
            <CadFloorplanEditor
              initialFloorId={spaces[0]?.floor?.id}
              onSaved={() => loadData()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ReservationSystem(props: ReservationSystemProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Loading Workplace Hub...</span>
        </div>
      }
    >
      <ReservationContent {...props} />
    </Suspense>
  );
}
