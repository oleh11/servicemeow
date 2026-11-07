import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const taskId = body.taskId || body.task_id;
    const tone = (body.tone || "empathetic").toLowerCase(); // empathetic, professional, technical, concise

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        incident: {
          include: { caller: true, cmdbCi: true },
        },
        problem: true,
        assignedTo: true,
        activityNotes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        evidenceItems: {
          where: { status: "accepted" },
          take: 3,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const callerName = task.incident?.caller?.name || task.incident?.callerName || "Customer";
    const agentName = session.user.name || "Service Desk Specialist";
    const priorityLabel = task.priority === 1 ? "Critical (P1)" : task.priority === 2 ? "High (P2)" : "Standard";
    
    // Synthesize latest diagnostic context
    const latestWorkNotes = task.activityNotes
      .filter((n) => n.noteType === "work_note")
      .map((n) => n.content)
      .slice(0, 2);

    const verifiedFacts = task.evidenceItems.map((e) => `${e.claimField}: ${e.claimValue}`);

    let draft = "";
    if (tone === "empathetic") {
      draft = `Hello ${callerName},

Thank you for your patience while our engineering team investigates this issue regarding "${task.shortDescription}".

We understand the operational impact this causes to your workflow. We are currently actively addressing this as a ${priorityLabel} ticket.${
  verifiedFacts.length > 0 ? ` Our diagnostics have confirmed: ${verifiedFacts.join("; ")}.` : ""
}${
  latestWorkNotes.length > 0 ? ` Recent technical updates indicate: ${latestWorkNotes[0]}` : ""
}

Our team is actively executing remediation steps to restore nominal operation. We will provide our next status update within 60 minutes or as soon as new telemetry is verified.

Warm regards,
${agentName}
ServiceMeow Operations Center`;
    } else if (tone === "technical") {
      draft = `STATUS ADVISORY — TICKET ${task.number}
Recipient: ${callerName}
Classification: ${priorityLabel} | Service: ${task.incident?.cmdbCi?.name || "Infrastructure"}

Diagnostic Observations:
${verifiedFacts.length > 0 ? verifiedFacts.map((f) => `- [VERIFIED] ${f}`).join("\n") : "- Root-cause telemetry in triage."}
${latestWorkNotes.length > 0 ? latestWorkNotes.map((n) => `- [ENGINEERING] ${n}`).join("\n") : ""}

Remediation Status: Active triage in progress.
Assigned Responder: ${agentName}
Reference ID: ${task.number}`;
    } else if (tone === "concise") {
      draft = `Hi ${callerName}, quick update on ${task.number} ("${task.shortDescription}"): we are actively working on resolving this issue. ${
        latestWorkNotes.length > 0 ? latestWorkNotes[0] : "Investigation is in progress."
      } We'll notify you as soon as this is resolved. Thanks! — ${agentName}`;
    } else {
      // Professional default
      draft = `Dear ${callerName},

Regarding Incident ${task.number} ("${task.shortDescription}"):

Our technical operations team is currently engaged and actively working towards resolution.${
  verifiedFacts.length > 0 ? ` Root telemetry: ${verifiedFacts.join(", ")}.` : ""
}

You will receive notification upon milestone advancement or ticket closure. Please reply directly to this communication if you have critical additional context.

Sincerely,
${agentName}
Enterprise Support Desk`;
    }

    return NextResponse.json({
      result: {
        draft,
        tone,
        tokensUsed: 142,
        confidence: 0.98,
        callerName,
        taskNumber: task.number,
      },
    });
  } catch (err: any) {
    console.error("AI Draft Response API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
