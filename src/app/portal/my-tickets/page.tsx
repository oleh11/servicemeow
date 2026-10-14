"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import {
  Ticket,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
  X,
  ChevronRight,
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
      const res = await fetch(`/api/now/table/task/${ticket.sys_id}`);
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
      const res = await fetch(`/api/now/table/task/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_id: currentUser.id,
          customer_comment: replyMessage,
        }),
      });

      if (res.ok) {
        // Refresh detail
        await openTicketDetail({ sys_id: selectedTicket.id });
        setReplyMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatePill = (state: string | number) => {
    const s = String(state);
    switch (s) {
      case "1":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">New / Submitted</span>;
      case "2":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">In Progress</span>;
      case "3":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Awaiting Info</span>;
      case "6":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">Resolved</span>;
      case "7":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">Active</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Requests & Incident Tickets</h1>
          <p className="text-xs text-slate-500">Track real-time progress, read technician updates, and add replies.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          title="Refresh tickets"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List View */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border">
              Loading your tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border space-y-2">
              <Ticket className="w-8 h-8 mx-auto text-slate-300" />
              <p>You have no active tickets or requests currently open.</p>
              <Link href="/portal/create-incident" className="text-emerald-600 font-semibold underline">
                Report an issue here
              </Link>
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.sys_id}
                onClick={() => openTicketDetail(t)}
                className={`p-4 rounded-xl border bg-white shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 ${
                  selectedTicket?.id === t.sys_id ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-700">{t.number}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {t.sys_class_name.replace("sc_", "").replace("_", " ")}
                    </span>
                  </div>
                  {getStatePill(t.state)}
                </div>

                <h3 className="font-bold text-slate-900 text-xs">{t.short_description}</h3>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t">
                  <span>Assigned: <strong className="text-slate-600">{t.assigned_to?.display_value || "IT Service Desk"}</strong></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.sys_created_on).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Thread Panel */}
        <div className="bg-white rounded-xl border shadow-xs p-5 flex flex-col justify-between h-[600px] text-xs">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-emerald-700">{selectedTicket.number}</span>
                  {getStatePill(selectedTicket.state)}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedTicket.shortDescription}</h3>
                <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">{selectedTicket.description}</p>
              </div>

              {/* Comments Thread (Customer Visible comments) */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Updates & Conversation
                </h4>

                {selectedTicket.activityNotes?.filter((n: any) => n.noteType === "customer_comment").length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No messages yet from Service Desk.</p>
                ) : (
                  selectedTicket.activityNotes
                    ?.filter((n: any) => n.noteType === "customer_comment")
                    .map((note: any) => (
                      <div key={note.id} className="p-3 rounded-lg bg-purple-50/60 border border-purple-200 text-slate-800 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span className="font-bold text-purple-900">{note.author?.name || "Service Desk Specialist"}</span>
                          <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{note.content}</p>
                      </div>
                    ))
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t space-y-2">
                <textarea
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type reply message to technician..."
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 focus:outline-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? "Sending..." : "Reply to Technician"}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-center italic">
              Select a ticket on the left to read technician updates and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
