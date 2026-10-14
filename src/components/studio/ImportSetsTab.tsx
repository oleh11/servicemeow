"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Layers,
  Sparkles,
} from "lucide-react";

const SAMPLE_CSV = `number,short_description,category,priority,state
INC0001001,VPN Gateway connection dropped repeatedly,network,1,2
INC0001002,Outlook desktop app crashing on MacOS Monterey,software,3,1
INC0001003,New employee MacBook Pro M3 provisioning,hardware,2,2`;

export function ImportSetsTab({ tables }: { tables: any[] }) {
  const [targetTable, setTargetTable] = useState("incident");
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [importSets, setImportSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeImportSet, setActiveImportSet] = useState<any | null>(null);

  // Mappings State
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<
    Array<{ sourceField: string; targetField: string; coalesce: boolean }>
  >([]);

  // Execution Report State
  const [executing, setExecuting] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const loadImportSets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/import-sets");
      const data = await res.json();
      if (data.result) setImportSets(data.result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImportSets();
  }, []);

  const handleCreateStaging = async () => {
    if (!csvText.trim()) return;
    setLoading(true);
    setStatusMsg("");
    setReport(null);

    try {
      const res = await fetch("/api/now/import-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTable,
          csvContent: csvText,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setActiveImportSet(data.result.importSet);
        const detectedHeaders = data.result.headers || [];
        setHeaders(detectedHeaders);

        // Auto-generate 1-to-1 default mappings
        const autoMaps = detectedHeaders.map((h: string) => ({
          sourceField: h,
          targetField: h,
          coalesce: h.toLowerCase() === "number" || h.toLowerCase() === "id",
        }));
        setMappings(autoMaps);
        setStatusMsg(`Import Set ${data.result.importSet.number} loaded with ${data.result.importSet.rowsCount} staging rows!`);
        await loadImportSets();
      }
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Error creating staging set: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransform = async () => {
    if (!activeImportSet) return;
    setExecuting(true);
    setReport(null);

    try {
      const res = await fetch(`/api/now/import-sets/${activeImportSet.id}/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transformMapName: `${activeImportSet.targetTable} CSV Transform`,
          mappings,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setReport(data.result);
        setStatusMsg("Transform execution complete!");
        await loadImportSets();
      }
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Transform error: ${e.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Data Import Sets & Transform Maps (sys_import_set)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage bulk records, build field transform maps, and perform coalesce matching for upserts.
          </p>
        </div>

        <button
          onClick={loadImportSets}
          className="p-1.5 text-slate-400 hover:text-white rounded border border-slate-800"
          title="Refresh History"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid: 1. CSV Staging Upload & 2. Transform Map Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: CSV Upload & Staging */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">1. CSV Upload & Staging Rows</h3>
            </div>
            <select
              value={targetTable}
              onChange={(e) => setTargetTable(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1 focus:outline-emerald-500 font-mono"
            >
              {tables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label} ({t.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Paste CSV raw text (with headers in first row):</span>
              <button
                type="button"
                onClick={() => setCsvText(SAMPLE_CSV)}
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" /> Load Sample Incident CSV
              </button>
            </div>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="header1,header2,header3..."
              className="w-full bg-slate-900 border border-slate-800 rounded p-3 font-mono text-xs text-slate-200 focus:outline-emerald-500"
            />
          </div>

          <button
            onClick={handleCreateStaging}
            disabled={loading || !csvText.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Load into Staging Table (sys_import_set)</span>
          </button>
        </div>

        {/* Box 2: Field Mapping Builder & Execution */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">2. Transform Map & Coalesce Matching</h3>
            </div>
            {activeImportSet && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {activeImportSet.number}
              </span>
            )}
          </div>

          {mappings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 italic">
              Stage a CSV on the left to configure source to target field transformations and Coalesce keys.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-slate-400 px-2">
                  <div className="col-span-5">Source Field (CSV)</div>
                  <div className="col-span-4">Target Field ({targetTable})</div>
                  <div className="col-span-3 text-right">Coalesce Key</div>
                </div>

                {mappings.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center gap-2 bg-slate-900/60 p-2 rounded border border-slate-800 text-xs text-slate-300"
                  >
                    <div className="col-span-5 font-mono text-emerald-300 truncate">{m.sourceField}</div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={m.targetField}
                        onChange={(e) => {
                          const updated = [...mappings];
                          updated[idx].targetField = e.target.value;
                          setMappings(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={m.coalesce}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].coalesce = e.target.checked;
                            setMappings(updated);
                          }}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className={m.coalesce ? "text-amber-400 font-bold" : ""}>Match</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleExecuteTransform}
                disabled={executing || !activeImportSet}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs transition-colors shadow-xs"
              >
                <Play className="w-4 h-4" />
                <span>{executing ? "Transforming Records..." : "Execute Transform Map"}</span>
              </button>
            </div>
          )}

          {/* Execution Report Card */}
          {report && (
            <div className="p-4 rounded-lg bg-slate-900 border border-emerald-500/40 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Transform Execution Summary
                </span>
                <span className="font-mono text-slate-400">{report.total} processed</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="bg-emerald-950/60 border border-emerald-800/80 p-2 rounded">
                  <div className="text-lg font-bold text-emerald-300">{report.inserted}</div>
                  <div className="text-[10px] text-emerald-500 uppercase font-sans">Inserted</div>
                </div>
                <div className="bg-amber-950/60 border border-amber-800/80 p-2 rounded">
                  <div className="text-lg font-bold text-amber-300">{report.updated}</div>
                  <div className="text-[10px] text-amber-500 uppercase font-sans">Updated</div>
                </div>
                <div className="bg-rose-950/60 border border-rose-800/80 p-2 rounded">
                  <div className="text-lg font-bold text-rose-300">{report.errors}</div>
                  <div className="text-[10px] text-rose-500 uppercase font-sans">Errors</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Sets History Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Import Sets Registry ({importSets.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Set Number</th>
                <th className="p-3">Target Table</th>
                <th className="p-3">State</th>
                <th className="p-3">Rows</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {importSets.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-mono font-bold text-emerald-400">{s.number}</td>
                  <td className="p-3 font-mono text-slate-300">{s.targetTable}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.state === "transformed"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {s.state}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{s.rowsCount || s._count?.rows || 0}</td>
                  <td className="p-3 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
