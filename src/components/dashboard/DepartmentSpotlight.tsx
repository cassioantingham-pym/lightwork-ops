"use client";

import { DepartmentSpotlight } from "@/lib/compute-stats";

const DEPT_ICONS: Record<string, { icon: string; bg: string }> = {
  Engineering: { icon: "⚙️", bg: "bg-red-50" },
  Commercial: { icon: "💼", bg: "bg-amber-50" },
  Product: { icon: "📦", bg: "bg-green-50" },
  Operations: { icon: "🛠️", bg: "bg-blue-50" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  on_track: { label: "On Track", className: "bg-green-50 text-green-600" },
  at_risk: { label: "At Risk", className: "bg-red-50 text-red-500" },
  stale: { label: "Stale", className: "bg-amber-50 text-amber-600" },
};

const PROGRESS_COLORS: Record<string, string> = {
  on_track: "text-green-500",
  at_risk: "text-red-500",
  stale: "text-amber-500",
};

interface Props {
  departments: DepartmentSpotlight[];
}

export function DepartmentSpotlightCard({ departments }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className="text-[12.5px] font-semibold text-[#0f042d]">
          🏢 Department spotlight
        </span>
        <span className="text-[11px] text-[#1AA0E6] cursor-pointer">
          View all →
        </span>
      </div>
      {departments.length === 0 ? (
        <div className="px-4 py-6 text-[12px] text-gray-400 text-center">
          No departments found
        </div>
      ) : (
        departments.map((dept) => {
          const iconData = DEPT_ICONS[dept.name] || {
            icon: "📂",
            bg: "bg-gray-50",
          };
          const badge = STATUS_BADGES[dept.status] || STATUS_BADGES.on_track;
          const progressColor = PROGRESS_COLORS[dept.status] || "text-[#1AA0E6]";

          return (
            <div
              key={dept.name}
              className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50 last:border-b-0"
            >
              <div
                className={`w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0 ${iconData.bg}`}
              >
                {iconData.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[#0f042d]">
                  {dept.name}
                </div>
                <div className="text-[11px] text-gray-400">{dept.subtitle}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[13px] font-bold ${progressColor}`}>
                  {dept.avgProgress}%
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-px rounded ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
