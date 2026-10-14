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
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Scheduled Jobs (sysauto_script)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate recurring platform tasks, audit cleanup, data sanitization, and background processing with the sys_trigger daemon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadJobs}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scheduled Job</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid of Jobs */}
      {jobs.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl italic">
          No Scheduled Jobs configured. Click "New Scheduled Job" to define periodic scripts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl border shadow-xs bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{job.name}</h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      job.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {job.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-amber-700">
                  <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Frequency: {job.interval}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">Run As: {job.runAs || "system"}</span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Last Run: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "Never"}
                </div>

                <pre className="text-[10px] font-mono bg-slate-50 p-2 rounded text-slate-700 line-clamp-3">
                  {job.script}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-3 border-t text-xs">
                <button
                  type="button"
                  onClick={() => handleExecuteNow(job.id, job.name)}
                  disabled={executingId === job.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold text-[11px]"
                >
                  <Play className={`w-3 h-3 ${executingId === job.id ? "animate-spin" : ""}`} />
                  <span>{executingId === job.id ? "Running..." : "Execute Now"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(job)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-100"
                    title="Edit Job"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(job.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-100"
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
          <div className="w-full max-w-xl bg-white rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? "Edit Scheduled Job" : "Create Scheduled Job"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daily Incident Auto-Close"
                  className="w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Run Frequency *</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-amber-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Run As User</label>
                  <input
                    type="text"
                    value={runAs}
                    onChange={(e) => setRunAs(e.target.value)}
                    placeholder="system / admin"
                    className="w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Script Sandbox</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">gs and db available</span>
                </div>
                <textarea
                  rows={8}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg p-3 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-slate-700 font-semibold">Active & Armed in Scheduler</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 shadow-xs"
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
