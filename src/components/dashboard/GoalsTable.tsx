"use client";

import { Goal } from "@/lib/supabase";
import { useState } from "react";

const STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  on_track: { label: "On Track", className: "bg-green-50 text-green-600" },
  at_risk: { label: "At Risk", className: "bg-red-50 text-red-500" },
  complete: { label: "Complete", className: "bg-blue-50 text-[#1AA0E6]" },
  missed: { label: "Missed", className: "bg-gray-100 text-gray-500" },
};

const PRIORITY_BADGES: Record<string, string> = {
  P0: "bg-red-50 text-red-500",
  P1: "bg-orange-50 text-orange-600",
  P2: "bg-slate-50 text-slate-500",
};

interface GoalsTableProps {
  goals: Goal[];
  onEditGoal: (goal: Goal) => void;
  showFilters?: boolean;
}

export function GoalsTable({
  goals,
  onEditGoal,
  showFilters = true,
}: GoalsTableProps) {
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const teams = [...new Set(goals.map((g) => g.team))].sort();

  const filtered = goals.filter((g) => {
    if (teamFilter !== "all" && g.team !== teamFilter) return false;
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  });

  const now = new Date();

  function deadlineDisplay(deadline: string, status: string) {
    const d = new Date(deadline);
    const daysUntil = Math.ceil(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const formatted = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

    if (status === "complete" || status === "missed") {
      return <span className="text-[11.5px] text-gray-400">{formatted}</span>;
    }
    if (daysUntil < 0) {
      return (
        <span className="text-[11.5px] text-red-500 font-semibold">
          {formatted} ⚠ overdue
        </span>
      );
    }
    if (daysUntil <= 3) {
      return (
        <span className="text-[11.5px] text-red-500 font-semibold">
          {formatted} ⚠
        </span>
      );
    }
    return <span className="text-[11.5px] text-gray-400">{formatted}</span>;
  }

  return (
    <div>
      {showFilters && (
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[13px] font-semibold text-[#0f042d]">
            All goals
          </span>
          <div className="flex gap-1.5">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-md px-2.5 py-1 text-[11.5px] text-[#575757] cursor-pointer"
            >
              <option value="all">All teams</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-md px-2.5 py-1 text-[11.5px] text-[#575757] cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="complete">Complete</option>
              <option value="missed">Missed</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-[2fr_100px_90px_70px_90px_110px] px-4 py-2 bg-gray-50 gap-2 items-center">
          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
            Goal
          </span>
          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
            Team
          </span>
          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
            Owner
          </span>
          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
            Priority
          </span>
          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
            Status
          </span>
          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">
            Deadline
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-gray-400">
            No goals match the current filters.
          </div>
        ) : (
          filtered.map((goal) => {
            const statusBadge = STATUS_BADGES[goal.status] || STATUS_BADGES.on_track;
            const priorityClass = PRIORITY_BADGES[goal.priority] || PRIORITY_BADGES.P2;

            return (
              <div
                key={goal.id}
                onClick={() => onEditGoal(goal)}
                className="grid grid-cols-[2fr_100px_90px_70px_90px_110px] px-4 py-2.5 border-b border-gray-100 last:border-b-0 gap-2 items-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-[12.5px] font-medium text-[#0f042d] truncate">
                  {goal.goal}
                </span>
                <span className="text-[12px] text-[#575757]">{goal.team}</span>
                <span className="text-[12px] text-[#575757]">{goal.owner}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-px rounded inline-block w-fit ${priorityClass}`}
                >
                  {goal.priority}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-px rounded inline-block w-fit ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
                {deadlineDisplay(goal.deadline, goal.status)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
