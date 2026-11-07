"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Download,
  Star,
  CheckCircle2,
  Clock,
  Minimize2,
  Maximize2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface LiveChatMessage {
  id: string;
  senderType: "requester" | "agent" | "system" | "bot";
  senderName?: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

interface LiveChatQueue {
  id: string;
  name: string;
  code: string;
  description?: string;
  welcomeMessage?: string;
  active: boolean;
}

interface LiveChatChannel {
  id: string;
  number: string;
  state: "queued" | "active" | "resolved" | "abandoned";
  subject?: string;
  assignedTo?: { id: string; name: string; email: string };
  queue?: LiveChatQueue;
  incidentId?: string;
  incidentTaskId?: string;
  rating?: number;
  queuePosition?: number;
  waitStartedAt?: string;
}

export function PortalLiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [queues, setQueues] = useState<LiveChatQueue[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [initialQuestion, setInitialQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<LiveChatChannel | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [csatRating, setCsatRating] = useState<number | null>(null);
  const [csatFeedback, setCsatFeedback] = useState("");
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [agentTypingName, setAgentTypingName] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, channel?.state, agentTypingName]);

  // Load available queues AND resume any active/queued session on mount
  useEffect(() => {
    async function initChatWidget() {
      try {
        const [configRes, sessionRes] = await Promise.all([
          fetch("/api/now/chat/config"),
          fetch("/api/now/chat/session?perspective=requester"),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          if (data.config && data.config.enabled === false) {
            setWidgetEnabled(false);
          }
          const activeQueues = (data.queues || []).filter((q: LiveChatQueue) => q.active);
          setQueues(activeQueues);
          if (activeQueues.length > 0) {
            setSelectedQueueId(activeQueues[0].id);
          }
        }

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.channel && (sessionData.channel.state === "queued" || sessionData.channel.state === "active")) {
            setChannel(sessionData.channel);
            const msgRes = await fetch(
              `/api/now/chat/message?channelId=${sessionData.channel.id}&perspective=requester`
            );
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              setMessages(msgData.messages || []);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize chat widget:", err);
      }
    }
    initChatWidget();
  }, []);

  // Elapsed wait timer when queued
  useEffect(() => {
    if (!channel || channel.state !== "queued") {
      setWaitSeconds(0);
      return;
    }
    const startMs = channel.waitStartedAt ? new Date(channel.waitStartedAt).getTime() : Date.now();
    const updateWait = () => {
      setWaitSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    updateWait();
    const timer = setInterval(updateWait, 1000);
    return () => clearInterval(timer);
  }, [channel?.id, channel?.state, channel?.waitStartedAt]);

  // Connect Server-Sent Events stream when in an active/queued channel
  useEffect(() => {
    if (!channel || channel.state === "resolved" || channel.state === "abandoned") {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const sse = new EventSource(
      `/api/now/chat/stream?channelId=${channel.id}&perspective=requester`
    );
    eventSourceRef.current = sse;

    sse.addEventListener("connected", () => {
      setIsConnected(true);
    });

    sse.addEventListener("message", (e) => {
      try {
        const newMsg: LiveChatMessage = JSON.parse(e.data);
        if (newMsg.isInternal) return;
        setAgentTypingName(null);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch (err) {
        console.error("Error parsing chat SSE message:", err);
      }
    });

    sse.addEventListener("typing", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.senderType === "agent") {
          setAgentTypingName(data.senderName || "Support Specialist");
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setAgentTypingName(null);
          }, 3000);
        }
      } catch {}
    });

    sse.addEventListener("status", (e) => {
      try {
        const statusUpdate = JSON.parse(e.data);
        setChannel((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            state: statusUpdate.state || prev.state,
            assignedTo: statusUpdate.assignedTo || prev.assignedTo,
            incidentId: statusUpdate.incidentId || prev.incidentId,
            incidentTaskId: statusUpdate.incidentTaskId || prev.incidentTaskId,
          };
        });
      } catch (err) {
        console.error("Error parsing chat SSE status:", err);
      }
    });

    sse.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      sse.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [channel?.id, channel?.state]);

  // Start chat session
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialQuestion.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/now/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: selectedQueueId,
          initialQuestion: initialQuestion.trim(),
          subject: initialQuestion.trim().slice(0, 60),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChannel(data.channel);

        // Fetch initial messages with requester perspective
        const msgRes = await fetch(
          `/api/now/chat/message?channelId=${data.channel.id}&perspective=requester`
        );
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setLoading(false);
    }
  };

  // Broadcast requester typing event (throttled to once per 2s)
  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!channel || channel.state !== "active" || !val.trim()) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      fetch("/api/now/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "typing",
          channelId: channel.id,
          senderType: "requester",
        }),
      }).catch(() => {});
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !channel) return;

    const textToSend = inputText.trim();
    setInputText("");

    try {
      const res = await fetch("/api/now/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          body: textToSend,
          senderType: "requester",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // End chat (uses requester-authorized PATCH /api/now/chat/session)
  const handleEndChat = async () => {
    if (!channel) return;

    try {
      const res = await fetch("/api/now/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          channelId: channel.id,
        }),
      });
      if (res.ok) {
        setChannel((prev) => (prev ? { ...prev, state: "resolved" } : null));
      }
    } catch (err) {
      console.error("Failed to end chat:", err);
    }
  };

  // Submit CSAT rating (uses requester-authorized PATCH /api/now/chat/session)
  const handleSubmitRating = async () => {
    if (!channel || !csatRating) return;
    try {
      const res = await fetch("/api/now/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate",
          channelId: channel.id,
          rating: csatRating,
          feedback: csatFeedback,
        }),
      });
      if (res.ok) {
        setCsatSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }
  };

  // Download transcript
  const handleDownloadTranscript = () => {
    if (!channel) return;
    const lines = [
      `======================================================`,
      `ServiceMeow Live Support Transcript`,
      `Session Number: ${channel.number}`,
      `Date: ${new Date().toLocaleString()}`,
      `Topic: ${channel.subject || "General Support"}`,
      `Assigned Agent: ${channel.assignedTo?.name || "Unassigned"}`,
      channel.incidentId ? `Linked Ticket: ${channel.incidentId}` : "",
      `======================================================\n`,
      ...messages
        .filter((m) => !m.isInternal)
        .map((m) => {
          const time = new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `[${time}] ${m.senderName || m.senderType.toUpperCase()}: ${m.body}`;
        }),
      `\n======================================================`,
      `End of Transcript`,
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${channel.number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setChannel(null);
    setMessages([]);
    setInitialQuestion("");
    setCsatRating(null);
    setCsatFeedback("");
    setCsatSubmitted(false);
    setAgentTypingName(null);
  };

  const formatWaitTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
  };

  if (!widgetEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-5 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-neutral-700 dark:border-neutral-300 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 group"
          aria-label="Open Live Support Chat"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold">
              {channel && channel.state !== "resolved" ? `Active • ${channel.number}` : "01 / Support"}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider">Live Agent Chat</div>
          </div>
        </button>
      )}

      {/* Chat Window Box */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 shadow-2xl transition-all duration-200 ${
            isMinimized ? "w-80 h-14" : "w-[380px] sm:w-[420px] h-[580px]"
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white border-b border-neutral-800 select-none">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  channel?.state === "active"
                    ? "bg-green-500 animate-pulse"
                    : channel?.state === "queued"
                    ? "bg-amber-400 animate-ping"
                    : "bg-green-500"
                }`}
              />
              <div>
                <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span>Live Agent Support</span>
                  {channel && (
                    <span className="font-mono text-neutral-400 text-[10px]">[{channel.number}]</span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {channel?.state === "active"
                    ? `Connected with ${channel.assignedTo?.name || "Support Specialist"}`
                    : channel?.state === "queued"
                    ? `Queued • Waiting ${formatWaitTime(waitSeconds)}`
                    : channel?.state === "resolved"
                    ? "Chat Session Concluded"
                    : "ITIL Service Desk Online"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* VIEW 1: Start Chat Intake Form */}
              {!channel && (
                <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="border-l-2 border-red-600 pl-3">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
                        Direct ITIL Engineering Desk
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Connect immediately with an on-duty operations specialist for live diagnosis and issue resolution.
                      </p>
                    </div>

                    {/* Queue Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Support Queue
                      </label>
                      <select
                        value={selectedQueueId}
                        onChange={(e) => setSelectedQueueId(e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-neutral-900 dark:focus:border-white font-medium text-neutral-900 dark:text-white"
                      >
                        {queues.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Initial Question */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Describe Your Issue or Request
                      </label>
                      <textarea
                        rows={4}
                        value={initialQuestion}
                        onChange={(e) => setInitialQuestion(e.target.value)}
                        placeholder="e.g., Cannot connect to corporate VPN after password reset, getting error 403..."
                        className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-neutral-900 dark:focus:border-white font-medium text-neutral-900 dark:text-white resize-none"
                      />
                    </div>

                    <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      <span>
                        Average response time: <strong>&lt; 2 minutes</strong> during business hours.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartChat}
                    disabled={loading || !initialQuestion.trim()}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors mt-4"
                  >
                    {loading ? (
                      <span>Initiating Session...</span>
                    ) : (
                      <>
                        <span>Connect to Live Agent</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* VIEW 2: Active Chat Room */}
              {channel && channel.state !== "resolved" && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Status Banner */}
                  <div className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {channel.state === "queued" ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                            Position: #{channel.queuePosition || 1} in queue • {formatWaitTime(waitSeconds)}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase">
                            {channel.assignedTo?.name ? `${channel.assignedTo.name} • Active` : "Agent Active"}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {channel.incidentId && (
                        <a
                          href="/portal/my-tickets"
                          className="font-mono text-[10px] bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-1.5 py-0.5 font-bold border border-red-300 dark:border-red-800 flex items-center gap-1 hover:underline"
                          title="View in My Tickets"
                        >
                          <span>{channel.incidentId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <button
                        onClick={handleEndChat}
                        className="text-[11px] text-neutral-500 hover:text-red-600 font-bold uppercase tracking-wider"
                      >
                        End Chat
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50 dark:bg-neutral-900/40">
                    {messages.map((m) => {
                      const isMe = m.senderType === "requester";
                      const isSystem = m.senderType === "system";

                      if (isSystem) {
                        return (
                          <div key={m.id} className="text-center my-2">
                            <span className="inline-block px-3 py-1 bg-neutral-200 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-400 font-mono tracking-wide">
                              {m.body}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-500 font-medium">
                            <span>{m.senderName || (isMe ? "You" : "Agent")}</span>
                            <span>•</span>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                              isMe
                                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 shadow-sm"
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })}

                    {/* Live Agent Typing Indicator */}
                    {agentTypingName && (
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono italic">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                        <span>{agentTypingName} is typing...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 text-xs px-3 py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white disabled:opacity-40 transition-colors"
                      title="Send Message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 3: Post-Chat CSAT & Summary */}
              {channel && channel.state === "resolved" && (
                <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-5 text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950/60 text-green-600 mx-auto flex items-center justify-center rounded-full">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Chat Session Resolved
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        Thank you for contacting ServiceMeow Support. We hope your issue was resolved quickly.
                      </p>
                      {channel.incidentId && (
                        <div className="mt-2 text-xs font-mono font-bold text-red-600 dark:text-red-400">
                          Incident Created: {channel.incidentId}
                        </div>
                      )}
                    </div>

                    {/* CSAT Rating */}
                    {!csatSubmitted ? (
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                          Rate Your Support Experience
                        </label>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCsatRating(star)}
                              className="p-1 hover:scale-125 transition-transform"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  (csatRating ?? 0) >= star
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-neutral-300 dark:text-neutral-700"
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={2}
                          value={csatFeedback}
                          onChange={(e) => setCsatFeedback(e.target.value)}
                          placeholder="Optional feedback..."
                          className="w-full text-xs p-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white resize-none"
                        />

                        <button
                          onClick={handleSubmitRating}
                          disabled={!csatRating}
                          className="w-full mt-2 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs uppercase tracking-wider disabled:opacity-40"
                        >
                          Submit Rating
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-800">
                        Thank you for your valuable feedback!
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-4">
                    <button
                      onClick={handleDownloadTranscript}
                      className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Transcript</span>
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs uppercase tracking-wider"
                    >
                      Start New Conversation
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
