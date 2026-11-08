"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Code2,
  CheckCircle,
} from "lucide-react";

const DEFAULT_SCHEDULED_SCRIPT = `// Scheduled Job (sysauto_script) Sandbox Execution
// gs (GlideSystem) and db (relational database) are available.
gs.info("Executing scheduled maintenance job: auto-close resolved incidents older than 7 days.");
`;

export function ScheduledJobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [interval, setInterval] = useState("daily");
  const [runAs, setRunAs] = useState("system");
  const [script, setScript] = useState(DEFAULT_SCHEDULED_SCRIPT);
  const [active, setActive] = useState(true);

  // Execution state
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/scheduled-jobs");
      if (res.ok) {
        const json = await res.json();
        setJobs(json.result || []);
      }
    } catch (e) {
      console.error("Error loading scheduled jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setInterval("daily");
    setRunAs("system");
    setScript(DEFAULT_SCHEDULED_SCRIPT);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (job: any) => {
    setEditingId(job.id);
    setName(job.name);
    setInterval(job.interval || "daily");
    setRunAs(job.runAs || "system");
    setScript(job.script || DEFAULT_SCHEDULED_SCRIPT);
    setActive(job.active ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        interval,
        runAs,
        script,
        active,
      };

      const url = editingId ? `/api/now/scheduled-jobs/${editingId}` : "/api/now/scheduled-jobs";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadJobs();
      }
    } catch (e) {
      console.error("Error saving scheduled job:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Scheduled Job?")) return;
    try {
      const res = await fetch(`/api/now/scheduled-jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadJobs();
      }
    } catch (e) {
      console.error("Error deleting scheduled job:", e);
    }
  };

  const handleExecuteNow = async (id: string, jobName: string) => {
    setExecutingId(id);
    setFeedbackMsg("");
    try {
      const res = await fetch(`/api/now/scheduled-jobs/${id}/run`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        setFeedbackMsg(`Scheduled Job '${jobName}' executed successfully!`);
        setTimeout(() => setFeedbackMsg(""), 3500);
        await loadJobs();
      } else {
        setFeedbackMsg(`Execution error: ${json.error}`);
      }
    } catch (e: any) {
      setFeedbackMsg(`Execution failed: ${e.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--swiss-amber)]" />
            <span>Scheduled Jobs (sysauto_script)</span>
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Automate recurring platform tasks, audit cleanup, data sanitization, and background processing with the sys_trigger daemon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadJobs}
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
            <span>New Scheduled Job</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-[var(--theme-accent-light)] border border-[var(--swiss-emerald)] text-[var(--swiss-emerald)] text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid of Jobs */}
      {jobs.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)] border border-dashed italic">
          No Scheduled Jobs configured. Click "New Scheduled Job" to define periodic scripts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 border bg-[var(--theme-card-bg)] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">{job.name}</h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                      job.active ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)]" : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                    }`}
                  >
                    {job.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--swiss-amber)]">
                  <span className="bg-[var(--theme-accent-light)] px-2 py-0.5 border border-[var(--swiss-amber)]">
                    Frequency: {job.interval}
                  </span>
                  <span className="text-[var(--theme-text-secondary)]">•</span>
                  <span className="text-[var(--theme-text-secondary)]">Run As: {job.runAs || "system"}</span>
                </div>

                <div className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                  Last Run: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "Never"}
                </div>

                <pre className="text-[10px] font-mono bg-[var(--theme-accent-light)] p-2 text-[var(--theme-text-primary)] line-clamp-3">
                  {job.script}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-3 border-t text-xs">
                <button
                  type="button"
                  onClick={() => handleExecuteNow(job.id, job.name)}
                  disabled={executingId === job.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[var(--theme-accent-light)] text-[var(--swiss-amber)] hover:bg-[var(--theme-accent-light)] border border-[var(--swiss-amber)] font-semibold text-[11px]"
                >
                  <Play className={`w-3 h-3 ${executingId === job.id ? "animate-spin" : ""}`} />
                  <span>{executingId === job.id ? "Running..." : "Execute Now"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(job)}
                    className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-amber)] hover:bg-[var(--theme-accent-light)]"
                    title="Edit Job"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(job.id)}
                    className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)] hover:bg-[var(--theme-accent-light)]"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[var(--theme-card-bg)] border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">
                {editingId ? "Edit Scheduled Job" : "Create Scheduled Job"}
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
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Job Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daily Incident Auto-Close"
                  className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-amber)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Run Frequency *</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-amber)]"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Run As User</label>
                  <input
                    type="text"
                    value={runAs}
                    onChange={(e) => setRunAs(e.target.value)}
                    placeholder="system / admin"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-amber)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[var(--swiss-amber)]" />
                    <span>Script Sandbox</span>
                  </label>
                  <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">gs and db available</span>
                </div>
                <textarea
                  rows={8}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:border-neutral-500 w-full font-mono text-xs p-3"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="text-[var(--swiss-amber)] focus:ring-[var(--swiss-amber)]"
                />
                <span className="text-[var(--theme-text-primary)] font-semibold">Active & Armed in Scheduler</span>
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
                  Save Scheduled Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
