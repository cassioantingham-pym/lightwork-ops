import { Goal } from "./supabase";

export type Stats = {
  fires: number;
  wins: number;
  stalled: number;
  avgProgress: number;
};

export type PersonSpotlight = {
  name: string;
  team: string;
  goalCount: number;
  avgProgress: number;
  tag: "Top performer" | "Overloaded" | "Stalled" | "Steady" | "New";
  tagColor: string;
};

export type DepartmentSpotlight = {
  name: string;
  activeGoals: number;
  avgProgress: number;
  status: "on_track" | "at_risk" | "stale";
  subtitle: string;
};

export function computeStats(goals: Goal[]): Stats {
  const now = new Date();

  const fires = goals.filter((g) => {
    if (g.status === "complete" || g.status === "missed") return false;
    if (g.status === "at_risk") return true;
    const deadline = new Date(g.deadline);
    return deadline < now;
  }).length;

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const wins = goals.filter(
    (g) => g.status === "complete" && new Date(g.last_updated) >= weekAgo
  ).length;

  const stalled = goals.filter((g) => {
    if (g.status === "complete" || g.status === "missed") return false;
    const updated = new Date(g.last_updated);
    const daysSince =
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 4;
  }).length;

  const active = goals.filter(
    (g) => g.status !== "complete" && g.status !== "missed"
  );
  const avgProgress =
    active.length > 0
      ? Math.round(
          active.reduce((sum, g) => sum + g.progress, 0) / active.length
        )
      : 0;

  return { fires, wins, stalled, avgProgress };
}

export function computePeopleSpotlight(goals: Goal[]): PersonSpotlight[] {
  const byOwner = new Map<string, Goal[]>();
  goals.forEach((g) => {
    const existing = byOwner.get(g.owner) || [];
    existing.push(g);
    byOwner.set(g.owner, existing);
  });

  const now = new Date();

  return Array.from(byOwner.entries()).map(([name, ownerGoals]) => {
    const team = ownerGoals[0].team;
    const active = ownerGoals.filter(
      (g) => g.status !== "complete" && g.status !== "missed"
    );
    const avgProgress =
      active.length > 0
        ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
        : ownerGoals.some((g) => g.status === "complete")
        ? 100
        : 0;

    const completedCount = ownerGoals.filter(
      (g) => g.status === "complete"
    ).length;
    const atRiskCount = ownerGoals.filter(
      (g) => g.status === "at_risk"
    ).length;
    const staleCount = active.filter((g) => {
      const days =
        (now.getTime() - new Date(g.last_updated).getTime()) /
        (1000 * 60 * 60 * 24);
      return days > 4;
    }).length;

    let tag: PersonSpotlight["tag"];
    let tagColor: string;

    if (staleCount > 0 || atRiskCount > active.length / 2) {
      tag = "Stalled";
      tagColor = "bg-red-50 text-red-600";
    } else if (active.length >= 3) {
      tag = "Overloaded";
      tagColor = "bg-orange-50 text-orange-600";
    } else if (avgProgress >= 75 || completedCount >= 2) {
      tag = "Top performer";
      tagColor = "bg-yellow-50 text-yellow-700";
    } else {
      tag = "Steady";
      tagColor = "bg-slate-50 text-slate-500";
    }

    return { name, team, goalCount: ownerGoals.length, avgProgress, tag, tagColor };
  });
}

export function computeDepartmentSpotlight(
  goals: Goal[]
): DepartmentSpotlight[] {
  const byTeam = new Map<string, Goal[]>();
  goals.forEach((g) => {
    const existing = byTeam.get(g.team) || [];
    existing.push(g);
    byTeam.set(g.team, existing);
  });

  const now = new Date();

  return Array.from(byTeam.entries()).map(([name, teamGoals]) => {
    const active = teamGoals.filter(
      (g) => g.status !== "complete" && g.status !== "missed"
    );
    const avgProgress =
      active.length > 0
        ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
        : 0;

    const atRiskCount = active.filter((g) => g.status === "at_risk").length;
    const staleCount = active.filter((g) => {
      const days =
        (now.getTime() - new Date(g.last_updated).getTime()) /
        (1000 * 60 * 60 * 24);
      return days > 4;
    }).length;

    let status: DepartmentSpotlight["status"] = "on_track";
    if (atRiskCount > 0) status = "at_risk";
    else if (staleCount > 0) status = "stale";

    const nextDeadline = active
      .map((g) => g.deadline)
      .sort()[0];

    let subtitle = `${active.length} active`;
    if (nextDeadline) {
      subtitle += ` · next deadline ${new Date(nextDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    }

    return { name, activeGoals: active.length, avgProgress, status, subtitle };
  });
}
