"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal } from "@/lib/supabase";
import {
  computeStats,
  computePeopleSpotlight,
  computeDepartmentSpotlight,
} from "@/lib/compute-stats";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatPanels } from "@/components/dashboard/StatPanels";
import { PymBanner } from "@/components/dashboard/PymBanner";
import { PeopleSpotlightCard } from "@/components/dashboard/PeopleSpotlight";
import { DepartmentSpotlightCard } from "@/components/dashboard/DepartmentSpotlight";
import { GoalsTable } from "@/components/dashboard/GoalsTable";
import { GoalModal } from "@/components/goals/GoalModal";
import { ChatDrawer } from "@/components/chat/ChatDrawer";

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeView, setActiveView] = useState("command");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoals(data);
      }
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
  const people = computePeopleSpotlight(goals);
  const departments = computeDepartmentSpotlight(goals);

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

  function handleChipClick(chip: string) {
    setChatOpen(true);
  }

  function handleEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setModalOpen(true);
  }

  function handleAddGoal() {
    setEditingGoal(null);
    setModalOpen(true);
  }

  const now = new Date();
  const atRiskGoals = goals.filter((g) => {
    if (g.status === "complete") return false;
    if (g.status === "at_risk" || g.status === "missed") return true;
    // Also include overdue goals (deadline passed but still active)
    const deadline = new Date(g.deadline);
    return deadline < now;
  });
  const completedGoals = goals.filter((g) => g.status === "complete");

  const teamGroups = goals.reduce(
    (acc, g) => {
      (acc[g.team] = acc[g.team] || []).push(g);
      return acc;
    },
    {} as Record<string, Goal[]>
  );

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFB]">
      <Navbar onAddGoal={handleAddGoal} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          riskCount={stats.fires}
          goalCount={goals.filter((g) => g.status !== "complete" && g.status !== "missed").length}
        />

        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">
              Loading goals...
            </div>
          ) : (
            <>
              {activeView === "command" && (
                <>
                  <PymBanner onChipClick={handleChipClick} />
                  <StatPanels stats={stats} />
                  <div className="grid grid-cols-2 gap-3">
                    <PeopleSpotlightCard people={people} />
                    <DepartmentSpotlightCard departments={departments} />
                  </div>
                  <GoalsTable goals={goals} onEditGoal={handleEditGoal} />
                </>
              )}

              {activeView === "goals" && (
                <GoalsTable goals={goals} onEditGoal={handleEditGoal} />
              )}

              {activeView === "at-risk" && (
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0f042d] mb-3">
                    🔥 At risk & missed
                  </h2>
                  {atRiskGoals.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-[10px] p-8 text-center text-[13px] text-gray-400">
                      Nothing at risk right now. Nice work.
                    </div>
                  ) : (
                    <GoalsTable
                      goals={atRiskGoals}
                      onEditGoal={handleEditGoal}
                      showFilters={false}
                    />
                  )}
                </div>
              )}

              {activeView === "completed" && (
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0f042d] mb-3">
                    ✓ Completed goals
                  </h2>
                  {completedGoals.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-[10px] p-8 text-center text-[13px] text-gray-400">
                      No completed goals yet.
                    </div>
                  ) : (
                    <GoalsTable
                      goals={completedGoals}
                      onEditGoal={handleEditGoal}
                      showFilters={false}
                    />
                  )}
                </div>
              )}

              {activeView === "teams" && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-[14px] font-semibold text-[#0f042d]">
                    👥 Goals by team
                  </h2>
                  {Object.entries(teamGroups).map(([team, teamGoals]) => {
                    const active = teamGoals.filter(
                      (g) => g.status !== "complete" && g.status !== "missed"
                    );
                    const avgProg =
                      active.length > 0
                        ? Math.round(
                            active.reduce((s, g) => s + g.progress, 0) /
                              active.length
                          )
                        : 0;
                    return (
                      <div key={team}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[13px] font-semibold text-[#0f042d]">
                            {team}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {active.length} active · {avgProg}% avg
                          </span>
                        </div>
                        <GoalsTable
                          goals={teamGoals}
                          onEditGoal={handleEditGoal}
                          showFilters={false}
                        />
                      </div>
                    );
                  })}
                  {Object.keys(teamGroups).length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-[10px] p-8 text-center text-[13px] text-gray-400">
                      No goals tracked yet.
                    </div>
                  )}
                </div>
              )}

              {activeView === "people" && (
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0f042d] mb-3">
                    🌟 People spotlight
                  </h2>
                  <PeopleSpotlightCard people={people} />
                </div>
              )}

              {activeView === "departments" && (
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0f042d] mb-3">
                    🏢 Department spotlight
                  </h2>
                  <DepartmentSpotlightCard departments={departments} />
                </div>
              )}

              {activeView === "summary" && <WeeklySummary />}

              {activeView === "export" && (
                <div className="bg-white border border-gray-200 rounded-[10px] p-8 text-center">
                  <h2 className="text-[14px] font-semibold text-[#0f042d] mb-2">
                    📤 Export
                  </h2>
                  <p className="text-[12px] text-gray-400 mb-4">
                    Download your goals data.
                  </p>
                  <button
                    onClick={() => {
                      const csv = [
                        "Goal,Team,Owner,Priority,Status,Progress,Deadline",
                        ...goals.map(
                          (g) =>
                            `"${g.goal}","${g.team}","${g.owner}","${g.priority}","${g.status}",${g.progress},"${g.deadline}"`
                        ),
                      ].join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `lightwork-goals-${new Date().toISOString().split("T")[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-[#1AA0E6] text-white rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer border-none hover:bg-[#0e8fd4] transition-colors"
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

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

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        goals={goals}
        onGoalsChanged={fetchGoals}
      />

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 bg-[#0f042d] text-white border-none rounded-xl px-4 py-2.5 text-[12.5px] font-semibold cursor-pointer flex items-center gap-2 shadow-[0_4px_14px_rgba(15,4,45,0.3)] hover:bg-[#1a0a3e] transition-colors z-40"
        >
          <div className="w-[7px] h-[7px] rounded-full bg-[#1AA0E6]" />
          Ask Pym anything
        </button>
      )}
    </div>
  );
}

function WeeklySummary() {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Generate a weekly summary for me." },
          ],
          goalsContext: "Use the generate_weekly_summary tool.",
        }),
      });
      const data = await res.json();
      setSummary(data.content || "Could not generate summary.");
    } catch {
      setSummary("Error generating summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-[#0f042d]">
          📊 Weekly summary
        </h2>
        <button
          onClick={generate}
          disabled={loading}
          className="bg-[#1AA0E6] text-white rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer border-none hover:bg-[#0e8fd4] transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate now"}
        </button>
      </div>
      {summary ? (
        <div className="bg-white border border-gray-200 rounded-[10px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="text-[13px] text-[#20282d] leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[10px] p-8 text-center text-[13px] text-gray-400">
          Click &quot;Generate now&quot; to create a weekly summary using Pym.
        </div>
      )}
    </div>
  );
}
