"use client";

interface NavbarProps {
  onAddGoal: () => void;
}

export function Navbar({ onAddGoal }: NavbarProps) {
  return (
    <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://framerusercontent.com/images/iU0WgErOqN5xst7T4tfl00leQ.png"
          alt="LightWork"
          className="h-5.5"
          style={{ height: 22 }}
        />
        <span className="text-sm font-bold text-[#0f042d]">LightWork</span>
        <div className="w-px h-4.5 bg-gray-200" />
        <span className="text-[13px] font-semibold text-[#0f042d]">Ops</span>
        <span className="bg-[#e7f6fe] text-[#1AA0E6] text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-[#575757]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_0_2px_#dcfce7]" />
          Pym is watching
        </div>
        <button
          onClick={onAddGoal}
          className="bg-[#1AA0E6] text-white border-none rounded-[7px] px-3.5 py-1 text-xs font-medium cursor-pointer hover:bg-[#0e8fd4] transition-colors"
        >
          + Add goal
        </button>
      </div>
    </header>
  );
}
