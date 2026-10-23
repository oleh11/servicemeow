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

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const state = searchParams.get("state"); // "queued", "active", "all"
    const perspective = searchParams.get("perspective"); // "requester" or "agent"

    const isFulfiller = session.isAdmin || session.hasRole("itil");
    const isRequesterView = !isFulfiller || perspective === "requester";

    if (channelId) {
      const channel = await db.sysLiveChatChannel.findUnique({
        where: { id: channelId },
        include: {
          queue: true,
          requester: { select: { id: true, name: true, email: true, avatar: true, department: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      }

      // Requester privacy check: requester can only view their own channel
      if (!isFulfiller && channel.requesterId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const queuePosition =
        channel.state === "queued" ? await ChatService.getQueuePosition(channel.id) : 0;

      // Filter internal notes if requester view
      const safeChannel = {
        ...channel,
        queuePosition,
        messages: isRequesterView
          ? channel.messages.filter((m) => !m.isInternal)
          : channel.messages,
      };

      return NextResponse.json({ channel: safeChannel });
    }

    let where: any = {};
    if (isRequesterView) {
      // Employee / Portal view only sees their own sessions
      where.requesterId = session.user.id;
      if (state && state !== "all") {
        where.state = state;
      } else {
        where.state = { in: ["queued", "active"] };
      }
    } else {
      // Fulfiller sees queued and assigned active sessions
      if (state && state !== "all") {
        where.state = state;
      }
    }

    const channels = await db.sysLiveChatChannel.findMany({
      where,
      include: {
        queue: true,
        requester: { select: { id: true, name: true, email: true, avatar: true, department: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ channels });
  } catch (error: any) {
    console.error("Error in chat session GET:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { queueId, initialQuestion, subject } = body;

    const channel = await ChatService.initiateSession({
      requesterId: session.user.id,
      queueId,
      initialQuestion,
      subject,
    });

    const queuePosition = await ChatService.getQueuePosition(channel.id);

    return NextResponse.json({ channel: { ...channel, queuePosition } }, { status: 201 });
  } catch (error: any) {
    console.error("Error in chat session POST:", error);
    return NextResponse.json({ error: error.message || "Failed to start chat session" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, action, rating, feedback, senderType } = body;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const existing = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const isFulfiller = session.isAdmin || session.hasRole("itil");
    if (!isFulfiller && existing.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "typing") {
      const effectiveSenderType =
        senderType === "requester" || !isFulfiller ? "requester" : "agent";
      ChatService.sendTypingIndicator(channelId, session.user.name, effectiveSenderType);
      return NextResponse.json({ ok: true });
    }

    if (action === "resolve" || action === "rate") {
      const updated = await ChatService.resolveChat(
        channelId,
        existing.assignedToId || undefined,
        rating,
        feedback
      );
      return NextResponse.json({ channel: updated });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in chat session PATCH:", error);
    return NextResponse.json({ error: error.message || "Failed to update chat session" }, { status: 500 });
  }
}

