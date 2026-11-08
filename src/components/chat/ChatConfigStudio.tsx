"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Settings,
  Sparkles,
  Layers,
  Save,
  Clock,
  Users,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface LiveChatQueue {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  priority: number;
  assignmentGroupId?: string;
  assignmentGroup?: { id: string; name: string };
  maxWaitSeconds: number;
  welcomeMessage: string;
  offlineMessage: string;
  _count?: { channels: number };
}

interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  message: string;
  category: string;
  active: boolean;
}

interface LiveChatConfig {
  id: string;
  enabled: boolean;
  maxConcurrentChatsPerAgent: number;
  autoAbandonTimeoutSeconds: number;
  soundNotifications: boolean;
  operatingHoursSchedule?: string;
}

interface GroupOption {
  id: string;
  name: string;
}

export function ChatConfigStudio() {
  const [activeTab, setActiveTab] = useState<"queues" | "canned" | "settings">("queues");
  const [queues, setQueues] = useState<LiveChatQueue[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [config, setConfig] = useState<LiveChatConfig>({
    id: "global",
    enabled: true,
    maxConcurrentChatsPerAgent: 3,
    autoAbandonTimeoutSeconds: 600,
    soundNotifications: true,
    operatingHoursSchedule: "24x7 Enterprise Support",
  });
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal states
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Partial<LiveChatQueue> | null>(null);

  const [cannedModalOpen, setCannedModalOpen] = useState(false);
  const [editingCanned, setEditingCanned] = useState<Partial<CannedResponse> | null>(null);

  // Load configuration
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/chat/config");
      if (res.ok) {
        const data = await res.json();
        setQueues(data.queues || []);
        setCannedResponses(data.cannedResponses || []);
        if (data.config) setConfig(data.config);
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to load chat config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save Global Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "config",
          data: config,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  // Save / Update Queue
  const handleSaveQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueue?.name || !editingQueue?.code) return;

    try {
      const isUpdate = Boolean(editingQueue.id);
      const res = await fetch("/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "queue",
          action: isUpdate ? "update" : "create",
          id: editingQueue.id,
          data: editingQueue,
        }),
      });

      if (res.ok) {
        setQueueModalOpen(false);
        setEditingQueue(null);
        await loadConfig();
      }
    } catch (err) {
      console.error("Failed to save queue:", err);
    }
  };

  // Delete Queue
  const handleDeleteQueue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this queue?")) return;
    try {
      const res = await fetch("/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "queue", action: "delete", id }),
      });
      if (res.ok) {
        await loadConfig();
      }
    } catch (err) {
      console.error("Failed to delete queue:", err);
    }
  };

  // Save / Update Canned Response
  const handleSaveCanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCanned?.shortcut || !editingCanned?.message) return;

    try {
      const isUpdate = Boolean(editingCanned.id);
      const res = await fetch("/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "canned",
          action: isUpdate ? "update" : "create",
          id: editingCanned.id,
          data: editingCanned,
        }),
      });

      if (res.ok) {
        setCannedModalOpen(false);
        setEditingCanned(null);
        await loadConfig();
      }
    } catch (err) {
      console.error("Failed to save canned response:", err);
    }
  };

  // Delete Canned Response
  const handleDeleteCanned = async (id: string) => {
    if (!confirm("Are you sure you want to delete this canned response?")) return;
    try {
      const res = await fetch("/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "canned", action: "delete", id }),
      });
      if (res.ok) {
        await loadConfig();
      }
    } catch (err) {
      console.error("Failed to delete canned response:", err);
    }
  };

  const activeQueuesCount = queues.filter((q) => q.active).length;
  const activeCannedCount = cannedResponses.filter((c) => c.active).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-[var(--theme-text-primary)]">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-card-border)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[var(--swiss-red)] text-white font-mono text-[10px] font-bold">
              SYS_LIVE_CHAT
            </span>
            <span className="text-xs font-mono text-[var(--theme-text-secondary)]">
              Omnichannel Support & Dispatch Engine
            </span>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
            Live Agent Chat Configuration
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
            Configure customer intake queues, assignment routing groups, agent capacity limits, and /shortcut canned macros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/workspace/chat"
            className="sw-btn-primary px-3.5 py-2 text-xs flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Launch Agent Cockpit</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={loadConfig}
            className="p-2 sw-panel hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Live KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sw-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-secondary)]">
            01 / Intake Queues
          </div>
          <div className="text-xl font-bold font-mono text-[var(--theme-text-primary)] mt-1">
            {activeQueuesCount} <span className="text-xs text-[var(--theme-text-secondary)]">/ {queues.length} Active</span>
          </div>
        </div>
        <div className="p-4 sw-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-secondary)]">
            02 / Canned Macros
          </div>
          <div className="text-xl font-bold font-mono text-[var(--theme-text-primary)] mt-1">
            {activeCannedCount} <span className="text-xs text-[var(--theme-text-secondary)]">Shortcuts</span>
          </div>
        </div>
        <div className="p-4 sw-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-secondary)]">
            03 / Agent Capacity
          </div>
          <div className="text-xl font-bold font-mono text-[var(--theme-text-primary)] mt-1">
            {config.maxConcurrentChatsPerAgent} <span className="text-xs text-[var(--theme-text-secondary)]">Chats / Fulfiller</span>
          </div>
        </div>
        <div className="p-4 sw-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-secondary)]">
            04 / Portal Widget
          </div>
          <div className="text-xl font-bold font-mono mt-1 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 ${config.enabled ? "bg-[var(--swiss-emerald)]" : "bg-[var(--theme-card-border)]"}`} />
            <span className={config.enabled ? "text-[var(--swiss-emerald)]" : "text-[var(--theme-text-secondary)]"}>
              {config.enabled ? "ONLINE" : "DISABLED"}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--theme-card-border)] text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("queues")}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "queues"
              ? "border-[var(--swiss-red)] text-[var(--theme-text-primary)] bg-[var(--theme-card-bg)]"
              : "border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
          }`}
        >
          <Layers className="w-4 h-4 text-[var(--swiss-red)]" />
          <span>Support Queues ({queues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("canned")}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "canned"
              ? "border-[var(--swiss-red)] text-[var(--theme-text-primary)] bg-[var(--theme-card-bg)]"
              : "border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-[var(--swiss-amber)]" />
          <span>Canned Macros ({cannedResponses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "settings"
              ? "border-[var(--swiss-red)] text-[var(--theme-text-primary)] bg-[var(--theme-card-bg)]"
              : "border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
          }`}
        >
          <Settings className="w-4 h-4 text-[var(--theme-text-primary)]" />
          <span>Global Routing & Capacity</span>
        </button>
      </div>

      {/* TAB 1: Support Queues */}
      {activeTab === "queues" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--theme-text-secondary)]">
              Queues route portal callers to designated fulfiller assignment groups with custom wait thresholds.
            </p>
            <button
              onClick={() => {
                setEditingQueue({
                  name: "",
                  code: "",
                  description: "",
                  active: true,
                  priority: 1,
                  maxWaitSeconds: 300,
                  welcomeMessage: "Hello! An ITIL specialist will assist you shortly.",
                  offlineMessage: "Live support is currently offline.",
                });
                setQueueModalOpen(true);
              }}
              className="sw-btn-primary px-3.5 py-2 text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Support Queue</span>
            </button>
          </div>

          <div className="sw-panel overflow-x-auto">
            <table className="sw-table w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--theme-card-bg)] border-b border-[var(--theme-card-border)] font-bold uppercase text-[var(--theme-text-secondary)]">
                <tr>
                  <th className="p-3.5">Queue Name</th>
                  <th className="p-3.5">System Code</th>
                  <th className="p-3.5">Assignment Group</th>
                  <th className="p-3.5">Max Wait</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-card-border)]">
                {queues.map((q) => (
                  <tr key={q.id} className="hover:bg-[var(--theme-accent-light)] transition-colors">
                    <td className="p-3.5 font-bold text-[var(--theme-text-primary)]">
                      {q.name}
                    </td>
                    <td className="p-3.5 font-mono text-[var(--theme-text-secondary)]">
                      {q.code}
                    </td>
                    <td className="p-3.5">
                      {q.assignmentGroup ? (
                        <span className="px-2 py-0.5 bg-[var(--theme-accent-light)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]">
                          {q.assignmentGroup.name}
                        </span>
                      ) : (
                        <span className="text-[var(--theme-text-secondary)]">All Available ITIL</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[var(--theme-text-primary)]">
                      {q.maxWaitSeconds}s
                    </td>
                    <td className="p-3.5 font-mono text-[var(--theme-text-primary)]">
                      #{q.priority}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          q.active
                            ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                            : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] border border-[var(--theme-card-border)]"
                        }`}
                      >
                        {q.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingQueue(q);
                          setQueueModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                        title="Edit Queue"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteQueue(q.id)}
                        className="p-1.5 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)]"
                        title="Delete Queue"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Canned Response Macros */}
      {activeTab === "canned" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--theme-text-secondary)]">
              Canned responses allow agents to insert standardized greetings, diagnostics, and closing messages with{" "}
              <code className="text-[var(--swiss-red)] font-mono">/shortcuts</code> and variables like{" "}
              <code className="text-[var(--swiss-amber)] font-mono">{"{{caller_name}}"}</code> or{" "}
              <code className="text-[var(--swiss-amber)] font-mono">{"{{agent_name}}"}</code>.
            </p>
            <button
              onClick={() => {
                setEditingCanned({
                  shortcut: "/",
                  title: "",
                  message: "",
                  category: "general",
                  active: true,
                });
                setCannedModalOpen(true);
              }}
              className="sw-btn-primary px-3.5 py-2 text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Canned Macro</span>
            </button>
          </div>

          <div className="sw-panel overflow-x-auto">
            <table className="sw-table w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--theme-card-bg)] border-b border-[var(--theme-card-border)] font-bold uppercase text-[var(--theme-text-secondary)]">
                <tr>
                  <th className="p-3.5">Shortcut</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Message Preview</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-card-border)]">
                {cannedResponses.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--theme-accent-light)] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[var(--swiss-red)]">
                      {c.shortcut}
                    </td>
                    <td className="p-3.5 font-bold text-[var(--theme-text-primary)]">
                      {c.title}
                    </td>
                    <td className="p-3.5 uppercase text-[10px] text-[var(--theme-text-secondary)] font-mono">
                      {c.category}
                    </td>
                    <td className="p-3.5 max-w-md truncate text-[var(--theme-text-primary)]">
                      {c.message}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.active
                            ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                            : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] border border-[var(--theme-card-border)]"
                        }`}
                      >
                        {c.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingCanned(c);
                          setCannedModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                        title="Edit Macro"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteCanned(c.id)}
                        className="p-1.5 hover:bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)]"
                        title="Delete Macro"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Global Routing & Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
          <div className="border border-[var(--theme-card-border)] p-6 space-y-5 bg-[var(--theme-card-bg)]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text-primary)] border-b border-[var(--theme-card-border)] pb-3">
              Fulfiller Dispatch & Concurrency Limits
            </h3>

            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase text-[var(--theme-text-primary)] block">
                  Enable Live Agent Chat
                </label>
                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                  Controls whether the floating chat widget is visible on the Self-Service Portal.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 accent-[var(--swiss-red)]"
              />
            </div>

            {/* Max Concurrent Chats */}
            <div>
              <label className="text-xs font-bold uppercase text-[var(--theme-text-primary)] block mb-1">
                Max Concurrent Chats per Agent: {config.maxConcurrentChatsPerAgent}
              </label>
              <span className="text-[11px] text-[var(--theme-text-secondary)] block mb-2">
                Prevents fulfiller overload. Incoming chats will hold in queue once an agent hits capacity.
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={config.maxConcurrentChatsPerAgent}
                onChange={(e) =>
                  setConfig({ ...config, maxConcurrentChatsPerAgent: Number(e.target.value) })
                }
                className="w-full accent-[var(--swiss-red)]"
              />
            </div>

            {/* Inactivity Abandon Timeout */}
            <div>
              <label className="text-xs font-bold uppercase text-[var(--theme-text-primary)] block mb-1">
                Auto-Abandon Inactivity Timeout (Seconds)
              </label>
              <input
                type="number"
                value={config.autoAbandonTimeoutSeconds}
                onChange={(e) =>
                  setConfig({ ...config, autoAbandonTimeoutSeconds: Number(e.target.value) })
                }
                className="w-full p-2.5 text-xs bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
              />
            </div>

            {/* Sound Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase text-[var(--theme-text-primary)] block">
                  Audible Queue Alerts
                </label>
                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                  Plays audio chime in Fulfiller Workspace when a new caller enters the queue.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.soundNotifications}
                onChange={(e) => setConfig({ ...config, soundNotifications: e.target.checked })}
                className="w-4 h-4 accent-[var(--swiss-red)]"
              />
            </div>

            {/* Operating Schedule */}
            <div>
              <label className="text-xs font-bold uppercase text-[var(--theme-text-primary)] block mb-1">
                Operating Schedule Coverage
              </label>
              <input
                type="text"
                value={config.operatingHoursSchedule || ""}
                onChange={(e) =>
                  setConfig({ ...config, operatingHoursSchedule: e.target.value })
                }
                placeholder="e.g. 24x7 Enterprise Support"
                className="w-full p-2.5 text-xs bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="sw-btn-primary px-6 py-2.5 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Chat Settings</span>
            </button>
            {saveSuccess && (
              <span className="text-xs text-[var(--swiss-emerald)] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration Saved</span>
              </span>
            )}
          </div>
        </form>
      )}

      {/* Queue Modal */}
      {queueModalOpen && editingQueue && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="sw-panel-strong w-full max-w-lg p-6 space-y-4 text-[var(--theme-text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                {editingQueue.id ? "Edit Support Queue" : "New Support Queue"}
              </h3>
              <button onClick={() => setQueueModalOpen(false)}>
                <X className="w-4 h-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]" />
              </button>
            </div>

            <form onSubmit={handleSaveQueue} className="space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                  Queue Name
                </label>
                <input
                  type="text"
                  required
                  value={editingQueue.name || ""}
                  onChange={(e) => setEditingQueue({ ...editingQueue, name: e.target.value })}
                  className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                  Unique Code
                </label>
                <input
                  type="text"
                  required
                  value={editingQueue.code || ""}
                  onChange={(e) =>
                    setEditingQueue({
                      ...editingQueue,
                      code: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="w-full p-2 font-mono bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                  Assignment Group
                </label>
                <select
                  value={editingQueue.assignmentGroupId || ""}
                  onChange={(e) =>
                    setEditingQueue({
                      ...editingQueue,
                      assignmentGroupId: e.target.value || undefined,
                    })
                  }
                  className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                >
                  <option value="">Any Available ITIL Agent</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                    Max Wait (Seconds)
                  </label>
                  <input
                    type="number"
                    value={editingQueue.maxWaitSeconds || 300}
                    onChange={(e) =>
                      setEditingQueue({
                        ...editingQueue,
                        maxWaitSeconds: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={editingQueue.priority || 1}
                    onChange={(e) =>
                      setEditingQueue({
                        ...editingQueue,
                        priority: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                  Automated Welcome Greeting
                </label>
                <textarea
                  rows={2}
                  value={editingQueue.welcomeMessage || ""}
                  onChange={(e) =>
                    setEditingQueue({ ...editingQueue, welcomeMessage: e.target.value })
                  }
                  className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="queueActive"
                  checked={editingQueue.active ?? true}
                  onChange={(e) =>
                    setEditingQueue({ ...editingQueue, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[var(--swiss-red)]"
                />
                <label htmlFor="queueActive" className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)]">
                  Queue Active
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setQueueModalOpen(false)}
                  className="px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sw-btn-primary px-5 py-2 uppercase text-xs"
                >
                  Save Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canned Macro Modal */}
      {cannedModalOpen && editingCanned && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="sw-panel-strong w-full max-w-lg p-6 space-y-4 text-[var(--theme-text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                {editingCanned.id ? "Edit Canned Macro" : "New Canned Macro"}
              </h3>
              <button onClick={() => setCannedModalOpen(false)}>
                <X className="w-4 h-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]" />
              </button>
            </div>

            <form onSubmit={handleSaveCanned} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                    Shortcut (e.g. /greet)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCanned.shortcut || "/"}
                    onChange={(e) =>
                      setEditingCanned({ ...editingCanned, shortcut: e.target.value })
                    }
                    className="w-full p-2 font-mono bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                    Category
                  </label>
                  <select
                    value={editingCanned.category || "general"}
                    onChange={(e) =>
                      setEditingCanned({ ...editingCanned, category: e.target.value })
                    }
                    className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                  >
                    <option value="general">General</option>
                    <option value="troubleshooting">Troubleshooting</option>
                    <option value="closing">Closing / Wrap Up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingCanned.title || ""}
                  onChange={(e) =>
                    setEditingCanned({ ...editingCanned, title: e.target.value })
                  }
                  placeholder="e.g. Friendly Initial Greeting"
                  className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)]"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)] block mb-1">
                  Message Body (Supports {"{{caller_name}}"}, {"{{agent_name}}"}, {"{{chat_number}}"})
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingCanned.message || ""}
                  onChange={(e) =>
                    setEditingCanned({ ...editingCanned, message: e.target.value })
                  }
                  placeholder="Template text inserted when agent triggers macro..."
                  className="w-full p-2 bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cannedActive"
                  checked={editingCanned.active ?? true}
                  onChange={(e) =>
                    setEditingCanned({ ...editingCanned, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[var(--swiss-red)]"
                />
                <label htmlFor="cannedActive" className="font-bold uppercase text-[11px] text-[var(--theme-text-primary)]">
                  Macro Active
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--theme-card-border)]">
                <button
                  type="button"
                  onClick={() => setCannedModalOpen(false)}
                  className="px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sw-btn-primary px-5 py-2 uppercase text-xs"
                >
                  Save Macro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
