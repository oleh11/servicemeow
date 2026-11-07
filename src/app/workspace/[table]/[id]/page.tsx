import React from "react";
import { TaskForm } from "@/components/m3/TaskForm";
import { RecordForm } from "@/components/workspace/RecordForm";
import { SpatialRecordForm } from "@/components/workspace/SpatialRecordForm";
import { CmdbCiForm } from "@/components/workspace/CmdbCiForm";
import { ProblemForm } from "@/components/workspace/ProblemForm";
import { KnowledgeArticleForm } from "@/components/workspace/KnowledgeArticleForm";
import { KnowledgeBaseForm } from "@/components/workspace/KnowledgeBaseForm";
import { AgileStoryForm } from "@/components/workspace/AgileStoryForm";
import { AgileSprintForm } from "@/components/workspace/AgileSprintForm";
import { AgileEpicForm } from "@/components/workspace/AgileEpicForm";

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

  if (table === "cmdb_ci") {
    return <CmdbCiForm recordId={id} />;
  }

  if (table === "problem") {
    return <ProblemForm recordId={id} />;
  }

  if (table === "kb_knowledge") {
    return <KnowledgeArticleForm recordId={id} />;
  }

  if (table === "kb_knowledge_base") {
    return <KnowledgeBaseForm recordId={id} />;
  }

  if (table === "rm_story") {
    return <AgileStoryForm recordId={id} />;
  }

  if (table === "rm_sprint") {
    return <AgileSprintForm recordId={id} />;
  }

  if (table === "rm_epic") {
    return <AgileEpicForm recordId={id} />;
  }

  if (table === "incident" || table === "task") {
    return <TaskForm tableName={table} recordId={id} />;
  }

  if (SPATIAL_TABLES.has(table)) {
    return <SpatialRecordForm tableName={table} recordId={id} />;
  }

  return <RecordForm tableName={table} recordId={id} />;
}
