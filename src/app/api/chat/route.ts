import { anthropic, MODEL, TOOL_DEFINITIONS, SYSTEM_PROMPT } from "@/lib/ai";
import { executeToolCall } from "@/lib/tools";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages, goalsContext } = await request.json();

  const systemMessage = `${SYSTEM_PROMPT}\n\nCurrent goals data:\n${goalsContext}`;

  // Convert messages to Claude format
  const claudeMessages = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemMessage,
      messages: claudeMessages,
      tools: TOOL_DEFINITIONS,
    });

    let goalChanged = false;
    let textContent = "";

    // Check if Claude wants to use tools
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use"
    );
    const textBlocks = response.content.filter(
      (block) => block.type === "text"
    );

    // Collect any text from the initial response
    for (const block of textBlocks) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }

    if (toolUseBlocks.length > 0) {
      // Execute all tool calls
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const block of toolUseBlocks) {
        if (block.type === "tool_use") {
          const { result, goalChanged: changed } = await executeToolCall(
            block.name,
            block.input as Record<string, unknown>
          );
          if (changed) goalChanged = true;
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Get follow-up response from Claude with tool results
      const followUp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemMessage,
        messages: [
          ...claudeMessages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ],
        tools: TOOL_DEFINITIONS,
      });

      // Handle potential nested tool calls from follow-up
      let followUpText = "";
      const followUpToolUses = followUp.content.filter(
        (block) => block.type === "tool_use"
      );

      if (followUpToolUses.length > 0) {
        // Execute nested tool calls (e.g., Pym logging notes after an action)
        const nestedResults: Array<{
          type: "tool_result";
          tool_use_id: string;
          content: string;
        }> = [];

        for (const block of followUpToolUses) {
          if (block.type === "tool_use") {
            const { result, goalChanged: changed } = await executeToolCall(
              block.name,
              block.input as Record<string, unknown>
            );
            if (changed) goalChanged = true;
            nestedResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        // Get final response after nested tool calls
        const finalResponse = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: systemMessage,
          messages: [
            ...claudeMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolResults },
            { role: "assistant", content: followUp.content },
            { role: "user", content: nestedResults },
          ],
        });

        for (const block of finalResponse.content) {
          if (block.type === "text") followUpText += block.text;
        }
      } else {
        for (const block of followUp.content) {
          if (block.type === "text") followUpText += block.text;
        }
      }

      const finalContent = followUpText || textContent || "Done.";

      await supabase.from("chat_messages").insert({
        role: "assistant",
        content: finalContent,
        tools_used: goalChanged,
      });

      return NextResponse.json({ content: finalContent, goalChanged });
    }

    // No tool calls — direct response
    const content = textContent || "I'm not sure how to help with that.";

    await supabase.from("chat_messages").insert({
      role: "assistant",
      content,
      tools_used: false,
    });

    return NextResponse.json({ content, goalChanged: false });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Claude API error:", msg);
    return NextResponse.json(
      { error: `AI error: ${msg}` },
      { status: 500 }
    );
  }
}
