"use client";

import React, { useState, useEffect } from "react";
import {
  Code,
  Plus,
  Trash2,
  Edit3,
  Play,
  Check,
  X,
  RefreshCw,
  Terminal,
  Zap,
  Globe,
  ExternalLink,
} from "lucide-react";

const DEFAULT_API_SCRIPT = `// Scripted REST API Handler
// Available arguments: request (headers, queryParams, body), response
(function process(request, response) {
  var action = request.queryParams.action || "status";
  
  return {
    success: true,
    platform: "ServiceMeow",
    action: action,
    timestamp: new Date().toISOString(),
    message: "Executed Scripted REST API endpoint successfully."
  };
})(request, response);
`;

export function ScriptedApisTab() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("monitoring");
  const [namespace, setNamespace] = useState("api");
  const [httpMethod, setHttpMethod] = useState("GET");
  const [operationName, setOperationName] = useState("healthCheck");
  const [script, setScript] = useState(DEFAULT_API_SCRIPT);
  const [active, setActive] = useState(true);

  // Live Test Invocation
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedDef, setSelectedDef] = useState<any | null>(null);
  const [testUrl, setTestUrl] = useState("");
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadDefinitions();
  }, []);

  const loadDefinitions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/scripted-apis");
      if (res.ok) {
        const json = await res.json();
        setDefinitions(json.result || []);
      }
    } catch (e) {
      console.error("Error loading scripted APIs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setServiceId("monitoring");
    setNamespace("api");
    setHttpMethod("GET");
    setOperationName("healthCheck");
    setScript(DEFAULT_API_SCRIPT);
    setActive(true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        serviceId,
        namespace,
        active,
        operations: [
          {
            name: operationName,
            httpMethod,
            operationScript: script,
            active: true,
          },
        ],
      };

      const res = await fetch("/api/now/scripted-apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadDefinitions();
      }
    } catch (e) {
      console.error("Error saving scripted API:", e);
    }
  };

  const handleOpenTest = (def: any) => {
    setSelectedDef(def);
    const op = def.operations?.[0];
    const endpoint = `/api/custom/${def.namespace}/${def.serviceId}/${op?.name || "default"}`;
    setTestUrl(endpoint);
    setTestResponse(null);
    setTestModalOpen(true);
  };

  const handleExecuteLiveTest = async () => {
    setTesting(true);
    setTestResponse(null);
    try {
      const op = selectedDef?.operations?.[0];
      const method = op?.httpMethod || "GET";

      const res = await fetch(testUrl, {
        method,
      });
      const json = await res.json();
      setTestResponse({ status: res.status, data: json });
    } catch (e: any) {
      setTestResponse({ error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--swiss-emerald)]" />
            <span>Scripted REST APIs (sys_ws_definition & sys_ws_operation)</span>
          </h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Build custom web service micro-endpoints hosted dynamically at /api/custom/... with sandbox request/response evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDefinitions}
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
            <span>New REST API</span>
          </button>
        </div>
      </div>

      {/* Grid of Definitions */}
      {definitions.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--theme-text-secondary)] border border-dashed italic">
          No Scripted REST APIs configured. Click "New REST API" to build custom web service endpoints.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {definitions.map((def) => {
            const op = def.operations?.[0];
            const endpointPath = `/api/custom/${def.namespace}/${def.serviceId}/${op?.name || ""}`;

            return (
              <div
                key={def.id}
                className="p-5 border bg-[var(--theme-card-bg)] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">{def.name}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                        def.active ? "bg-[var(--theme-accent-light)] text-[var(--swiss-emerald)]" : "bg-[var(--theme-accent-light)] text-[var(--theme-text-secondary)]"
                      }`}
                    >
                      {def.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--swiss-emerald)]">
                    <span className="bg-[var(--theme-accent-light)] px-2 py-0.5 border border-[var(--swiss-emerald)]">
                      {op?.httpMethod || "GET"}
                    </span>
                    <span className="text-[var(--theme-text-secondary)] truncate">{endpointPath}</span>
                  </div>

                  <pre className="text-[10px] font-mono bg-[var(--theme-accent-light)] p-2 text-[var(--theme-text-primary)] line-clamp-3">
                    {op?.operationScript || "No script attached"}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenTest(def)}
                    className="inline-flex items-center gap-1.5 text-[var(--swiss-emerald)] hover:text-[var(--swiss-emerald)] font-semibold text-[11px]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Endpoint</span>
                  </button>

                  <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">
                    {def.operations?.length || 0} op(s)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--theme-card-bg)] border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">Create Scripted REST API</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">API Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cluster Health Monitoring API"
                  className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Namespace *</label>
                  <input
                    type="text"
                    required
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="api / v1"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] font-mono focus:outline-[var(--swiss-emerald)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Service ID (Path) *</label>
                  <input
                    type="text"
                    required
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder="monitoring"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] font-mono focus:outline-[var(--swiss-emerald)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">HTTP Method *</label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] focus:outline-[var(--swiss-emerald)] font-bold"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Operation Resource Name *</label>
                  <input
                    type="text"
                    required
                    value={operationName}
                    onChange={(e) => setOperationName(e.target.value)}
                    placeholder="healthCheck"
                    className="w-full border px-3 py-2 text-[var(--theme-text-primary)] font-mono focus:outline-[var(--swiss-emerald)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[var(--theme-text-primary)]">Handler Script (process(request, response))</label>
                  <span className="text-[10px] font-mono text-[var(--theme-text-secondary)]">sandbox execution</span>
                </div>
                <textarea
                  rows={8}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:border-neutral-500 w-full font-mono text-xs p-3"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="text-[var(--swiss-emerald)] focus:ring-[var(--swiss-emerald)]"
                />
                <span className="text-[var(--theme-text-primary)] font-semibold">Active & Routing Requests</span>
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
                  Save Scripted API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Playground Modal */}
      {testModalOpen && selectedDef && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[var(--theme-card-bg)] border p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[var(--swiss-emerald)]" />
                <h3 className="font-bold text-sm text-[var(--theme-text-primary)]">
                  Live Endpoint Tester: {selectedDef.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--theme-text-primary)] mb-1">Target Endpoint URL</label>
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="w-full border px-3 py-2 text-[var(--theme-text-primary)] font-mono focus:outline-[var(--swiss-emerald)]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteLiveTest}
                  disabled={testing}
                  className="sw-btn-primary flex items-center gap-2 px-5 py-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testing ? "Sending Request..." : "Send HTTP Request"}</span>
                </button>
              </div>

              {testResponse && (
                <div className="bg-neutral-950 text-emerald-400 border border-neutral-800 focus:outline-none focus:border-neutral-500 p-4 font-mono text-xs space-y-2">
                  <div className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] border-b border-[var(--theme-card-border)] pb-1">
                    HTTP Response (Status: {testResponse.status || 200})
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testResponse.data || testResponse, null, 2)}
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
