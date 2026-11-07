import React from "react";
import { ReportBuilder } from "@/components/reports/ReportBuilder";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-100 min-h-screen text-black font-sans">
      <ReportBuilder />
    </div>
  );
}
