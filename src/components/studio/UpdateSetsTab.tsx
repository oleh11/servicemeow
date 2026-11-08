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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--theme-page-bg)] p-4 border border-[var(--theme-card-border)]">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--theme-text-primary)]" />
            <h2 className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight">
              Update Sets Engine (sys_update_set)
            </h2>
          </div>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Capture configuration changes, package application customizations, and export/import across environments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="sw-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Update Set</span>
          </button>
          <button
            onClick={() => setNewModalOpen(true)}
            className="sw-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Update Set</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-[var(--theme-accent-light)] border border-[var(--swiss-emerald)] text-[var(--swiss-emerald)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--theme-text-primary)]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Grid: Update Set Selector & Changes Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Update Set Selector */}
        <div className="bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-4 space-y-3">
          <h3 className="sw-section-title flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--theme-text-primary)]" />
            <span>All Update Sets ({updateSets.length})</span>
          </h3>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {updateSets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSetId(s.id)}
                className={`w-full text-left p-3 text-xs transition-colors border flex flex-col gap-1 ${
                  selectedSetId === s.id
                    ? "bg-[var(--theme-card-bg)] border-[var(--theme-text-primary)] text-[var(--theme-text-primary)]"
                    : "bg-[var(--theme-page-bg)] border-[var(--theme-card-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent-light)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{s.name}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                      s.state === "in_progress"
                        ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)] animate-pulse"
                        : s.state === "committed"
                        ? "bg-[var(--theme-text-primary)] text-[var(--theme-page-bg)] border border-[var(--theme-text-primary)]"
                        : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                    }`}
                  >
                    {s.state}
                  </span>
                </div>
                {s.description && (
                  <p className="text-[11px] text-[var(--theme-text-secondary)] line-clamp-1">{s.description}</p>
                )}
                <div className="text-[10px] text-[var(--theme-text-secondary)] flex justify-between pt-1 border-t border-[var(--theme-card-border)]">
                  <span>Created {new Date(s.createdAt).toLocaleDateString()}</span>
                  <span>{JSON.parse(s.payloadJson || "[]").length} changes</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Update Set Manifest & Export Actions */}
        <div className="lg:col-span-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] p-5 space-y-4">
          {activeSet ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--theme-card-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--theme-text-primary)]">{activeSet.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                        activeSet.state === "in_progress"
                          ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                          : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                      }`}
                    >
                      {activeSet.state}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{activeSet.description || "No description provided."}</p>
                </div>

                <div className="flex items-center gap-2">
                  {activeSet.state !== "in_progress" && (
                    <button
                      onClick={() => handleMakeActive(activeSet.id)}
                      className="sw-btn px-2.5 py-1.5 text-xs"
                    >
                      Make Active
                    </button>
                  )}
                  <button
                    onClick={() => handleExport("json")}
                    className="sw-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    title="Export as JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--swiss-blue)]" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => handleExport("xml")}
                    className="sw-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    title="Export as XML"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--theme-text-primary)]" />
                    <span>Export XML</span>
                  </button>
                </div>
              </div>

              {/* Changes Captured Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                    Captured Configuration Records ({changesList.length})
                  </h4>
                  <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">sys_update_set payload</span>
                </div>

                {changesList.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)] italic sw-panel">
                    No configuration changes recorded yet in this update set. Modifications to Client Scripts, UI Policies, or Business Rules will be automatically tracked here.
                  </div>
                ) : (
                  <div className="sw-panel overflow-hidden">
                    <table className="sw-table w-full text-left text-xs text-[var(--theme-text-primary)]">
                      <thead className="bg-[var(--theme-card-bg)] text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] border-b border-[var(--theme-card-border)]">
                        <tr>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Action</th>
                          <th className="p-2.5">Record Name</th>
                          <th className="p-2.5 text-right">Recorded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--theme-card-border)]">
                        {changesList.map((c, i) => (
                          <tr key={c.id || i} className="hover:bg-[var(--theme-accent-light)]">
                            <td className="p-2.5 font-mono text-[var(--swiss-emerald)] text-[11px]">{c.type}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                                  c.action === "insert"
                                    ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                                    : c.action === "update"
                                    ? "bg-[var(--theme-accent-light)] text-[var(--swiss-blue)] border border-[var(--swiss-blue)]"
                                    : "bg-[var(--theme-accent-light)] text-[var(--swiss-red)] border border-[var(--swiss-red)]"
                                }`}
                              >
                                {c.action}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-[var(--theme-text-primary)]">{c.name}</td>
                            <td className="p-2.5 text-right text-[var(--theme-text-secondary)] font-mono text-[11px]">
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
            <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)] italic">
              Select or create an update set to view its manifest.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Update Set */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="sw-panel-strong max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div className="flex items-center gap-2 text-[var(--theme-text-primary)] font-bold text-sm">
                <Package className="w-4 h-4 text-[var(--theme-text-primary)]" />
                <span>Create New Update Set</span>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUpdateSet} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">Update Set Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Incident Enhancements v1.2"
                  className="sw-input w-full px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summary of release items and scope..."
                  className="sw-input w-full p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="sw-btn px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newSaving}
                  className="sw-btn-primary px-3 py-1.5 text-xs"
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="sw-panel-strong max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div className="flex items-center gap-2 text-[var(--theme-text-primary)] font-bold text-sm">
                <Upload className="w-4 h-4 text-[var(--theme-text-primary)]" />
                <span>Import & Commit Update Set (XML / JSON)</span>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">
                  Paste Exported XML or JSON Payload:
                </label>
                <textarea
                  rows={8}
                  value={importPayload}
                  onChange={(e) => setImportPayload(e.target.value)}
                  placeholder="<sys_update_set>... or { sys_update_set: { ... } }"
                  className="bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:border-neutral-500 w-full p-3 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  disabled={!importPayload.trim()}
                  className="sw-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-[var(--swiss-blue)]" />
                  <span>Preview Payload</span>
                </button>

                {previewData && (
                  <span className="text-xs font-mono text-[var(--swiss-emerald)]">
                    Found {previewData.totalChanges} changes ({previewData.name})
                  </span>
                )}
              </div>

              {previewData && (
                <div className="p-3 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] space-y-2">
                  <div className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase">Preview Breakdown</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(previewData.typesCount || {}).map(([t, count]: any) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 sw-panel font-mono text-[var(--theme-text-primary)] text-[11px]"
                      >
                        {t}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="sw-btn px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={importing || !importPayload.trim()}
                  className="sw-btn-primary px-4 py-1.5 text-xs"
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
