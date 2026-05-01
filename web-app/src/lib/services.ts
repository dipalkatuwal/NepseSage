import api from "./api";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface BackendUser {
  _id: string;
  name: string;
  email: string;
  disciplineScore: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  tradingGoal: string;
  watchlist?: string[];
  token?: string;
}

export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post<BackendUser>("/auth/register", {
      name,
      email,
      password,
    });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<BackendUser>("/auth/login", {
      email,
      password,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get<BackendUser>("/auth/me");
    return data;
  },

  updateProfile: async (updates: {
    name?: string;
    tradingGoal?: string;
    riskTolerance?: string;
    watchlist?: string[];
  }) => {
    const { data } = await api.put<BackendUser>("/auth/me", updates);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

export interface Holding {
  symbol: string;
  companyName: string;
  sector: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
}

export interface Transaction {
  _id: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  notes: string;
  date: string;
}

export interface Portfolio {
  holdings: Holding[];
  transactions: Transaction[];
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  portfolioBeta: number;
  valueHistory: { date: string; value: number }[];
}

export const portfolioAPI = {
  get: async () => {
    const { data } = await api.get<Portfolio>("/portfolio");
    return data;
  },

  addTransaction: async (payload: {
    symbol: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    notes?: string;
    date?: string;
  }) => {
    const { data } = await api.post<Portfolio>("/portfolio/transaction", payload);
    return data;
  },

  addBulkTransactions: async (payload: {
    transactions: {
      symbol: string;
      type: "BUY" | "SELL";
      quantity: number;
      price: number;
      notes?: string;
      date?: string;
    }[];
  }) => {
    const { data } = await api.post<Portfolio>("/portfolio/bulk-transactions", payload);
    return data;
  },

  getTransactions: async (params?: {
    symbol?: string;
    type?: string;
    limit?: number;
    page?: number;
  }) => {
    const { data } = await api.get<{
      transactions: Transaction[];
      total: number;
      page: number;
    }>("/portfolio/transactions", { params });
    return data;
  },

  getHistory: async () => {
    const { data } = await api.get("/portfolio/history");
    return data;
  },

  deleteTransaction: async (id: string) => {
    await api.delete(`/portfolio/transaction/${id}`);
  },
};

// ─── JOURNAL ──────────────────────────────────────────────────────────────────

export interface JournalEntry {
  _id: string;
  symbol: string;
  tradeType: "BUY" | "SELL" | "HOLD";
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  pnl: number;
  pnlPercent: number;
  emotionBefore: string;
  emotionAfter?: string;
  detectedBiases: string[];
  isRedFlag: boolean;
  reasoning: string;
  lessonsLearned?: string;
  marketCondition?: string;
  aiAnalysis?: string;
  tradeDate: string;
  createdAt: string;
}

export interface DisciplineScore {
  score: number;
  trend: "improving" | "declining" | "stable";
  totalEntries: number;
  breakdown: {
    redFlagPenalty: number;
    biasFrequency: Record<string, number>;
    emotionalConsistency: number;
    reasoningQuality: number;
    winLossBalance: number;
  };
}

export const journalAPI = {
  getEntries: async (params?: {
    symbol?: string;
    tradeType?: string;
    isRedFlag?: boolean;
    limit?: number;
    page?: number;
  }) => {
    const { data } = await api.get<{
      entries: JournalEntry[];
      total: number;
      page: number;
    }>("/journal", { params });
    return data;
  },

  createEntry: async (payload: {
    symbol: string;
    tradeType: "BUY" | "SELL" | "HOLD";
    entryPrice?: number;
    exitPrice?: number;
    quantity?: number;
    pnl?: number;
    pnlPercent?: number;
    emotionBefore: string;
    emotionAfter?: string;
    reasoning: string;
    lessonsLearned?: string;
    marketCondition?: string;
    tradeDate?: string;
  }) => {
    const { data } = await api.post<JournalEntry>("/journal", payload);
    return data;
  },

  updateEntry: async (id: string, payload: Partial<JournalEntry>) => {
    const { data } = await api.put<JournalEntry>(`/journal/${id}`, payload);
    return data;
  },

  deleteEntry: async (id: string) => {
    await api.delete(`/journal/${id}`);
  },

  getDisciplineScore: async () => {
    const { data } = await api.get<DisciplineScore>("/journal/discipline");
    return data;
  },

  getBiases: async () => {
    const { data } = await api.get<
      { bias: string; count: number; severity: string; symbols: string[] }[]
    >("/journal/biases");
    return data;
  },

  getEmotionStats: async () => {
    const { data } = await api.get("/journal/emotions");
    return data;
  },
};

// ─── SIMULATOR ────────────────────────────────────────────────────────────────

export interface SimHolding {
  symbol: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
}

export interface SimOrder {
  _id: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  status: "EXECUTED" | "CANCELLED";
  executedAt: string;
}

export interface Simulator {
  cash: number;
  startingCapital: number;
  holdings: SimHolding[];
  orders: SimOrder[];
  totalPortfolioValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  valueHistory: { date: string; value: number; cash: number }[];
}

export const simulatorAPI = {
  get: async () => {
    const { data } = await api.get<Simulator>("/simulator");
    return data;
  },

  placeOrder: async (payload: {
    symbol: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
  }) => {
    const { data } = await api.post<Simulator>("/simulator/order", payload);
    return data;
  },

  getOrders: async () => {
    const { data } = await api.get<SimOrder[]>("/simulator/orders");
    return data;
  },

  reset: async () => {
    const { data } = await api.post("/simulator/reset");
    return data;
  },
};

// ─── NEPSE ────────────────────────────────────────────────────────────────────

export interface MarketSymbol {
  symbol: string;
  companyName: string;
  sector: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface TechnicalAnalysis {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  rsi: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  sma20: number | null;
  sma50: number | null;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  supportResistance: { support: number | null; resistance: number | null };
  trend: string;
  signal: string;
  accumulationSignal: string;
}

export const nepseAPI = {
  getSummary: async () => {
    const { data } = await api.get("/nepse/summary");
    return data;
  },

  searchSymbols: async (q: string) => {
    const { data } = await api.get<MarketSymbol[]>("/nepse/search", {
      params: { q },
    });
    return data;
  },

  getSymbol: async (symbol: string) => {
    const { data } = await api.get<MarketSymbol>(`/nepse/symbol/${symbol}`);
    return data;
  },

  getGainers: async (limit = 10) => {
    const { data } = await api.get<MarketSymbol[]>("/nepse/gainers", {
      params: { limit },
    });
    return data;
  },

  getLosers: async (limit = 10) => {
    const { data } = await api.get<MarketSymbol[]>("/nepse/losers", {
      params: { limit },
    });
    return data;
  },

  getSectors: async () => {
    const { data } = await api.get("/nepse/sectors");
    return data;
  },

  getTechnical: async (symbol: string) => {
    const { data } = await api.get<TechnicalAnalysis>(
      `/nepse/technical/${symbol}`
    );
    return data;
  },

  getHistory: async (symbol: string, days = 90) => {
    const { data } = await api.get(`/nepse/history/${symbol}`, {
      params: { days },
    });
    return data;
  },
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiAPI = {
  /**
   * Streaming stock analysis — returns an async generator of text chunks
   */
  analyzeStock: async function* (symbol: string, question?: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("nepsesage_token")
        : null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/ai/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ symbol, question }),
      }
    );

    if (!response.ok) throw new Error("AI analysis failed");
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") return;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) yield parsed.text as string;
          } catch {
            // skip malformed lines
          }
        }
      }
    }
  },

  /**
   * Streaming chat — same SSE pattern
   */
  chat: async function* (
    messages: { role: "user" | "assistant"; content: string }[],
    symbol?: string,
    context?: string
  ) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("nepsesage_token")
        : null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/ai/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages, symbol, context }),
      }
    );

    if (!response.ok) throw new Error("Chat failed");
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") return;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) yield parsed.text as string;
          } catch {
            // skip
          }
        }
      }
    }
  },

  getSentiment: async () => {
    const { data } = await api.get("/ai/sentiment");
    return data;
  },

  analyzeJournalEntry: async (entryId: string) => {
    const { data } = await api.post("/ai/journal-analysis", { entryId });
    return data;
  },
};

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────

export interface Insight {
  _id: string;
  user: {
    _id: string;
    name: string;
    disciplineScore: number;
    profile: {
      experience: string;
    };
  };
  symbol: string;
  company: string;
  sentiment: "bullish" | "bearish" | "neutral";
  text: string;
  confidence: number;
  isPublic: boolean;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export const insightsAPI = {
  getInsights: async (params?: { page?: number; limit?: number; symbol?: string; sentiment?: string }) => {
    const { data } = await api.get<{
      insights: Insight[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>("/insights", { params });
    return data;
  },

  createInsight: async (payload: { symbol: string; sentiment: string; text: string; isPublic?: boolean }) => {
    const { data } = await api.post<Insight>("/insights", payload);
    return data;
  },

  toggleLike: async (id: string) => {
    const { data } = await api.post<{ likes: number; liked: boolean }>(`/insights/${id}/like`);
    return data;
  },

  deleteInsight: async (id: string) => {
    await api.delete(`/insights/${id}`);
  },
};