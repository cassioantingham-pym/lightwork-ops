"use client";

import { useEffect, useState } from "react";

interface PymBriefingProps {
  onChipClick: (chip: string) => void;
}

export function PymBriefing({ onChipClick }: PymBriefingProps) {
  const [briefing, setBriefing] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/briefing")
      .then((res) => res.json())
      .then((data) => {
        setBriefing(data.briefing);
        setChips(data.chips || []);
      })
      .catch(() => {
        setBriefing("Could not load briefing.");
        setChips(["Show all goals"]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-[#bae6fd]/60 rounded-2xl p-5 shadow-[0_1px_8px_rgba(26,160,230,0.06)]">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-xl flex items-center justify-center text-white font-bold text-[11px] shadow-[0_2px_8px_rgba(26,160,230,0.3)]">
          ✦
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[#0f042d]">
            Pym&apos;s Briefing
          </div>
          <div className="text-[11px] text-gray-400">Updated just now</div>
        </div>
      </div>

      {loading ? (
        <div className="text-[13px] text-gray-400 animate-pulse py-2">
          Analyzing your goals...
        </div>
      ) : (
        <>
          <div className="text-[13.5px] text-[#20282d] leading-[1.65] mb-3">
            {briefing}
          </div>
          <div className="flex gap-2 flex-wrap">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => onChipClick(chip)}
                className="bg-[#f0f9ff]/80 backdrop-blur-sm border border-[#bae6fd]/60 text-[#0075AD] text-[12px] font-medium px-3 py-1 rounded-lg cursor-pointer hover:bg-[#e0f2fe] transition-all hover:shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
