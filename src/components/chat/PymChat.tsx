"use client";

import { useState, useRef, useEffect } from "react";
import { Goal } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PymChatProps {
  goals: Goal[];
  onGoalsChanged: () => void;
}

const QUICK_PROMPTS = [
  "What's at risk?",
  "Compliance check",
  "Weekly summary",
  "Client pipeline",
];

export function PymChat({ goals, onGoalsChanged }: PymChatProps) {
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
          `[${g.id}] "${g.goal}" | Team: ${g.team} | Owner: ${g.owner} | Status: ${g.status} | Priority: ${g.priority} | Progress: ${g.progress}% | Deadline: ${g.deadline} | Category: ${g.category || "general"} | Notes: ${g.notes || "none"}`
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
        if (data.goalChanged) onGoalsChanged();
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-xl flex items-center justify-center text-white font-bold text-[11px] shadow-[0_2px_8px_rgba(26,160,230,0.3)]">
            ✦
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#0f042d]">Pym</div>
            <div className="text-[11px] text-gray-400">
              Your witty ops sidekick
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1AA0E6]/10 to-[#0075AD]/10 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-[20px]">✦</span>
            </div>
            <div className="text-[13px] text-gray-500 mb-1">
              Ask Pym anything
            </div>
            <div className="text-[11px] text-gray-400 max-w-[200px]">
              Create goals, update statuses, flag risks, get summaries — all through chat.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-lg flex items-center justify-center text-white font-bold text-[8px] shrink-0 mt-0.5 shadow-sm">
                ✦
              </div>
            )}
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#0f042d] text-white rounded-br-md"
                  : "bg-white/80 backdrop-blur-sm border border-gray-200/40 text-[#20282d] rounded-bl-md shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 bg-gradient-to-br from-[#1AA0E6] to-[#0075AD] rounded-lg flex items-center justify-center text-white font-bold text-[8px] shrink-0 shadow-sm">
              ✦
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/40 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] text-gray-400 shadow-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            onClick={() => sendMessage(qp)}
            className="bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 cursor-pointer hover:border-[#1AA0E6]/40 hover:text-[#1AA0E6] transition-all"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-1 shrink-0">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-xl px-3.5 py-2.5 focus-within:border-[#1AA0E6]/40 focus-within:shadow-[0_0_12px_rgba(26,160,230,0.08)] transition-all">
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
            placeholder="Ask Pym anything..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#0f042d] placeholder:text-gray-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 bg-[#1AA0E6] rounded-lg flex items-center justify-center text-white text-sm cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0e8fd4] transition-colors shrink-0 shadow-sm"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
