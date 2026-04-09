"use client";

import { useState } from "react";
import { Goal } from "@/lib/supabase";

type ViewMode = "list" | "cards" | "kanban" | "compact";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  on_track: { label: "On Track", className: "bg-emerald-50 text-emerald-600 border-emerald-200/60" },
  at_risk: { label: "At Risk", className: "bg-red-50 text-red-500 border-red-200/60" },
  complete: { label: "Complete", className: "bg-blue-50 text-[#1AA0E6] border-blue-200/60" },
  missed: { label: "Missed", className: "bg-gray-50 text-gray-500 border-gray-200/60" },
};

const PRIORITY_BADGES: Record<string, string> = {
  P0: "bg-red-500 text-white",
  P1: "bg-orange-400 text-white",
  P2: "bg-gray-300 text-gray-700",
};

interface GoalListProps {
  goals: Goal[];
  onEditGoal: (goal: Goal) => void;
}

export function GoalList({ goals, onEditGoal }: GoalListProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [teamFilter, setTeamFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "progress">("deadline");

  const teams = [...new Set(goals.map((g) => g.team))].sort();
  const owners = [...new Set(goals.map((g) => g.owner))].sort();
  const hasFilters = teamFilter !== "all" || ownerFilter !== "all" || statusFilter !== "all";

  // Filter
  let filtered = goals.filter((g) => {
    if (teamFilter !== "all" && g.team !== teamFilter) return false;
    if (ownerFilter !== "all" && g.owner !== ownerFilter) return false;
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (sortBy === "priority") {
      const order = { P0: 0, P1: 1, P2: 2 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    }
    return b.progress - a.progress;
  });

  // Pin: P0 goals with at_risk or goals due within 3 days
  const now = new Date();
  const pinned = filtered.filter((g) => {
    if (g.status === "complete" || g.status === "missed") return false;
    if (g.priority === "P0" && g.status === "at_risk") return true;
    const daysUntil = (new Date(g.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 3 && daysUntil >= 0;
  });
  const pinnedIds = new Set(pinned.map((g) => g.id));
  const unpinned = filtered.filter((g) => !pinnedIds.has(g.id));

  function clearFilters() {
    setTeamFilter("all");
    setOwnerFilter("all");
    setStatusFilter("all");
  }

  const views: { key: ViewMode; label: string; icon: string }[] = [
    { key: "list", label: "List", icon: "☰" },
    { key: "cards", label: "Cards", icon: "▦" },
    { key: "kanban", label: "Kanban", icon: "◫" },
    { key: "compact", label: "Compact", icon: "≡" },
  ];

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold text-[#0f042d]">
          Active Goals
        </div>
        <div className="flex items-center gap-1.5">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border-none ${
                view === v.key
                  ? "bg-[#e7f6fe] text-[#1AA0E6]"
                  : "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-600 cursor-pointer"
        >
          <option value="all">All Owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-600 cursor-pointer"
        >
          <option value="all">All Depts</option>
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-600 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="on_track">On Track</option>
          <option value="at_risk">At Risk</option>
          <option value="complete">Complete</option>
          <option value="missed">Missed</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-600 cursor-pointer"
        >
          <option value="deadline">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
          <option value="progress">Sort: Progress</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[12px] text-[#1AA0E6] font-medium cursor-pointer bg-transparent border-none hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Pinned goals */}
      {pinned.length > 0 && view === "list" && (
        <div className="mb-3">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            📌 Pinned
          </div>
          <div className="flex flex-col gap-2">
            {pinned.map((goal) => (
              <GoalRow key={goal.id} goal={goal} onEdit={onEditGoal} pinned />
            ))}
          </div>
        </div>
      )}

      {/* Goal list */}
      {view === "list" && (
        <div className="flex flex-col gap-2">
          {unpinned.length === 0 && pinned.length === 0 && (
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl p-8 text-center text-[13px] text-gray-400">
              No goals match the current filters.
            </div>
          )}
          {unpinned.map((goal) => (
            <GoalRow key={goal.id} goal={goal} onEdit={onEditGoal} />
          ))}
        </div>
      )}

      {/* Cards view */}
      {view === "cards" && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={onEditGoal} />
          ))}
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && <KanbanView goals={filtered} onEdit={onEditGoal} />}

      {/* Compact view */}
      {view === "compact" && (
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/40 rounded-xl overflow-hidden">
          {filtered.map((goal, i) => (
            <div
              key={goal.id}
              onClick={() => onEditGoal(goal)}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50/80 transition-colors ${
                i < filtered.length - 1 ? "border-b border-gray-100/60" : ""
              }`}
            >
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_BADGES[goal.priority]}`}>
                {goal.priority}
              </span>
              <span className="text-[12px] font-medium text-[#0f042d] flex-1 truncate">
                {goal.goal}
              </span>
              <span className="text-[11px] text-gray-400">{goal.team}</span>
              <span className="text-[11px] text-gray-400">
                {new Date(goal.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
              <StatusBadge status={goal.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goal,
  onEdit,
  pinned = false,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  pinned?: boolean;
}) {
  const now = new Date();
  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      onClick={() => onEdit(goal)}
      className={`bg-white/70 backdrop-blur-xl border rounded-xl px-4 py-3 cursor-pointer hover:shadow-md transition-all group ${
        pinned
          ? "border-[#1AA0E6]/30 shadow-[0_0_12px_rgba(26,160,230,0.06)]"
          : "border-gray-200/40 hover:border-gray-300/60"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Priority badge */}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${PRIORITY_BADGES[goal.priority]}`}
        >
          {goal.priority}
        </span>

        {/* Compliance indicator */}
        {goal.category === "compliance" && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200/60 shrink-0">
            🛡 COMPLIANCE
          </span>
        )}

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#0f042d] truncate">
            {goal.goal}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-gray-400">{goal.owner}</span>
            <span className="text-[11px] text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{goal.team}</span>
            <span className="text-[11px] text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">
              Updated{" "}
              {formatTimeAgo(goal.last_updated)}
            </span>
          </div>
          {goal.notes && (
            <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[400px] italic">
              💬 {goal.notes.split("\n").pop()}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-16 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor:
                    goal.progress >= 75
                      ? "#10b981"
                      : goal.progress >= 40
                      ? "#1AA0E6"
                      : "#f59e0b",
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium w-8 text-right">
              {goal.progress}%
            </span>
          </div>
        </div>

        {/* Days left */}
        <div className="shrink-0 w-14 text-right">
          {goal.status === "complete" ? (
            <span className="text-[11px] text-emerald-500 font-medium">Done</span>
          ) : daysLeft < 0 ? (
            <span className="text-[11px] text-red-500 font-semibold">
              {Math.abs(daysLeft)}d overdue
            </span>
          ) : (
            <span
              className={`text-[11px] font-medium ${
                daysLeft <= 3 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {daysLeft}d left
            </span>
          )}
        </div>

        {/* Status */}
        <StatusBadge status={goal.status} />
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: (g: Goal) => void }) {
  return (
    <div
      onClick={() => onEdit(goal)}
      className="bg-white/70 backdrop-blur-xl border border-gray-200/40 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-gray-300/60 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_BADGES[goal.priority]}`}>
          {goal.priority}
        </span>
        <StatusBadge status={goal.status} />
      </div>
      <div className="text-[13px] font-medium text-[#0f042d] mb-1 line-clamp-2">
        {goal.goal}
      </div>
      <div className="text-[11px] text-gray-400 mb-3">
        {goal.owner} · {goal.team}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${goal.progress}%`,
              backgroundColor:
                goal.progress >= 75 ? "#10b981" : goal.progress >= 40 ? "#1AA0E6" : "#f59e0b",
            }}
          />
        </div>
        <span className="text-[10px] text-gray-400">{goal.progress}%</span>
      </div>
      <div className="text-[10px] text-gray-400 mt-2">
        Due {new Date(goal.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </div>
    </div>
  );
}

function KanbanView({
  goals,
  onEdit,
}: {
  goals: Goal[];
  onEdit: (g: Goal) => void;
}) {
  const columns = [
    { key: "on_track", label: "On Track", color: "border-emerald-400" },
    { key: "at_risk", label: "At Risk", color: "border-red-400" },
    { key: "complete", label: "Complete", color: "border-blue-400" },
    { key: "missed", label: "Missed", color: "border-gray-400" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {columns.map((col) => {
        const colGoals = goals.filter((g) => g.status === col.key);
        return (
          <div key={col.key}>
            <div
              className={`text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b-2 ${col.color}`}
            >
              {col.label} ({colGoals.length})
            </div>
            <div className="flex flex-col gap-2">
              {colGoals.map((g) => (
                <div
                  key={g.id}
                  onClick={() => onEdit(g)}
                  className="bg-white/70 backdrop-blur-sm border border-gray-200/40 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="text-[12px] font-medium text-[#0f042d] mb-1">
                    {g.goal}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {g.owner} · {g.team}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || STATUS_BADGES.on_track;
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const hours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
