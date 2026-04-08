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
        `- [${g.id}] "${g.goal}" | Team: ${g.team} | Owner: ${g.owner} | Status: ${g.status} | Priority: ${g.priority} | Progress: ${g.progress}% | Deadline: ${g.deadline} | Last updated: ${g.last_updated}`
    )
    .join("\n");

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a morning briefing for the Founder's Associate. Be concise — 2-3 sentences max. Highlight what needs attention today: at-risk items, approaching deadlines (within 3 days), stale goals (no update in 4+ days). End with what's going well.

Also suggest 3-4 short action chip labels (under 30 chars each) that the user could click to take action. Return your response in this JSON format:
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
