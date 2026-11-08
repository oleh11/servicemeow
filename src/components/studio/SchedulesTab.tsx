"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Calculator,
  Sparkles,
} from "lucide-react";

export function SchedulesTab() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState("8x5");
  const [timezone, setTimezone] = useState("America/New_York");
  const [validFrom, setValidFrom] = useState("08:00");
  const [validTo, setValidTo] = useState("17:00");
  const [excludeWeekends, setExcludeWeekends] = useState(true);

  // Interactive Breach Calculator
  const [calcScheduleId, setCalcScheduleId] = useState("");
  const [calcDurationHours, setCalcDurationHours] = useState(4);
  const [calcResult, setCalcResult] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/schedules");
      if (res.ok) {
        const json = await res.json();
        const list = json.result || [];
        setSchedules(list);
        if (list.length > 0 && !calcScheduleId) {
          setCalcScheduleId(list[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading schedules:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setType("8x5");
    setTimezone("America/New_York");
    setValidFrom("08:00");
    setValidTo("17:00");
    setExcludeWeekends(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (sched: any) => {
    setEditingId(sched.id);
    setName(sched.name);
    setType(sched.type || "8x5");
    setTimezone(sched.timezone || "America/New_York");
    setValidFrom(sched.validFrom || "08:00");
    setValidTo(sched.validTo || "17:00");
    setExcludeWeekends(sched.excludeWeekends ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        type,
        timezone,
        validFrom,
        validTo,
        excludeWeekends,
      };

      const url = editingId ? `/api/now/schedules/${editingId}` : "/api/now/schedules";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadSchedules();
      }
    } catch (e) {
      console.error("Error saving schedule:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Business Schedule?")) return;
    try {
      const res = await fetch(`/api/now/schedules/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadSchedules();
      }
    } catch (e) {
      console.error("Error deleting schedule:", e);
    }
  };

  const handleCalculateBreach = () => {
    const selected = schedules.find((s) => s.id === calcScheduleId);
    const now = new Date();
    if (!selected || selected.type === "24x7") {
      const breach = new Date(now.getTime() + calcDurationHours * 3600 * 1000);
      setCalcResult(`${breach.toLocaleString()} (24x7 calendar time)`);
      return;
    }

    // 8x5 simulation: 9 business hours per day
    const daysToAdd = Math.floor(calcDurationHours / 8);
    const remainderHours = calcDurationHours % 8;
    const projected = new Date(now.getTime() + (daysToAdd * 24 + remainderHours) * 3600 * 1000);

    // Skip weekend if landed on Saturday/Sunday
    if (projected.getDay() === 6) projected.setDate(projected.getDate() + 2);
    if (projected.getDay() === 0) projected.setDate(projected.getDate() + 1);

    setCalcResult(`${projected.toLocaleString()} (8x5 Business Hours Adjusted)`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--swiss-emerald)]" />
            <span>SLA Schedules & Business Calendars (cmn_schedule)</span>
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Define 8x5, 24x7, and custom business hours for SLA breach calculations, maintenance blackout periods, and CAB approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSchedules}
            className="p-2 border text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="sw-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Interactive SLA Breach Calculator Widget */}
      <div className="p-5 border bg-[var(--theme-accent-light)] space-y-3">
        <h3 className="sw-section-title flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-[var(--swiss-emerald)]" />
          <span>Interactive SLA Breach Simulator</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <select
            value={calcScheduleId}
            onChange={(e) => setCalcScheduleId(e.target.value)}
            className="sw-input px-3 py-2"
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={calcDurationHours}
              onChange={(e) => setCalcDurationHours(Number(e.target.value))}
              className="sw-input px-3 py-2 w-24"
            />
            <span className="text-[var(--theme-text-secondary)] font-medium">Target Hours SLA</span>
          </div>

          <button
            type="button"
            onClick={handleCalculateBreach}
            className="sw-btn-primary flex items-center justify-center gap-1.5 px-4 py-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Project Breach Deadline</span>
          </button>
        </div>

        {calcResult && (
          <div className="p-3 bg-[var(--theme-card-bg)] border text-xs font-mono text-[var(--swiss-emerald)] flex items-center gap-2">
            <strong>Projected Breach Deadline:</strong> {calcResult}
          </div>
        )}
      </div>

      {/* Grid of Schedules */}
      {schedules.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)] border border-dashed italic">
          No schedules defined. Click "New Schedule" to configure 8x5 or 24x7 calendars.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((sched) => (
            <div
              key={sched.id}
              className="p-5 border bg-[var(--theme-card-bg)] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">{sched.name}</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)]">
                    {sched.type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--theme-text-secondary)]">
                  <span>TZ: {sched.timezone}</span>
                </div>

                <div className="text-xs text-[var(--theme-text-secondary)] bg-[var(--theme-accent-light)] p-2.5 border space-y-1">
                  <div className="flex justify-between">
                    <span>Working Hours:</span>
                    <strong>
                      {sched.type === "24x7" ? "All Day (24 Hours)" : `${sched.validFrom} – ${sched.validTo}`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Exclude Weekends:</span>
                    <strong>{sched.excludeWeekends ? "Yes (Sat & Sun)" : "No"}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(sched)}
                  className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-emerald)] hover:bg-[var(--theme-accent-light)]"
                  title="Edit Schedule"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(sched.id)}
                  className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)] hover:bg-[var(--theme-accent-light)]"
                  title="Delete Schedule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--theme-card-bg)] border p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">
                {editingId ? "Edit Schedule" : "Create Business Schedule"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Schedule Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 8x5 North America Business Hours"
                  className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Schedule Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)]"
                  >
                    <option value="8x5">8x5 Standard Business Hours</option>
                    <option value="24x7">24x7 Continuous Global</option>
                    <option value="custom">Custom Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Timezone *</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)]"
                  >
                    <option value="America/New_York">America/New_York (US Eastern)</option>
                    <option value="America/Chicago">America/Chicago (US Central)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (US Pacific)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="UTC">UTC Universal</option>
                  </select>
                </div>
              </div>

              {type !== "24x7" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Start Time (Daily)</label>
                    <input
                      type="time"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">End Time (Daily)</label>
                    <input
                      type="time"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)]"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeWeekends}
                  onChange={(e) => setExcludeWeekends(e.target.checked)}
                  className="text-[var(--swiss-emerald)] focus:ring-[var(--swiss-emerald)]"
                />
                <span className="text-[var(--theme-text-primary)] font-semibold">
                  Exclude Saturdays & Sundays from SLA countdown
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border text-[var(--theme-text-secondary)] hover:bg-[var(--theme-accent-light)] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sw-btn-primary px-5 py-2"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
