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
  { id: "1", label: "Backlog", color: "neutral", dot: "bg-neutral-500" },
  { id: "2", label: "Sprint Ready", color: "sky", dot: "bg-sky-600" },
  { id: "3", label: "In Progress", color: "amber", dot: "bg-amber-600" },
  { id: "4", label: "Testing & QA", color: "purple", dot: "bg-purple-600" },
  { id: "7", label: "Complete", color: "emerald", dot: "bg-emerald-600" },
] as const;

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

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
  const [createSprintModalOpen, setCreateSprintModalOpen] = useState(false);
  const [createEpicModalOpen, setCreateEpicModalOpen] = useState(false);
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

  // Form State for New Sprint
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintState, setNewSprintState] = useState<"planning" | "active" | "closed">("planning");
  const [newSprintStart, setNewSprintStart] = useState(new Date().toISOString().split("T")[0]);
  const [newSprintEnd, setNewSprintEnd] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [newSprintCapacity, setNewSprintCapacity] = useState<number>(45);
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);

  // Form State for New Epic
  const [newEpicTitle, setNewEpicTitle] = useState("");
  const [newEpicPriority, setNewEpicPriority] = useState("2");
  const [newEpicDesc, setNewEpicDesc] = useState("");
  const [epics, setEpics] = useState<any[]>([]);
  const [creatingEpic, setCreatingEpic] = useState(false);

  // Fetch Board Data
  const loadBoardData = useCallback(async () => {
    try {
      const [storyRes, sprintRes, epicRes] = await Promise.all([
        fetch("/api/now/table/rm_story?sysparm_limit=200"),
        fetch("/api/now/table/rm_sprint?sysparm_limit=50"),
        fetch("/api/now/table/rm_epic?sysparm_limit=50"),
      ]);

      const [storyData, sprintData, epicData] = await Promise.all([
        storyRes.json().catch(() => ({ result: [] })),
        sprintRes.json().catch(() => ({ result: [] })),
        epicRes.json().catch(() => ({ result: [] })),
      ]);

      if (storyData.result) {
        setStories(
          storyData.result.map((s: any) => ({
            id: s.id || s.sys_id,
            number: s.number || "STRY0000",
            short_description: s.short_description || s.shortDescription || "Untitled Story",
            description: s.description || "",
            state: String(s.state || "1"),
            priority: String(s.priority || "3"),
            assigned_to: s.assigned_to || s.assignedTo?.display_value || "",
            story_points: s.story_points ? Number(s.story_points) : (s.storyPoints ? Number(s.storyPoints) : 3),
            sprint_id: s.sprint_id || "",
            sprint_name: s.sprint_name || "",
            epic_name: s.epic_name || "",
            acceptance_criteria: s.acceptance_criteria || "",
            created_at: s.sys_created_on || s.createdAt,
            updated_at: s.sys_updated_on || s.updatedAt,
          }))
        );
      }

      if (sprintData.result) {
        setSprints(
          sprintData.result.map((sp: any) => ({
            id: sp.id || sp.sys_id,
            number: sp.number || "",
            name: sp.name || "Sprint",
            state: sp.state || "planning",
            start_date: sp.start_date || sp.startDate || "",
            end_date: sp.end_date || sp.endDate || "",
            capacity_points: sp.capacity_points || sp.capacityPoints || 40,
            goal: sp.goal || "",
          }))
        );
      }

      if (epicData.result) {
        setEpics(epicData.result);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load agile workspace");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBoardData();
  };

  // State Transition Engine for Kanban
  const handleMoveStory = async (story: AgileStory, direction: "next" | "prev") => {
    const colOrder = ["1", "2", "3", "4", "7"];
    const currentIndex = colOrder.indexOf(story.state);
    if (currentIndex === -1) return;

    let targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= colOrder.length) return;

    const nextState = colOrder[targetIndex];

    // Optimistic UI update
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, state: nextState } : s))
    );

    try {
      const res = await fetch(`/api/now/table/rm_story/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
      if (!res.ok) {
        // Rollback on network failure
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, state: story.state } : s))
        );
      }
    } catch {
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, state: story.state } : s))
      );
    }
  };

  // Create Story Handler
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreatingStory(true);
    const sprintObj = sprints.find((s) => s.number === newSprint);

    const payload = {
      short_description: newTitle.trim(),
      description: newDesc.trim(),
      story_points: newPoints,
      priority: newPriority,
      state: "1", // Starts in Backlog
      sprint_id: newSprint || null,
      sprint_name: sprintObj ? sprintObj.name : null,
      epic_name: newEpic || null,
      assigned_to: newAssignee || null,
      acceptance_criteria: newCriteria.trim(),
    };

    try {
      const res = await fetch("/api/now/table/rm_story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.result;
        setStories((prev) => [
          {
            id: created.sys_id || created.id,
            number: created.number,
            short_description: created.short_description,
            description: created.description,
            state: created.state,
            priority: created.priority,
            assigned_to: created.assigned_to,
            story_points: created.story_points,
            sprint_id: created.sprint_id,
            sprint_name: created.sprint_name,
            epic_name: created.epic_name,
            acceptance_criteria: created.acceptance_criteria,
          },
          ...prev,
        ]);
        setCreateModalOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewCriteria("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingStory(false);
    }
  };

  // Create Sprint Handler
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    setCreatingSprint(true);
    const payload = {
      name: newSprintName.trim(),
      state: newSprintState,
      start_date: newSprintStart,
      end_date: newSprintEnd,
      capacity_points: newSprintCapacity,
      goal: newSprintGoal.trim(),
    };

    try {
      const res = await fetch("/api/now/table/rm_sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const sp = data.result;
        setSprints((prev) => [
          ...prev,
          {
            id: sp.sys_id || sp.id,
            number: sp.number,
            name: sp.name,
            state: sp.state,
            start_date: sp.startDate || sp.start_date,
            end_date: sp.endDate || sp.end_date,
            capacity_points: sp.capacityPoints || sp.capacity_points,
            goal: sp.goal,
          },
        ]);
        setSelectedSprint(sp.number);
        setCreateSprintModalOpen(false);
        setNewSprintName("");
        setNewSprintGoal("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingSprint(false);
    }
  };

  // Create Epic Handler
  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpicTitle.trim()) return;

    setCreatingEpic(true);
    const payload = {
      short_description: newEpicTitle.trim(),
      priority: newEpicPriority,
      description: newEpicDesc.trim(),
      state: "1",
    };

    try {
      const res = await fetch("/api/now/table/rm_epic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setEpics((prev) => [data.result, ...prev]);
        setNewEpic(`${data.result.number}: ${data.result.short_description}`);
        setCreateEpicModalOpen(false);
        setNewEpicTitle("");
        setNewEpicDesc("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingEpic(false);
    }
  };

  // Delete Story
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

  // Filtered Stories
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Sprint filter
      if (selectedSprint === "backlog" && story.sprint_id) return false;
      if (selectedSprint !== "all" && selectedSprint !== "backlog") {
        if (story.sprint_id !== selectedSprint) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && story.priority !== priorityFilter) return false;

      // Assignee filter
      if (assigneeFilter !== "all" && story.assigned_to !== assigneeFilter) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (story.number || "").toLowerCase();
        const title = (story.short_description || "").toLowerCase();
        const desc = (story.description || "").toLowerCase();
        const assignee = (story.assigned_to || "").toLowerCase();
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
  }, [stories, selectedSprint, priorityFilter, assigneeFilter, searchQuery]);

  // Velocity & Metrics Calculation
  const metrics = useMemo(() => {
    const totalCount = filteredStories.length;
    const totalPoints = filteredStories.reduce(
      (sum, s) => sum + (Number(s.story_points) || 0),
      0
    );
    const completedCount = filteredStories.filter((s) => s.state === "7").length;
    const completedPoints = filteredStories
      .filter((s) => s.state === "7")
      .reduce((sum, s) => sum + (Number(s.story_points) || 0), 0);

    const progressPct =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    const inProgressPoints = filteredStories
      .filter((s) => s.state === "3" || s.state === "4")
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

  // Assignee list for filter dropdown
  const assignees = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => {
      if (s.assigned_to) set.add(s.assigned_to);
    });
    return Array.from(set);
  }, [stories]);

  const activeSprintObj = useMemo(() => {
    return sprints.find((s) => s.number === selectedSprint);
  }, [sprints, selectedSprint]);

  return (
    <div className="space-y-6 font-sans text-black">
      {/* Top Banner & Control Bar */}
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-black text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <Kanban className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-lg font-black uppercase tracking-tight text-black">
                  Agile Board & Sprint Hub
                </h1>
                <span className="border-2 border-black bg-[#eb0029] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  ServiceMeow Agile 2.0
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-600 mt-0.5">
                Manage user stories, sprint backlogs, Fibonacci story points and release velocity.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all cursor-pointer"
              title="Refresh Agile Board"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#eb0029]" : ""}`} />
            </button>

            <Link
              href="/studio?tab=table_editor"
              className="flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Table Editor</span>
            </Link>

            {/* Create Sprint Button */}
            <button
              type="button"
              onClick={() => setCreateSprintModalOpen(true)}
              className="flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>+ Sprint</span>
            </button>

            {/* Create Epic Button */}
            <button
              type="button"
              onClick={() => setCreateEpicModalOpen(true)}
              className="flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <Target className="h-3.5 w-3.5" />
              <span>+ Epic</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewSprint(selectedSprint !== "all" && selectedSprint !== "backlog" ? selectedSprint : "");
                setCreateModalOpen(true);
              }}
              className="flex h-9 items-center gap-2 border-2 border-black bg-black px-4 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-[#eb0029] hover:text-white transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create User Story</span>
            </button>
          </div>
        </div>

        {/* Sprint Selector & Velocity Progress Bar */}
        <div className="mt-5 pt-4 border-t-2 border-black grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Sprint Tabs */}
          <div className="md:col-span-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSprint("all")}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-black whitespace-nowrap transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                selectedSprint === "all"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              All Stories ({stories.length})
            </button>

            {sprints.map((sp) => (
              <button
                key={sp.id || sp.number}
                type="button"
                onClick={() => setSelectedSprint(sp.number)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                  selectedSprint === sp.number
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-neutral-100"
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
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-black whitespace-nowrap transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                selectedSprint === "backlog"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              Backlog (Unassigned)
            </button>
          </div>

          {/* Velocity Progress Bar */}
          <div className="border-2 border-black bg-neutral-100 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono text-xs font-bold uppercase text-black flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-black" />
                <span>Sprint Velocity</span>
              </span>
              <span className="font-mono font-black text-black tabular-nums">
                {metrics.completedPoints} / {metrics.totalPoints} pts ({metrics.progressPct}%)
              </span>
            </div>
            <div className="w-full bg-white border-2 border-black h-3 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${metrics.progressPct}%` }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
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
          <div className="mt-4 border-2 border-black bg-neutral-50 p-3 text-xs flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 font-mono">
              <Target className="w-4 h-4 text-black shrink-0" />
              <span>
                <strong className="uppercase">Sprint Goal:</strong> {activeSprintObj.goal || "Achieve sprint commitment and resolve prioritized stories."}
              </span>
            </div>
            {activeSprintObj.start_date && (
              <span className="font-mono text-[11px] font-bold text-neutral-600 shrink-0">
                {activeSprintObj.start_date} → {activeSprintObj.end_date}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-2 border-black bg-white p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories, STRY#, epic, assignee..."
            className="w-full border-2 border-black bg-white pl-9 pr-3 py-1.5 font-mono text-xs text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-black shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border-2 border-black bg-white px-2 py-1 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Priorities</option>
              <option value="1">P1 - Critical</option>
              <option value="2">P2 - High</option>
              <option value="3">P3 - Moderate</option>
              <option value="4">P4 - Low</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-black shrink-0">
            <User className="w-3.5 h-3.5" />
            <span>Assignee:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="border-2 border-black bg-white px-2 py-1 font-mono text-xs text-black outline-none focus:ring-2 focus:ring-black max-w-[160px] truncate"
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
          <RefreshCw className="w-8 h-8 text-black animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs font-bold uppercase text-black">Loading agile board...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colStories = filteredStories.filter((s) => s.state === col.id);
            const colPoints = colStories.reduce(
              (sum, s) => sum + (Number(s.story_points) || 0),
              0
            );

            return (
              <div
                key={col.id}
                className="border-2 border-black bg-white p-3 min-h-[580px] flex flex-col justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                {/* Column Header */}
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 border border-black ${col.dot}`} />
                      <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
                        {col.label}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                      <span className="border-2 border-black bg-neutral-100 px-1.5 py-0.2 font-bold text-black">
                        {colStories.length}
                      </span>
                      <span className="border-2 border-black bg-black px-1.5 py-0.2 font-bold text-white">
                        {colPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Stories List */}
                  <div className="space-y-3">
                    {colStories.length === 0 ? (
                      <div className="py-12 text-center font-mono text-xs font-bold uppercase text-neutral-400 border-2 border-dashed border-neutral-300">
                        No stories in {col.label}
                      </div>
                    ) : (
                      colStories.map((story) => (
                        <div
                          key={story.id}
                          className="border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all group relative flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Number + Priority Pill */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="font-mono text-[11px] font-black text-black">
                                {story.number}
                              </span>

                              <div className="flex items-center gap-1">
                                {story.priority === "1" ? (
                                  <span className="border border-black bg-[#eb0029] px-1.5 py-0.2 font-mono text-[9px] font-black uppercase text-white">
                                    P1 Crit
                                  </span>
                                ) : story.priority === "2" ? (
                                  <span className="border border-black bg-amber-400 px-1.5 py-0.2 font-mono text-[9px] font-black uppercase text-black">
                                    P2 High
                                  </span>
                                ) : (
                                  <span className="border border-black bg-neutral-100 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-black">
                                    P{story.priority || "3"}
                                  </span>
                                )}

                                {/* Fibonacci Points Badge */}
                                <span className="border border-black bg-neutral-200 px-1.5 py-0.2 font-mono text-[10px] font-black text-black tabular-nums">
                                  {story.story_points || 0} pts
                                </span>
                              </div>
                            </div>

                            {/* Story Title */}
                            <h4
                              onClick={() => {
                                setSelectedStory(story);
                                setStoryDetailModalOpen(true);
                              }}
                              className="font-sans text-xs font-bold text-black group-hover:text-[#eb0029] cursor-pointer line-clamp-2 leading-snug transition-colors"
                            >
                              {story.short_description}
                            </h4>

                            {/* Epic Badge */}
                            {story.epic_name && (
                              <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-neutral-600 truncate">
                                <span className="w-1.5 h-1.5 bg-black shrink-0" />
                                <span className="truncate">{story.epic_name}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Assignee + Move Controls */}
                          <div className="mt-3 pt-2.5 border-t-2 border-black flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-600 truncate max-w-[120px]">
                              <User className="w-3 h-3 text-black shrink-0" />
                              <span className="truncate">{story.assigned_to || "Unassigned"}</span>
                            </div>

                            {/* Card Navigation Controls */}
                            <div className="flex items-center gap-1">
                              {col.id !== "1" && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStory(story, "prev")}
                                  className="flex h-6 w-6 items-center justify-center border border-black bg-white text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                                  title="Move to Previous Column"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                              )}
                              {col.id !== "7" && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStory(story, "next")}
                                  className="flex h-6 w-6 items-center justify-center border border-black bg-white text-black hover:bg-neutral-100 transition-colors cursor-pointer"
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
                  className="mt-3 w-full py-2 border-2 border-dashed border-black hover:bg-neutral-100 font-mono text-xs font-bold uppercase text-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border-2 border-black bg-white max-w-xl w-full p-6 space-y-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Kanban className="w-5 h-5 text-black" />
                <h3 className="font-mono text-sm font-black uppercase text-black">Create New User Story</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center border-2 border-black text-black hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Story Title / Short Description *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="As a fulfiller, I need..."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Technical background, user context, and architectural notes..."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Fibonacci Story Points Selector */}
              <div>
                <label className="block font-bold uppercase text-black mb-1">
                  Fibonacci Story Points
                </label>
                <div className="flex items-center gap-2">
                  {FIBONACCI_POINTS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setNewPoints(pts)}
                      className={`flex-1 py-1.5 border-2 border-black font-mono font-bold text-xs transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                        newPoints === pts
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-black mb-1">Sprint</label>
                  <select
                    value={newSprint}
                    onChange={(e) => setNewSprint(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
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
                  <label className="block font-bold uppercase text-black mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
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
                  <label className="block font-bold uppercase text-black mb-1">Epic</label>
                  <input
                    type="text"
                    list="epic-list"
                    value={newEpic}
                    onChange={(e) => setNewEpic(e.target.value)}
                    placeholder="Select or enter Epic..."
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                  />
                  <datalist id="epic-list">
                    {epics.map((ep) => (
                      <option
                        key={ep.id || ep.number}
                        value={`${ep.number}: ${ep.short_description || ep.shortDescription || ep.name || ""}`}
                      />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold uppercase text-black mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">Acceptance Criteria</label>
                <textarea
                  rows={2}
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  placeholder="GIVEN [context], WHEN [action], THEN [outcome]..."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black font-mono text-[11px]"
                />
              </div>

              <div className="border-t-2 border-black pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStory}
                  className="px-5 py-2 border-2 border-black bg-black hover:bg-[#eb0029] hover:text-white text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
                >
                  {creatingStory ? "Creating..." : "Create User Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SPRINT MODAL */}
      {createSprintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border-2 border-black bg-white max-w-md w-full p-6 space-y-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-black" />
                <h3 className="font-mono text-base font-black uppercase text-black">Create Agile Sprint</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateSprintModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center border-2 border-black text-black hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block font-bold uppercase text-black mb-1">Sprint Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 24 - Orion Release"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-black mb-1">State</label>
                  <select
                    value={newSprintState}
                    onChange={(e) => setNewSprintState(e.target.value as any)}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active (Current)</option>
                    <option value="closed">Closed / Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-black mb-1">Capacity (Pts)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newSprintCapacity}
                    onChange={(e) => setNewSprintCapacity(Number(e.target.value))}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-black mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-black mb-1">End Date</label>
                  <input
                    type="date"
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">Sprint Goal</label>
                <textarea
                  rows={2}
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="Key milestones or commitments for this sprint cadence..."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="border-t-2 border-black pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateSprintModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSprint}
                  className="px-5 py-2 border-2 border-black bg-black hover:bg-[#eb0029] hover:text-white text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
                >
                  {creatingSprint ? "Creating..." : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EPIC MODAL */}
      {createEpicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border-2 border-black bg-white max-w-md w-full p-6 space-y-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-black" />
                <h3 className="font-mono text-base font-black uppercase text-black">Create Agile Epic</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateEpicModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center border-2 border-black text-black hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEpic} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block font-bold uppercase text-black mb-1">Epic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Incident Management Automation"
                  value={newEpicTitle}
                  onChange={(e) => setNewEpicTitle(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">Priority</label>
                <select
                  value={newEpicPriority}
                  onChange={(e) => setNewEpicPriority(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-1.5 text-black outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="1">1 - Critical Strategic Initiative</option>
                  <option value="2">2 - High Value / High Impact</option>
                  <option value="3">3 - Medium Priority</option>
                  <option value="4">4 - Low / Nice to Have</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-black mb-1">Business Objective / Description</label>
                <textarea
                  rows={3}
                  value={newEpicDesc}
                  onChange={(e) => setNewEpicDesc(e.target.value)}
                  placeholder="Describe the business outcomes, scope, and high-level architectural goals..."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-black placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="border-t-2 border-black pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateEpicModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-100 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEpic}
                  className="px-5 py-2 border-2 border-black bg-black hover:bg-[#eb0029] hover:text-white text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
                >
                  {creatingEpic ? "Creating..." : "Create Epic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORY DETAIL & EDIT MODAL */}
      {storyDetailModalOpen && selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border-2 border-black bg-white max-w-xl w-full p-6 space-y-4 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-xs font-black text-white">
                  {selectedStory.number}
                </span>
                <h3 className="font-mono text-sm font-black uppercase text-black truncate max-w-sm">
                  {selectedStory.short_description}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStoryDetailModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center border-2 border-black text-black hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="font-bold uppercase text-black block mb-1">Description</span>
                <p className="p-3 bg-neutral-100 border-2 border-black text-black leading-relaxed">
                  {selectedStory.description || "No detailed description provided."}
                </p>
              </div>

              {selectedStory.acceptance_criteria && (
                <div>
                  <span className="font-bold uppercase text-black block mb-1">Acceptance Criteria</span>
                  <div className="p-3 bg-neutral-100 border-2 border-black text-black font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {selectedStory.acceptance_criteria}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">Epic</span>
                  <span className="font-bold text-black mt-0.5 block truncate">
                    {selectedStory.epic_name || "None"}
                  </span>
                </div>

                <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">Sprint</span>
                  <span className="font-bold text-black mt-0.5 block truncate">
                    {selectedStory.sprint_name || "Product Backlog"}
                  </span>
                </div>

                <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">Assignee</span>
                  <span className="font-bold text-black mt-0.5 block truncate">
                    {selectedStory.assigned_to || "Unassigned"}
                  </span>
                </div>

                <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">Story Points</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {FIBONACCI_POINTS.map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => handleUpdatePoints(selectedStory, pts)}
                        className={`px-2 py-0.5 border border-black font-mono text-xs font-bold cursor-pointer transition-colors ${
                          Number(selectedStory.story_points) === pts
                            ? "bg-black text-white"
                            : "bg-white text-black hover:bg-neutral-100"
                        }`}
                      >
                        {pts}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-black pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteStory(selectedStory.id)}
                className="px-3 py-1.5 border-2 border-black bg-white hover:bg-red-50 text-red-600 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Story</span>
              </button>

              <button
                type="button"
                onClick={() => setStoryDetailModalOpen(false)}
                className="px-4 py-2 border-2 border-black bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
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
