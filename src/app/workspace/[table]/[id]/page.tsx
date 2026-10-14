import React from "react";
import { TaskForm } from "@/components/m3/TaskForm";
import { RecordForm } from "@/components/workspace/RecordForm";

export default async function TableRecordPage({
  params,
}: {
  params: Promise<{ table: string; id: string }>;
}) {
  const { table, id } = await params;
  if (table === "incident" || table === "task") {
    return <TaskForm tableName={table} recordId={id} />;
  }
  return <RecordForm tableName={table} recordId={id} />;
}
