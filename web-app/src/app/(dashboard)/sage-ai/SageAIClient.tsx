"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { MessageItem } from "@/components/sage-ai/MessageItem";
import { SageContextSheet } from "@/components/sage-ai/SageContextSheet";
import { Send, Plus, SquarePen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiAPI } from "@/lib/services";

interface Message {
  type: "user" | "ai";
  text: string;
  time: string;
  streaming?: boolean;
}

const WELCOME: Message = {
  type: "ai",
  text: "Hello! I'm Sage, your AI-powered NEPSE market analyst. Ask me anything about Nepali stocks — technicals, fundamentals, sector trends, or trade ideas.",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const SUGGESTIONS = [
  "Analyze NABIL bank technically",
  "Which sectors are bullish right now?",
  "Explain how NRB policy affects NEPSE",
  "Best hydropower stocks to watch",
];

export default function SageAIClient() {
  return (
    <AuthGuard
      require="pro"
      featureName="Sage AI"
      featureDesc="Unlock unlimited AI-powered stock analysis, sector breakdowns, and trade ideas with a Pro plan."
    >
      <SageAIContent />
    </AuthGuard>
  );
}

function SageAIContent() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOnlyWelcome = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setTimeout(resizeTextarea, 0);

    const userMsg: Message = {
      type: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const aiPlaceholder: Message = {
      type: "ai",
      text: "",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setLoading(true);

    try {
      let full = "";
      for await (const chunk of aiAPI.analyzeStock(text)) {
        full += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...aiPlaceholder, text: full };
          return next;
        });
      }
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...aiPlaceholder, text: full, streaming: false };
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...aiPlaceholder,
          text: "Sorry, I couldn't process that request. Please try again.",
          streaming: false,
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <h1 className="text-sm font-semibold">Sage AI</h1>
        <div className="flex items-center gap-2">
          <SageContextSheet />
          <button
            onClick={() => setMessages([WELCOME])}
            title="New chat"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

          {/* Welcome + suggestions */}
          <AnimatePresence>
            {isOnlyWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center pt-8 pb-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">S</span>
                </div>
                <h2 className="text-2xl font-semibold mb-1">How can I help you?</h2>
                <p className="text-sm text-muted-foreground">Ask me anything about NEPSE stocks, sectors, or market trends.</p>

                <div className="grid grid-cols-2 gap-2 mt-6 max-w-lg mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[13px] text-foreground/70 hover:text-foreground border border-border/60 hover:border-border hover:bg-secondary/50 rounded-xl px-4 py-3 transition-all leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message list */}
          {messages.map((m, i) => (
            <MessageItem key={i} msg={m} />
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — same style as Claude/GPT */}
      <div className="shrink-0 pb-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 border border-border/70 hover:border-border focus-within:border-border rounded-2xl bg-background shadow-sm px-4 py-3 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="Message Sage AI..."
              disabled={loading}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] placeholder:text-muted-foreground/40 outline-none leading-relaxed max-h-[160px] overflow-y-auto py-0.5"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="h-8 w-8 shrink-0 rounded-lg bg-foreground text-background hover:opacity-80 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-opacity mb-0.5"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/40 mt-2">
            Sage AI can make mistakes. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
