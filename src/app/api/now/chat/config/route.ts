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

    await ChatService.ensureDefaults();

    const queues = await db.sysLiveChatQueue.findMany({
      include: {
        assignmentGroup: { select: { id: true, name: true } },
        _count: { select: { channels: true } },
      },
      orderBy: { priority: "asc" },
    });

    const cannedResponses = await db.sysCannedResponse.findMany({
      orderBy: [{ category: "asc" }, { shortcut: "asc" }],
    });

    const config = await db.sysLiveChatConfig.findUnique({
      where: { id: "global" },
    });

    const groups = await db.group.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      queues,
      cannedResponses,
      config: config || {
        enabled: true,
        maxConcurrentChatsPerAgent: 3,
        autoAbandonTimeoutSeconds: 600,
        soundNotifications: true,
        operatingHoursSchedule: "24x7 Enterprise Support",
      },
      groups,
    });
  } catch (error: any) {
    console.error("Error in chat config GET:", error);
    return NextResponse.json({ error: error.message || "Failed to load config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be admin or itil_admin to mutate configuration
    const canConfigure = session.isAdmin || session.hasRole("itil_admin");
    if (!canConfigure) {
      return NextResponse.json({ error: "Forbidden: Administrator role required" }, { status: 403 });
    }

    const json = await request.json();
    const { entity, action, data, id } = json;

    switch (entity) {
      case "queue": {
        if (action === "create") {
          const queue = await db.sysLiveChatQueue.create({
            data: {
              name: data.name,
              code: data.code,
              description: data.description,
              active: data.active ?? true,
              priority: Number(data.priority) || 1,
              assignmentGroupId: data.assignmentGroupId || null,
              maxWaitSeconds: Number(data.maxWaitSeconds) || 300,
              welcomeMessage: data.welcomeMessage || "Hello! An ITIL specialist will assist you shortly.",
              offlineMessage: data.offlineMessage || "All agents are currently offline.",
            },
          });
          return NextResponse.json({ queue }, { status: 201 });
        } else if (action === "update") {
          const queue = await db.sysLiveChatQueue.update({
            where: { id },
            data: {
              name: data.name,
              description: data.description,
              active: data.active,
              priority: data.priority !== undefined ? Number(data.priority) : undefined,
              assignmentGroupId: data.assignmentGroupId !== undefined ? data.assignmentGroupId : undefined,
              maxWaitSeconds: data.maxWaitSeconds !== undefined ? Number(data.maxWaitSeconds) : undefined,
              welcomeMessage: data.welcomeMessage,
              offlineMessage: data.offlineMessage,
            },
          });
          return NextResponse.json({ queue });
        } else if (action === "delete") {
          await db.sysLiveChatQueue.delete({ where: { id } });
          return NextResponse.json({ success: true });
        }
        break;
      }

      case "canned": {
        if (action === "create") {
          const canned = await db.sysCannedResponse.create({
            data: {
              shortcut: data.shortcut,
              title: data.title,
              message: data.message,
              category: data.category || "general",
              active: data.active ?? true,
            },
          });
          return NextResponse.json({ canned }, { status: 201 });
        } else if (action === "update") {
          const canned = await db.sysCannedResponse.update({
            where: { id },
            data: {
              shortcut: data.shortcut,
              title: data.title,
              message: data.message,
              category: data.category,
              active: data.active,
            },
          });
          return NextResponse.json({ canned });
        } else if (action === "delete") {
          await db.sysCannedResponse.delete({ where: { id } });
          return NextResponse.json({ success: true });
        }
        break;
      }

      case "config": {
        const config = await db.sysLiveChatConfig.upsert({
          where: { id: "global" },
          update: {
            enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
            maxConcurrentChatsPerAgent: data.maxConcurrentChatsPerAgent !== undefined ? Number(data.maxConcurrentChatsPerAgent) : 3,
            autoAbandonTimeoutSeconds: data.autoAbandonTimeoutSeconds !== undefined ? Number(data.autoAbandonTimeoutSeconds) : 600,
            soundNotifications: data.soundNotifications !== undefined ? Boolean(data.soundNotifications) : true,
            operatingHoursSchedule: data.operatingHoursSchedule || "24x7 Enterprise Support",
          },
          create: {
            id: "global",
            enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
            maxConcurrentChatsPerAgent: data.maxConcurrentChatsPerAgent !== undefined ? Number(data.maxConcurrentChatsPerAgent) : 3,
            autoAbandonTimeoutSeconds: data.autoAbandonTimeoutSeconds !== undefined ? Number(data.autoAbandonTimeoutSeconds) : 600,
            soundNotifications: data.soundNotifications !== undefined ? Boolean(data.soundNotifications) : true,
            operatingHoursSchedule: data.operatingHoursSchedule || "24x7 Enterprise Support",
          },
        });
        return NextResponse.json({ config });
      }

      default:
        return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in chat config POST:", error);
    return NextResponse.json({ error: error.message || "Configuration update failed" }, { status: 500 });
  }
}
