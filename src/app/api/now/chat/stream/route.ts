import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { chatBus, ChatStreamEvent } from "@/lib/chat-bus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const mode = searchParams.get("mode"); // "agent" or "channel"

    const isFulfiller = session.isAdmin || session.hasRole("itil");

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // 1. Send initial connection established event
        const initialData = `event: connected\ndata: ${JSON.stringify({
          status: "connected",
          userId: session.user.id,
          channelId,
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(initialData));

        const eventHandler = (event: ChatStreamEvent) => {
          if (isClosed) return;
          try {
            // For requesters, do not stream internal whisper notes
            if (!isFulfiller && event.data?.isInternal) {
              return;
            }

            const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch (err) {
            console.error("Error enqueueing SSE event:", err);
          }
        };

        const cleanups: (() => void)[] = [];

        // Subscribe to channel events if channelId is specified
        if (channelId) {
          cleanups.push(chatBus.subscribeChannel(channelId, eventHandler));
        }

        // Subscribe to agent alerts if user is fulfiller and mode is agent or global
        if (isFulfiller && (mode === "agent" || !channelId)) {
          cleanups.push(chatBus.subscribeAgent(session.user.id, eventHandler));
          cleanups.push(chatBus.subscribeGlobal(eventHandler));
        }

        // 15-second heartbeat ping to keep HTTP/2 and reverse proxies alive
        const pingInterval = setInterval(() => {
          if (isClosed) {
            clearInterval(pingInterval);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`));
          } catch {
            isClosed = true;
            clearInterval(pingInterval);
          }
        }, 15000);

        // Abort cleanup handler
        request.signal.addEventListener("abort", () => {
          isClosed = true;
          clearInterval(pingInterval);
          for (const cleanup of cleanups) {
            cleanup();
          }
          try {
            controller.close();
          } catch {}
        });
      },
      cancel() {
        isClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Error in SSE chat stream:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
