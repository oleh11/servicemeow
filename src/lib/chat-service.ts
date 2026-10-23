import { db } from "@/lib/db";
import { chatBus } from "./chat-bus";
import { getNextNumber } from "./numbering";

export interface InitiateChatParams {
  requesterId: string;
  queueId?: string;
  initialQuestion?: string;
  subject?: string;
}

export interface SendMessageParams {
  channelId: string;
  senderId?: string;
  senderName?: string;
  senderType: "requester" | "agent" | "system" | "bot";
  body: string;
  isInternal?: boolean;
}

export class ChatService {
  /**
   * Automatically initializes default queues, canned responses and config if none exist.
   */
  static async ensureDefaults() {
    const queueCount = await db.sysLiveChatQueue.count();
    if (queueCount === 0) {
      const itGroup = await db.group.findFirst({
        where: { name: { contains: "Service Desk" } },
      });

      await db.sysLiveChatQueue.createMany({
        data: [
          {
            name: "Global IT Service Desk",
            code: "it_service_desk",
            description: "Tier 1 hardware, network, software and authentication support",
            active: true,
            priority: 1,
            assignmentGroupId: itGroup?.id,
            maxWaitSeconds: 300,
            welcomeMessage: "Hello! You've reached ServiceMeow IT Support. An ITIL engineer will be with you shortly.",
            offlineMessage: "Live IT support is currently offline. Please submit an incident via the self-service portal.",
          },
          {
            name: "Workplace & Facilities Support",
            code: "workplace_facilities",
            description: "Room booking, HVAC, badge access, and facility operations",
            active: true,
            priority: 2,
            maxWaitSeconds: 600,
            welcomeMessage: "Hello! Welcome to Workplace & Facilities. How can we assist with your office or campus needs?",
            offlineMessage: "Facilities support is offline. For urgent maintenance, call the building operations hotline.",
          },
        ],
      });
    }

    const cannedCount = await db.sysCannedResponse.count();
    if (cannedCount === 0) {
      await db.sysCannedResponse.createMany({
        data: [
          {
            shortcut: "/greet",
            title: "Standard Professional Greeting",
            message: "Hello! Thank you for contacting ServiceMeow Support. My name is {{agent_name}}. How may I assist you today?",
            category: "general",
            active: true,
          },
          {
            shortcut: "/kb",
            title: "Knowledge Base Reference",
            message: "I've located a helpful Knowledge Article that addresses this issue. Please review: ",
            category: "troubleshooting",
            active: true,
          },
          {
            shortcut: "/hold",
            title: "Diagnostic Hold",
            message: "I am actively checking the system telemetry and event logs. May I place you on a brief 2-minute hold?",
            category: "troubleshooting",
            active: true,
          },
          {
            shortcut: "/screen_share",
            title: "Request Remote Assist",
            message: "Would you be open to a quick screen share session so I can inspect this directly?",
            category: "troubleshooting",
            active: true,
          },
          {
            shortcut: "/resolve",
            title: "Resolution & Wrap Up",
            message: "The issue has been diagnosed and resolved. Is there anything else I can assist you with today?",
            category: "closing",
            active: true,
          },
        ],
      });
    }

    await db.sysLiveChatConfig.upsert({
      where: { id: "global" },
      update: {},
      create: {
        id: "global",
        enabled: true,
        maxConcurrentChatsPerAgent: 3,
        autoAbandonTimeoutSeconds: 600,
        soundNotifications: true,
        operatingHoursSchedule: "24x7 Enterprise Support",
      },
    });
  }

  /**
   * Generates a unique CHAT-prefixed sequential identifier.
   */
  static async generateChatNumber(): Promise<string> {
    const lastChannel = await db.sysLiveChatChannel.findFirst({
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });
    if (lastChannel?.number?.startsWith("CHAT")) {
      const parsed = parseInt(lastChannel.number.replace("CHAT", ""), 10);
      if (!isNaN(parsed)) {
        return `CHAT${String(parsed + 1).padStart(7, "0")}`;
      }
    }
    const count = await db.sysLiveChatChannel.count();
    return `CHAT${String(count + 1001).padStart(7, "0")}`;
  }

  /**
   * Initiates a new chat session for a requester.
   */
  static async initiateSession({
    requesterId,
    queueId,
    initialQuestion,
    subject,
  }: InitiateChatParams) {
    await this.ensureDefaults();

    let targetQueue = queueId
      ? await db.sysLiveChatQueue.findUnique({ where: { id: queueId } })
      : await db.sysLiveChatQueue.findFirst({ where: { active: true }, orderBy: { priority: "asc" } });

    if (!targetQueue) {
      targetQueue = await db.sysLiveChatQueue.findFirst();
    }

    const requester = await db.user.findUnique({
      where: { id: requesterId },
      select: { id: true, name: true, email: true },
    });

    if (!requester) {
      throw new Error("Requester user not found");
    }

    const number = await this.generateChatNumber();
    const effectiveSubject = subject || initialQuestion?.slice(0, 80) || "General Technical Support";

    const channel = await db.sysLiveChatChannel.create({
      data: {
        number,
        queueId: targetQueue?.id,
        requesterId,
        state: "queued",
        subject: effectiveSubject,
        initialQuestion,
        waitStartedAt: new Date(),
      },
      include: {
        queue: true,
        requester: { select: { id: true, name: true, email: true, avatar: true, department: true } },
      },
    });

    // 1. If requester provided initial question, post it as the first message
    if (initialQuestion && initialQuestion.trim().length > 0) {
      await db.sysLiveChatMessage.create({
        data: {
          channelId: channel.id,
          senderId: requester.id,
          senderName: requester.name,
          senderType: "requester",
          body: initialQuestion.trim(),
          isInternal: false,
        },
      });
    }

    // 2. Post automated queue welcome message
    const welcomeMsg = targetQueue?.welcomeMessage || "Hello! An ITIL specialist will assist you shortly.";
    await db.sysLiveChatMessage.create({
      data: {
        channelId: channel.id,
        senderType: "system",
        senderName: "ServiceMeow Dispatcher",
        body: welcomeMsg,
        isInternal: false,
      },
    });

    // 3. Broadcast dispatch alert to fulfillers
    chatBus.broadcastChannel(channel.id, "dispatch", {
      channelId: channel.id,
      number: channel.number,
      subject: channel.subject,
      requesterName: requester.name,
      queueName: targetQueue?.name,
    });

    return channel;
  }

  /**
   * Fetches messages for a channel with privacy filtering.
   */
  static async getChannelMessages(channelId: string, isRequester = false) {
    const where: any = { channelId };
    if (isRequester) {
      where.isInternal = false;
    }

    return db.sysLiveChatMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Posts a new message into a live chat channel.
   */
  static async sendMessage({
    channelId,
    senderId,
    senderName,
    senderType,
    body,
    isInternal = false,
  }: SendMessageParams) {
    const channel = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error("Chat channel not found");
    }

    if (channel.state === "resolved" || channel.state === "abandoned") {
      throw new Error(`Cannot send message to a ${channel.state} chat session`);
    }

    const message = await db.sysLiveChatMessage.create({
      data: {
        channelId,
        senderId,
        senderName,
        senderType,
        body,
        isInternal,
      },
    });

    // Broadcast message to channel stream
    chatBus.broadcastChannel(channelId, "message", message);

    return message;
  }

  /**
   * Fulfiller accepts an incoming queued chat session.
   */
  static async acceptChat(channelId: string, agentId: string) {
    const agent = await db.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, email: true },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const channel = await db.sysLiveChatChannel.update({
      where: { id: channelId },
      data: {
        assignedToId: agent.id,
        state: "active",
        acceptedAt: new Date(),
      },
      include: {
        queue: true,
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Increment agent active chats count
    await db.sysLiveChatPresence.upsert({
      where: { userId: agent.id },
      update: {
        status: "online",
        activeChatsCount: { increment: 1 },
        lastPingAt: new Date(),
      },
      create: {
        userId: agent.id,
        status: "online",
        activeChatsCount: 1,
      },
    });

    // Add system notification message
    const sysMsg = await db.sysLiveChatMessage.create({
      data: {
        channelId,
        senderType: "system",
        senderName: "ServiceMeow Dispatcher",
        body: `${agent.name} has joined the conversation.`,
        isInternal: false,
      },
    });

    chatBus.broadcastChannel(channelId, "status", {
      state: "active",
      assignedTo: agent,
    });
    chatBus.broadcastChannel(channelId, "message", sysMsg);

    return channel;
  }

  /**
   * Resolves/concludes an active chat channel or updates post-chat CSAT rating.
   * Idempotent: if already resolved, updates rating/feedback without double-decrementing agent capacity.
   */
  static async resolveChat(
    channelId: string,
    agentId?: string,
    rating?: number,
    feedback?: string
  ) {
    const existing = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
    });

    if (!existing) {
      throw new Error("Channel not found");
    }

    const wasAlreadyResolved = existing.state === "resolved" || existing.state === "abandoned";

    const updated = await db.sysLiveChatChannel.update({
      where: { id: channelId },
      data: {
        state: "resolved",
        endedAt: existing.endedAt || new Date(),
        rating: rating !== undefined ? Number(rating) : existing.rating,
        feedback: feedback !== undefined ? feedback : existing.feedback,
      },
      include: {
        queue: true,
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!wasAlreadyResolved) {
      // Decrement agent's active chats count if assigned
      const effectiveAgentId = agentId || existing.assignedToId;
      if (effectiveAgentId) {
        const presence = await db.sysLiveChatPresence.findUnique({
          where: { userId: effectiveAgentId },
        });
        if (presence && presence.activeChatsCount > 0) {
          await db.sysLiveChatPresence.update({
            where: { userId: effectiveAgentId },
            data: {
              activeChatsCount: Math.max(0, presence.activeChatsCount - 1),
            },
          });
        }
      }

      // Add closing message only on first resolution transition
      const closeMsg = await db.sysLiveChatMessage.create({
        data: {
          channelId,
          senderType: "system",
          senderName: "ServiceMeow Dispatcher",
          body: "The chat session has been resolved. Thank you for using ServiceMeow Live Support.",
          isInternal: false,
        },
      });
      chatBus.broadcastChannel(channelId, "message", closeMsg);
    }

    chatBus.broadcastChannel(channelId, "status", {
      state: "resolved",
      endedAt: updated.endedAt,
      rating: updated.rating,
      feedback: updated.feedback,
    });

    return updated;
  }

  /**
   * Broadcasts a non-persistent typing indicator event to channel subscribers.
   */
  static sendTypingIndicator(
    channelId: string,
    senderName: string,
    senderType: "requester" | "agent"
  ) {
    chatBus.broadcastChannel(channelId, "typing", {
      channelId,
      senderName,
      senderType,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Computes 1-indexed queue position for a waiting channel.
   */
  static async getQueuePosition(channelId: string): Promise<number> {
    const channel = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
      select: { state: true, queueId: true, waitStartedAt: true },
    });
    if (!channel || channel.state !== "queued") return 0;

    const aheadCount = await db.sysLiveChatChannel.count({
      where: {
        state: "queued",
        ...(channel.queueId ? { queueId: channel.queueId } : {}),
        waitStartedAt: { lt: channel.waitStartedAt },
      },
    });
    return aheadCount + 1;
  }

  /**
   * Creates a formal ITIL Incident and Task record from a live chat channel.
   * Public messages populate the customer-visible description; internal whisper notes
   * are stored strictly as internal JournalEntry work_notes to preserve Persona Segregation.
   */
  static async createIncidentFromChat(channelId: string, agentId: string) {
    const channel = await db.sysLiveChatChannel.findUnique({
      where: { id: channelId },
      include: {
        requester: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    const publicMessages = channel.messages.filter((m) => !m.isInternal);
    const internalMessages = channel.messages.filter((m) => m.isInternal);

    // Build customer-safe public transcript for ticket description
    const publicTranscript = publicMessages
      .map((m) => {
        const time = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `[${time}] ${m.senderName || m.senderType}: ${m.body}`;
      })
      .join("\n");

    const taskNumber = await getNextNumber("INC");

    const itGroup = await db.group.findFirst({
      where: { name: { contains: "Service Desk" } },
    });

    // Create Task and Incident
    const task = await db.task.create({
      data: {
        number: taskNumber,
        sysClassName: "incident",
        shortDescription: channel.subject || `Live Chat Escalation: ${channel.number}`,
        description: `Created from Live Agent Chat session ${channel.number}.\n\n--- Public Chat Transcript ---\n${publicTranscript}`,
        priority: 3,
        state: 2, // In Progress
        impact: 2,
        urgency: 2,
        openedById: channel.requesterId,
        assignedToId: agentId,
        assignmentGroupId: itGroup?.id,
        incident: {
          create: {
            callerId: channel.requesterId,
            category: "inquiry",
            severity: 3,
          },
        },
      },
    });

    // Preserve internal whisper notes strictly as internal ActivityNote work_note entries
    for (const internalMsg of internalMessages) {
      await db.activityNote.create({
        data: {
          taskId: task.id,
          authorId: internalMsg.senderId || agentId,
          noteType: "work_note",
          content: `[Live Chat Whisper Note - ${channel.number}] ${internalMsg.body}`,
        },
      });
    }

    // Link Incident ID to chat channel
    await db.sysLiveChatChannel.update({
      where: { id: channelId },
      data: { incidentId: task.number },
    });

    // Notify chat participants
    const notice = await db.sysLiveChatMessage.create({
      data: {
        channelId,
        senderType: "system",
        senderName: "ServiceMeow Dispatcher",
        body: `Incident ticket ${task.number} has been generated from this chat session.`,
        isInternal: false,
      },
    });

    chatBus.broadcastChannel(channelId, "message", notice);
    chatBus.broadcastChannel(channelId, "status", {
      incidentId: task.number,
      incidentTaskId: task.id,
    });

    return task;
  }

  /**
   * Sets the live presence status for an ITIL fulfiller.
   */
  static async setAgentPresence(
    userId: string,
    status: "online" | "busy" | "away" | "offline"
  ) {
    const presence = await db.sysLiveChatPresence.upsert({
      where: { userId },
      update: {
        status,
        lastPingAt: new Date(),
      },
      create: {
        userId,
        status,
        activeChatsCount: 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    chatBus.broadcastAgent(userId, "presence", presence);
    return presence;
  }
}
