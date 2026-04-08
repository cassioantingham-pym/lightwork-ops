"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal } from "@/lib/supabase";
import { computeStats } from "@/lib/compute-stats";
import { PymBriefing } from "@/components/dashboard/PymBriefing";
import { SignalBar } from "@/components/dashboard/SignalBar";
import { GoalList } from "@/components/dashboard/GoalList";
import { GoalModal } from "@/components/goals/GoalModal";
import { PymChat } from "@/components/chat/PymChat";

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (Array.isArray(data)) setGoals(data);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const stats = computeStats(goals);

  async function handleSaveGoal(goalData: Partial<Goal>) {
    try {
      if (goalData.id) {
        await fetch("/api/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });
      } else {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });
      }
      fetchGoals();
    } catch (err) {
      console.error("Failed to save goal:", err);
    }
  }

  async function handleDeleteGoal(id: string) {
    try {
      await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FB]">
      {/* HEADER */}
      <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://framerusercontent.com/images/iU0WgErOqN5xst7T4tfl00leQ.png"
            alt="LightWork"
            style={{ height: 24 }}
          />
          <div>
            <div className="text-[15px] font-bold text-[#0f042d] leading-tight">
              Pym
            </div>
            <div className="text-[11px] text-gray-400 leading-tight">
              {today}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setModalOpen(true);
          }}
          className="bg-[#1AA0E6] text-white rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer border-none hover:bg-[#0e8fd4] transition-colors flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span> Add Goal
        </button>
      </header>

      {/* MAIN SPLIT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Dashboard 2/3 */}
        <div className="flex-[2] overflow-y-auto p-6 flex flex-col gap-5">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">
              Loading...
            </div>
          ) : (
            <>
              <PymBriefing onChipClick={() => {}} />
              <SignalBar
                atRisk={stats.fires}
                onTrack={
                  goals.filter(
                    (g) => g.status === "on_track"
                  ).length
                }
                doneThisWeek={stats.wins}
              />
              <GoalList
                goals={goals}
                onEditGoal={(goal) => {
                  setEditingGoal(goal);
                  setModalOpen(true);
                }}
              />
            </>
          )}
        </div>

        {/* RIGHT: Pym Chat 1/3 */}
        <div className="flex-[1] border-l border-gray-200/60 bg-white/50 backdrop-blur-sm flex flex-col min-w-[340px] max-w-[420px]">
          <PymChat goals={goals} onGoalsChanged={fetchGoals} />
        </div>
      </div>

      {/* Goal Modal */}
      <GoalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
        goal={editingGoal}
      />
    </div>
  );
}
