"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  Shield,
  Tag,
  CheckCircle,
  Package,
} from "lucide-react";

interface SysApp {
  id: string;
  name: string;
  scope: string;
  version: string;
  description?: string;
  vendor?: string;
  active: boolean;
  icon: string;
  applicationMenus?: any[];
  createdAt: string;
  updatedAt: string;
}

export function ApplicationsTab() {
  const [apps, setApps] = useState<SysApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<SysApp | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("ServiceMeow");
  const [icon, setIcon] = useState("Box");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/apps");
      const data = await res.json();
      if (data.result) {
        setApps(data.result);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const openCreateModal = () => {
    setEditingApp(null);
    setName("");
    setScope("");
    setVersion("1.0.0");
    setDescription("");
    setVendor("ServiceMeow");
    setIcon("Box");
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (app: SysApp) => {
    setEditingApp(app);
    setName(app.name);
    setScope(app.scope);
    setVersion(app.version);
    setDescription(app.description || "");
    setVendor(app.vendor || "ServiceMeow");
    setIcon(app.icon || "Box");
    setActive(app.active);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingApp) {
      // Auto-suggest scope
      const suggested = "x_purr_" + val.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 16);
      setScope(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !scope) return;

    setSubmitting(true);
    try {
      if (editingApp) {
        const res = await fetch(`/api/now/apps/${editingApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            version,
            description,
            vendor,
            icon,
            active,
          }),
        });
        if (res.ok) {
          showToast(`Application '${name}' updated & captured in active update set!`);
          setModalOpen(false);
          await fetchApps();
        }
      } else {
        const res = await fetch("/api/now/apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            scope,
            version,
            description,
            vendor,
            icon,
          }),
        });
        if (res.ok) {
          showToast(`Application '${name}' created & captured in active update set!`);
          setModalOpen(false);
          await fetchApps();
        }
      }
    } catch (err) {
      console.error("Failed to save application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete application '${appName}'? This will also remove associated navigation menus.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/now/apps/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Application '${appName}' deleted & captured in active update set.`);
        await fetchApps();
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  const filtered = apps.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.scope.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-500" />
            Custom Applications (sys_app)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage application scopes, package boundaries, versioning, and auto-generated navigation
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={fetchApps}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Application</span>
          </button>
        </div>
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading applications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Box className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Applications Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create custom scoped applications to organize tables, business rules, client scripts, and navigation menus.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Application</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                          {app.scope}
                        </span>
                        <span className="text-[10px] text-slate-400">v{app.version}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.active
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {app.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {app.description || "No description provided for this scoped application."}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Vendor: <strong className="text-slate-700 dark:text-slate-300">{app.vendor || "ServiceMeow"}</strong></span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Layers className="w-3 h-3" />
                    {app.applicationMenus?.length || 0} menu(s)
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href="/studio?tab=navigation"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 flex items-center gap-1"
                >
                  <span>Navigation Menus</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    title="Edit Application"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(app.id, app.name)}
                    className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-500" />
                {editingApp ? "Edit Application" : "Create New Custom Application"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Application Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Care Management, Facilities Workspace"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scope Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingApp}
                    placeholder="x_purr_appname"
                    value={scope}
                    onChange={(e) => setScope(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain the purpose and capabilities of this custom application..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Active in platform</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Update Set Tracking:</strong> Creating or modifying this application will be recorded in the current active Update Set automatically.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name || !scope}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingApp ? "Save Changes" : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
