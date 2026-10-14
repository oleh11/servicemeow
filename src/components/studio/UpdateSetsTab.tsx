"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  FileCode,
  Layers,
  RefreshCw,
  Eye,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export function UpdateSetsTab() {
  const [updateSets, setUpdateSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [activeSet, setActiveSet] = useState<any | null>(null);

  // New Update Set Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSaving, setNewSaving] = useState(false);

  // Import Update Set Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState("");
  const [importName, setImportName] = useState("Imported Customer Config");
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);

  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const loadUpdateSets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/update-sets");
      const data = await res.json();
      if (data.result) {
        setUpdateSets(data.result);
        const inProgress = data.result.find((s: any) => s.state === "in_progress");
        const defaultId = inProgress ? inProgress.id : data.result[0]?.id;
        if (!selectedSetId && defaultId) {
          setSelectedSetId(defaultId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdateSets();
  }, []);

  useEffect(() => {
    if (selectedSetId) {
      const found = updateSets.find((s) => s.id === selectedSetId);
      setActiveSet(found || null);
    }
  }, [selectedSetId, updateSets]);

  const handleCreateUpdateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newSaving) return;

    setNewSaving(true);
    try {
      const res = await fetch("/api/now/update-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          state: "in_progress",
        }),
      });
      const data = await res.json();
      if (data.result) {
        showToast(`Created & set active: '${newName}'`);
        setNewModalOpen(false);
        setNewName("");
        setNewDesc("");
        setSelectedSetId(data.result.id);
        await loadUpdateSets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNewSaving(false);
    }
  };

  const handleMakeActive = async (id: string) => {
    try {
      await fetch(`/api/now/update-sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "in_progress" }),
      });
      showToast("Update Set switched to in_progress (active)!");
      await loadUpdateSets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = (format: "json" | "xml") => {
    if (!activeSet) return;
    window.open(`/api/now/update-sets/${activeSet.id}/export?format=${format}`, "_blank");
  };

  const handlePreviewImport = async () => {
    if (!importPayload.trim()) return;
    try {
      const res = await fetch("/api/now/update-sets/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", payload: importPayload }),
      });
      const data = await res.json();
      if (data.result) {
        setPreviewData(data.result);
        if (data.result.name) setImportName(data.result.name);
      }
    } catch (e: any) {
      alert(`Preview error: ${e.message}`);
    }
  };

  const handleCommitImport = async () => {
    if (!importPayload.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/now/update-sets/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", name: importName, payload: importPayload }),
      });
      const data = await res.json();
      if (data.result) {
        showToast(`Committed Update Set with ${data.result.applied} changes applied!`);
        setImportModalOpen(false);
        setImportPayload("");
        setPreviewData(null);
        await loadUpdateSets();
      }
    } catch (e: any) {
      alert(`Commit error: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  let changesList: any[] = [];
  if (activeSet?.payloadJson) {
    try {
      changesList = JSON.parse(activeSet.payloadJson);
    } catch {
      changesList = [];
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Update Sets Engine (sys_update_set)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture configuration changes, package application customizations, and export/import across environments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition-colors border border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Update Set</span>
          </button>
          <button
            onClick={() => setNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Update Set</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Grid: Update Set Selector & Changes Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Update Set Selector */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Update Sets ({updateSets.length})</span>
          </h3>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {updateSets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSetId(s.id)}
                className={`w-full text-left p-3 rounded-lg text-xs transition-colors border flex flex-col gap-1 ${
                  selectedSetId === s.id
                    ? "bg-slate-900 border-emerald-500 text-white"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{s.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      s.state === "in_progress"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse"
                        : s.state === "committed"
                        ? "bg-purple-950 text-purple-300 border border-purple-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {s.state}
                  </span>
                </div>
                {s.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1">{s.description}</p>
                )}
                <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/40">
                  <span>Created {new Date(s.createdAt).toLocaleDateString()}</span>
                  <span>{JSON.parse(s.payloadJson || "[]").length} changes</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Update Set Manifest & Export Actions */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
          {activeSet ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{activeSet.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        activeSet.state === "in_progress"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {activeSet.state}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{activeSet.description || "No description provided."}</p>
                </div>

                <div className="flex items-center gap-2">
                  {activeSet.state !== "in_progress" && (
                    <button
                      onClick={() => handleMakeActive(activeSet.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-semibold border border-slate-700"
                    >
                      Make Active
                    </button>
                  )}
                  <button
                    onClick={() => handleExport("json")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition-colors border border-slate-700"
                    title="Export as JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => handleExport("xml")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition-colors border border-slate-700"
                    title="Export as XML"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export XML</span>
                  </button>
                </div>
              </div>

              {/* Changes Captured Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Captured Configuration Records ({changesList.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">sys_update_set payload</span>
                </div>

                {changesList.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500 italic bg-slate-900/40 rounded-lg border border-slate-800/80">
                    No configuration changes recorded yet in this update set. Modifications to Client Scripts, UI Policies, or Business Rules will be automatically tracked here.
                  </div>
                ) : (
                  <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Action</th>
                          <th className="p-2.5">Record Name</th>
                          <th className="p-2.5 text-right">Recorded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {changesList.map((c, i) => (
                          <tr key={c.id || i} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono text-emerald-400 text-[11px]">{c.type}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                  c.action === "insert"
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    : c.action === "update"
                                    ? "bg-blue-950 text-blue-300 border border-blue-800"
                                    : "bg-rose-950 text-rose-300 border border-rose-800"
                                }`}
                              >
                                {c.action}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-white">{c.name}</td>
                            <td className="p-2.5 text-right text-slate-500 font-mono text-[11px]">
                              {new Date(c.recordedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 italic">
              Select or create an update set to view its manifest.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Update Set */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Create New Update Set</span>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUpdateSet} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Update Set Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Incident Enhancements v1.2"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summary of release items and scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newSaving}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
                >
                  {newSaving ? "Creating..." : "Create & Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Update Set with Preview & Commit */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import & Commit Update Set (XML / JSON)</span>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Paste Exported XML or JSON Payload:
                </label>
                <textarea
                  rows={8}
                  value={importPayload}
                  onChange={(e) => setImportPayload(e.target.value)}
                  placeholder="<sys_update_set>... or { sys_update_set: { ... } }"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 font-mono text-xs text-emerald-300 focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  disabled={!importPayload.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Preview Payload</span>
                </button>

                {previewData && (
                  <span className="text-xs font-mono text-emerald-400">
                    Found {previewData.totalChanges} changes ({previewData.name})
                  </span>
                )}
              </div>

              {previewData && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Preview Breakdown</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(previewData.typesCount || {}).map(([t, count]: any) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300 text-[11px]"
                      >
                        {t}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={importing || !importPayload.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
                >
                  {importing ? "Committing..." : "Commit Update Set"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
