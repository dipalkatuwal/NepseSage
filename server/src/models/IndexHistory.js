import mongoose from "mongoose";

/**
 * IndexHistory — Daily time-series snapshots of the NEPSE index.
 *
 * Unlike IndexSnapshot (which overwrites a single document every 5 min),
 * this collection accumulates one document per trading day — permanently.
 *
 * Written by: nepseSyncService.appendIndexHistory()
 *   Called from: syncIndexSnapshot() at every EOD cron (15:30 NPT)
 *   Called from: runStartupSync() on server boot if today's row is missing
 *
 * Read by: nepseController.getIndexHistory()
 *   Serves: MarketChart (1D / 1W / 1M / 1Y / ALL views)
 *
 * Schema is intentionally lean — we only store what the chart needs.
 * Sub-index history (Banking, Hydro, etc.) is stored in SubIndexHistory.
 */
const indexHistorySchema = new mongoose.Schema(
  {
    // UTC midnight of the trading day (used as the unique key)
    date: { type: Date, required: true, unique: true, index: true },

    // NEPSE composite index
    nepseIndex:        { type: Number, default: 0 },
    change:            { type: Number, default: 0 },
    changePercent:     { type: Number, default: 0 },

    // Market breadth
    turnover:          { type: Number, default: 0 },  // NPR total
    totalVolume:       { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },

    // Advance / Decline — populated from MarketData aggregation
    gainers:   { type: Number, default: 0 },
    losers:    { type: Number, default: 0 },
    unchanged: { type: Number, default: 0 },

    // Raw asOf string from NEPSE (for display)
    asOf: { type: String, default: "" },
  },
  {
    timestamps: true,
    // Optimise range queries (date-asc) that power the chart endpoint
    autoIndex: true,
  }
);

export default mongoose.model("IndexHistory", indexHistorySchema);
