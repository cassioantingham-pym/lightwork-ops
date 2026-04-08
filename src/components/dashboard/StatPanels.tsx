"use client";

import { Stats } from "@/lib/compute-stats";

interface StatPanelsProps {
  stats: Stats;
}

const panels = [
  {
    key: "fires",
    label: "Fires",
    sub: "At risk or overdue",
    color: "text-red-500",
    border: "border-t-red-500",
  },
  {
    key: "wins",
    label: "Wins",
    sub: "Completed this week",
    color: "text-green-500",
    border: "border-t-green-500",
  },
  {
    key: "stalled",
    label: "Stalled",
    sub: "No update 4+ days",
    color: "text-amber-500",
    border: "border-t-amber-500",
  },
  {
    key: "avgProgress",
    label: "Avg progress",
    sub: "Across all teams",
    color: "text-[#1AA0E6]",
    border: "border-t-[#1AA0E6]",
    suffix: "%",
  },
] as const;

export function StatPanels({ stats }: StatPanelsProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {panels.map((p) => (
        <div
          key={p.key}
          className={`bg-white border border-gray-200 rounded-[10px] p-3.5 cursor-pointer transition-shadow hover:shadow-md border-t-[3px] ${p.border}`}
        >
          <div className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {p.label}
          </div>
          <div className={`text-[22px] font-bold leading-none mb-0.5 ${p.color}`}>
            {stats[p.key]}
            {"suffix" in p ? p.suffix : ""}
          </div>
          <div className="text-[11px] text-gray-400">{p.sub}</div>
        </div>
      ))}
    </div>
  );
}
