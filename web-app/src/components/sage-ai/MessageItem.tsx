"use client";

import { Copy, RefreshCw, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface MessageItemProps {
  msg: {
    type: string;
    text: string;
    time: string;
    streaming?: boolean;
  };
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : part
  );
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-semibold text-foreground mt-5 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{line.slice(2)}</h1>);
    } else if (line.match(/^\d+\.\s/)) {
      // numbered list — collect group
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 my-3 ml-1">
          {items.map((b, j) => (
            <li key={j} className="flex gap-3 text-[15px] text-foreground/85 leading-relaxed">
              <span className="shrink-0 font-medium text-foreground/40 w-5 text-right">{j + 1}.</span>
              <span>{renderInline(b)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2 my-3 ml-1">
          {items.map((b, j) => (
            <li key={j} className="flex gap-3 text-[15px] text-foreground/85 leading-relaxed">
              <span className="shrink-0 text-foreground/30 mt-2 h-1.5 w-1.5 rounded-full bg-current" />
              <span>{renderInline(b)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith("---") || line.startsWith("***")) {
      elements.push(<hr key={i} className="border-border/40 my-4" />);
    } else {
      elements.push(
        <p key={i} className="text-[15px] text-foreground/85 leading-[1.75] my-2">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return elements;
}

export function MessageItem({ msg }: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.type === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] bg-secondary rounded-3xl px-5 py-3.5">
          <p className="text-[15px] text-foreground leading-relaxed">{msg.text}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      {/* Streaming dots */}
      {msg.streaming && !msg.text && (
        <div className="flex items-center gap-1 py-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-foreground/30"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}

      {/* Message content */}
      {msg.text && (
        <div className="prose-sm max-w-none">
          {renderMarkdown(msg.text)}
          {msg.streaming && (
            <motion.span
              className="inline-block w-0.5 h-4 bg-foreground/60 ml-0.5 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>
      )}

      {/* Action row */}
      {!msg.streaming && msg.text && (
        <div className="flex items-center gap-1 mt-3 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
