"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import {
  Package,
  Layers,
  Check,
  Plus,
  ExternalLink,
  ChevronDown,
  RotateCw,
  FolderGit2,
  FileCode,
} from "lucide-react";

interface UpdateSet {
  id: string;
  name: string;
  state: string;
  application: string;
  description?: string;
  isCurrent?: boolean;
  payloadJson?: string;
  updatedAt: string;
}

export function UpdateSetPicker() {
  const { currentUser } = useUser();
  const isAdmin = currentUser.role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [updateSets, setUpdateSets] = useState<UpdateSet[]>([]);
  const [activeSet, setActiveSet] = useState<UpdateSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newApp, setNewApp] = useState("global");
  const [apps, setApps] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUpdateSets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/now/update-sets");
      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        setUpdateSets(data.result);
        const current = data.result.find((s: UpdateSet) => s.isCurrent) ||
                        data.result.find((s: UpdateSet) => s.state === "in_progress") ||
                        data.result[0];
        setActiveSet(current || null);
      }
    } catch (err) {
      console.error("Failed to fetch update sets:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const res = await fetch("/api/now/apps");
      const data = await res.json();
      if (data.result) {
        setApps(data.result);
      }
    } catch {}
  };

  useEffect(() => {
    if (isAdmin) {
      loadUpdateSets();
      loadApps();
    }
  }, [isAdmin]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchSet = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/now/update-sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true, state: "in_progress" }),
      });
      if (res.ok) {
        await loadUpdateSets();
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to switch update set:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/now/update-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          application: newApp,
          state: "in_progress",
        }),
      });

      if (res.ok) {
        setNewName("");
        setNewDesc("");
        setShowCreateForm(false);
        await loadUpdateSets();
      }
    } catch (err) {
      console.error("Failed to create update set:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  // Count changes in active set
  let changeCount = 0;
  if (activeSet?.payloadJson) {
    try {
      const parsed = JSON.parse(activeSet.payloadJson);
      changeCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {}
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors shadow-2xs"
        title="Current Update Set & Application Scope"
      >
        <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="font-semibold max-w-[120px] sm:max-w-[160px] truncate">
          {activeSet ? activeSet.name : "Default"}
        </span>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
          {changeCount}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-84 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-amber-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Update Set & Application Scope
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  All schema, business rules, and script changes capture here
                </p>
              </div>
            </div>
            <button
              onClick={loadUpdateSets}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Refresh Update Sets"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Active Set Summary */}
          {activeSet && (
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                  Active Update Set
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {activeSet.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Scope: <strong className="text-slate-700 dark:text-slate-300">{activeSet.application || "global"}</strong></span>
                  <span>&bull;</span>
                  <span>State: <strong className="text-emerald-600">{activeSet.state}</strong></span>
                  <span>&bull;</span>
                  <span>{changeCount} changes</span>
                </div>
              </div>
              <Link
                href="/studio?tab=update_sets"
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 rounded bg-amber-500 text-white font-semibold text-[11px] hover:bg-amber-600 transition-colors flex items-center gap-1 shrink-0"
              >
                Inspect
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* In-Progress Sets List */}
          <div className="max-h-48 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Switch In-Progress Update Set
            </div>
            {updateSets
              .filter((s) => s.state === "in_progress")
              .map((s) => {
                const isSelected = activeSet?.id === s.id;
                let cCount = 0;
                try {
                  cCount = JSON.parse(s.payloadJson || "[]").length;
                } catch {}

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSwitchSet(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Scope: {s.application || "global"} &bull; {cCount} change(s)
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Create New Update Set Expander */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-800/30">
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Create New Update Set</span>
              </button>
            ) : (
              <form onSubmit={handleCreateSet} className="space-y-2 p-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  New Update Set
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Update Set Name (e.g., Sprint 15 Catalog Enhancements)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newApp}
                    onChange={(e) => setNewApp(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="global">Scope: Global</option>
                    {apps.map((a) => (
                      <option key={a.id} value={a.scope}>
                        Scope: {a.name} ({a.scope})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-2.5 py-1 rounded text-slate-500 hover:text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newName.trim()}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                  >
                    Create & Make Current
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Footer Links */}
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <Link
              href="/studio?tab=update_sets"
              onClick={() => setIsOpen(false)}
              className="hover:text-amber-600 dark:hover:text-amber-400 font-medium flex items-center gap-1"
            >
              <Package className="w-3 h-3" />
              Manage Sets
            </Link>
            <Link
              href="/studio?tab=apps"
              onClick={() => setIsOpen(false)}
              className="hover:text-amber-600 dark:hover:text-amber-400 font-medium flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
              Custom Applications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
