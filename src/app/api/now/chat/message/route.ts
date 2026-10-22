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

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const channel = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const isFulfiller = session.isAdmin || session.hasRole("itil");
    if (!isFulfiller && channel.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await ChatService.getChannelMessages(channelId, !isFulfiller);

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Error in chat message GET:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { channelId, body, isInternal } = json;

    if (!channelId || !body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "channelId and body are required" }, { status: 400 });
    }

    const channel = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const isFulfiller = session.isAdmin || session.hasRole("itil");

    // Requester authorization check
    if (!isFulfiller && channel.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only fulfillers/admins can post internal whisper notes
    const effectiveIsInternal = isFulfiller ? Boolean(isInternal) : false;
    const senderType = isFulfiller ? "agent" : "requester";

    const message = await ChatService.sendMessage({
      channelId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderType,
      body: body.trim(),
      isInternal: effectiveIsInternal,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("Error in chat message POST:", error);
    return NextResponse.json({ error: error.message || "Failed to post message" }, { status: 500 });
  }
}
