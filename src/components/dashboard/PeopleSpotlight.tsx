"use client";

import { PersonSpotlight } from "@/lib/compute-stats";

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-[#1AA0E6]",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function progressColor(pct: number) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-[#1AA0E6]";
  if (pct >= 25) return "bg-amber-500";
  return "bg-red-500";
}

interface Props {
  people: PersonSpotlight[];
}

export function PeopleSpotlightCard({ people }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className="text-[12.5px] font-semibold text-[#0f042d]">
          🌟 People spotlight
        </span>
        <span className="text-[11px] text-[#1AA0E6] cursor-pointer">
          View all →
        </span>
      </div>
      {people.length === 0 ? (
        <div className="px-4 py-6 text-[12px] text-gray-400 text-center">
          No goal owners found
        </div>
      ) : (
        people.slice(0, 5).map((person, i) => (
          <div
            key={person.name}
            className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50 last:border-b-0"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
            >
              {person.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0f042d]">
                {person.name}
              </div>
              <div className="text-[11px] text-gray-400">
                {person.team} · {person.goalCount} goal
                {person.goalCount !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`text-[9.5px] font-semibold px-1.5 py-px rounded ${person.tagColor}`}
              >
                {person.tag === "Top performer" && "⭐ "}
                {person.tag === "Overloaded" && "⚠ "}
                {person.tag === "Stalled" && "🔴 "}
                {person.tag === "Steady" && "● "}
                {person.tag}
              </span>
              <div className="w-[60px]">
                <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressColor(person.avgProgress)}`}
                    style={{ width: `${person.avgProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 text-right">
                  {person.avgProgress}%
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
