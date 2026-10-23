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
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-white">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-[10px] font-bold">
              SYS_LIVE_CHAT
            </span>
            <span className="text-xs font-mono text-slate-400">
              Omnichannel Support & Dispatch Engine
            </span>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">
            Live Agent Chat Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure customer intake queues, assignment routing groups, agent capacity limits, and /shortcut canned macros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/workspace/chat"
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Launch Agent Cockpit</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={loadConfig}
            className="p-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Live KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            01 / Intake Queues
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {activeQueuesCount} <span className="text-xs text-slate-500">/ {queues.length} Active</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            02 / Canned Macros
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {activeCannedCount} <span className="text-xs text-slate-500">Shortcuts</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            03 / Agent Capacity
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {config.maxConcurrentChatsPerAgent} <span className="text-xs text-slate-500">Chats / Fulfiller</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            04 / Portal Widget
          </div>
          <div className="text-xl font-bold font-mono mt-1 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${config.enabled ? "bg-green-500" : "bg-slate-500"}`} />
            <span className={config.enabled ? "text-green-400" : "text-slate-400"}>
              {config.enabled ? "ONLINE" : "DISABLED"}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("queues")}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "queues"
              ? "border-red-500 text-white bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4 text-red-500" />
          <span>Support Queues ({queues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("canned")}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "canned"
              ? "border-red-500 text-white bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Canned Macros ({cannedResponses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "settings"
              ? "border-red-500 text-white bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>Global Routing & Capacity</span>
        </button>
      </div>

      {/* TAB 1: Support Queues */}
      {activeTab === "queues" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
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
              className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Support Queue</span>
            </button>
          </div>

          <div className="border border-slate-800 bg-slate-900/60 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 font-bold uppercase text-slate-400">
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
              <tbody className="divide-y divide-slate-800/80">
                {queues.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      {q.name}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {q.code}
                    </td>
                    <td className="p-3.5">
                      {q.assignmentGroup ? (
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200">
                          {q.assignmentGroup.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">All Available ITIL</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {q.maxWaitSeconds}s
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      #{q.priority}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          q.active
                            ? "bg-green-950/80 text-green-300 border border-green-800"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
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
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit Queue"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteQueue(q.id)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400"
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
            <p className="text-xs text-slate-400">
              Canned responses allow agents to insert standardized greetings, diagnostics, and closing messages with{" "}
              <code className="text-red-400 font-mono">/shortcuts</code> and variables like{" "}
              <code className="text-amber-300 font-mono">{"{{caller_name}}"}</code> or{" "}
              <code className="text-amber-300 font-mono">{"{{agent_name}}"}</code>.
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
              className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Canned Macro</span>
            </button>
          </div>

          <div className="border border-slate-800 bg-slate-900/60 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-3.5">Shortcut</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Message Preview</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {cannedResponses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-red-400">
                      {c.shortcut}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {c.title}
                    </td>
                    <td className="p-3.5 uppercase text-[10px] text-slate-400 font-mono">
                      {c.category}
                    </td>
                    <td className="p-3.5 max-w-md truncate text-slate-300">
                      {c.message}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.active
                            ? "bg-green-950/80 text-green-300 border border-green-800"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
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
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit Macro"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteCanned(c.id)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400"
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
          <div className="border border-slate-800 p-6 space-y-5 bg-slate-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Fulfiller Dispatch & Concurrency Limits
            </h3>

            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase text-white block">
                  Enable Live Agent Chat
                </label>
                <span className="text-[11px] text-slate-400">
                  Controls whether the floating chat widget is visible on the Self-Service Portal.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
            </div>

            {/* Max Concurrent Chats */}
            <div>
              <label className="text-xs font-bold uppercase text-white block mb-1">
                Max Concurrent Chats per Agent: {config.maxConcurrentChatsPerAgent}
              </label>
              <span className="text-[11px] text-slate-400 block mb-2">
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
                className="w-full accent-red-600"
              />
            </div>

            {/* Inactivity Abandon Timeout */}
            <div>
              <label className="text-xs font-bold uppercase text-white block mb-1">
                Auto-Abandon Inactivity Timeout (Seconds)
              </label>
              <input
                type="number"
                value={config.autoAbandonTimeoutSeconds}
                onChange={(e) =>
                  setConfig({ ...config, autoAbandonTimeoutSeconds: Number(e.target.value) })
                }
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            {/* Sound Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase text-white block">
                  Audible Queue Alerts
                </label>
                <span className="text-[11px] text-slate-400">
                  Plays audio chime in Fulfiller Workspace when a new caller enters the queue.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.soundNotifications}
                onChange={(e) => setConfig({ ...config, soundNotifications: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
            </div>

            {/* Operating Schedule */}
            <div>
              <label className="text-xs font-bold uppercase text-white block mb-1">
                Operating Schedule Coverage
              </label>
              <input
                type="text"
                value={config.operatingHoursSchedule || ""}
                onChange={(e) =>
                  setConfig({ ...config, operatingHoursSchedule: e.target.value })
                }
                placeholder="e.g. 24x7 Enterprise Support"
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Chat Settings</span>
            </button>
            {saveSuccess && (
              <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration Saved</span>
              </span>
            )}
          </div>
        </form>
      )}

      {/* Queue Modal */}
      {queueModalOpen && editingQueue && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingQueue.id ? "Edit Support Queue" : "New Support Queue"}
              </h3>
              <button onClick={() => setQueueModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveQueue} className="space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
                  Queue Name
                </label>
                <input
                  type="text"
                  required
                  value={editingQueue.name || ""}
                  onChange={(e) => setEditingQueue({ ...editingQueue, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
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
                  className="w-full p-2 font-mono bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
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
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-white"
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
                  <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
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
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
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
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
                  Automated Welcome Greeting
                </label>
                <textarea
                  rows={2}
                  value={editingQueue.welcomeMessage || ""}
                  onChange={(e) =>
                    setEditingQueue({ ...editingQueue, welcomeMessage: e.target.value })
                  }
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-white resize-none"
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
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="queueActive" className="font-bold uppercase text-[11px] text-slate-200">
                  Queue Active
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQueueModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white hover:bg-slate-200 text-slate-950 font-bold uppercase text-xs"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingCanned.id ? "Edit Canned Macro" : "New Canned Macro"}
              </h3>
              <button onClick={() => setCannedModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveCanned} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
                    Shortcut (e.g. /greet)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCanned.shortcut || "/"}
                    onChange={(e) =>
                      setEditingCanned({ ...editingCanned, shortcut: e.target.value })
                    }
                    className="w-full p-2 font-mono bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={editingCanned.category || "general"}
                    onChange={(e) =>
                      setEditingCanned({ ...editingCanned, category: e.target.value })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="general">General</option>
                    <option value="troubleshooting">Troubleshooting</option>
                    <option value="closing">Closing / Wrap Up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
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
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[11px] text-slate-300 block mb-1">
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
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-white resize-none"
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
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="cannedActive" className="font-bold uppercase text-[11px] text-slate-200">
                  Macro Active
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCannedModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white hover:bg-slate-200 text-slate-950 font-bold uppercase text-xs"
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
