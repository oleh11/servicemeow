"use client";

import React from "react";
import { AgileProjectBoard } from "@/components/agile/AgileProjectBoard";

export default function WorkspaceAgilePage() {
  return (
    <div className="p-4 sm:p-6 max-w-[1720px] mx-auto w-full min-h-[calc(100vh-120px)]">
      <AgileProjectBoard />
    </div>
  );
}
