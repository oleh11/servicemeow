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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--theme-page-bg)] p-4 border border-[var(--theme-card-border)]">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[var(--theme-text-primary)]" />
            <h2 className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight">Client Scripts (sys_script_client)</h2>
          </div>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Client-side browser automation executing onLoad, onChange, and onSubmit hooks with the standard g_form API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table filter */}
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="sw-input text-xs px-2.5 py-1.5"
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
            className="sw-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Client Script</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-[var(--theme-accent-light)] border border-[var(--swiss-emerald)] text-[var(--swiss-emerald)] text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-[var(--theme-text-primary)]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Script List Table */}
      <div className="bg-[var(--theme-page-bg)] border border-[var(--theme-card-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--theme-text-secondary)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--theme-text-primary)]" /> Loading Client Scripts...
          </div>
        ) : scripts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--theme-text-secondary)] italic">
            No Client Scripts found. Click &quot;New Client Script&quot; to configure client-side hooks.
          </div>
        ) : (
          <table className="sw-table w-full text-left text-xs text-[var(--theme-text-primary)]">
            <thead className="bg-[var(--theme-card-bg)] border-b border-[var(--theme-card-border)] text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Table</th>
                <th className="p-3">Type</th>
                <th className="p-3">Field</th>
                <th className="p-3">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-card-border)]">
              {scripts.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--theme-accent-light)] transition-colors">
                  <td className="p-3 font-semibold text-[var(--theme-text-primary)]">
                    <div>{s.name}</div>
                    {s.description && (
                      <div className="text-[11px] text-[var(--theme-text-secondary)] font-normal">{s.description}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-[var(--swiss-emerald)]">{s.tableName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                        s.type === "onLoad"
                          ? "bg-[var(--theme-accent-light)] text-[var(--swiss-blue)] border border-[var(--swiss-blue)]"
                          : s.type === "onChange"
                          ? "bg-[var(--theme-accent-light)] text-[var(--swiss-amber)] border border-[var(--swiss-amber)]"
                          : "bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] border border-[var(--theme-text-primary)]"
                      }`}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[var(--theme-text-secondary)]">{s.fieldName || "—"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`px-2 py-0.5 text-[10px] font-bold ${
                        s.active
                          ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)] border border-[var(--swiss-emerald)]"
                          : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)] transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="sw-panel-strong max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
              <div className="flex items-center gap-2 text-[var(--theme-text-primary)] font-bold text-sm">
                <Code className="w-4 h-4 text-[var(--theme-text-primary)]" />
                <span>{editingId ? "Edit Client Script" : "New Client Script"}</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">Script Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Warn on P1 Critical"
                    className="sw-input w-full px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">Target Table</label>
                  <select
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="sw-input w-full px-2.5 py-1.5"
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
                  <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">Script Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setType(newType);
                      if (!editingId && TEMPLATES[newType]) {
                        setScriptBody(TEMPLATES[newType]);
                      }
                    }}
                    className="sw-input w-full px-2.5 py-1.5"
                  >
                    <option value="onLoad">onLoad (Runs when form renders)</option>
                    <option value="onChange">onChange (Runs when field changes)</option>
                    <option value="onSubmit">onSubmit (Runs before save)</option>
                  </select>
                </div>

                {type === "onChange" && (
                  <div>
                    <label className="block text-[var(--theme-text-secondary)] font-semibold mb-1">Watched Field Name</label>
                    <input
                      type="text"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      placeholder="e.g. priority, state, impact"
                      className="sw-input w-full px-2.5 py-1.5"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[var(--theme-text-secondary)] font-semibold">JavaScript Script Body (g_form API)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setScriptBody(TEMPLATES[type])}
                      className="text-[10px] text-[var(--swiss-emerald)] hover:text-[var(--theme-text-primary)] flex items-center gap-1"
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
                  className="bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:border-neutral-500 w-full p-2.5 font-mono text-xs"
                />
                <div className="text-[10px] text-[var(--theme-text-secondary)] mt-1 font-mono">
                  Supported APIs: g_form.getValue(field), setValue(field, val), setMandatory(field, bool), setReadOnly(field, bool), setVisible(field, bool), addErrorMessage(msg), addInfoMessage(msg)
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-card-border)]">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--theme-text-primary)]">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="text-[var(--swiss-emerald)] focus:ring-[var(--swiss-emerald)]"
                  />
                  <span>Script Active</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="sw-btn px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="sw-btn-primary px-3 py-1.5 text-xs"
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
