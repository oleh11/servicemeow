import React from "react";
import { TaskForm } from "@/components/m3/TaskForm";
import { M3NavigationRail } from "@/components/m3/M3NavigationRail";

export default async function M3TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen bg-[var(--md-sys-color-surface)]">
      <M3NavigationRail />
      <div className="flex-1 flex flex-col min-w-0">
        <TaskForm tableName="incident" recordId={id} />
      </div>
    </div>
  );
}
