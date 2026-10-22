import React from "react";
import { MorningChecksConsole } from "@/components/workspace/MorningChecksConsole";

export const metadata = {
  title: "Shift Operational Rounds & Morning Checks | ServiceMeow",
  description:
    "Shift-based infrastructure readiness verification and morning checks console with 1-click incident escalation.",
};

export const dynamic = "force-dynamic";

export default function MorningChecksPage() {
  return <MorningChecksConsole />;
}
