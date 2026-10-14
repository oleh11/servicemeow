import React from "react";
import { TaskForm } from "@/components/m3/TaskForm";
import { RecordForm } from "@/components/workspace/RecordForm";
import { SpatialRecordForm } from "@/components/workspace/SpatialRecordForm";

const SPATIAL_TABLES = new Set([
  "cmn_region",
  "cmn_state",
  "cmn_campus",
  "cmn_building",
  "cmn_floor",
  "cmn_space",
  "cmn_location",
  "cmn_reservation",
]);

export default async function TableRecordPage({
  params,
}: {
  params: Promise<{ table: string; id: string }>;
}) {
  const { table, id } = await params;
  if (table === "incident" || table === "task") {
    return <TaskForm tableName={table} recordId={id} />;
  }
  if (SPATIAL_TABLES.has(table)) {
    return <SpatialRecordForm tableName={table} recordId={id} />;
  }
  return <RecordForm tableName={table} recordId={id} />;
}
