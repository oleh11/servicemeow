"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import {
  Ticket,
  Clock,
  Send,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
} from "lucide-react";

export default function MyTicketsPortalPage() {
  const { currentUser } = useUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/table/task?sysparm_limit=50");
      const data = await res.json();
      if (data.result) {
        setTickets(data.result);
        if (data.result.length > 0 && !selectedTicket) {
          openTicketDetail(data.result[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicketDetail = async (ticket: any) => {
    try {
      const ticketId = ticket.sys_id || ticket.id;
      const res = await fetch(`/api/now/table/task/${ticketId}`);
      const data = await res.json();
      if (data.result) {
        setSelectedTicket(data.result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket || sendingReply) return;

    setSendingReply(true);
    try {
      const ticketId = selectedTicket.id || selectedTicket.sys_id;
      const res = await fetch(`/api/now/table/task/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_id: currentUser.id,
          customer_comment: replyMessage,
        }),
      });

      if (res.ok) {
        await openTicketDetail({ sys_id: ticketId });
        setReplyMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (state: string | number) => {
    const s = String(state);
    switch (s) {
      case "1":
        return (
          <span className="font-mono text-xs uppercase px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-700 font-bold">
            New / Submitted
          </span>
        );
      case "2":
        return (
          <span className="font-mono text-xs uppercase px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 font-bold">
            In Progress
          </span>
        );
      case "3":
        return (
          <span className="font-mono text-xs uppercase px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-800 font-bold">
            Awaiting Info
          </span>
        );
      case "6":
        return (
          <span className="font-mono text-xs uppercase px-2 py-0.5 border border-neutral-400 bg-neutral-100 text-neutral-800 font-bold">
            Resolved
          </span>
        );
      case "7":
        return (
          <span className="font-mono text-xs uppercase px-2 py-0.5 border border-neutral-300 bg-neutral-50 text-neutral-500 font-bold">
            Closed
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs uppercase px-2 py-0.5 border border-neutral-400 bg-neutral-100 text-neutral-700 font-bold">
            Active
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Swiss Header */}
      <div className="border-b-2 border-black pb-6 space-y-2">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Main Screen</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-bold text-amber-600">04 /</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black">
                Check on Your Requests
              </h1>
            </div>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mt-1">
              Select any request on the left to read live updates, answers from technicians, or add your reply.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              className="px-4 py-2 border border-black hover:bg-neutral-100 text-black text-xs font-mono uppercase font-bold flex items-center gap-2 transition-colors cursor-pointer"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh List</span>
            </button>
            <Link
              href="/portal/create-incident"
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-mono uppercase font-bold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 2-Column Swiss Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="border-b border-black pb-2 flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-neutral-500">
              All Active Requests ({tickets.length})
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-neutral-500 border border-neutral-300 bg-white">
              Fetching your request history...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center border-2 border-neutral-300 bg-white space-y-4">
              <Ticket className="w-10 h-10 mx-auto text-neutral-400" />
              <div className="space-y-1">
                <h3 className="font-bold text-base text-black uppercase">No Active Requests</h3>
                <p className="text-xs text-neutral-600">
                  You have not reported any issues or ordered equipment yet.
                </p>
              </div>
              <Link
                href="/portal/create-incident"
                className="inline-block px-5 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Report a Problem Now &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const isSelected =
                  (selectedTicket?.id || selectedTicket?.sys_id) === (t.sys_id || t.id);
                return (
                  <div
                    key={t.sys_id || t.id}
                    onClick={() => openTicketDetail(t)}
                    className={`p-5 border-2 transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? "border-black bg-neutral-100 ring-1 ring-black"
                        : "border-neutral-200 hover:border-black bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-black">
                        {t.number}
                      </span>
                      {getStatusBadge(t.state)}
                    </div>

                    <h4 className="font-bold text-sm text-black leading-snug">
                      {t.short_description || t.shortDescription}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-200">
                      <span>Tech: {t.assigned_to?.display_value || "IT Support"}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.sys_created_on || t.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Ticket Details & Conversation */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="border-2 border-black bg-white p-6 space-y-6">
              {/* Detail Header */}
              <div className="border-b-2 border-black pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg font-extrabold text-black">
                      {selectedTicket.number}
                    </span>
                    <span className="text-xs uppercase font-mono px-2 py-0.5 bg-neutral-200 text-neutral-800 font-bold">
                      {(selectedTicket.sysClassName || "incident").toUpperCase()}
                    </span>
                  </div>
                  {getStatusBadge(selectedTicket.state)}
                </div>

                <h2 className="text-xl font-extrabold text-black uppercase tracking-tight">
                  {selectedTicket.shortDescription || selectedTicket.short_description}
                </h2>

                <p className="text-sm text-neutral-700 bg-neutral-50 p-4 border border-neutral-200 leading-relaxed">
                  {selectedTicket.description || "No additional description provided."}
                </p>
              </div>

              {/* Message Activity Stream */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-neutral-500">
                  <MessageSquare className="w-4 h-4" />
                  <span>Communication History</span>
                </div>

                <div className="border border-neutral-300 p-4 min-h-[220px] max-h-[350px] overflow-y-auto space-y-4 bg-neutral-50/50">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((c: any, i: number) => (
                      <div key={i} className="border border-neutral-200 bg-white p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <strong className="text-black">{c.author || "Support Agent"}</strong>
                          <span className="text-neutral-400">{new Date(c.time).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-neutral-500 text-xs font-mono">
                      No messages yet. An IT support engineer will post an update here once review starts.
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-neutral-200">
                <label htmlFor="reply-box" className="block text-xs font-mono uppercase font-bold text-black">
                  Send a Message to IT
                </label>
                <textarea
                  id="reply-box"
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type an update or answer here..."
                  className="w-full text-sm p-3 border border-neutral-300 text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="px-6 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingReply ? "Sending..." : "Send Message"}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-300 p-12 text-center text-neutral-500 text-sm font-mono h-full flex items-center justify-center">
              Select a request from the list on the left to view its details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
