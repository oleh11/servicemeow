import React from "react";
import { CrmConsole } from "@/components/workspace/CrmConsole";

export const metadata = {
  title: "CRM & Accounts Cockpit | ServiceMeow",
  description: "Enterprise Customer Relationship Management, Deal Pipeline Kanban, and Accounts 360",
};

export default function CrmPage() {
  return <CrmConsole />;
}
