import { supabase, Goal } from "./supabase";

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ result: string; goalChanged: boolean }> {
  switch (name) {
    case "create_goal":
      return createGoal(args);
    case "update_goal":
      return updateGoal(args);
    case "delete_goal":
      return deleteGoal(args);
    case "flag_risk":
      return flagRisk(args);
    case "generate_weekly_summary":
      return generateWeeklySummary();
    default:
      return { result: `Unknown tool: ${name}`, goalChanged: false };
  }
}

async function createGoal(
  args: Record<string, unknown>
): Promise<{ result: string; goalChanged: boolean }> {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      team: args.team,
      goal: args.goal,
      owner: args.owner,
      deadline: args.deadline,
      priority: args.priority,
      notes: args.notes || null,
      status: "on_track",
      progress: 0,
      last_updated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { result: `Error creating goal: ${error.message}`, goalChanged: false };
  }

  return {
    result: `Goal created: "${data.goal}" for ${data.team}, owned by ${data.owner}, due ${data.deadline}, priority ${data.priority}.`,
    goalChanged: true,
  };
}

async function updateGoal(
  args: Record<string, unknown>
): Promise<{ result: string; goalChanged: boolean }> {
  const updates: Record<string, unknown> = {
    last_updated: new Date().toISOString(),
  };

  // Map all possible fields
  if (args.status !== undefined) updates.status = args.status;
  if (args.progress !== undefined) updates.progress = args.progress;
  if (args.notes !== undefined) updates.notes = args.notes;
  if (args.deadline !== undefined) updates.deadline = args.deadline;
  if (args.owner !== undefined) updates.owner = args.owner;
  if (args.team !== undefined) updates.team = args.team;
  if (args.priority !== undefined) updates.priority = args.priority;
  if (args.goal !== undefined) updates.goal = args.goal;

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", args.goal_id)
    .select()
    .single();

  if (error) {
    return { result: `Error updating goal: ${error.message}`, goalChanged: false };
  }

  // Build a human-readable summary of what changed
  const changes: string[] = [];
  if (args.status) changes.push(`status → ${data.status}`);
  if (args.progress !== undefined) changes.push(`progress → ${data.progress}%`);
  if (args.owner) changes.push(`owner → ${data.owner}`);
  if (args.team) changes.push(`team → ${data.team}`);
  if (args.priority) changes.push(`priority → ${data.priority}`);
  if (args.deadline) changes.push(`deadline → ${data.deadline}`);
  if (args.goal) changes.push(`title → "${data.goal}"`);
  if (args.notes) changes.push(`notes updated`);

  return {
    result: `Updated "${data.goal}": ${changes.join(", ")}.`,
    goalChanged: true,
  };
}

async function deleteGoal(
  args: Record<string, unknown>
): Promise<{ result: string; goalChanged: boolean }> {
  // Fetch the goal first so we can confirm what was deleted
  const { data: goal } = await supabase
    .from("goals")
    .select("goal, team, owner")
    .eq("id", args.goal_id)
    .single();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", args.goal_id);

  if (error) {
    return { result: `Error deleting goal: ${error.message}`, goalChanged: false };
  }

  if (goal) {
    return {
      result: `Deleted "${goal.goal}" (${goal.team}, ${goal.owner}). It's gone.`,
      goalChanged: true,
    };
  }

  return { result: "Goal deleted.", goalChanged: true };
}

async function flagRisk(
  args: Record<string, unknown>
): Promise<{ result: string; goalChanged: boolean }> {
  const { data, error } = await supabase
    .from("goals")
    .update({
      status: "at_risk",
      notes: `⚠ Flagged at risk: ${args.reason}`,
      last_updated: new Date().toISOString(),
    })
    .eq("id", args.goal_id)
    .select()
    .single();

  if (error) {
    return { result: `Error flagging goal: ${error.message}`, goalChanged: false };
  }

  return {
    result: `Flagged "${data.goal}" as at risk. Reason: ${args.reason}.`,
    goalChanged: true,
  };
}

async function generateWeeklySummary(): Promise<{
  result: string;
  goalChanged: boolean;
}> {
  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .order("deadline", { ascending: true });

  if (error || !goals) {
    return { result: "Error fetching goals for summary.", goalChanged: false };
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const completed = goals.filter((g: Goal) => g.status === "complete");
  const atRisk = goals.filter((g: Goal) => g.status === "at_risk");
  const stale = goals.filter((g: Goal) => {
    const updated = new Date(g.last_updated);
    const daysSince =
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 4 && g.status !== "complete" && g.status !== "missed";
  });
  const upcoming = goals.filter((g: Goal) => {
    const deadline = new Date(g.deadline);
    const daysUntil =
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil >= 0 && daysUntil <= 7 && g.status !== "complete";
  });

  const recentlyCompleted = completed.filter(
    (g: Goal) => new Date(g.last_updated) >= weekAgo
  );

  let summary = `## Weekly Summary — ${now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}\n\n`;

  summary += `### ✅ Completed (${recentlyCompleted.length} this week)\n`;
  if (recentlyCompleted.length > 0) {
    recentlyCompleted.forEach((g: Goal) => {
      summary += `- **${g.goal}** (${g.team}, ${g.owner})\n`;
    });
  } else {
    summary += "- No goals completed this week.\n";
  }

  summary += `\n### 🔥 At Risk (${atRisk.length})\n`;
  if (atRisk.length > 0) {
    atRisk.forEach((g: Goal) => {
      summary += `- **${g.goal}** — ${g.team}, ${g.owner}. Due: ${g.deadline}. ${g.notes || ""}\n`;
    });
  } else {
    summary += "- Nothing at risk.\n";
  }

  summary += `\n### ⏸ Stalled (${stale.length})\n`;
  if (stale.length > 0) {
    stale.forEach((g: Goal) => {
      const days = Math.floor(
        (now.getTime() - new Date(g.last_updated).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      summary += `- **${g.goal}** — ${g.team}, ${g.owner}. No update in ${days} days.\n`;
    });
  } else {
    summary += "- All goals have recent updates.\n";
  }

  summary += `\n### 📅 Upcoming (next 7 days)\n`;
  if (upcoming.length > 0) {
    upcoming.forEach((g: Goal) => {
      summary += `- **${g.goal}** — ${g.team}, due ${g.deadline} (${g.status.replace("_", " ")})\n`;
    });
  } else {
    summary += "- No deadlines in the next 7 days.\n";
  }

  const totalActive = goals.filter(
    (g: Goal) => g.status !== "complete" && g.status !== "missed"
  );
  const avgProgress =
    totalActive.length > 0
      ? Math.round(
          totalActive.reduce((sum: number, g: Goal) => sum + g.progress, 0) /
            totalActive.length
        )
      : 0;

  summary += `\n### 📊 Overall\n`;
  summary += `- **${goals.length}** total goals, **${totalActive.length}** active\n`;
  summary += `- Average progress: **${avgProgress}%**\n`;
  summary += `- Teams: ${[...new Set(goals.map((g: Goal) => g.team))].join(", ")}\n`;

  return { result: summary, goalChanged: false };
}
