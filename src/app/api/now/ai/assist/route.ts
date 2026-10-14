import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, record } = body;

    if (!action || !record) {
      return NextResponse.json(
        { error: "action and record payload are required" },
        { status: 400 }
      );
    }

    const number = record.number || "INC0001001";
    const shortDesc = record.shortDescription || record.short_description || "System Service Issue";
    const desc = record.description || "User reported unexpected degradation.";
    const category = record.category || "software";
    const priority = record.priority || 3;
    const notes = Array.isArray(record.activityNotes) ? record.activityNotes : [];

    const notesSummary = notes.length > 0
      ? notes
          .slice(0, 3)
          .map((n: any) => `• [${n.noteType || "note"}] ${n.content?.substring(0, 80) || ""}`)
          .join("\n")
      : "• No previous work notes recorded.";

    if (action === "summarize") {
      const summaryText = `🐱✨ **Purr-Assist AI • Executive Handoff Summary**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Incident Reference**: ${number} (Priority P${priority})
• **Domain Category**: ${category.toUpperCase()}
• **Primary Symptom**: ${shortDesc}
• **Technical Context**: ${desc}
• **Recent Activity**:
${notesSummary}
• **Recommended Next Step**: Verify upstream dependencies in CMDB and continue triage with assigned engineering group. SLA breach timeline is actively monitored.`;

      return NextResponse.json({
        result: {
          action: "summarize",
          summary: summaryText,
        },
      });
    }

    if (action === "propose_resolution") {
      let rootCause = "Transient service degradation or memory leak detected.";
      let remedy = "Recycled worker processes, purged stale cache pools, and re-authenticated downstream API endpoints.";
      let code = "Solved (Permanently)";

      if (category === "network") {
        rootCause = "High latency and dropped packets on core edge gateway interface.";
        remedy = "Flushed DNS resolver caches, rerouted traffic through backup spine switch, and verified packet loss returned to 0%.";
      } else if (category === "database") {
        rootCause = "Connection pool exhaustion caused by unindexed batch query locks.";
        remedy = "Terminated idle blocker connections, added missing composite index, and restarted connection poolers.";
      } else if (category === "hardware") {
        rootCause = "Faulty physical transceiver or overheating sensor alert.";
        remedy = "Replaced fiber optic SFP+ transceiver and verified link integrity on interface.";
      } else if (category === "inquiry") {
        rootCause = "User configuration misconception regarding standard operational workflow.";
        remedy = "Provided knowledge base guidance, shared self-service documentation, and validated user access.";
        code = "Solved (Work Around)";
      }

      const closeNotesText = `Root Cause: ${rootCause}\nCorrective Action: ${remedy}\nVerification: Post-mitigation telemetry confirms standard SLA thresholds restored.`;

      const workNoteStamp = `🐱✨ **Purr-Assist AI • Autonomous Resolution Proposal**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Root Cause Analysis**: ${rootCause}
• **Applied Solution**: ${remedy}
• **Recommended Close Code**: ${code}
• **Status**: Remediation steps verified against ServiceMeow ITIL standard operating procedures.`;

      return NextResponse.json({
        result: {
          action: "propose_resolution",
          summary: workNoteStamp,
          closeNotes: closeNotesText,
          closeCode: code,
        },
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
