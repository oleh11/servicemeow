"use client";

import React, { Suspense } from "react";
import { TableDataEditorTab } from "@/components/studio/TableDataEditorTab";
import { Database, Download, FileSpreadsheet, Building2, Kanban, RefreshCw } from "lucide-react";

export default function PortalDataExplorerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome & Extraction Banner */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Employee Table &amp; Data Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Direct open explorer for all enterprise database tables. Inspect spatial location records, agile backlogs, service tickets, and export live data to CSV anytime for daily reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-semibold">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>End-of-Day CSV Extract Enabled</span>
          </div>
        </div>
      </div>

      {/* Main Table Explorer Grid */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-16 text-slate-400 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Loading Data Explorer...</span>
          </div>
        }
      >
        <TableDataEditorTab initialTable="cmn_location" isPortalView={true} />
      </Suspense>
    </div>
  );
}
