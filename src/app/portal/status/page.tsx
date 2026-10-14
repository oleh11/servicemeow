"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";
  description: string;
  uptimePercent: number;
}

export default function ServiceStatusPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<any[]>([]);
  const [overallStatus, setOverallStatus] = useState("operational");
  const [loading, setLoading] = useState(true);

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
        setActiveIncidents(json.result?.activeIncidents || []);
        setOverallStatus(json.result?.overallStatus || "operational");
      }
    } catch (e) {
      console.error("Error loading service status:", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return {
          label: "Operational",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
          color: "text-emerald-600",
        };
      case "degraded":
        return {
          label: "Degraded Performance",
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          icon: AlertTriangle,
          color: "text-amber-600",
        };
      case "major_outage":
        return {
          label: "Major Outage",
          bg: "bg-rose-100 text-rose-800 border-rose-200",
          icon: XCircle,
          color: "text-rose-600",
        };
      case "maintenance":
        return {
          label: "Scheduled Maintenance",
          bg: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
          color: "text-blue-600",
        };
      default:
        return {
          label: "Operational",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
          color: "text-emerald-600",
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back to Portal */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Self-Service Portal</span>
        </Link>

        <button
          onClick={loadStatus}
          className="p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Status Hero Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
          overallStatus === "operational"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
            : overallStatus === "degraded"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-950"
            : "bg-rose-500/10 border-rose-500/30 text-rose-950"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              overallStatus === "operational"
                ? "bg-emerald-600 text-white"
                : overallStatus === "degraded"
                ? "bg-amber-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {overallStatus === "operational" ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : overallStatus === "degraded" ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 font-mono">
              Live System Status
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {overallStatus === "operational"
                ? "All Systems Operational"
                : overallStatus === "degraded"
                ? "Partial Service Degradation Detected"
                : "Critical Outage Active"}
            </h1>
            <p className="text-xs opacity-80 mt-0.5">
              Automated telemetry probes and monitoring check status across all enterprise components.
            </p>
          </div>
        </div>

        <Link
          href="/portal/catalog"
          className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors shadow-xs shrink-0 text-center"
        >
          Report an Incident
        </Link>
      </div>

      {/* Active Disruptions Section (If Any) */}
      {activeIncidents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Active Operational Investigations ({activeIncidents.length})</span>
          </h2>

          <div className="space-y-2">
            {activeIncidents.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-800">{t.number}</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.2 rounded font-mono font-bold text-[10px]">
                      P{t.priority} High Severity
                    </span>
                    {t.incident?.cmdbCi && (
                      <span className="bg-white/80 px-2 py-0.2 rounded font-mono text-[10px] text-slate-700 border">
                        Affected CI: {t.incident.cmdbCi.name}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-slate-900">{t.shortDescription}</p>
                </div>

                <Link
                  href={`/workspace/incident/${t.id}`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold self-start sm:self-center"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services List with 90-Day Uptime Bars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Core Business & Infrastructure Services</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">90-Day Historical Uptime</span>
        </div>

        <div className="space-y-3">
          {services.map((service) => {
            const badge = getStatusBadge(service.status);
            const Icon = badge.icon;

            return (
              <div
                key={service.id}
                className="p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                        {service.category}
                      </span>
                      <span className="text-slate-300">•</span>
                      <h3 className="font-bold text-sm text-slate-900">{service.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500">{service.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {service.uptimePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 90-Day Uptime Bar Visualization */}
                <div className="pt-2 border-t flex items-center gap-0.5">
                  {Array.from({ length: 45 }).map((_, i) => (
                    <div
                      key={i}
                      title={`Day ${45 - i}: 100% Operational`}
                      className="h-7 flex-1 rounded-xs bg-emerald-500/80 hover:bg-emerald-600 transition-colors cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
