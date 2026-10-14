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
} from "lucide-react";
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
    <div className="flex-1 space-y-6 p-4 sm:p-6 min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isFulfiller ? "Workplace & Space Reservations" : "Book a Meeting Room or Desk"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  {isFulfiller ? "ITIL Facilities Hub" : "Self-Service"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs font-medium transition-colors"
            >
              <span>&larr; Employee Portal</span>
            </Link>
          )}

          {isFulfiller && (
            <Link
              href="/workspace/spaces"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white text-xs font-medium transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Spatial Hierarchy</span>
            </Link>
          )}

          <button
            onClick={() => setShowMyBookings(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <CalendarCheck2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>My Bookings</span>
          </button>

          {/* Time Format Switcher (12H AM/PM vs. 24H Military Time) */}
          <div
            className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            title="Toggle room & desk booking time format"
          >
            <div className="flex items-center px-2 py-1 text-slate-500 dark:text-slate-400 text-xs gap-1 border-r border-slate-200 dark:border-slate-800 mr-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden xl:inline font-semibold text-slate-700 dark:text-slate-300">Format:</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleTimeFormat("12h")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFormat === "12h"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              12H (AM/PM)
            </button>
            <button
              type="button"
              onClick={() => handleToggleTimeFormat("24h")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFormat === "24h"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              24H (Military)
            </button>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveView("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === "catalog"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catalog View</span>
              <span className="sm:hidden">Catalog</span>
            </button>
            <button
              onClick={() => setActiveView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === "calendar"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar View</span>
              <span className="sm:hidden">Calendar</span>
            </button>
            <button
              onClick={() => setActiveView("floorplan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === "floorplan"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Picture / Floorplan</span>
              <span className="sm:hidden">Floorplan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Capability Selector Card */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm space-y-4">
        {/* Row 1: Date, Time Window, Space Type, Capacity, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">Start Time</label>
              {timeFormat === "24h" && (
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{toMilitaryCallout(startTime)}</span>
              )}
            </div>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 font-mono shadow-xs"
            >
              {STANDARD_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeOption(t, timeFormat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">End Time</label>
              {timeFormat === "24h" && (
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{toMilitaryCallout(endTime)}</span>
              )}
            </div>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 font-mono shadow-xs"
            >
              {STANDARD_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeOption(t, timeFormat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Space Type</label>
            <select
              value={spaceTypeFilter}
              onChange={(e) => setSpaceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 shadow-xs"
            >
              <option value="all">All Space Types</option>
              <option value="Conference Room">Conference Rooms</option>
              <option value="Huddle Room">Huddle Rooms</option>
              <option value="Video Suite">Video Suites</option>
              <option value="Hot Desk">Standing &amp; Hot Desks</option>
              <option value="Focus Pod">Focus Pods</option>
              <option value="Auditorium">Auditorium / Arena</option>
              <option value="Innovation Lab">Innovation Labs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Search Room / Desk</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 410, Boardroom, Desk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 shadow-xs placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Capabilities Filter Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Required Room / Desk Capabilities
            </span>
            {selectedCapabilities.length > 0 && (
              <button
                onClick={() => setSelectedCapabilities([])}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Clear Filters ({selectedCapabilities.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CAPABILITIES.map((cap) => {
              const isSelected = selectedCapabilities.includes(cap.id);
              const CapIcon = cap.icon;
              return (
                <button
                  key={cap.id}
                  onClick={() => toggleCapability(cap.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? `${cap.color} ring-2 ring-indigo-500 shadow-xs font-bold`
                      : "bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <CapIcon className="w-3.5 h-3.5" />
                  <span>{cap.label}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Filter Summary Pills */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Available in window: <strong className="text-emerald-600 dark:text-emerald-400">{availableCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Reserved / Booked: <strong className="text-rose-600 dark:text-rose-400">{reservedCount}</strong></span>
            </div>
            <div>
              Total filtered spaces: <strong className="text-slate-900 dark:text-white">{totalSpacesCount}</strong>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span>
              Interval: <strong className="text-slate-800 dark:text-slate-200">{selectedDate}</strong> &bull;{" "}
              <strong className="text-indigo-600 dark:text-indigo-300">{formatInterval(startTime, endTime, timeFormat)}</strong>
            </span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider border border-slate-200 dark:border-slate-700">
              {timeFormat === "24h" ? "24H MIL" : "12H AM/PM"}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* VIEW 1: CATALOG VIEW */}
      {activeView === "catalog" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Scanning room &amp; desk availability...</span>
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <CalendarX2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No matching spaces found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Try loosening your capability filters or choosing another time window.
              </p>
              <button
                onClick={() => {
                  setSelectedCapabilities([]);
                  setSpaceTypeFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.map((sp) => (
                <div
                  key={sp.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 shadow-xs hover:shadow-md overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Space Image Header */}
                  <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={sp.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"}
                      alt={sp.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                    {/* Top Status Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-900/90 text-white border border-slate-700 shadow-md">
                        {sp.spaceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-900/80 text-slate-200 border border-slate-700">
                        {sp.spaceType}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {sp.isAvailable ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white border border-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Available
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/90 text-white border border-rose-400 shadow-lg shadow-rose-500/20 flex items-center gap-1.5">
                          Booked
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-300" />
                        <span>Up to <strong>{sp.capacity}</strong> attendees</span>
                      </div>
                      {sp.squareFeet && (
                        <span>{sp.squareFeet} sq ft</span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{sp.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{sp.floor?.building?.name || "Tech Tower"} &bull; Floor {sp.floor?.floorNumber || 4}</span>
                      </div>

                      {/* Capabilities Tag Cloud */}
                      <div className="mt-3.5">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Equipped Capabilities:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {sp.parsedCapabilities.length > 0 ? (
                            sp.parsedCapabilities.map((cap) => {
                              const found = AVAILABLE_CAPABILITIES.find((c) => c.id === cap.toLowerCase());
                              return (
                                <span
                                  key={cap}
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 ${
                                    found ? found.color : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  {found && <found.icon className="w-3 h-3" />}
                                  {found ? found.label : cap}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Standard meeting amenities</span>
                          )}
                        </div>
                      </div>

                      {/* Conflicting reservation details if booked */}
                      {!sp.isAvailable && sp.reservations.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                          <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                            <span>Currently Reserved:</span>
                            <span className="text-[10px] font-mono text-rose-600 dark:text-rose-300/90">
                              {formatDateTimeSlot(sp.reservations[0].startTime, timeFormat)} – {formatDateTimeSlot(sp.reservations[0].endTime, timeFormat)}
                            </span>
                          </div>
                          <div className="truncate">{sp.reservations[0].subject}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Holder: {sp.reservations[0].reservedBy?.name || "Staff Member"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBooking(sp)}
                        disabled={!sp.isAvailable}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          sp.isAvailable
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <CalendarCheck2 className="w-4 h-4" />
                        <span>{sp.isAvailable ? "Reserve This Space" : "Unavailable in Window"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView("floorplan");
                          setHoveredFloorplanSpace(sp);
                        }}
                        title="Locate on Architectural Floorplan Picture"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <MapIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
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
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Space Occupancy Matrix</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Click any vacant time slot to reserve instantly.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900 dark:text-white px-2">
                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split("T")[0]);
                }}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="p-3 w-56 font-semibold sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 border-r border-slate-200 dark:border-slate-800">
                    Room / Space
                  </th>
                  {CALENDAR_HOURLY_SLOTS.slice(0, -1).map((t, idx) => {
                    const nextT = CALENDAR_HOURLY_SLOTS[idx + 1];
                    return (
                      <th key={t} className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800/60 w-32">
                        <div className="font-mono text-slate-800 dark:text-white text-[11px]">
                          {formatTimeSlot(t, timeFormat)} – {formatTimeSlot(nextT, timeFormat)}
                        </div>
                        {timeFormat === "24h" && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                            {toMilitaryCallout(t).replace(" hrs", "")}–{toMilitaryCallout(nextT)}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {spaces.map((sp) => {
                  return (
                    <tr key={sp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Space Title Cell */}
                      <td className="p-3 font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            {sp.spaceNumber}
                          </span>
                          <span className="font-semibold truncate max-w-[140px] text-slate-900 dark:text-white">{sp.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span>Cap: {sp.capacity}</span>
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
                            className="p-1 border-r border-slate-200 dark:border-slate-800/60 align-middle text-center"
                          >
                            {overlappingRes ? (
                              <div
                                title={`${overlappingRes.subject} (${overlappingRes.status})\nTime: ${formatReservationWindow(overlappingRes.startTime, overlappingRes.endTime, timeFormat)}\nReserved by: ${overlappingRes.reservedBy?.name || "Staff"}`}
                                className="h-12 rounded-lg bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 p-1.5 flex flex-col justify-between text-left hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors cursor-pointer"
                                onClick={() => alert(`Reservation: ${overlappingRes.number}\nSubject: ${overlappingRes.subject}\nTime: ${formatReservationWindow(overlappingRes.startTime, overlappingRes.endTime, timeFormat)}\nHolder: ${overlappingRes.reservedBy?.name || "N/A"}\nStatus: ${overlappingRes.status}`)}
                              >
                                <span className="font-semibold text-[11px] truncate leading-tight text-rose-900 dark:text-white">
                                  {overlappingRes.subject}
                                </span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate font-medium">
                                  {overlappingRes.reservedBy?.name || "Reserved"}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenBooking(sp, slotHour, slotNextHour)}
                                title={`Book ${sp.name} for ${formatInterval(slotHour, slotNextHour, timeFormat)}`}
                                className="w-full h-12 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 transition-all group cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                                <span className="text-[11px] font-medium hidden group-hover:inline">Book</span>
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
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Architectural Schematic &amp; Floorplan Picture</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive spatial blueprint with real-time green (available) and red (reserved) occupancy pins. Click any room or desk to book directly.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-xs font-mono text-indigo-700 dark:text-indigo-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Window: {formatInterval(startTime, endTime, timeFormat)}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono border border-slate-200 dark:border-slate-700">
                  {timeFormat === "24h" ? "Military 24H" : "Standard 12H"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/floorplans/tech_tower_l4.svg"
                target="_blank"
                download="tech_tower_level_4_schematic.svg"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Export PDF / Vector Schematic</span>
              </a>
            </div>
          </div>

          {/* Interactive SVG / Picture Canvas */}
          <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#090d16] shadow-xl aspect-[1000/600]">
            <img
              src="/floorplans/tech_tower_l4.svg"
              alt="Level 4 Floorplan Blueprint"
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
                  className={`absolute rounded-lg border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between p-2 select-none ${
                    isAvailable
                      ? isHovered
                        ? "bg-emerald-500/30 border-emerald-400 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20 scale-[1.02] z-20"
                        : "bg-emerald-500/15 border-emerald-500/60 hover:bg-emerald-500/25"
                      : isHovered
                      ? "bg-rose-500/30 border-rose-400 shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/20 scale-[1.02] z-20"
                      : "bg-rose-500/20 border-rose-500/60 hover:bg-rose-500/30"
                  }`}
                >
                  {/* Pin Header */}
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-950/90 text-white shadow-xs">
                      {sp.spaceNumber}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAvailable ? "bg-emerald-400 animate-pulse shadow-md shadow-emerald-400" : "bg-rose-400"
                      }`}
                    ></span>
                  </div>

                  {/* Pin Center / Label */}
                  <div className="text-center pointer-events-none">
                    <span className="text-[11px] font-bold text-white drop-shadow-md truncate block">
                      {sp.name}
                    </span>
                    <span className="text-[9px] text-slate-300 drop-shadow-sm font-medium">
                      {isAvailable ? "🟢 Click to Book" : "🔴 Reserved"}
                    </span>
                  </div>

                  {/* Capabilities micro badges */}
                  <div className="flex items-center justify-center gap-1 pointer-events-none overflow-hidden">
                    {sp.parsedCapabilities.slice(0, 3).map((cap) => (
                      <span
                        key={cap}
                        className="px-1 py-0.2 rounded text-[9px] font-medium bg-slate-950/80 text-indigo-300"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Available (Click to Reserve)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Booked / In Use</span>
              </div>
            </div>

            <div className="md:col-span-2 text-slate-500 dark:text-slate-400 flex items-center justify-end gap-2">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Hovering any hot zone displays instant capabilities; clicking initiates conflict-checked booking.</span>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingModalSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                  {bookingModalSpace.spaceNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{bookingModalSpace.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {bookingModalSpace.floor?.building?.name || "Tech Tower"} &bull; Floor {bookingModalSpace.floor?.floorNumber || 4} &bull; Cap: {bookingModalSpace.capacity}
                </p>
              </div>
              <button
                onClick={() => setBookingModalSpace(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error or Success Banner */}
            {bookingError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}
            {bookingSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting / Reservation Subject</label>
                <input
                  type="text"
                  value={bookingSubject}
                  onChange={(e) => setBookingSubject(e.target.value)}
                  placeholder="e.g. Q4 Executive Strategy Session"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attendees</label>
                  <input
                    type="number"
                    min={1}
                    max={bookingModalSpace.capacity}
                    value={bookingAttendees}
                    onChange={(e) => setBookingAttendees(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Time Window & Format Switcher */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Booking Time Window</span>
                  </span>
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleToggleTimeFormat("12h")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        timeFormat === "12h"
                          ? "bg-indigo-600 text-white font-semibold shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      12H (AM/PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleTimeFormat("24h")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        timeFormat === "24h"
                          ? "bg-indigo-600 text-white font-semibold shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      24H (Military)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                    >
                      {STANDARD_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTimeOption(t, timeFormat)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 text-[11px] font-medium">End Time</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
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
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>Selected Window:</span>
                    <strong className="text-indigo-600 dark:text-indigo-300 font-mono">{formatInterval(startTime, endTime, timeFormat)}</strong>
                  </span>
                  {timeFormat === "24h" && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                      [Mil: {toMilitaryCallout(startTime)} &ndash; {toMilitaryCallout(endTime)}]
                    </span>
                  )}
                </div>
              </div>

              {/* Space Capabilities Notice */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Equipped Room Capabilities</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {bookingModalSpace.parsedCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Setup Instructions</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Teams room video link needed, whiteboard markers requested..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                ></textarea>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookingModalSpace(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={bookingSubmitting}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200 text-slate-900 dark:text-slate-100">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Reservations</h3>
                </div>
                <button
                  onClick={() => setShowMyBookings(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
                {allReservations.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                    No active reservations recorded.
                  </div>
                ) : (
                  allReservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{res.number}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            res.status === "confirmed"
                              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                              : res.status === "checked_in"
                              ? "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{res.subject}</div>

                      <div className="text-slate-500 dark:text-slate-400">
                        Space: <strong className="text-slate-800 dark:text-slate-200">{res.space?.name}</strong> ({res.space?.spaceNumber})
                      </div>

                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {formatReservationWindow(res.startTime, res.endTime, timeFormat)}
                        </span>
                      </div>

                      {res.reservedBy && (
                        <div className="text-slate-500 dark:text-slate-400">
                          Booked by: <span className="text-slate-800 dark:text-slate-200 font-medium">{res.reservedBy.name}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end gap-2">
                        {res.status === "confirmed" && (
                          <button
                            onClick={() => handleCheckIn(res.id)}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 font-medium cursor-pointer transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {res.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-300 font-medium cursor-pointer transition-colors"
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
              className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            >
              Close
            </button>
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
