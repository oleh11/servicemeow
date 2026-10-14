"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Bell,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";

export function NotificationsTab({ tables }: { tables: any[] }) {
  const [subTab, setSubTab] = useState<"notifications" | "events">("notifications");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [tableName, setTableName] = useState("incident");
  const [eventName, setEventName] = useState("incident.created");
  const [subject, setSubject] = useState("Incident ${number} has been created: ${short_description}");
  const [body, setBody] = useState(
    "Hello,\n\nA new incident (${number}) has been registered:\nShort Description: ${short_description}\nPriority: ${priority}\nState: ${state}\n\nPlease review immediately in ServiceMeow."
  );
  const [active, setActive] = useState(true);

  // Test Event Dispatch
  const [testEventName, setTestEventName] = useState("incident.created");
  const [testParm1, setTestParm1] = useState("admin@servicemeow.io");
  const [testParm2, setTestParm2] = useState("Test System Alert");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState("");

  useEffect(() => {
    loadData();
  }, [subTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === "notifications") {
        const res = await fetch("/api/now/notifications");
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.result || []);
        }
      } else {
        const res = await fetch("/api/now/events");
        if (res.ok) {
          const json = await res.json();
          setEvents(json.result || []);
        }
      }
    } catch (e) {
      console.error("Error loading notifications/events:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setTableName("incident");
    setEventName("incident.created");
    setSubject("Incident ${number} has been created: ${short_description}");
    setBody("A new record has been created: ${number}");
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (n: any) => {
    setEditingId(n.id);
    setName(n.name);
    setTableName(n.tableName);
    setEventName(n.eventName || "incident.created");
    setSubject(n.subject);
    setBody(n.body);
    setActive(n.active ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        tableName,
        eventName,
        subject,
        body,
        active,
      };

      const url = editingId ? `/api/now/notifications/${editingId}` : "/api/now/notifications";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadData();
      }
    } catch (e) {
      console.error("Error saving notification:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification rule?")) return;
    try {
      const res = await fetch(`/api/now/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  };

  const handleDispatchTestEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchMsg("");
    try {
      const res = await fetch("/api/now/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testEventName,
          tableName: "incident",
          instanceId: "test-instance",
          parm1: testParm1,
          parm2: testParm2,
        }),
      });

      if (res.ok) {
        setDispatchMsg(`Event '${testEventName}' successfully enqueued in sysevent!`);
        setTimeout(() => setDispatchMsg(""), 3000);
        await loadData();
      }
    } catch (e: any) {
      setDispatchMsg(`Error: ${e.message}`);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-600" />
            <span>Email Notifications & Event Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure sysevent_email_action notification templates with &#36;{'{'}token{'}'} dynamic evaluation and monitor the sysevent bus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-lg flex text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubTab("notifications")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                subTab === "notifications"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Email Rules ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab("events")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                subTab === "events"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Event Registry ({events.length})
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {subTab === "notifications" && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Email Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications Tab Content */}
      {subTab === "notifications" ? (
        notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl italic">
            No Email Notifications configured. Click "New Email Rule" to create templates.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-5 rounded-2xl border shadow-xs bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{n.name}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        n.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {n.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-rose-700">
                    <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Table: {n.tableName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-semibold">{n.eventName}</span>
                  </div>

                  <div className="text-xs font-medium text-slate-800 bg-slate-50 p-2 rounded border truncate">
                    <strong>Subject:</strong> {n.subject}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 font-mono text-[11px]">
                    {n.body}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(n)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-slate-100"
                    title="Edit Rule"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-100"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Event Registry & Test Dispatcher */
        <div className="space-y-6">
          {/* Dispatch Tester Card */}
          <div className="p-5 rounded-2xl border bg-slate-50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate / Enqueue Platform Event (gs.eventQueue)</span>
            </h3>

            <form onSubmit={handleDispatchTestEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                required
                value={testEventName}
                onChange={(e) => setTestEventName(e.target.value)}
                placeholder="Event Name (e.g. incident.created)"
                className="bg-white border rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-rose-500"
              />
              <input
                type="text"
                value={testParm1}
                onChange={(e) => setTestParm1(e.target.value)}
                placeholder="parm1 (e.g. recipient email)"
                className="bg-white border rounded-lg px-3 py-2 text-slate-800 focus:outline-rose-500"
              />
              <input
                type="text"
                value={testParm2}
                onChange={(e) => setTestParm2(e.target.value)}
                placeholder="parm2 (e.g. extra context)"
                className="bg-white border rounded-lg px-3 py-2 text-slate-800 focus:outline-rose-500"
              />
              <button
                type="submit"
                disabled={dispatching}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatching ? "Sending..." : "Enqueue Event"}</span>
              </button>
            </form>

            {dispatchMsg && (
              <div className="text-xs font-semibold text-emerald-700 mt-1">{dispatchMsg}</div>
            )}
          </div>

          {/* Events Log Table */}
          <div className="border rounded-2xl overflow-hidden shadow-xs bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b">
                <tr>
                  <th className="p-3">Event Name</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Instance / ID</th>
                  <th className="p-3">Parm 1</th>
                  <th className="p-3">Parm 2</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[11px]">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      No events currently logged in sysevent table.
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-700">{evt.name}</td>
                      <td className="p-3 font-mono text-slate-600">{evt.tableName || "—"}</td>
                      <td className="p-3 font-mono text-slate-400 max-w-[120px] truncate">
                        {evt.instanceId || "—"}
                      </td>
                      <td className="p-3 text-slate-700 truncate max-w-[140px]">{evt.parm1 || "—"}</td>
                      <td className="p-3 text-slate-700 truncate max-w-[140px]">{evt.parm2 || "—"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            evt.processed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {evt.processed ? "Processed" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(evt.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? "Edit Email Notification" : "Create Email Notification"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notification Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Incident Assigned Notification"
                    className="w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Table *</label>
                  <select
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-rose-500"
                  >
                    <option value="incident">Incident [incident]</option>
                    <option value="change_request">Change Request [change_request]</option>
                    <option value="problem">Problem [problem]</option>
                    <option value="task">Platform Task [task]</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Event (sysevent) *</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="incident.created, change.approved"
                  className="w-full border rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Subject Template (supports &#36;{'{'}field{'}'}) *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Body Template (supports &#36;{'{'}number{'}'}, &#36;{'{'}short_description{'}'}, &#36;{'{'}priority{'}'})
                </label>
                <textarea
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full font-mono text-xs border rounded-lg p-3 text-slate-800 bg-slate-50 focus:outline-rose-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-700 font-semibold">Active & Listening to Events</span>
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
                  className="px-5 py-2 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-xs"
                >
                  Save Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
