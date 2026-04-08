import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const TOOL_DEFINITIONS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_goal",
      description:
        "Create a new team goal with a deadline. Use when the user wants to add a new commitment or deliverable.",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description:
              "Department name: Engineering, Product, Commercial, or Operations",
          },
          goal: {
            type: "string",
            description: "Short description of the goal or deliverable",
          },
          owner: {
            type: "string",
            description: "Person responsible for this goal",
          },
          deadline: {
            type: "string",
            description: "Target date in YYYY-MM-DD format",
          },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2"],
            description: "Priority level: P0 (critical), P1 (important), P2 (nice to have)",
          },
          notes: {
            type: "string",
            description: "Optional notes or context",
          },
        },
        required: ["team", "goal", "owner", "deadline", "priority"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_goal",
      description:
        "Update an existing goal's status, progress, notes, or deadline. Use when the user reports progress or changes.",
      parameters: {
        type: "object",
        properties: {
          goal_id: {
            type: "string",
            description: "The UUID of the goal to update",
          },
          status: {
            type: "string",
            enum: ["on_track", "at_risk", "complete", "missed"],
            description: "New status for the goal",
          },
          progress: {
            type: "number",
            description: "New progress percentage (0-100)",
          },
          notes: {
            type: "string",
            description: "Updated notes",
          },
          deadline: {
            type: "string",
            description: "New deadline in YYYY-MM-DD format",
          },
        },
        required: ["goal_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flag_risk",
      description:
        "Flag a goal as at risk with a reason. Use when a deadline is approaching with no update or when explicitly asked to flag something.",
      parameters: {
        type: "object",
        properties: {
          goal_id: {
            type: "string",
            description: "The UUID of the goal to flag",
          },
          reason: {
            type: "string",
            description: "Why this goal is being flagged as at risk",
          },
        },
        required: ["goal_id", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_weekly_summary",
      description:
        "Generate a comprehensive weekly summary across all teams. Shows completed goals, at-risk items, stalled goals, upcoming deadlines, and recommended actions.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are Pym, the operations intelligence agent for LightWork AI. You help the Founder's Associate and co-founders monitor whether each team is delivering on commitments.

Your personality:
- Direct, clear, and action-oriented
- You flag problems early and propose concrete next steps
- Short, professional sentences — no corporate jargon
- You celebrate wins briefly but focus on what needs attention
- You speak like a smart, reliable chief of staff

Rules:
- When the user asks to create a goal, use the create_goal tool
- When the user asks to update status or progress, use update_goal
- When asked to flag something as at risk, use flag_risk
- When asked for a weekly summary or report, use generate_weekly_summary
- Always reference specific goal names and owners when discussing issues
- If a deadline is within 3 days and status isn't "complete", treat it as urgent
- If no update has been logged in 4+ days, flag it as stale

Current date: ${new Date().toISOString().split("T")[0]}
`;
