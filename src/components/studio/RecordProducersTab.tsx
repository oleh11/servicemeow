"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileText,
  ExternalLink,
  RefreshCw,
  Code2,
  Settings,
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle,
  Link2,
} from "lucide-react";

const DEFAULT_PRODUCER_SCRIPT = `// Record Producer Sandbox Script
// Available objects: current (target GlideRecord), producer (submitted form variables), user
current.short_description = producer.summary || producer.short_description;
current.description = producer.description || producer.details;
current.contact_type = "self-service";
`;

const TABLE_FIELD_SUGGESTIONS: Record<string, string[]> = {
  incident: [
    "short_description",
    "description",
    "category",
    "subcategory",
    "urgency",
    "impact",
    "priority",
    "caller_name",
    "caller_email",
    "cmdb_ci_id",
    "assignment_group_id",
  ],
  change_request: [
    "short_description",
    "description",
    "change_type",
    "risk",
    "implementation_plan",
    "backout_plan",
    "test_plan",
    "cmdb_ci_id",
  ],
  problem: [
    "short_description",
    "description",
    "root_cause",
    "workaround",
    "priority",
  ],
  task: [
    "short_description",
    "description",
    "priority",
    "state",
  ],
};

export function RecordProducersTab({ tables }: { tables: any[] }) {
  const [producers, setProducers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Producer Form Fields
  const [name, setName] = useState("");
  const [targetTable, setTargetTable] = useState("incident");
  const [category, setCategory] = useState("IT Services");
  const [description, setDescription] = useState("");
  const [producerScript, setProducerScript] = useState(DEFAULT_PRODUCER_SCRIPT);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [active, setActive] = useState(true);

  // Variable Builder Drawer State
  const [variablesDrawerOpen, setVariablesDrawerOpen] = useState(false);
  const [selectedProducerForVars, setSelectedProducerForVars] = useState<any | null>(null);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [varName, setVarName] = useState("");
  const [varLabel, setVarLabel] = useState("");
  const [varType, setVarType] = useState("string");
  const [varMandatory, setVarMandatory] = useState(false);
  const [varOrder, setVarOrder] = useState(1);
  const [varChoices, setVarChoices] = useState<string[]>([]);
  const [choiceInput, setChoiceInput] = useState("");
  const [varMapToField, setVarMapToField] = useState(false);
  const [varTargetField, setVarTargetField] = useState("");
  const [savingVar, setSavingVar] = useState(false);

  useEffect(() => {
    loadProducers();
  }, []);

  const loadProducers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/producers");
      if (res.ok) {
        const json = await res.json();
        setProducers(json.result || []);
      }
    } catch (e) {
      console.error("Error loading producers:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setTargetTable("incident");
    setCategory("IT Services");
    setDescription("");
    setProducerScript(DEFAULT_PRODUCER_SCRIPT);
    setRedirectUrl("");
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setTargetTable(p.targetTable || p.tableName || "incident");
    setCategory(p.category || "IT Services");
    setDescription(p.description || "");
    setProducerScript(p.producerScript || p.script || DEFAULT_PRODUCER_SCRIPT);
    setRedirectUrl(p.redirectUrl || "");
    setActive(p.active ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        targetTable,
        tableName: targetTable,
        category,
        description,
        producerScript,
        script: producerScript,
        redirectUrl,
        active,
      };

      const url = editingId ? `/api/now/producers/${editingId}` : "/api/now/producers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadProducers();
      }
    } catch (e) {
      console.error("Error saving producer:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Record Producer?")) return;
    try {
      const res = await fetch(`/api/now/producers/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedProducerForVars?.id === id) {
          setVariablesDrawerOpen(false);
          setSelectedProducerForVars(null);
        }
        await loadProducers();
      }
    } catch (e) {
      console.error("Error deleting producer:", e);
    }
  };

  // Variable Management
  const handleOpenVariablesDrawer = (p: any) => {
    setSelectedProducerForVars(p);
    resetVariableForm(p);
    setVariablesDrawerOpen(true);
  };

  const resetVariableForm = (p?: any) => {
    const currentP = p || selectedProducerForVars;
    setEditingVarId(null);
    setVarName("");
    setVarLabel("");
    setVarType("string");
    setVarMandatory(false);
    setVarChoices([]);
    setChoiceInput("");
    setVarMapToField(false);
    setVarTargetField("");
    setVarOrder((currentP?.variables?.length || 0) + 1);
  };

  const handleEditVariable = (v: any) => {
    setEditingVarId(v.id);
    setVarName(v.name);
    setVarLabel(v.label);
    setVarType(v.varType || "string");
    setVarMandatory(Boolean(v.isMandatory));
    setVarOrder(v.order || 1);
    setVarMapToField(Boolean(v.mapToField));
    setVarTargetField(v.targetField || "");
    try {
      const parsed = v.optionsJson ? JSON.parse(v.optionsJson) : [];
      setVarChoices(Array.isArray(parsed) ? parsed : []);
    } catch {
      setVarChoices([]);
    }
  };

  const handleAddChoice = () => {
    if (!choiceInput.trim()) return;
    if (!varChoices.includes(choiceInput.trim())) {
      setVarChoices([...varChoices, choiceInput.trim()]);
    }
    setChoiceInput("");
  };

  const handleRemoveChoice = (choice: string) => {
    setVarChoices(varChoices.filter((c) => c !== choice));
  };

  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducerForVars || !varName.trim() || !varLabel.trim()) return;

    setSavingVar(true);
    try {
      const payload = {
        id: editingVarId || undefined,
        name: varName,
        label: varLabel,
        varType,
        isMandatory: varMandatory,
        optionsJson: varType === "select" ? varChoices : null,
        order: varOrder,
        mapToField: varMapToField,
        targetField: varMapToField ? varTargetField || varName : null,
      };

      const res = await fetch(`/api/now/producers/${selectedProducerForVars.id}/variable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refresh producer data
        const pRes = await fetch(`/api/now/producers/${selectedProducerForVars.id}`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          setSelectedProducerForVars(pJson.result);
        }
        await loadProducers();
        resetVariableForm();
      }
    } catch (e) {
      console.error("Error saving producer variable:", e);
    } finally {
      setSavingVar(false);
    }
  };

  const handleDeleteVariable = async (varId: string) => {
    if (!confirm("Are you sure you want to delete this question variable?")) return;
    if (!selectedProducerForVars) return;

    try {
      const res = await fetch(
        `/api/now/producers/${selectedProducerForVars.id}/variable?varId=${varId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const pRes = await fetch(`/api/now/producers/${selectedProducerForVars.id}`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          setSelectedProducerForVars(pJson.result);
        }
        await loadProducers();
      }
    } catch (e) {
      console.error("Error deleting variable:", e);
    }
  };

  const handleMoveVariable = async (index: number, direction: "up" | "down") => {
    if (!selectedProducerForVars || !selectedProducerForVars.variables) return;
    const vars = [...selectedProducerForVars.variables];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= vars.length) return;

    // Swap items
    const temp = vars[index];
    vars[index] = vars[targetIndex];
    vars[targetIndex] = temp;

    // Reassign orders
    const orders = vars.map((v, i) => ({ id: v.id, order: i + 1 }));

    try {
      const res = await fetch(`/api/now/producers/${selectedProducerForVars.id}/variable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });
      if (res.ok) {
        const pRes = await fetch(`/api/now/producers/${selectedProducerForVars.id}`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          setSelectedProducerForVars(pJson.result);
        }
        await loadProducers();
      }
    } catch (e) {
      console.error("Error reordering variables:", e);
    }
  };

  const currentSuggestions =
    TABLE_FIELD_SUGGESTIONS[selectedProducerForVars?.targetTable?.toLowerCase() || ""] ||
    TABLE_FIELD_SUGGESTIONS["incident"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--swiss-blue)]" />
            <span>Record Producers (sc_cat_item_producer)</span>
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Configure self-service intake forms with dynamic questions, direct target column mappings, and sandbox script execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadProducers}
            className="p-2 border text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="sw-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Producer</span>
          </button>
        </div>
      </div>

      {/* Grid of Producers */}
      {producers.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)] border border-dashed italic">
          No Record Producers configured yet. Click "New Producer" to build self-service catalog forms.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {producers.map((p) => (
            <div
              key={p.id}
              className="p-5 border bg-[var(--theme-card-bg)] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">{p.name}</h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                      p.active ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)]" : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                    }`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--swiss-blue)]">
                  <span className="bg-[var(--theme-accent-light)] px-2 py-0.5 border border-[var(--swiss-blue)]">
                    Target: {p.targetTable || p.tableName}
                  </span>
                  <span className="text-[var(--theme-text-secondary)]">•</span>
                  <span className="text-[var(--theme-text-secondary)]">{p.category || "General"}</span>
                </div>

                <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-2">
                  {p.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenVariablesDrawer(p)}
                    className="sw-btn px-2.5 py-1 text-[11px] flex items-center gap-1"
                    title="Configure intake fields and question variables"
                  >
                    <Settings className="w-3 h-3 text-[var(--swiss-blue)]" />
                    <span>Fields ({p.variables?.length || 0})</span>
                  </button>

                  <Link
                    href={`/portal/catalog/producer/${p.id}`}
                    target="_blank"
                    className="text-[var(--swiss-blue)] hover:text-[var(--theme-text-primary)] flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Portal</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-blue)] hover:bg-[var(--theme-accent-light)]"
                    title="Edit Producer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)] hover:bg-[var(--theme-accent-light)]"
                    title="Delete Producer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create/Edit Record Producer */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--theme-card-bg)] border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">
                {editingId ? "Edit Record Producer" : "Create Record Producer"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Producer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Report a Security Incident"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-blue)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Target Table *</label>
                  <select
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value)}
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-blue)]"
                  >
                    <option value="incident">Incident [incident]</option>
                    <option value="change_request">Change Request [change_request]</option>
                    <option value="problem">Problem [problem]</option>
                    <option value="task">Platform Task [task]</option>
                    {tables?.map((t: any) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.label || t.name} [{t.name}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Security & Compliance"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-blue)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Redirect URL</label>
                  <input
                    type="text"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="e.g. /workspace/incident/{id}"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-blue)] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Description / Help Text</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explains what this producer creates..."
                  className="w-full border p-2.5 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-blue)]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[var(--swiss-blue)]" />
                    <span>Producer Sandbox Script</span>
                  </label>
                  <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">current, producer, user</span>
                </div>
                <textarea
                  rows={6}
                  value={producerScript}
                  onChange={(e) => setProducerScript(e.target.value)}
                  className="bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:border-neutral-500 w-full font-mono text-xs p-3"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="text-[var(--swiss-blue)] focus:ring-[var(--swiss-blue)]"
                />
                <span className="text-[var(--theme-text-primary)] font-semibold">Active & Available in Catalog</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border text-[var(--theme-text-secondary)] hover:bg-[var(--theme-accent-light)] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sw-btn-primary px-5 py-2"
                >
                  Save Producer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manage Producer Variables Drawer / Dialog */}
      {variablesDrawerOpen && selectedProducerForVars && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--theme-card-bg)] border max-w-2xl w-full p-6 space-y-5 text-xs text-[var(--theme-text-primary)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-[var(--theme-text-primary)] flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[var(--swiss-blue)]" />
                  <span>Configure Intake Fields & Variables</span>
                </h3>
                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                  Form questions prompted on portal for: <strong className="text-[var(--theme-text-primary)]">{selectedProducerForVars.name}</strong> (Target: <span className="font-mono text-[var(--swiss-blue)]">{selectedProducerForVars.targetTable}</span>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariablesDrawerOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Variables List */}
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--theme-text-primary)] flex items-center justify-between">
                <span>Active Intake Questions ({selectedProducerForVars.variables?.length || 0})</span>
                <span className="text-[10px] text-[var(--theme-text-secondary)] font-normal">Requesters see these questions on the portal form</span>
              </h4>

              {(!selectedProducerForVars.variables || selectedProducerForVars.variables.length === 0) ? (
                <div className="p-4 bg-[var(--theme-accent-light)] border border-dashed border-[var(--theme-card-border)] text-center text-[var(--theme-text-secondary)] italic">
                  No custom intake fields defined yet. Add your first field question below!
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProducerForVars.variables.map((v: any, index: number) => {
                    const isEditing = editingVarId === v.id;
                    const isFirst = index === 0;
                    const isLast = index === selectedProducerForVars.variables.length - 1;

                    return (
                      <div
                        key={v.id}
                        className={`p-3 border flex items-center justify-between gap-3 transition-colors ${
                          isEditing
                            ? "bg-[var(--theme-accent-light)] border-[var(--swiss-blue)]"
                            : "bg-[var(--theme-accent-light)] border-[var(--theme-card-border)] hover:border-[var(--theme-text-primary)]"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[var(--theme-text-secondary)] font-bold">#{v.order || index + 1}</span>
                            <span className="font-bold text-[var(--theme-text-primary)] truncate">{v.label}</span>
                            {v.isMandatory && (
                              <span className="text-[10px] font-bold text-[var(--swiss-red)] font-mono">*Mandatory</span>
                            )}
                            {v.mapToField && (
                              <span className="text-[10px] font-mono text-[var(--swiss-emerald)] bg-[var(--theme-accent-light)] px-1.5 py-0.2 border border-[var(--swiss-emerald)] flex items-center gap-1">
                                <Link2 className="w-2.5 h-2.5" />
                                <span>maps to {v.targetField || v.name}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--theme-text-secondary)] font-mono">
                            <span>name: <strong className="text-[var(--theme-text-primary)]">{v.name}</strong></span>
                            <span>•</span>
                            <span className="uppercase text-[var(--swiss-blue)] font-semibold">{v.varType}</span>
                            {v.optionsJson && (
                              <>
                                <span>•</span>
                                <span className="text-[var(--theme-text-secondary)] truncate max-w-xs">{v.optionsJson}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveVariable(index, "up")}
                            className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveVariable(index, "down")}
                            className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditVariable(v)}
                            className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-blue)] ml-1"
                            title="Edit Field"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariable(v.id)}
                            className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)]"
                            title="Delete Field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add / Edit Variable Form */}
            <form onSubmit={handleSaveVariable} className="bg-[var(--theme-accent-light)] p-4 border border-[var(--theme-card-border)] space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-[var(--theme-text-primary)]">
                  {editingVarId ? "Edit Intake Question" : "Add Intake Question"}
                </span>
                {editingVarId && (
                  <button
                    type="button"
                    onClick={() => resetVariableForm()}
                    className="text-[10px] text-[var(--swiss-blue)] hover:text-[var(--theme-text-primary)]"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--theme-text-primary)] mb-1 font-semibold">Field Question Label *</label>
                  <input
                    type="text"
                    required
                    value={varLabel}
                    onChange={(e) => {
                      setVarLabel(e.target.value);
                      if (!editingVarId) {
                        setVarName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                      }
                    }}
                    placeholder="e.g. Business Impact or Affected CI"
                    className="sw-input w-full p-2"
                  />
                </div>

                <div>
                  <label className="block text-[var(--theme-text-primary)] mb-1 font-semibold">Technical Name *</label>
                  <input
                    type="text"
                    required
                    value={varName}
                    onChange={(e) => setVarName(e.target.value)}
                    placeholder="e.g. affected_ci"
                    className="sw-input w-full p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--theme-text-primary)] mb-1 font-semibold">Field Type</label>
                  <select
                    value={varType}
                    onChange={(e) => setVarType(e.target.value)}
                    className="sw-input w-full p-2"
                  >
                    <option value="string">Single-line Text</option>
                    <option value="text">Multi-line Text Area</option>
                    <option value="select">Dropdown Choice</option>
                    <option value="checkbox">Checkbox (Yes/No)</option>
                    <option value="date">Date Picker</option>
                    <option value="reference">Reference Field</option>
                    <option value="integer">Integer Number</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--theme-text-primary)] mb-1 font-semibold">Display Sequence</label>
                  <input
                    type="number"
                    min="1"
                    value={varOrder}
                    onChange={(e) => setVarOrder(parseInt(e.target.value) || 1)}
                    className="sw-input w-full p-2"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={varMandatory}
                      onChange={(e) => setVarMandatory(e.target.checked)}
                      className="border-[var(--theme-card-border)] text-[var(--swiss-blue)] focus:ring-[var(--swiss-blue)]"
                    />
                    <span className="text-[var(--theme-text-primary)] font-semibold">Mandatory</span>
                  </label>
                </div>
              </div>

              {/* Dropdown Options Builder */}
              {varType === "select" && (
                <div className="p-3 sw-panel space-y-2">
                  <label className="block text-[var(--theme-text-primary)] font-semibold text-[11px]">Dropdown Choices</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={choiceInput}
                      onChange={(e) => setChoiceInput(e.target.value)}
                      placeholder="Type choice and press Add (e.g. Production Outage)"
                      className="flex-1 bg-[var(--theme-accent-light)] border p-1.5 text-xs text-[var(--theme-text-primary)]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChoice();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddChoice}
                      className="sw-btn-primary px-3 py-1"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {varChoices.map((choice) => (
                      <span
                        key={choice}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--theme-accent-light)] text-[var(--theme-text-primary)] border border-[var(--theme-card-border)] text-[11px]"
                      >
                        <span>{choice}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(choice)}
                          className="text-[var(--theme-text-secondary)] hover:text-[var(--swiss-red)]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Field Mapping Section */}
              <div className="p-3 sw-panel space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={varMapToField}
                    onChange={(e) => {
                      setVarMapToField(e.target.checked);
                      if (e.target.checked && !varTargetField) {
                        setVarTargetField(varName);
                      }
                    }}
                    className="text-[var(--swiss-blue)] focus:ring-[var(--swiss-blue)]"
                  />
                  <span className="font-semibold text-[var(--theme-text-primary)]">
                    Directly map question response to target table column
                  </span>
                </label>

                {varMapToField && (
                  <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--theme-text-secondary)] text-[11px] font-semibold mb-1">
                        Select Target Column ({selectedProducerForVars.targetTable})
                      </label>
                      <select
                        value={currentSuggestions.includes(varTargetField) ? varTargetField : "custom"}
                        onChange={(e) => {
                          if (e.target.value !== "custom") {
                            setVarTargetField(e.target.value);
                          }
                        }}
                        className="w-full bg-[var(--theme-accent-light)] border p-2 text-xs text-[var(--theme-text-primary)]"
                      >
                        <option value="">-- Choose standard column --</option>
                        {currentSuggestions.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                        <option value="custom">Other / Custom Column Name</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--theme-text-secondary)] text-[11px] font-semibold mb-1">
                        Target Field Column Name
                      </label>
                      <input
                        type="text"
                        value={varTargetField}
                        onChange={(e) => setVarTargetField(e.target.value)}
                        placeholder="e.g. short_description or u_custom_field"
                        className="sw-input w-full p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={savingVar}
                className="w-full py-2 bg-[var(--theme-text-primary)] hover:opacity-85 text-[var(--theme-page-bg)] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {savingVar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingVarId ? "Update Question" : "Add Question to Form"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
