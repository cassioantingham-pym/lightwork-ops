import { groq, SYSTEM_PROMPT } from "@/lib/groq";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .order("deadline", { ascending: true });

  if (error || !goals || goals.length === 0) {
    return NextResponse.json({
      briefing:
        "No goals tracked yet. Add some goals to get started — I'll keep an eye on everything.",
      chips: ["Add a goal"],
    });
  }

  // For briefing, only send goals that need attention (at_risk, missed, due within 7 days, stale)
  const now = new Date();
  const relevantGoals = goals.filter((g: { status: string; deadline: string; last_updated: string }) => {
    if (g.status === "at_risk" || g.status === "missed") return true;
    const daysUntil = (new Date(g.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 7 && g.status !== "complete") return true;
    const daysSinceUpdate = (now.getTime() - new Date(g.last_updated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 4 && g.status !== "complete") return true;
    return false;
  });

  // Also include a summary of what's on track
  const onTrackCount = goals.filter((g: { status: string }) => g.status === "on_track").length;
  const completeCount = goals.filter((g: { status: string }) => g.status === "complete").length;

  const goalsContext = relevantGoals
    .map(
      (g) =>
        `- "${g.goal}" | ${g.team} | ${g.owner} | ${g.status} | ${g.priority} | ${g.progress}% | Due: ${g.deadline} | Category: ${g.category || "general"}`
    )
    .join("\n") + `\n\nSummary: ${goals.length} total goals, ${onTrackCount} on track, ${completeCount} complete, ${relevantGoals.length} needing attention.`;

  const complianceIssues = goals.filter(
    (g: { category: string | null; status: string }) =>
      g.category === "compliance" && (g.status === "missed" || g.status === "at_risk")
  );

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a morning briefing for the Founder's Associate at LightWork AI. Use your warm, conversational personality. 3-4 sentences max.

Priorities for the briefing:
1. COMPLIANCE issues first — expired ICO registration, overdue compliance items are LEGAL RISKS and should be flagged urgently
2. At-risk items and approaching deadlines (within 3 days)
3. Connect goals to business context — e.g. "the PMS partnership is what your clients are waiting for" or "Felicity v2 is blocking 3 enterprise demos"
4. End with something positive

${complianceIssues.length > 0 ? `⚠ COMPLIANCE ALERT: ${complianceIssues.length} compliance item(s) need urgent attention.` : ""}

Also suggest 3-4 short action chip labels (under 30 chars each). Return JSON:
{
  "briefing": "your briefing text here",
  "chips": ["chip 1", "chip 2", "chip 3"]
}

Current goals:
${goalsContext}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return NextResponse.json({
      briefing: parsed.briefing || "All clear for now.",
      chips: parsed.chips || ["Show all goals"],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Briefing error:", msg);
    return NextResponse.json({
      briefing: "Could not generate briefing right now. Check back soon.",
      chips: ["Show all goals"],
    });
  }
}
