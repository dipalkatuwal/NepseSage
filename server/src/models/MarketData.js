import mongoose from "mongoose";

// Cached NEPSE market data to avoid hammering external sources
const marketDataSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, unique: true },
    companyName: { type: String, default: "" },
    sector: { type: String, default: "Unknown" },
    // Latest price data
    ltp: { type: Number, default: 0 }, // Last traded price
    open: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    close: { type: Number, default: 0 },
    previousClose: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    turnover: { type: Number, default: 0 },
    // 52-week range
    high52Week: { type: Number, default: 0 },
    low52Week: { type: Number, default: 0 },
    // Technical indicators (computed)
    rsi14: { type: Number, default: null },
    macd: { type: Number, default: null },
    macdSignal: { type: Number, default: null },
    sma20: { type: Number, default: null },
    sma50: { type: Number, default: null },
    // Support / Resistance
    supportLevel: { type: Number, default: null },
    resistanceLevel: { type: Number, default: null },
    // OHLCV history for chart (last 90 days)
    ohlcvHistory: [
      {
        date: Date,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
      },
    ],
    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("MarketData", marketDataSchema);