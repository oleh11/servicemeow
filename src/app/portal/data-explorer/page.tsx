"use client";

import React, { Suspense } from "react";
import { TableDataEditorTab } from "@/components/studio/TableDataEditorTab";
import { Database, Download, FileSpreadsheet, Building2, Kanban, RefreshCw } from "lucide-react";

export default function PortalDataExplorerPage() {
  return (
    <div className="sw-page">
      {/* Top Welcome & Extraction Banner */}
      <div className="sw-page-header">
        <div className="space-y-1">
          <div className="sw-eyebrow">
            <span className="sw-eyebrow-tag">PORTAL</span>
            <Database className="w-3.5 h-3.5" />
            <span>Data Explorer</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="sw-title">
              Employee Table &amp; Data Explorer
            </h1>
          </div>
          <p className="sw-subtitle leading-relaxed">
            Direct open explorer for all enterprise database tables. Inspect spatial location records, agile backlogs, service tickets, and export live data to CSV anytime for daily reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="sw-badge-green px-3 py-2">
            <Download className="w-4 h-4" />
            <span>End-of-Day CSV Extract Enabled</span>
          </div>
        </div>
      </div>

      {/* Main Table Explorer Grid */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-16 text-[var(--theme-text-secondary)] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--theme-text-primary)]" />
            <span>Loading Data Explorer...</span>
          </div>
        }
      >
        <TableDataEditorTab initialTable="cmn_location" isPortalView={true} />
      </Suspense>
    </div>
  );
}
