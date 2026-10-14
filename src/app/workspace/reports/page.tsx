import React from "react";
import { ReportBuilder } from "@/components/reports/ReportBuilder";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ReportBuilder />
    </div>
  );
}
