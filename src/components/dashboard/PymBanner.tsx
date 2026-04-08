"use client";

import { useEffect, useState } from "react";

interface PymBannerProps {
  onChipClick: (chip: string) => void;
}

export function PymBanner({ onChipClick }: PymBannerProps) {
  const [briefing, setBriefing] = useState<string>("");
  const [chips, setChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

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

  if (dismissed) return null;

  return (
    <div className="bg-white border-[1.5px] border-[#bae6fd] rounded-[10px] p-3 px-4 flex items-start gap-3 shadow-[0_1px_3px_rgba(26,160,230,0.08)]">
      <div className="w-[30px] h-[30px] bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
        LW
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-[#1AA0E6] tracking-wide mb-0.5">
          ✦ PYM · Morning briefing
        </div>
        {loading ? (
          <div className="text-[12.5px] text-gray-400 animate-pulse">
            Analyzing goals...
          </div>
        ) : (
          <>
            <div className="text-[12.5px] text-[#20282d] leading-relaxed">
              {briefing}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => onChipClick(chip)}
                  className="bg-[#f0f9ff] border border-[#bae6fd] text-[#0075AD] text-[11px] font-medium px-2.5 py-0.5 rounded-[5px] cursor-pointer hover:bg-[#e0f2fe] transition-colors"
                >
                  {chip}
                </button>
              ))}
              <button
                onClick={() => setDismissed(true)}
                className="bg-gray-50 border border-gray-200 text-gray-400 text-[11px] font-medium px-2.5 py-0.5 rounded-[5px] cursor-pointer hover:bg-gray-100 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
