"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Kanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  User,
  ArrowUpRight,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Target,
  BarChart3,
  Flame,
  Check,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

export interface AgileStory {
  id: string;
  number: string;
  short_description: string;
  description?: string;
  state: string; // "1"=Backlog, "2"=Ready, "3"=In Progress, "4"=Testing, "7"=Complete
  priority: string; // "1"=Critical, "2"=High, "3"=Moderate, "4"=Low
  assigned_to?: string;
  story_points?: number | string;
  sprint_id?: string;
  sprint_name?: string;
  epic_name?: string;
  acceptance_criteria?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgileSprint {
  id: string;
  number: string;
  name: string;
  state: "active" | "planning" | "closed";
  start_date?: string;
  end_date?: string;
  capacity_points?: number;
  goal?: string;
}

const COLUMNS = [
  { id: "1", label: "Backlog", color: "slate", accent: "border-slate-500/40 text-slate-300" },
  { id: "2", label: "Sprint Ready", color: "sky", accent: "border-sky-500/40 text-sky-300" },
  { id: "3", label: "In Progress", color: "amber", accent: "border-amber-500/40 text-amber-300" },
  { id: "4", label: "Testing & QA", color: "purple", accent: "border-purple-500/40 text-purple-300" },
  { id: "7", label: "Complete", color: "emerald", accent: "border-emerald-500/40 text-emerald-300" },
] as const;

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

function getAssigneeName(val: any): string {
  if (!val) return "";
  if (typeof val === "object") return val.name || val.display_value || val.email || "";
  return String(val);
}

export function AgileProjectBoard() {
  const { currentUser } = useUser();
  const [stories, setStories] = useState<AgileStory[]>([]);
  const [sprints, setSprints] = useState<AgileSprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSprint, setSelectedSprint] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Modals & Panels
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<AgileStory | null>(null);
  const [storyDetailModalOpen, setStoryDetailModalOpen] = useState(false);

  // Form State for New Story
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState<number>(3);
  const [newPriority, setNewPriority] = useState<string>("3");
  const [newSprint, setNewSprint] = useState<string>("");
  const [newEpic, setNewEpic] = useState<string>("EPIC0001001: ITIL Core Engine");
  const [newAssignee, setNewAssignee] = useState<string>(currentUser.name || "System Administrator");
  const [newCriteria, setNewCriteria] = useState("");
  const [creatingStory, setCreatingStory] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [storyRes, sprintRes] = await Promise.all([
        fetch("/api/now/table/rm_story"),
        fetch("/api/now/table/rm_sprint"),
      ]);

      if (!storyRes.ok) throw new Error("Failed to load agile stories");

      const storyData = await storyRes.json();
      const sprintData = await sprintRes.json();

      setStories(storyData.result || []);
      setSprints(sprintData.result || []);

      // If active sprint exists and no sprint selected, default to active sprint
      if (sprintData.result && sprintData.result.length > 0 && selectedSprint === "all") {
        const active = sprintData.result.find((s: AgileSprint) => s.state === "active");
        if (active) setSelectedSprint(active.number);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load agile data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSprint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // State Transitions (Move Card)
  const handleMoveStory = async (story: AgileStory, direction: "prev" | "next") => {
    const colOrder = ["1", "2", "3", "4", "7"];
    const currentIndex = colOrder.indexOf(story.state);
    if (currentIndex === -1) return;

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= colOrder.length) return;

    const targetState = colOrder[nextIndex];

    // Optimistic UI update
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, state: targetState } : s))
    );

    try {
      const res = await fetch(`/api/now/table/rm_story/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });
      if (!res.ok) {
        // Rollback on error
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, state: story.state } : s))
        );
      }
    } catch (err) {
      console.error(err);
      // Rollback
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, state: story.state } : s))
      );
    }
  };

  // Create Story Handler
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || creatingStory) return;

    setCreatingStory(true);
    try {
      const sprintObj = sprints.find((s) => s.number === newSprint);

      const payload = {
        short_description: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        state: newSprint ? "2" : "1", // Backlog if no sprint, Ready if sprint assigned
        assigned_to: newAssignee,
        story_points: Number(newPoints),
        sprint_id: newSprint || null,
        sprint_name: sprintObj ? sprintObj.name : null,
        epic_name: newEpic || null,
        acceptance_criteria: newCriteria.trim(),
      };

      const res = await fetch("/api/now/table/rm_story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create story");
      }

      const data = await res.json();
      if (data.result) {
        setStories((prev) => [data.result, ...prev]);
        setCreateModalOpen(false);
        // Reset form
        setNewTitle("");
        setNewDesc("");
        setNewPoints(3);
        setNewCriteria("");
      }
    } catch (err: any) {
      alert(err.message || "Error creating story");
    } finally {
      setCreatingStory(false);
    }
  };

  // Delete Story Handler
  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      const res = await fetch(`/api/now/table/rm_story/${storyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
        setStoryDetailModalOpen(false);
        setSelectedStory(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Points Incrementer
  const handleUpdatePoints = async (story: AgileStory, newPointVal: number) => {
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, story_points: newPointVal } : s))
    );

    try {
      await fetch(`/api/now/table/rm_story/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_points: newPointVal }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const activeSprintObj = useMemo(() => {
    return sprints.find((s) => s.number === selectedSprint || s.id === selectedSprint);
  }, [sprints, selectedSprint]);

  // Filtered Stories
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Sprint filter
      if (selectedSprint === "backlog" && story.sprint_id) return false;
      if (selectedSprint !== "all" && selectedSprint !== "backlog") {
        const matchesSprint =
          story.sprint_id === selectedSprint ||
          (activeSprintObj &&
            (story.sprint_id === activeSprintObj.id ||
              story.sprint_id === activeSprintObj.number ||
              story.sprint_name === activeSprintObj.name));
        if (!matchesSprint) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && String(story.priority) !== String(priorityFilter)) return false;

      // Assignee filter
      const storyAssignee = getAssigneeName(story.assigned_to);
      if (assigneeFilter !== "all" && storyAssignee !== assigneeFilter) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (story.number || "").toLowerCase();
        const title = (story.short_description || "").toLowerCase();
        const desc = (story.description || "").toLowerCase();
        const assignee = storyAssignee.toLowerCase();
        const epic = (story.epic_name || "").toLowerCase();
        return (
          num.includes(q) ||
          title.includes(q) ||
          desc.includes(q) ||
          assignee.includes(q) ||
          epic.includes(q)
        );
      }

      return true;
    });
  }, [stories, selectedSprint, activeSprintObj, priorityFilter, assigneeFilter, searchQuery]);

  // Velocity & Metrics Calculation
  const metrics = useMemo(() => {
    const totalCount = filteredStories.length;
    const totalPoints = filteredStories.reduce(
      (sum, s) => sum + (Number(s.story_points) || 0),
      0
    );
    const completedCount = filteredStories.filter((s) => String(s.state) === "7").length;
    const completedPoints = filteredStories
      .filter((s) => String(s.state) === "7")
      .reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);

    const progressPct =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    const inProgressPoints = filteredStories
      .filter((s) => String(s.state) === "3" || String(s.state) === "4")
      .reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);

    return {
      totalCount,
      totalPoints,
      completedCount,
      completedPoints,
      inProgressPoints,
      progressPct,
    };
  }, [filteredStories]);

  // Unique assignees for filter
  const assignees = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => {
      const name = getAssigneeName(s.assigned_to);
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [stories]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs dark:shadow-xl transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <Kanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Agile Board & Sprint Hub
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 uppercase tracking-wider">
                  ServiceMeow Agile 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user stories, sprint backlogs, Fibonacci story points and velocity across Agile releases.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer"
              title="Refresh Agile Board"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-sky-500" : ""}`} />
            </button>

            <Link
              href="/studio?tab=table_editor"
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              <span>Table Data Editor</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setNewSprint(selectedSprint !== "all" && selectedSprint !== "backlog" ? selectedSprint : "");
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-950/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Story</span>
            </button>
          </div>
        </div>

        {/* Sprint Selector & Velocity Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Sprint Tabs */}
          <div className="md:col-span-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSprint("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedSprint === "all"
                  ? "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50 shadow-xs"
                  : "bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-950 text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800"
              }`}
            >
              All Stories ({stories.length})
            </button>

            {sprints.map((sp) => (
              <button
                key={sp.id || sp.number}
                type="button"
                onClick={() => setSelectedSprint(sp.number)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                  selectedSprint === sp.number
                    ? "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50 shadow-xs"
                    : "bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-950 text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800"
                }`}
              >
                <span>{sp.name}</span>
                {sp.state === "active" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedSprint("backlog")}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedSprint === "backlog"
                  ? "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50 shadow-xs"
                  : "bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-950 text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800"
              }`}
            >
              Backlog (Unassigned)
            </button>
          </div>

          {/* Velocity & Burn-up Mini Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                <span>Sprint Velocity Progress</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {metrics.completedPoints} / {metrics.totalPoints} pts ({metrics.progressPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${metrics.progressPct}%` }}
              />
              <div
                className="bg-amber-500/60 h-full transition-all duration-500"
                style={{
                  width: `${
                    metrics.totalPoints > 0
                      ? Math.min(100 - metrics.progressPct, Math.round((metrics.inProgressPoints / metrics.totalPoints) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sprint Goal Banner if single sprint selected */}
        {activeSprintObj && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs flex items-center justify-between text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-500 shrink-0" />
              <span>
                <strong>Sprint Goal:</strong> {activeSprintObj.goal || "Achieve sprint commitment and resolve prioritized stories."}
              </span>
            </div>
            {activeSprintObj.start_date && (
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 shrink-0">
                {activeSprintObj.start_date} → {activeSprintObj.end_date}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories, STRY#, epic, assignee..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Priorities</option>
              <option value="1">P1 - Critical</option>
              <option value="2">P2 - High</option>
              <option value="3">P3 - Moderate</option>
              <option value="4">P4 - Low</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 shrink-0">
            <User className="w-3.5 h-3.5" />
            <span>Assignee:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 max-w-[160px] truncate"
            >
              <option value="all">All Assignees</option>
              {assignees.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board 5 Columns */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading agile board...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colStories = filteredStories.filter(
              (s) => String(s.state) === String(col.id)
            );
            const colPoints = colStories.reduce(
              (sum, s) => sum + (Number(s.story_points) || 0),
              0
            );

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 min-h-[580px] flex flex-col justify-between shadow-xs dark:shadow-md transition-colors"
              >
                {/* Column Header */}
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.id === "7" ? "bg-emerald-500" : col.id === "3" ? "bg-amber-500" : col.id === "4" ? "bg-purple-500" : col.id === "2" ? "bg-sky-500" : "bg-slate-400 dark:bg-slate-500"}`} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {col.label}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {colStories.length}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                        {colPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Stories List */}
                  <div className="space-y-3">
                    {colStories.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-800/80 rounded-xl">
                        No stories in {col.label}
                      </div>
                    ) : (
                      colStories.map((story) => (
                        <div
                          key={story.id}
                          className="bg-white dark:bg-slate-950/90 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-sky-400 dark:hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-xs hover:shadow-md group relative flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Number + Priority Pill + Epic */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                                {story.number}
                              </span>

                              <div className="flex items-center gap-1">
                                {story.priority === "1" ? (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40">
                                    P1 Crit
                                  </span>
                                ) : story.priority === "2" ? (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
                                    P2 High
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    P{story.priority || "3"}
                                  </span>
                                )}

                                {/* Fibonacci Points Badge */}
                                <div className="group/pts relative">
                                  <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 tabular-nums">
                                    {story.story_points || 0} pts
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Story Title */}
                            <h4
                              onClick={() => {
                                setSelectedStory(story);
                                setStoryDetailModalOpen(true);
                              }}
                              className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-300 cursor-pointer line-clamp-2 leading-snug transition-colors"
                            >
                              {story.short_description}
                            </h4>

                            {/* Epic or Sprint Badge */}
                            {story.epic_name && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                                <span className="truncate">{story.epic_name}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Assignee + Move Controls */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[120px]">
                              <User className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="truncate">{getAssigneeName(story.assigned_to) || "Unassigned"}</span>
                            </div>

                            {/* Card Navigation Controls */}
                            <div className="flex items-center gap-1">
                              {col.id !== "1" && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStory(story, "prev")}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                  title="Move to Previous Column"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                              )}
                              {col.id !== "7" && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStory(story, "next")}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                  title="Move to Next Column"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column Quick Add */}
                <button
                  type="button"
                  onClick={() => {
                    setNewSprint(selectedSprint !== "all" && selectedSprint !== "backlog" ? selectedSprint : "");
                    setCreateModalOpen(true);
                  }}
                  className="mt-3 w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white/60 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Story</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE STORY MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Kanban className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New Agile User Story</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Story Title / Short Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="As a fulfiller, I need..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Technical background, user context, and architectural notes..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Fibonacci Story Points Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Fibonacci Story Points
                </label>
                <div className="flex items-center gap-2">
                  {FIBONACCI_POINTS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setNewPoints(pts)}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
                        newPoints === pts
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/20"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Sprint</label>
                  <select
                    value={newSprint}
                    onChange={(e) => setNewSprint(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="">-- Product Backlog (Unassigned) --</option>
                    {sprints.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.name} ({s.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="1">1 - Critical</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Moderate</option>
                    <option value="4">4 - Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Epic</label>
                  <input
                    type="text"
                    value={newEpic}
                    onChange={(e) => setNewEpic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Acceptance Criteria</label>
                <textarea
                  rows={2}
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  placeholder="GIVEN [context], WHEN [action], THEN [outcome]..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 font-mono text-[11px]"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStory}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {creatingStory ? "Creating..." : "Create User Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORY DETAIL & EDIT MODAL */}
      {storyDetailModalOpen && selectedStory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-500/30">
                  {selectedStory.number}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-sm">
                  {selectedStory.short_description}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStoryDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold mb-1">Description</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedStory.description || "No detailed description provided."}
                </p>
              </div>

              {selectedStory.acceptance_criteria && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold mb-1">Acceptance Criteria</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {selectedStory.acceptance_criteria}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Epic</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                    {selectedStory.epic_name || "None"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Sprint</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                    {selectedStory.sprint_name || "Product Backlog"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Assignee</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                    {getAssigneeName(selectedStory.assigned_to) || "Unassigned"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Story Points</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {FIBONACCI_POINTS.map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => handleUpdatePoints(selectedStory, pts)}
                        className={`px-2 py-0.5 rounded font-mono text-xs font-bold cursor-pointer transition-colors ${
                          Number(selectedStory.story_points) === pts
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {pts}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteStory(selectedStory.id)}
                className="px-3 py-1.5 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Story</span>
              </button>

              <button
                type="button"
                onClick={() => setStoryDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
