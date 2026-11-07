import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { ChatService } from "@/lib/chat-service";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isFulfiller = session.isAdmin || session.hasRole("itil");
    if (!isFulfiller) {
      return NextResponse.json({ error: "Forbidden: ITIL role required" }, { status: 403 });
    }

    await ChatService.ensureDefaults();

    // 1. Get or create agent presence
    const presence = await db.sysLiveChatPresence.upsert({
      where: { userId: session.user.id },
      update: { lastPingAt: new Date() },
      create: {
        userId: session.user.id,
        status: "online",
        activeChatsCount: 0,
      },
    });

    // 2. Fetch config
    const config = await db.sysLiveChatConfig.findUnique({
      where: { id: "global" },
    });

    // 3. Fetch queued sessions
    const queuedChannels = await db.sysLiveChatChannel.findMany({
      where: { state: "queued" },
      include: {
        queue: true,
        requester: { select: { id: true, name: true, email: true, avatar: true, department: true } },
      },
      orderBy: { waitStartedAt: "asc" },
      take: 20,
    });

    // 4. Fetch active sessions assigned to this fulfiller
    const activeChannels = await db.sysLiveChatChannel.findMany({
      where: {
        assignedToId: session.user.id,
        state: "active",
      },
      include: {
        queue: true,
        requester: { select: { id: true, name: true, email: true, avatar: true, department: true } },
      },
      orderBy: { acceptedAt: "desc" },
    });

    // 5. Fetch canned responses
    const cannedResponses = await db.sysCannedResponse.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { shortcut: "asc" }],
    });

    return NextResponse.json({
      presence,
      config: config || {
        maxConcurrentChatsPerAgent: 3,
        enabled: true,
        autoAbandonTimeoutSeconds: 600,
      },
      queuedChannels,
      activeChannels,
      cannedResponses,
    });
  } catch (error: any) {
    console.error("Error in agent chat GET:", error);
    return NextResponse.json({ error: error.message || "Failed to load agent workspace" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isFulfiller = session.isAdmin || session.hasRole("itil");
    if (!isFulfiller) {
      return NextResponse.json({ error: "Forbidden: ITIL role required" }, { status: 403 });
    }

    const json = await request.json();
    const { action, status, channelId, rating, feedback } = json;

    switch (action) {
      case "presence": {
        if (!status || !["online", "busy", "away", "offline"].includes(status)) {
          return NextResponse.json({ error: "Valid status required" }, { status: 400 });
        }
        const updatedPresence = await ChatService.setAgentPresence(session.user.id, status);
        return NextResponse.json({ presence: updatedPresence });
      }

      case "accept": {
        if (!channelId) {
          return NextResponse.json({ error: "channelId is required" }, { status: 400 });
        }
        const channel = await ChatService.acceptChat(channelId, session.user.id);
        return NextResponse.json({ channel });
      }

      case "resolve": {
        if (!channelId) {
          return NextResponse.json({ error: "channelId is required" }, { status: 400 });
        }
        const channel = await ChatService.resolveChat(channelId, session.user.id, rating, feedback);
        return NextResponse.json({ channel });
      }

      case "create_incident": {
        if (!channelId) {
          return NextResponse.json({ error: "channelId is required" }, { status: 400 });
        }
        const incidentTask = await ChatService.createIncidentFromChat(channelId, session.user.id);
        return NextResponse.json({ task: incidentTask });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in agent chat POST:", error);
    return NextResponse.json({ error: error.message || "Agent action failed" }, { status: 500 });
  }
}
