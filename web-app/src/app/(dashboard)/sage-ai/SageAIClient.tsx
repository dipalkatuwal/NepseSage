"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { MessageItem } from "@/components/sage-ai/MessageItem";
import { SageContextSheet } from "@/components/sage-ai/SageContextSheet";
import { Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="font-heading text-lg font-bold">Sage AI</h1>
          <p className="text-xs text-muted-foreground">AI-powered NEPSE market analyst</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextSheet />
          <Button variant="outline" size="sm" onClick={() => setMessages([WELCOME])}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <MessageItem key={i} msg={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about any NEPSE stock or sector..."
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
