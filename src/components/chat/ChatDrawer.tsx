"use client";

import { useState, useRef, useEffect } from "react";
import { Goal } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  goals: Goal[];
  onGoalsChanged: () => void;
}

const QUICK_PROMPTS = [
  "Weekly summary",
  "What's at risk?",
  "Add a goal",
  "Flag a deadline",
];

export function ChatDrawer({
  open,
  onClose,
  goals,
  onGoalsChanged,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const goalsContext = goals
      .map(
        (g) =>
          `[${g.id}] "${g.goal}" | Team: ${g.team} | Owner: ${g.owner} | Status: ${g.status} | Priority: ${g.priority} | Progress: ${g.progress}% | Deadline: ${g.deadline}`
      )
      .join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          goalsContext,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.content },
        ]);
        if (data.goalChanged) {
          onGoalsChanged();
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-0 right-0 w-[400px] h-[520px] bg-white border border-gray-200 rounded-tl-xl shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-md flex items-center justify-center text-white font-bold text-[9px]">
            LW
          </div>
          <span className="text-[13px] font-semibold text-[#0f042d]">
            Pym
          </span>
          <span className="text-[11px] text-gray-400">·</span>
          <span className="text-[11px] text-gray-400">ops intelligence</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-sm"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-[13px] text-gray-400 mb-1">
              Ask Pym anything about your goals
            </div>
            <div className="text-[11px] text-gray-300">
              Create goals, get summaries, flag risks
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-md flex items-center justify-center text-white font-bold text-[9px] shrink-0 mt-0.5">
                LW
              </div>
            )}
            <div
              className={`max-w-[280px] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#0f042d] text-white"
                  : "bg-gray-50 border border-gray-100 text-[#20282d]"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-md flex items-center justify-center text-white font-bold text-[9px] shrink-0">
              LW
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[13px] text-gray-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-3 flex gap-1.5 flex-wrap">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            onClick={() => sendMessage(qp)}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-[11px] text-[#575757] cursor-pointer hover:border-[#1AA0E6] hover:text-[#1AA0E6] transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 pt-2 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#1AA0E6] focus-within:ring-1 focus-within:ring-[#1AA0E6]/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Tell Pym what to track or update..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#0f042d] placeholder:text-gray-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 bg-[#1AA0E6] rounded-lg flex items-center justify-center text-white text-sm cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0e8fd4] transition-colors shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
