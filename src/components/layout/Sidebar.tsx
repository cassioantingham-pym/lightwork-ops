"use client";

import { cn } from "@/lib/utils";

const views = [
  { icon: "⚡", label: "Command centre", key: "command" },
  { icon: "📋", label: "All goals", key: "goals" },
  { icon: "🔥", label: "At risk", key: "at-risk" },
  { icon: "✓", label: "Completed", key: "completed" },
  { icon: "👥", label: "By team", key: "teams" },
];

const spotlight = [
  { icon: "🌟", label: "People", key: "people" },
  { icon: "🏢", label: "Departments", key: "departments" },
];

const reports = [
  { icon: "📊", label: "Weekly summary", key: "summary" },
  { icon: "📤", label: "Export", key: "export" },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  riskCount?: number;
  goalCount?: number;
}

export function Sidebar({
  activeView,
  onViewChange,
  riskCount = 0,
  goalCount = 0,
}: SidebarProps) {
  return (
    <aside className="w-[200px] bg-white border-r border-gray-200 p-4 flex flex-col gap-0.5 shrink-0">
      <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase px-2 pb-1.5">
        Views
      </div>
      {views.map((item) => (
        <button
          key={item.key}
          onClick={() => onViewChange(item.key)}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium text-[#575757] cursor-pointer text-left w-full border-none bg-transparent hover:bg-gray-100 transition-colors",
            activeView === item.key &&
              "bg-[#e7f6fe] text-[#1AA0E6] font-semibold hover:bg-[#e7f6fe]"
          )}
        >
          <span>{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.key === "goals" && goalCount > 0 && (
            <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-1.5 rounded-full">
              {goalCount}
            </span>
          )}
          {item.key === "at-risk" && riskCount > 0 && (
            <span className="bg-red-50 text-red-500 text-[10px] font-bold px-1.5 rounded-full">
              {riskCount}
            </span>
          )}
        </button>
      ))}

      <div className="h-px bg-gray-100 my-1.5" />

      <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase px-2 pb-1.5">
        Spotlight
      </div>
      {spotlight.map((item) => (
        <button
          key={item.key}
          onClick={() => onViewChange(item.key)}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium text-[#575757] cursor-pointer text-left w-full border-none bg-transparent hover:bg-gray-100 transition-colors",
            activeView === item.key &&
              "bg-[#e7f6fe] text-[#1AA0E6] font-semibold hover:bg-[#e7f6fe]"
          )}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="h-px bg-gray-100 my-1.5" />

      <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase px-2 pb-1.5">
        Reports
      </div>
      {reports.map((item) => (
        <button
          key={item.key}
          onClick={() => onViewChange(item.key)}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium text-[#575757] cursor-pointer text-left w-full border-none bg-transparent hover:bg-gray-100 transition-colors",
            activeView === item.key &&
              "bg-[#e7f6fe] text-[#1AA0E6] font-semibold hover:bg-[#e7f6fe]"
          )}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="flex-1" />
      <div className="text-[11px] text-gray-400 px-2.5 py-2">
        {new Date().toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </aside>
  );
}
