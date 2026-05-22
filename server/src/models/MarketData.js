import mongoose from "mongoose";

/**
 * MarketData — MongoDB cache for live NEPSE security data.
 *
 * UPGRADE LOG (v2):
 *   - Added isActive compound indexes (missing — every query filtered isActive)
 *   - ohlcvHistory now includes `turnover` per day (was split across pvHistory)
 *   - pvHistory retained for one migration cycle then can be dropped
 *   - technicals sub-doc replaces flat nullable rsi14/macd/sma fields
 *     Pre-computed at EOD, served directly from DB — no live recalculation
 */
const ohlcvSchema = new mongoose.Schema(
  {
    date:     { type: Date, required: true },
    open:     { type: Number, default: 0 },
    high:     { type: Number, default: 0 },
    low:      { type: Number, default: 0 },
    close:    { type: Number, default: 0 },
    volume:   { type: Number, default: 0 },
    turnover: { type: Number, default: 0 },
  },
  { _id: false }
);

const technicalSchema = new mongoose.Schema(
  {
    rsi14:           { type: Number, default: null },
    macd:            { type: Number, default: null },
    macdSignal:      { type: Number, default: null },
    macdHistogram:   { type: Number, default: null },
    sma20:           { type: Number, default: null },
    sma50:           { type: Number, default: null },
    ema20:           { type: Number, default: null },
    bbUpper:         { type: Number, default: null },
    bbMiddle:        { type: Number, default: null },
    bbLower:         { type: Number, default: null },
    supportLevel:    { type: Number, default: null },
    resistanceLevel: { type: Number, default: null },
    trend:           { type: String, default: "unknown" },
    signal:          { type: String, default: "neutral" },
    accumulationSignal: { type: String, default: "neutral" },
    computedAt:      { type: Date, default: null },
  },
  { _id: false }
);

const marketDataSchema = new mongoose.Schema(
  {
    symbol:         { type: String, required: true, uppercase: true, unique: true, index: true },
    companyName:    { type: String, default: "" },
    sector:         { type: String, default: "Unknown" },
    companyEmail:   { type: String, default: "" },
    website:        { type: String, default: "" },
    regulatoryBody: { type: String, default: "" },
    instrumentType: { type: String, default: "" },
    listingDate:    { type: Date,   default: null },
    status:         { type: String, default: "A" },

    // Fundamental share data (from getSecurityDetails)
    totalListedShares: { type: Number, default: 0 },
    totalPaidUpValue:  { type: Number, default: 0 },
    marketCapitalization: { type: Number, default: 0 },

    ltp:           { type: Number, default: 0 },
    open:          { type: Number, default: 0 },
    high:          { type: Number, default: 0 },
    low:           { type: Number, default: 0 },
    close:         { type: Number, default: 0 },
    previousClose: { type: Number, default: 0 },
    change:        { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    volume:        { type: Number, default: 0 },
    turnover:      { type: Number, default: 0 },

    high52Week: { type: Number, default: 0 },
    low52Week:  { type: Number, default: 0 },

    // Pre-computed technicals (populated at EOD by syncTechnicals)
    technicals: { type: technicalSchema, default: () => ({}) },

    // Unified OHLCV history — up to 365 trading days, includes turnover
    ohlcvHistory: { type: [ohlcvSchema], default: [] },

    // @deprecated — retained for migration; turnover data backfilled into ohlcvHistory
    pvHistory: [
      { date: Date, price: Number, volume: Number, turnover: Number, _id: false },
    ],

    lastUpdated: { type: Date, default: Date.now },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

marketDataSchema.index({ sector: 1, changePercent: -1 });
marketDataSchema.index({ isActive: 1 });
marketDataSchema.index({ isActive: 1, changePercent: -1 });
marketDataSchema.index({ isActive: 1, turnover: -1 });

export default mongoose.model("MarketData", marketDataSchema);
