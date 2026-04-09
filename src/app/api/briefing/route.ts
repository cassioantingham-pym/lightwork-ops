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

  const goalsContext = goals
    .map(
      (g) =>
        `- "${g.goal}" | Team: ${g.team} | Owner: ${g.owner} | Status: ${g.status} | Priority: ${g.priority} | Progress: ${g.progress}% | Deadline: ${g.deadline} | Last updated: ${g.last_updated} | Category: ${g.category || "general"}`
    )
    .join("\n");

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
