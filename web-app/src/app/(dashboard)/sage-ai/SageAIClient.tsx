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
  text: "Namaste! I'm Sage, your NEPSE clinical analyst. Ask me about any listed company — technical levels, sector outlook, behavioral insights, or portfolio strategy.",
  time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
};

export default function SageAIClient() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = { type: "user", text, time };
    setMessages((prev) => [...prev, userMsg]);

    // Add placeholder AI message
    const aiMsg: Message = { type: "ai", text: "", time: "", streaming: true };
    setMessages((prev) => [...prev, aiMsg]);
    setIsStreaming(true);

    try {
      // Build conversation history (last 10 messages)
      const history = [...messages.slice(-9), userMsg].map((m) => ({
        role: m.type === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      let fullText = "";
      for await (const chunk of aiAPI.chat(history)) {
        fullText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            type: "ai",
            text: fullText,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            streaming: true,
          };
          return updated;
        });
      }

      // Mark streaming done
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          streaming: false,
        };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          type: "ai",
          text: "I encountered an error connecting to the analysis engine. Please try again.",
          time: "",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AuthGuard
      featureName="Sage AI"
      featureDesc="NEPSE Sage AI is a high-precision clinical analyst. Sign in to chat with the AI about your portfolio and NEPSE market trends."
    >
      <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-1 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
            Sage AI Assistant
          </span>
          <SageContextSheet />
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <MessageItem
                key={i}
                msg={{
                  ...msg,
                  text: msg.streaming && !msg.text ? "▋" : msg.text,
                }}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-3 pb-3">
          <div className="max-w-3xl mx-auto px-4 w-full">
            <div className="relative group">
              <div className="flex items-center bg-secondary/30 border border-border/50 rounded-full px-4 py-2 hover:border-primary/20 transition-all shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask Sage AI anything about NEPSE..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[15px] py-3 shadow-none placeholder:text-muted-foreground/40"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="h-9 w-9 rounded-full bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-center text-[11px] text-muted-foreground/40 mt-2 font-normal">
              Sage AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
