import { groq, TOOL_DEFINITIONS, SYSTEM_PROMPT } from "@/lib/groq";
import { executeToolCall } from "@/lib/tools";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages, goalsContext } = await request.json();

  const systemMessage = `${SYSTEM_PROMPT}\n\nCurrent goals data:\n${goalsContext}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const message = response.choices[0].message;
    let goalChanged = false;

    // Handle tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolResults: Array<{
        role: "tool";
        tool_call_id: string;
        content: string;
      }> = [];

      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const { result, goalChanged: changed } = await executeToolCall(
          toolCall.function.name,
          args
        );
        if (changed) goalChanged = true;
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Get follow-up response from Groq with tool results
      const followUp = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
          message,
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });

      const finalContent =
        followUp.choices[0].message.content || "Done.";

      // Save to chat history
      await supabase.from("chat_messages").insert({
        role: "assistant",
        content: finalContent,
        tools_used: goalChanged,
      });

      return NextResponse.json({
        content: finalContent,
        goalChanged,
      });
    }

    // No tool calls — direct response
    const content = message.content || "I'm not sure how to help with that.";

    await supabase.from("chat_messages").insert({
      role: "assistant",
      content,
      tools_used: false,
    });

    return NextResponse.json({ content, goalChanged: false });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Groq API error:", msg);
    return NextResponse.json(
      { error: `AI error: ${msg}` },
      { status: 500 }
    );
  }
}
