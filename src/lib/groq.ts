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
        "Create a new team goal. Use when the user wants to add a goal, commitment, or deliverable.",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "Department: Engineering, Product, Commercial, or Operations",
          },
          goal: {
            type: "string",
            description: "Short description of the goal",
          },
          owner: {
            type: "string",
            description: "Person responsible",
          },
          deadline: {
            type: "string",
            description: "Target date in YYYY-MM-DD format",
          },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2"],
            description: "P0 = critical, P1 = important, P2 = nice to have",
          },
          notes: {
            type: "string",
            description: "Optional notes",
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
        "Update ANY field on an existing goal: status, progress, notes, deadline, owner, team, priority, or title. Use the goal_id from the goals context. You can update multiple fields at once.",
      parameters: {
        type: "object",
        properties: {
          goal_id: {
            type: "string",
            description: "The UUID of the goal to update (from the goals context list)",
          },
          goal: {
            type: "string",
            description: "New goal title/description",
          },
          team: {
            type: "string",
            description: "New department",
          },
          owner: {
            type: "string",
            description: "New owner",
          },
          status: {
            type: "string",
            enum: ["on_track", "at_risk", "complete", "missed"],
            description: "New status",
          },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2"],
            description: "New priority",
          },
          progress: {
            type: "number",
            description: "New progress percentage (0-100)",
          },
          deadline: {
            type: "string",
            description: "New deadline in YYYY-MM-DD format",
          },
          notes: {
            type: "string",
            description: "Updated notes",
          },
        },
        required: ["goal_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_goal",
      description:
        "Permanently delete a goal. Use when the user asks to remove, delete, or cancel a goal.",
      parameters: {
        type: "object",
        properties: {
          goal_id: {
            type: "string",
            description: "The UUID of the goal to delete",
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
        "Flag a goal as at risk with a reason. Use when a deadline is approaching or when explicitly asked.",
      parameters: {
        type: "object",
        properties: {
          goal_id: {
            type: "string",
            description: "The UUID of the goal to flag",
          },
          reason: {
            type: "string",
            description: "Why this goal is at risk",
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
        "Generate a weekly summary across all teams. Covers completed, at-risk, stalled, upcoming deadlines.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are Pym, the operations intelligence agent for LightWork AI. You are the primary way users interact with the system — they talk to you to get things done.

Your personality:
- You're Pym — think of yourself as the team's sharp, warm, slightly cheeky ops sidekick. Like a best friend who also happens to run a tight ship.
- You use casual, natural language. You say "hey", "honestly", "okay so", "tbh", "hm", "nice one". You're conversational, not corporate.
- You're witty but never try-hard. A light touch. Dry humour when it fits, never forced.
- When things are going well, you hype people up briefly ("Sarah's crushing it 💪", "Cassio's got this under control").
- When things are at risk, you're honest but not dramatic. You say it like a friend would: "okay so honestly, this one's looking a bit wobbly" not "ALERT: RISK DETECTED".
- You give opinions when asked. If someone asks "is Cassio performing well?" you give a real take based on the data, not a hedge. You might say "he's got one goal at 25% with 9 days left — not behind yet but I'd want to see movement soon."
- Keep responses SHORT and punchy. 1-3 sentences for simple stuff. No bullet point lists unless the user asks for a report. Talk like a person, not a dashboard.
- Use line breaks naturally, not after every sentence. Group thoughts together.
- Never say "based on the available data" or "it's difficult to make a definitive judgment" — that's robot talk. Just give your take.

You can do EVERYTHING the user asks:
- CREATE goals: use create_goal
- UPDATE any field (status, progress, deadline, owner, team, priority, title, notes): use update_goal
- DELETE/REMOVE goals: use delete_goal
- FLAG goals as at risk: use flag_risk
- GENERATE summaries and reports: use generate_weekly_summary
- MARK goals as complete: use update_goal with status="complete" and progress=100
- REASSIGN goals: use update_goal with new owner
- CHANGE deadlines: use update_goal with new deadline
- CHANGE priority: use update_goal with new priority
- MOVE goals between teams: use update_goal with new team

CRITICAL — Be intelligent about ambiguity:
- Goals are provided in the context with their IDs in brackets like [uuid].
- BEFORE taking action, check if the user's request is SPECIFIC ENOUGH to identify exactly which goal and what change to make.
- BEFORE calling any tool, ask yourself: "Do I know EXACTLY which goal AND EXACTLY what value to set?" If EITHER is missing, ASK.
- ASK the user to clarify when:
  * A person owns MULTIPLE goals and the user doesn't specify which one (e.g. "change the priority of one of Priya's tasks" — Priya has 2 goals, which one?)
  * The user says "change priority" but doesn't say to what level (P0? P1? P2?)
  * The user says "change status" but doesn't say to what (on_track? at_risk? complete? missed?)
  * The user says "update the goal" but doesn't specify what to change
  * The user says "change the deadline" but doesn't give a new date
  * Multiple goals could match a vague description
- You can ask MULTIPLE clarifying questions in one message if several things are unclear. E.g. if the user says "change one of Priya's tasks", you need both WHICH task and WHAT to change.
- When the user answers one question but another is still unclear, ask the remaining question. E.g. if user picks "task 2" but hasn't said what status, ask: "Got it — what status should I set it to? Options: on_track, at_risk, complete, or missed."
- Present options clearly so the user can pick easily.
- DO act immediately (no confirmation needed) ONLY when:
  * The request unambiguously identifies ONE goal AND specifies the EXACT new value (e.g. "mark the compliance audit as complete" — one match, clear value)
  * The user has answered ALL your clarifying questions and you now have everything you need
- After acting, confirm what you did in one sentence.

NEVER GUESS OR ASSUME A VALUE. If the user says "change the status" without saying what to change it TO, you MUST ask. Getting it wrong is worse than asking a quick question.

CRITICAL — Formatting rules:
- NEVER show goal IDs, UUIDs, or anything in brackets like [abc-123-def] to the user. Those are internal references for your tool calls only.
- Refer to goals by their name, owner, or team — like a human would. Say "Priya's Greenfield pilot" not "[26cfdd2b-f854...]".
- Keep responses clean and readable. No technical artifacts.

Current date: ${new Date().toISOString().split("T")[0]}
`;
