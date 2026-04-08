"use client";

import { useState, useEffect } from "react";
import { Goal } from "@/lib/supabase";

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
  onDelete?: (id: string) => void;
  goal?: Goal | null;
}

const TEAMS = ["Engineering", "Product", "Commercial", "Operations"];
const PRIORITIES = ["P0", "P1", "P2"];
const STATUSES = ["on_track", "at_risk", "complete", "missed"];
const STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  complete: "Complete",
  missed: "Missed",
};

export function GoalModal({
  open,
  onClose,
  onSave,
  onDelete,
  goal,
}: GoalModalProps) {
  const [form, setForm] = useState<{
    goal: string;
    team: string;
    owner: string;
    deadline: string;
    priority: "P0" | "P1" | "P2";
    status: "on_track" | "at_risk" | "complete" | "missed";
    progress: number;
    notes: string;
  }>({
    goal: "",
    team: "Engineering",
    owner: "",
    deadline: "",
    priority: "P1",
    status: "on_track",
    progress: 0,
    notes: "",
  });

  useEffect(() => {
    if (goal) {
      setForm({
        goal: goal.goal,
        team: goal.team,
        owner: goal.owner,
        deadline: goal.deadline,
        priority: goal.priority,
        status: goal.status,
        progress: goal.progress,
        notes: goal.notes || "",
      });
    } else {
      setForm({
        goal: "",
        team: "Engineering",
        owner: "",
        deadline: "",
        priority: "P1",
        status: "on_track",
        progress: 0,
        notes: "",
      });
    }
  }, [goal, open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(goal ? { id: goal.id, ...form } : form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-[14px] font-semibold text-[#0f042d]">
            {goal ? "Edit goal" : "Add goal"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer bg-transparent border-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Goal
            </label>
            <input
              type="text"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="Ship API integration"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] outline-none focus:border-[#1AA0E6] focus:ring-1 focus:ring-[#1AA0E6]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Team
              </label>
              <select
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] bg-white"
              >
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Owner
              </label>
              <input
                type="text"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="James"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] outline-none focus:border-[#1AA0E6] focus:ring-1 focus:ring-[#1AA0E6]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] outline-none focus:border-[#1AA0E6] focus:ring-1 focus:ring-[#1AA0E6]/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as "P0" | "P1" | "P2" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "on_track" | "at_risk" | "complete" | "missed" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Progress ({form.progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.progress}
              onChange={(e) =>
                setForm({ ...form, progress: parseInt(e.target.value) })
              }
              className="w-full accent-[#1AA0E6]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#0f042d] outline-none focus:border-[#1AA0E6] focus:ring-1 focus:ring-[#1AA0E6]/20 resize-none"
            />
          </div>

          <div className="flex justify-between pt-2">
            <div>
              {goal && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(goal.id);
                    onClose();
                  }}
                  className="text-red-500 text-[12px] font-medium hover:text-red-700 cursor-pointer bg-transparent border-none"
                >
                  Delete goal
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-[12px] font-medium text-[#575757] bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#1AA0E6] rounded-lg border-none cursor-pointer hover:bg-[#0e8fd4] transition-colors"
              >
                {goal ? "Save changes" : "Create goal"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
