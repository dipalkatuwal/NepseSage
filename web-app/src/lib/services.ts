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

  upgradeToPro: async (billingCycle: "monthly" | "yearly") => {
    const { data } = await api.post("/auth/upgrade", { plan: "pro", billingCycle });
    return data;
  },

  downgradeToFree: async () => {
    const { data } = await api.post("/auth/downgrade");
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
  turnover?: number;
  high52Week?: number;
  low52Week?: number;
  // Fundamental / listing data
  instrumentType?: string;
  listingDate?: string | null;
  totalListedShares?: number;
  totalPaidUpValue?: number;
  marketCapitalization?: number;
  totalTrades?: number;    // from daily trade data when available
  close?: number;          // official EOD close (may differ from ltp intraday)
}

export interface IndexPoint {
  time: string;
  date?: string;
  value: number;
  change?: number;
  changePercent?: number;
  turnover?: number;
  gainers?: number;
  losers?: number;
}

export interface BreadthPoint {
  date: string;
  time: string;
  gainers: number;
  losers: number;
  unchanged: number;
  index: number;
}

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number;
}

export interface ChartSeries {
  symbol: string;
  currentPrice: number;
  dates: string[];
  candles: OHLCVBar[];
  volume: number[];
  rsi: (number | null)[];
  sma20: (number | null)[];
  sma50: (number | null)[];
  ema20: (number | null)[];
  macdLine: (number | null)[];
  macdSignal: (number | null)[];
  macdHistogram: (number | null)[];
  bbUpper: (number | null)[];
  bbMiddle: (number | null)[];
  bbLower: (number | null)[];
}

export interface TechnicalAnalysis {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high52Week?: number;
  low52Week?: number;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  supportLevel: number | null;
  resistanceLevel: number | null;
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

  getIndexHistory: async (range?: string, days?: number) => {
    const params: Record<string, string | number> = {};
    if (range) params.range = range;
    if (days)  params.days  = days;
    const { data } = await api.get<IndexPoint[]>("/nepse/index-history", { params });
    return data;
  },

  getIndexBreadth: async (days = 30) => {
    const { data } = await api.get<BreadthPoint[]>("/nepse/index-history/breadth", {
      params: { days },
    });
    return data;
  },

  getChartSeries: async (symbol: string, days = 180) => {
    const { data } = await api.get<ChartSeries>(`/nepse/chart-series/${symbol}`, {
      params: { days },
    });
    return data;
  },

  getPriceVolumeHistory: async (symbol: string, days = 365) => {
    const { data } = await api.get<{ symbol: string; pvHistory: any[] }>(
      `/nepse/price-volume-history/${symbol}`,
      { params: { days } }
    );
    return data;
  },

  getTodayVolumeHistory: async () => {
    const { data } = await api.get<any[]>("/nepse/today-volume-history");
    return data;
  },

  getIndexDailyGraph: async () => {
    const { data } = await api.get<any[]>("/nepse/index-daily-graph");
    return data;
  },

  /**
   * Fetches all active symbols from MongoDB cache.
   * No limit passed → backend defaults to 1000 (full NEPSE listing).
   * Pass `q` to search/filter; in that case results are capped at 30.
   */
  getAllSymbols: async (q?: string) => {
    const { data } = await api.get<MarketSymbol[]>("/nepse/search", {
      params: q ? { q } : {},
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
    profile?: {
      experience?: string;
    };
  };
  symbol: string;
  company: string;
  sector: string;
  sentiment: "bullish" | "bearish" | "neutral";
  text: string;
  confidence: number;
  isPublic: boolean;
  likes: number;
  likedBy?: string[];      // stripped server-side; use isLikedByMe instead
  isLikedByMe: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsightComment {
  _id: string;
  insight: string;
  user: {
    _id: string;
    name: string;
    disciplineScore: number;
  };
  text: string;
  createdAt: string;
  updatedAt: string;
}

export const insightsAPI = {
  getInsights: async (params?: {
    page?: number;
    limit?: number;
    symbol?: string;
    sentiment?: string;
    sector?: string;
    sort?: "latest" | "popular" | "trending";
  }) => {
    const { data } = await api.get<{
      insights: Insight[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>("/insights", { params });
    return data;
  },

  getMyInsights: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<{
      insights: Insight[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>("/insights/mine", { params });
    return data;
  },

  createInsight: async (payload: { symbol: string; sentiment: string; text: string; isPublic?: boolean }) => {
    const { data } = await api.post<Insight>("/insights", payload);
    return data;
  },

  updateInsight: async (id: string, payload: { text?: string; sentiment?: "bullish" | "bearish" | "neutral"; isPublic?: boolean }) => {
    const { data } = await api.put<Insight>(`/insights/${id}`, payload);
    return data;
  },

  toggleLike: async (id: string) => {
    const { data } = await api.post<{ likes: number; liked: boolean }>(`/insights/${id}/like`);
    return data;
  },

  getComments: async (id: string) => {
    const { data } = await api.get<{ comments: InsightComment[]; total: number }>(`/insights/${id}/comments`);
    return data;
  },

  postComment: async (id: string, text: string) => {
    const { data } = await api.post<InsightComment>(`/insights/${id}/comments`, { text });
    return data;
  },

  deleteComment: async (insightId: string, commentId: string) => {
    await api.delete(`/insights/${insightId}/comments/${commentId}`);
  },

  deleteInsight: async (id: string) => {
    await api.delete(`/insights/${id}`);
  },
};