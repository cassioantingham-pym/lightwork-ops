"use client";

interface SignalBarProps {
  atRisk: number;
  onTrack: number;
  doneThisWeek: number;
}

export function SignalBar({ atRisk, onTrack, doneThisWeek }: SignalBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white/70 backdrop-blur-xl border border-red-100/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            At Risk
          </span>
        </div>
        <div className="text-[28px] font-bold text-red-500 leading-none">
          {atRisk}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-green-100/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            On Track
          </span>
        </div>
        <div className="text-[28px] font-bold text-emerald-500 leading-none">
          {onTrack}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-amber-100/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Done This Week
          </span>
        </div>
        <div className="text-[28px] font-bold text-amber-500 leading-none">
          {doneThisWeek}
        </div>
      </div>
    </div>
  );
}
