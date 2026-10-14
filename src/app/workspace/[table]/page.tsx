import React from "react";
import { RecordList } from "@/components/workspace/RecordList";

export default async function TableListPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;

  const tableTitles: Record<string, string> = {
    incident: "Incident Management",
    change_request: "Change Requests",
    problem: "Problem Management",
    sc_task: "Service Catalog Tasks",
    cmdb_ci: "Configuration Items (CMDB)",
    task: "All Platform Tasks",
  };

  const title = tableTitles[table] || `${table.toUpperCase()} Records`;

  return <RecordList tableName={table} tableTitle={title} />;
}
