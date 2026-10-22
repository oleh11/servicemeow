"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  User,
  Shield,
  Send,
  Lock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Copy,
  ExternalLink,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";

interface RequesterInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
}

interface LiveChatQueue {
  id: string;
  name: string;
  code: string;
}

interface LiveChatChannel {
  id: string;
  number: string;
  state: "queued" | "active" | "resolved" | "abandoned";
  subject?: string;
  initialQuestion?: string;
  requesterId: string;
  requester?: RequesterInfo;
  assignedToId?: string;
  queueId?: string;
  queue?: LiveChatQueue;
  waitStartedAt: string;
  acceptedAt?: string;
  incidentId?: string;
}

interface LiveChatMessage {
  id: string;
  channelId: string;
  senderId?: string;
  senderName?: string;
  senderType: "requester" | "agent" | "system" | "bot";
  body: string;
  isInternal: boolean;
  createdAt: string;
}

interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  message: string;
  category: string;
}

interface AgentPresence {
  id: string;
  userId: string;
  status: "online" | "busy" | "away" | "offline";
  activeChatsCount: number;
}

export function FulfillerChatCockpit() {
  const [presence, setPresence] = useState<AgentPresence | null>(null);
  const [queuedChannels, setQueuedChannels] = useState<LiveChatChannel[]>([]);
  const [activeChannels, setActiveChannels] = useState<LiveChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [maxCapacity, setMaxCapacity] = useState(3);
  const [composerText, setComposerText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showMacroMenu, setShowMacroMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const activeChannel = activeChannels.find((c) => c.id === selectedChannelId) || null;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChannelId]);

  // Load initial workspace data
  const refreshWorkspace = async () => {
    try {
      const res = await fetch("/api/now/chat/agent");
      if (res.ok) {
        const data = await res.json();
        setPresence(data.presence);
        setQueuedChannels(data.queuedChannels || []);
        setActiveChannels(data.activeChannels || []);
        setCannedResponses(data.cannedResponses || []);
        if (data.config?.maxConcurrentChatsPerAgent) {
          setMaxCapacity(data.config.maxConcurrentChatsPerAgent);
        }

        // If no channel selected and active channels exist, select first
        if (!selectedChannelId && data.activeChannels?.length > 0) {
          setSelectedChannelId(data.activeChannels[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load agent workspace:", err);
    }
  };

  useEffect(() => {
    refreshWorkspace();
    const interval = setInterval(refreshWorkspace, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Global SSE events for agent
  useEffect(() => {
    const sse = new EventSource("/api/now/chat/stream?mode=agent");

    sse.addEventListener("dispatch", (e) => {
      try {
        refreshWorkspace();
      } catch (err) {
        console.error("Error on dispatch SSE:", err);
      }
    });

    sse.addEventListener("message", (e) => {
      try {
        const newMsg: LiveChatMessage = JSON.parse(e.data);
        if (newMsg.channelId === selectedChannelId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      } catch (err) {
        console.error("Error on message SSE:", err);
      }
    });

    sse.addEventListener("status", () => {
      refreshWorkspace();
    });

    return () => {
      sse.close();
    };
  }, [selectedChannelId]);

  // Load messages whenever selected channel changes
  useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const res = await fetch(`/api/now/chat/message?channelId=${selectedChannelId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    }
    loadMessages();
  }, [selectedChannelId]);

  // Change presence status
  const handleSetPresence = async (status: "online" | "busy" | "away" | "offline") => {
    try {
      const res = await fetch("/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "presence", status }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresence(data.presence);
      }
    } catch (err) {
      console.error("Failed to update presence:", err);
    }
  };

  // Accept incoming chat
  const handleAcceptChat = async (channelId: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", channelId }),
      });
      if (res.ok) {
        await refreshWorkspace();
        setSelectedChannelId(channelId);
      }
    } catch (err) {
      console.error("Failed to accept chat:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || !selectedChannelId) return;

    const bodyText = composerText.trim();
    setComposerText("");

    try {
      const res = await fetch("/api/now/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          body: bodyText,
          isInternal: isInternalNote,
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

  // Create Incident from Chat
  const handleCreateIncident = async () => {
    if (!selectedChannelId) return;
    setLoadingAction(true);
    try {
      const res = await fetch("/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_incident",
          channelId: selectedChannelId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Incident ${data.task.number} created successfully with full chat transcript!`);
        await refreshWorkspace();
      }
    } catch (err) {
      console.error("Failed to create incident:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Resolve chat
  const handleResolveChat = async () => {
    if (!selectedChannelId) return;
    if (!confirm("Are you sure you want to resolve and wrap up this chat session?")) return;

    setLoadingAction(true);
    try {
      const res = await fetch("/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          channelId: selectedChannelId,
        }),
      });
      if (res.ok) {
        await refreshWorkspace();
        setSelectedChannelId(null);
      }
    } catch (err) {
      console.error("Failed to resolve chat:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Insert macro template
  const handleInsertMacro = (macro: CannedResponse) => {
    setComposerText((prev) => (prev ? `${prev} ${macro.message}` : macro.message));
    setShowMacroMenu(false);
  };

  // Copy transcript to clipboard
  const handleCopyTranscript = () => {
    if (!activeChannel) return;
    const text = messages
      .map((m) => `[${m.senderType.toUpperCase()}] ${m.senderName || ""}: ${m.body}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Transcript copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden">
      {/* Top Cockpit Control Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-600 text-white font-mono font-bold text-xs">
              01
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider">
                Live Agent Cockpit
              </h1>
              <p className="text-[11px] text-neutral-500 font-mono">
                ITIL Omnichannel Real-Time Queue & Dispatch
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

          {/* Capacity Meter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold uppercase text-neutral-500">
              Capacity:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono font-bold">
              <span>{activeChannels.length}</span>
              <span className="text-neutral-400">/</span>
              <span>{maxCapacity}</span>
            </div>
          </div>
        </div>

        {/* Presence Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="flex items-center border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-0.5 text-xs font-bold uppercase tracking-wider">
            {(["online", "busy", "away", "offline"] as const).map((st) => {
              const isCurrent = presence?.status === st;
              return (
                <button
                  key={st}
                  onClick={() => handleSetPresence(st)}
                  className={`px-3 py-1 transition-colors flex items-center gap-1.5 ${
                    isCurrent
                      ? st === "online"
                        ? "bg-green-600 text-white"
                        : st === "busy"
                        ? "bg-amber-600 text-white"
                        : st === "away"
                        ? "bg-yellow-600 text-white"
                        : "bg-neutral-800 text-white"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      st === "online"
                        ? "bg-green-400"
                        : st === "busy"
                        ? "bg-amber-400"
                        : st === "away"
                        ? "bg-yellow-400"
                        : "bg-neutral-500"
                    }`}
                  />
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 3-Column Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Intake & Conversations List */}
        <div className="w-80 border-r border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col">
          {/* Section A: Incoming Queue Intake */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Queue Intake</span>
              </span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                {queuedChannels.length} Waiting
              </span>
            </div>

            {queuedChannels.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-400 font-mono">
                Queue is clear • Zero callers waiting
              </div>
            ) : (
              <div className="space-y-2">
                {queuedChannels.map((qc) => (
                  <div
                    key={qc.id}
                    className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-amber-500 border border-neutral-200 dark:border-neutral-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {qc.requester?.name || "Caller"}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {qc.number}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {qc.initialQuestion || qc.subject}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">
                        {qc.queue?.name || "IT Queue"}
                      </span>
                      <button
                        onClick={() => handleAcceptChat(qc.id)}
                        disabled={loadingAction}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] uppercase tracking-wider"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Active Sessions List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Active Sessions ({activeChannels.length})
            </div>

            {activeChannels.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                No active conversations. Accept callers from the queue above to begin triage.
              </div>
            ) : (
              activeChannels.map((ac) => {
                const isSelected = ac.id === selectedChannelId;
                return (
                  <button
                    key={ac.id}
                    onClick={() => setSelectedChannelId(ac.id)}
                    className={`w-full text-left p-3.5 border-b border-neutral-200 dark:border-neutral-800 transition-colors flex items-start gap-3 ${
                      isSelected
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-850"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 text-neutral-800 dark:text-neutral-200">
                      {ac.requester?.name?.charAt(0) || "U"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold truncate">
                          {ac.requester?.name || "Caller"}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-500"}`}>
                          {ac.number}
                        </span>
                      </div>

                      <div className={`text-[11px] truncate ${isSelected ? "text-neutral-300 dark:text-neutral-700" : "text-neutral-500"}`}>
                        {ac.subject || "Support Inquiry"}
                      </div>

                      {ac.incidentId && (
                        <div className="mt-1 text-[9px] font-mono font-bold text-red-400 dark:text-red-600">
                          {ac.incidentId}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Conversation View & Composer */}
        <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
          {activeChannel ? (
            <>
              {/* Channel Header Bar */}
              <div className="px-6 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      {activeChannel.number}
                    </span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {activeChannel.requester?.name || "Caller"}
                    </span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">
                      {activeChannel.queue?.name || "Support Queue"}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 truncate mt-0.5">
                    Topic: <strong>{activeChannel.subject || "General Inquiry"}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTranscript}
                    className="p-2 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    title="Copy Transcript"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResolveChat}
                    disabled={loadingAction}
                    className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold uppercase tracking-wider"
                  >
                    Resolve Chat
                  </button>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((m) => {
                  const isAgent = m.senderType === "agent";
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

                  if (m.isInternal) {
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 border border-amber-200 dark:border-amber-900 text-xs leading-relaxed space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            <span>Internal Whisper Note (Hidden from Caller)</span>
                          </span>
                          <span className="font-mono">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-neutral-900 dark:text-amber-100 font-mono">
                          {m.body}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-500 font-medium">
                        <span>{m.senderName || (isAgent ? "You" : "Caller")}</span>
                        <span>•</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      <div
                        className={`max-w-[75%] p-3.5 text-xs leading-relaxed ${
                          isAgent
                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                            : "bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-sm"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer Box */}
              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-800 space-y-2">
                {/* Mode Selector & Quick Macros */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        !isInternalNote
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      Public Reply to Caller
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                        isInternalNote
                          ? "bg-amber-600 text-white"
                          : "text-neutral-500 hover:text-amber-600"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Internal Whisper Note</span>
                    </button>
                  </div>

                  {/* Canned Responses Macro Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMacroMenu(!showMacroMenu)}
                      className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-neutral-700 dark:text-neutral-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Canned Macros</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showMacroMenu && (
                      <div className="absolute right-0 bottom-8 w-64 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-xl z-20 py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                          Quick Canned Replies
                        </div>
                        {cannedResponses.map((macro) => (
                          <button
                            key={macro.id}
                            type="button"
                            onClick={() => handleInsertMacro(macro)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 block"
                          >
                            <span className="font-mono font-bold text-red-600 dark:text-red-400 mr-1.5">
                              {macro.shortcut}
                            </span>
                            <span className="text-neutral-700 dark:text-neutral-200">{macro.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Textarea Composer */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={
                      isInternalNote
                        ? "Enter internal technical note (hidden from caller)..."
                        : "Type public response to caller (Press Ctrl+Enter to send)..."
                    }
                    className={`flex-1 p-2.5 text-xs border focus:outline-none resize-none font-medium ${
                      isInternalNote
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-white"
                        : "bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!composerText.trim()}
                    className={`px-5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors ${
                      isInternalNote
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <MessageSquare className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                No Chat Session Selected
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Select an active conversation on the left, or accept an incoming caller from the Queue Intake panel.
              </p>
            </div>
          )}
        </div>

        {/* Column 3: Caller Context & Quick Actions */}
        {activeChannel && (
          <div className="w-80 border-l border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Caller Profile Card */}
              <div className="border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-850">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm">
                    {activeChannel.requester?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wide">
                      {activeChannel.requester?.name || "Caller"}
                    </h4>
                    <span className="text-[10px] text-neutral-500 block truncate">
                      {activeChannel.requester?.email || "No email"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Department:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {activeChannel.requester?.department || "Corporate"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">VIP Status:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      Standard Tier
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Session ID:</span>
                    <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-300">
                      {activeChannel.number}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Click ITIL Action: Create Incident */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  ITIL Actions
                </span>

                {activeChannel.incidentId ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs">
                    <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 block mb-1">
                      Incident Linked
                    </span>
                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                      {activeChannel.incidentId}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateIncident}
                    disabled={loadingAction}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Incident from Chat</span>
                  </button>
                )}

                <button
                  onClick={handleResolveChat}
                  disabled={loadingAction}
                  className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Mark as Resolved</span>
                </button>
              </div>
            </div>

            {/* Platform Help Note */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500 font-mono mt-6">
              All messages and internal notes are audited under sys_live_chat_message with cryptographic timestamps.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
