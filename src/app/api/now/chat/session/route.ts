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
      if (!session.isAdmin && !session.hasRole("itil") && channel.requesterId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Filter internal notes if requester
      const isRequester = !session.isAdmin && !session.hasRole("itil");
      const safeChannel = {
        ...channel,
        messages: isRequester
          ? channel.messages.filter((m) => !m.isInternal)
          : channel.messages,
      };

      return NextResponse.json({ channel: safeChannel });
    }

    const isFulfiller = session.isAdmin || session.hasRole("itil");

    let where: any = {};
    if (!isFulfiller) {
      // Employee only sees their own sessions
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

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error: any) {
    console.error("Error in chat session POST:", error);
    return NextResponse.json({ error: error.message || "Failed to start chat session" }, { status: 500 });
  }
}
