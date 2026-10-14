"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  Plus,
  Trash2,
  Edit3,
  Play,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Terminal,
  Zap,
} from "lucide-react";

const DEFAULT_SCRIPT_INCLUDE = `var GlobalUtils = Class.create();
GlobalUtils.prototype = {
  initialize: function() {},

  calculateRiskScore: function(impact, urgency) {
    var score = (parseInt(impact, 10) * 10) + (parseInt(urgency, 10) * 5);
    return score;
  },

  type: 'GlobalUtils'
};
`;

export function ScriptIncludesTab() {
  const [includes, setIncludes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [apiName, setApiName] = useState("");
  const [clientCallable, setClientCallable] = useState(false);
  const [description, setDescription] = useState("");
  const [script, setScript] = useState(DEFAULT_SCRIPT_INCLUDE);
  const [active, setActive] = useState(true);

  // Simulator / Test Execution Drawer
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTargetInclude, setTestTargetInclude] = useState<any | null>(null);
  const [testMethod, setTestMethod] = useState("calculateRiskScore");
  const [testParams, setTestParams] = useState(JSON.stringify({ impact: 1, urgency: 1 }, null, 2));
  const [testResult, setTestResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadIncludes();
  }, []);

  const loadIncludes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/script-includes");
      if (res.ok) {
        const json = await res.json();
        setIncludes(json.result || []);
      }
    } catch (e) {
      console.error("Error loading script includes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setApiName("");
    setClientCallable(false);
    setDescription("");
    setScript(DEFAULT_SCRIPT_INCLUDE);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (inc: any) => {
    setEditingId(inc.id);
    setName(inc.name);
    setApiName(inc.apiName || inc.name);
    setClientCallable(inc.clientCallable || false);
    setDescription(inc.description || "");
    setScript(inc.script || DEFAULT_SCRIPT_INCLUDE);
    setActive(inc.active ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        apiName: apiName || name,
        clientCallable,
        description,
        script,
        active,
      };

      const url = editingId ? `/api/now/script-includes/${editingId}` : "/api/now/script-includes";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadIncludes();
      }
    } catch (e) {
      console.error("Error saving script include:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Script Include?")) return;
    try {
      const res = await fetch(`/api/now/script-includes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadIncludes();
      }
    } catch (e) {
      console.error("Error deleting script include:", e);
    }
  };

  const handleOpenTest = (inc: any) => {
    setTestTargetInclude(inc);
    setTestResult(null);
    setTestMethod("calculateRiskScore");
    setTestModalOpen(true);
  };

  const handleExecuteGlideAjax = async () => {
    if (!testTargetInclude) return;
    setExecuting(true);
    setTestResult(null);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(testParams);
      } catch {
        parsedParams = {};
      }

      const res = await fetch("/api/now/script-includes/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptIncludeId: testTargetInclude.id,
          scriptIncludeName: testTargetInclude.name,
          methodName: testMethod,
          parameters: parsedParams,
        }),
      });

      const json = await res.json();
      setTestResult(json);
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <span>Script Includes (sys_script_include)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reusable server-side business logic and GlideAjax endpoints powered by the isolated Class.create() engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadIncludes}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Script Include</span>
          </button>
        </div>
      </div>

      {/* Grid of Script Includes */}
      {includes.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl italic">
          No Script Includes configured. Create classes with GlideAjax client-callable capabilities.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {includes.map((inc) => (
            <div
              key={inc.id}
              className="p-5 rounded-2xl border shadow-xs bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 font-mono">{inc.name}</h3>
                  <div className="flex items-center gap-1.5">
                    {inc.clientCallable && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        GlideAjax
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        inc.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {inc.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  API: {inc.apiName || inc.name}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {inc.description || "Reusable server-side script definition."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenTest(inc)}
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute / Test</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(inc)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                    title="Edit Script Include"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(inc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-100"
                    title="Delete Script Include"
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? "Edit Script Include" : "Create Script Include"}
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
                  <label className="block font-semibold text-slate-700 mb-1">Class / Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!apiName || apiName === name) setApiName(e.target.value);
                    }}
                    placeholder="e.g. RiskCalculator"
                    className="w-full border rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Name</label>
                  <input
                    type="text"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="global.RiskCalculator"
                    className="w-full border rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Utility class for risk scoring and validation..."
                  className="w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientCallable}
                    onChange={(e) => setClientCallable(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 font-semibold">
                    Client Callable (GlideAjax Parity)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 font-semibold">Active</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Script (Class.create Prototype)</label>
                  <span className="text-[10px] font-mono text-slate-400">gs sandbox available</span>
                </div>
                <textarea
                  rows={10}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg p-3 focus:outline-none"
                />
              </div>

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
                  className="px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-xs"
                >
                  Save Script Include
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GlideAjax Test / Playground Modal */}
      {testModalOpen && testTargetInclude && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  GlideAjax Sandbox Test: {testTargetInclude.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Function / Method Name</label>
                <input
                  type="text"
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  placeholder="e.g. calculateRiskScore"
                  className="w-full border rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  JSON Parameters (passed to function)
                </label>
                <textarea
                  rows={4}
                  value={testParams}
                  onChange={(e) => setTestParams(e.target.value)}
                  className="w-full border rounded-lg p-3 font-mono text-xs text-slate-800 bg-slate-50 focus:outline-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteGlideAjax}
                  disabled={executing}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{executing ? "Executing in Sandbox..." : "Run Function"}</span>
                </button>
              </div>

              {testResult && (
                <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700 pb-1">
                    Execution Result
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
