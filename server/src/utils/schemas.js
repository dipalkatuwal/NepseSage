import { z } from "zod";

// Auth
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Portfolio
export const addTransactionSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().positive("Price must be positive"),
  notes: z.string().max(500).optional(),
  date: z.string().optional(),
});

export const bulkTransactionSchema = z.object({
  transactions: z.array(addTransactionSchema).min(1),
});

// Journal
export const journalEntrySchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  tradeType: z.enum(["BUY", "SELL", "HOLD"]),
  entryPrice: z.number().positive().optional(),
  exitPrice: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  pnl: z.number().optional(),
  pnlPercent: z.number().optional(),
  emotionBefore: z.enum([
    "confident", "fearful", "greedy", "neutral",
    "anxious", "excited", "frustrated", "calm",
  ]),
  emotionAfter: z.enum([
    "confident", "fearful", "greedy", "neutral",
    "anxious", "excited", "frustrated", "calm",
  ]).optional(),
  reasoning: z.string().min(10, "Please describe your reasoning (min 10 chars)"),
  lessonsLearned: z.string().max(1000).optional(),
  marketCondition: z.enum(["bullish", "bearish", "sideways", "volatile"]).optional(),
  tradeDate: z.string().optional(),
});

// Simulator order
export const simOrderSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

// AI analysis
export const aiAnalysisSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  question: z.string().max(500).optional(),
});

export const aiChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).min(1),
  symbol: z.string().optional(),
  context: z.string().optional(),
});