"use client";

import React, { useState, useEffect } from "react";
import {
  Code,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileCode,
  Sparkles,
  RefreshCw,
  Table,
} from "lucide-react";

const TEMPLATES: Record<string, string> = {
  onLoad: `function onLoad(g_form) {
  // Executed when form loads
  g_form.addInfoMessage("🐱 ServiceMeow Client Script: Form loaded successfully.");
}`,
  onChange: `function onChange(g_form, oldValue, newValue) {
  // Executed when field changes
  if (newValue === "1") {
    g_form.addErrorMessage("⚠️ P1 Critical Priority selected! Immediate incident manager notification required.");
    g_form.setMandatory("close_notes", true);
  }
}`,
  onSubmit: `function onSubmit(g_form) {
  // Executed before form submission. Return false to abort.
  const shortDesc = g_form.getValue("short_description");
  if (!shortDesc || shortDesc.trim().length < 5) {
    g_form.addErrorMessage("🐱 Short Description must contain at least 5 characters.");
    return false;
  }
  return true;
}`,
};

export function ClientScriptsTab({ tables }: { tables: any[] }) {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tableName, setTableName] = useState("incident");
  const [type, setType] = useState<"onLoad" | "onChange" | "onSubmit">("onLoad");
  const [fieldName, setFieldName] = useState("priority");
  const [scriptBody, setScriptBody] = useState(TEMPLATES.onLoad);
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const loadScripts = async () => {
    setLoading(true);
    try {
      const url = selectedTable === "all" ? "/api/now/client-scripts" : `/api/now/client-scripts?table=${selectedTable}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.result) setScripts(data.result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, [selectedTable]);

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setTableName(selectedTable !== "all" ? selectedTable : "incident");
    setType("onLoad");
    setFieldName("priority");
    setScriptBody(TEMPLATES.onLoad);
    setActive(true);
    setDescription("");
    setModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingId(s.id);
    setName(s.name);
    setTableName(s.tableName);
    setType(s.type);
    setFieldName(s.fieldName || "priority");
    setScriptBody(s.scriptBody);
    setActive(s.active !== false);
    setDescription(s.description || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    try {
      const payload = {
        name,
        tableName,
        type,
        fieldName: type === "onChange" ? fieldName : null,
        scriptBody,
        active,
        description,
      };

      if (editingId) {
        const res = await fetch(`/api/now/client-scripts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast("Client Script updated & recorded into active Update Set!");
          setModalOpen(false);
          await loadScripts();
        }
      } else {
        const res = await fetch("/api/now/client-scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast("New Client Script registered & added to Update Set!");
          setModalOpen(false);
          await loadScripts();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Client Script?")) return;
    try {
      await fetch(`/api/now/client-scripts/${id}`, { method: "DELETE" });
      showToast("Client Script deleted.");
      await loadScripts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (s: any) => {
    try {
      await fetch(`/api/now/client-scripts/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      await loadScripts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Client Scripts (sys_script_client)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Client-side browser automation executing onLoad, onChange, and onSubmit hooks with the standard g_form API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table filter */}
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-emerald-500"
          >
            <option value="all">All Tables ({tables.length})</option>
            {tables.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label} ({t.name})
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Client Script</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Script List Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading Client Scripts...
          </div>
        ) : scripts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No Client Scripts found. Click &quot;New Client Script&quot; to configure client-side hooks.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Table</th>
                <th className="p-3">Type</th>
                <th className="p-3">Field</th>
                <th className="p-3">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {scripts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    <div>{s.name}</div>
                    {s.description && (
                      <div className="text-[11px] text-slate-500 font-normal">{s.description}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-emerald-400">{s.tableName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.type === "onLoad"
                          ? "bg-blue-950 text-blue-300 border border-blue-800"
                          : s.type === "onChange"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-purple-950 text-purple-300 border border-purple-800"
                      }`}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{s.fieldName || "—"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.active
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>{editingId ? "Edit Client Script" : "New Client Script"}</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Script Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Warn on P1 Critical"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Table</label>
                  <select
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                  >
                    {tables.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.label} ({t.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Script Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setType(newType);
                      if (!editingId && TEMPLATES[newType]) {
                        setScriptBody(TEMPLATES[newType]);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                  >
                    <option value="onLoad">onLoad (Runs when form renders)</option>
                    <option value="onChange">onChange (Runs when field changes)</option>
                    <option value="onSubmit">onSubmit (Runs before save)</option>
                  </select>
                </div>

                {type === "onChange" && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Watched Field Name</label>
                    <input
                      type="text"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      placeholder="e.g. priority, state, impact"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">JavaScript Script Body (g_form API)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setScriptBody(TEMPLATES[type])}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Insert {type} Template
                    </button>
                  </div>
                </div>
                <textarea
                  rows={8}
                  required
                  value={scriptBody}
                  onChange={(e) => setScriptBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-emerald-300 text-xs focus:outline-emerald-500"
                />
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Supported APIs: g_form.getValue(field), setValue(field, val), setMandatory(field, bool), setReadOnly(field, bool), setVisible(field, bool), addErrorMessage(msg), addInfoMessage(msg)
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Script Active</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
                  >
                    {saving ? "Saving..." : editingId ? "Update Script" : "Create Script"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
