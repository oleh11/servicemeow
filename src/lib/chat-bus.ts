import { EventEmitter } from "node:events";

export interface ChatStreamEvent {
  type: "message" | "status" | "dispatch" | "typing" | "presence" | "ping";
  channelId?: string;
  data: any;
  timestamp: string;
}

type EventListener = (event: ChatStreamEvent) => void;

class ChatEventBus {
  private channelSubscribers: Map<string, Set<EventListener>> = new Map();
  private agentSubscribers: Map<string, Set<EventListener>> = new Map();
  private globalSubscribers: Set<EventListener> = new Set();

  /**
   * Subscribe to events for a specific chat channel.
   * Returns an unsubscribe callback function.
   */
  public subscribeChannel(channelId: string, listener: EventListener): () => void {
    if (!this.channelSubscribers.has(channelId)) {
      this.channelSubscribers.set(channelId, new Set());
    }
    const set = this.channelSubscribers.get(channelId)!;
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.channelSubscribers.delete(channelId);
      }
    };
  }

  /**
   * Subscribe an ITIL agent to live dispatch alerts and assigned updates.
   */
  public subscribeAgent(agentId: string, listener: EventListener): () => void {
    if (!this.agentSubscribers.has(agentId)) {
      this.agentSubscribers.set(agentId, new Set());
    }
    const set = this.agentSubscribers.get(agentId)!;
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.agentSubscribers.delete(agentId);
      }
    };
  }

  /**
   * Subscribe to all live dispatch events (for queue cockpits / dispatchers).
   */
  public subscribeGlobal(listener: EventListener): () => void {
    this.globalSubscribers.add(listener);
    return () => {
      this.globalSubscribers.delete(listener);
    };
  }

  /**
   * Broadcast an event to channel subscribers and global listeners.
   */
  public broadcastChannel(channelId: string, type: ChatStreamEvent["type"], data: any) {
    const event: ChatStreamEvent = {
      type,
      channelId,
      data,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.channelSubscribers.get(channelId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (err) {
          console.error("Error in chat listener:", err);
        }
      }
    }

    // Also broadcast to global dispatch listeners
    for (const listener of this.globalSubscribers) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in global chat listener:", err);
      }
    }
  }

  /**
   * Broadcast an event specifically to an assigned agent or targeted agent.
   */
  public broadcastAgent(agentId: string, type: ChatStreamEvent["type"], data: any) {
    const event: ChatStreamEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.agentSubscribers.get(agentId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (err) {
          console.error("Error in agent listener:", err);
        }
      }
    }
  }
}

// Preserve singleton across fast refresh in development
const globalForChatBus = globalThis as unknown as { chatBus: ChatEventBus | undefined };
export const chatBus = globalForChatBus.chatBus ?? new ChatEventBus();
if (process.env.NODE_ENV !== "production") globalForChatBus.chatBus = chatBus;
