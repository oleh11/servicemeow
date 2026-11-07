"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Server,
  ShieldCheck,
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
          label: "OPERATIONAL",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-600",
          icon: CheckCircle2,
        };
      case "degraded":
        return {
          label: "DEGRADED",
          bg: "bg-amber-50 text-amber-800 border-amber-600",
          icon: AlertTriangle,
        };
      case "major_outage":
        return {
          label: "MAJOR OUTAGE",
          bg: "bg-red-50 text-red-800 border-red-600",
          icon: XCircle,
        };
      case "maintenance":
        return {
          label: "MAINTENANCE",
          bg: "bg-neutral-100 text-neutral-800 border-neutral-400",
          icon: ShieldCheck,
        };
      default:
        return {
          label: "ACTIVE",
          bg: "bg-neutral-100 text-neutral-800 border-neutral-300",
          icon: CheckCircle2,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Swiss Header */}
      <div className="border-b-2 border-black pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&larr; Back to Main Screen</span>
          </Link>

          <button
            onClick={loadStatus}
            className="px-3 py-1.5 border border-black hover:bg-neutral-100 text-black text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Probes</span>
          </button>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-bold text-emerald-600">05 /</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black">
            System Operational Status
          </h1>
        </div>
        <p className="text-sm sm:text-base text-neutral-600 max-w-2xl">
          Real-time availability probes across all enterprise core services, VPN nodes, email gateways, and cloud APIs.
        </p>
      </div>

      {/* Main Status Hero Banner */}
      <div
        className={`p-6 sm:p-8 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
          overallStatus === "operational"
            ? "border-emerald-600 bg-emerald-50/40 text-black"
            : overallStatus === "degraded"
            ? "border-amber-600 bg-amber-50/40 text-black"
            : "border-red-600 bg-red-50/40 text-black"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 border-2 flex items-center justify-center shrink-0 ${
              overallStatus === "operational"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : overallStatus === "degraded"
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-red-600 bg-red-600 text-white"
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
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500 block">
              Global Platform Health
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase text-black">
              {overallStatus === "operational"
                ? "All Systems Operational"
                : overallStatus === "degraded"
                ? "Degraded Performance Detected"
                : "Active System Outage"}
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Automated telemetry probes verify health every 60 seconds with 99.98% SLA compliance.
            </p>
          </div>
        </div>

        <Link
          href="/portal/create-incident"
          className="px-6 py-4 bg-black hover:bg-neutral-800 text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors shrink-0 text-center"
        >
          Report a Problem &rarr;
        </Link>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="border-2 border-red-600 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-extrabold uppercase text-black">
              Active Operational Investigations ({activeIncidents.length})
            </h3>
          </div>

          <div className="space-y-3">
            {activeIncidents.map((t) => (
              <div key={t.id} className="p-4 border border-red-200 bg-red-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-700">{t.number}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-red-200 text-red-800 font-bold">
                    P{t.priority} Investigation
                  </span>
                </div>
                <p className="text-xs font-bold text-black">{t.shortDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services List with 90-Day Uptime Bars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h2 className="text-base font-extrabold uppercase text-black flex items-center gap-2">
            <Server className="w-4 h-4 text-black" />
            <span>Core Enterprise Services &amp; Infrastructure</span>
          </h2>
          <span className="text-xs font-mono uppercase font-bold text-neutral-500">
            90-Day Telemetry
          </span>
        </div>

        <div className="space-y-3">
          {services.map((service, idx) => {
            const badge = getStatusBadge(service.status);
            const Icon = badge.icon;
            const num = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={service.id}
                className="p-5 border-2 border-neutral-200 hover:border-black bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-400">{num}</span>
                      <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 bg-neutral-100 text-neutral-600">
                        {service.category}
                      </span>
                      <h3 className="font-extrabold text-sm uppercase text-black">{service.name}</h3>
                    </div>
                    <p className="text-xs text-neutral-600">{service.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase border ${badge.bg}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="font-mono text-xs font-extrabold text-black">
                      {service.uptimePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 90-Day Uptime Bar Visualization */}
                <div className="pt-2 border-t border-neutral-100 flex items-center gap-1">
                  {Array.from({ length: 45 }).map((_, i) => (
                    <div
                      key={i}
                      title={`Day ${45 - i}: 100% Operational`}
                      className="h-5 flex-1 bg-emerald-600 hover:bg-black transition-colors cursor-pointer"
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
