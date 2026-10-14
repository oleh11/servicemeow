"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Server,
  Edit3,
  ExternalLink,
  Plus,
  Save,
  X,
} from "lucide-react";

export default function WorkspaceServiceStatusPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/service-status");
      if (res.ok) {
        const json = await res.json();
        setServices(json.result?.services || []);
      }
    } catch (e) {
      console.error("Error loading services:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/now/service-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await loadStatus();
      }
    } catch (e) {
      console.error("Error updating status:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900">Service Health & Operations Status</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              cmn_service
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage enterprise service status indicators, update degraded states, and view customer-facing portal uptime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/portal/status"
            target="_blank"
            className="px-3.5 py-2 rounded-lg border text-blue-600 hover:bg-blue-50 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Status Portal</span>
          </Link>
          <button
            onClick={loadStatus}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4">Service Offering</th>
              <th className="p-4">Category</th>
              <th className="p-4">Live Status</th>
              <th className="p-4">90-Day SLA</th>
              <th className="p-4 text-right">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-900">
                  <div className="space-y-0.5">
                    <span>{s.name}</span>
                    <p className="text-[11px] text-slate-500 font-normal">{s.description}</p>
                  </div>
                </td>
                <td className="p-4 font-mono text-[11px] text-slate-500">{s.category}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                      s.status === "operational"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : s.status === "degraded"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.status === "operational"
                          ? "bg-emerald-500"
                          : s.status === "degraded"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span>{s.status.replace("_", " ").toUpperCase()}</span>
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-slate-800">
                  {s.uptimePercent.toFixed(2)}%
                </td>
                <td className="p-4 text-right space-x-1.5">
                  <button
                    disabled={updatingId === s.id}
                    onClick={() => handleUpdateStatus(s.id, "operational")}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  >
                    Set Operational
                  </button>
                  <button
                    disabled={updatingId === s.id}
                    onClick={() => handleUpdateStatus(s.id, "degraded")}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                  >
                    Degraded
                  </button>
                  <button
                    disabled={updatingId === s.id}
                    onClick={() => handleUpdateStatus(s.id, "major_outage")}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  >
                    Major Outage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
