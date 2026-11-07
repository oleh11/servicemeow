import React from "react";
import { WatchtowerCockpit } from "@/components/workspace/WatchtowerCockpit";

export const metadata = {
  title: "Watchtower Operational Attention Cockpit | ServiceMeow",
  description:
    "Unified real-time attention engine aggregating P1/P2 incidents, breaching SLAs, CAB approvals, problems, and morning checks.",
};

export const dynamic = "force-dynamic";

export default function WatchtowerPage() {
  return <WatchtowerCockpit />;
}
