/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NepseSage — NEPSE Scheduler  v3                     ║
 * ║                                                                  ║
 * ║  NEPSE Trading Hours (Nepal Time = UTC+5:45):                    ║
 * ║    Sunday – Thursday, 11:00 AM – 3:00 PM NPT                    ║
 * ║                                                                  ║
 * ║  Rules:                                                          ║
 * ║  • appendIndexHistory() ONLY called at EOD (15:30 NPT cron)     ║
 * ║    Never on startup — must always contain confirmed close data   ║
 * ║  • syncIndexSnapshot() only runs during market hours             ║
 * ║  • Missed days backfilled automatically on startup               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import cron from "node-cron";
import {
  runStartupSync,
  syncAllPrices,
  syncIndexSnapshot,
  syncSubIndices,
  syncPriorityHistories,
  syncAllSymbolHistories,
  syncTechnicals,
  appendIndexHistory,
  seedCompanyMaster,
} from "./nepseSyncService.js";

// ─── Startup ──────────────────────────────────────────────────────────────────
// Delay 3 s to let Mongoose finish connecting before firing any API calls.

setTimeout(runStartupSync, 3000);

// ─── Every 5 min during market hours (11:00–15:00 NPT, Sun–Thu) ──────────────

cron.schedule(
  "*/5 11-15 * * 0-4",
  async () => {
    await syncAllPrices();
    await syncIndexSnapshot();
    await syncSubIndices();
  },
  { timezone: "Asia/Kathmandu" }
);

// ─── Pre-market warmup (10:50 NPT) ───────────────────────────────────────────
// Ensures DB cache is warm before the first 5-min tick fires.

cron.schedule(
  "50 10 * * 0-4",
  () => syncAllPrices(),
  { timezone: "Asia/Kathmandu" }
);

// ─── End-of-day snapshot (15:30 NPT) ─────────────────────────────────────────
// Full pipeline after market close.
//
// ORDER MATTERS:
//   1. appendIndexHistory() — locks in today's confirmed index + turnover FIRST,
//      before syncAllPrices() can zero out MarketData volume/turnover fields.
//      This ensures IndexSnapshot always holds the correct session totals as
//      a fallback for the summary API when MarketData is zeroed post-close.
//   2. syncAllPrices() — resets non-traded symbol volumes (may zero MarketData)
//   3. syncIndexSnapshot() + syncSubIndices() — refresh snapshots
//   4. syncAllSymbolHistories() — full OHLCV history for every active symbol
//   5. syncTechnicals() — pre-compute RSI / MACD / SMA / BB
//   6. seedCompanyMaster() — refresh metadata (new listings, delists)

cron.schedule(
  "30 15 * * 0-4",
  async () => {
    console.log("📅 [Scheduler] EOD sync starting...");
    try {
      // Step 1: Persist today's confirmed index data BEFORE any resets
      await appendIndexHistory();

      // Step 2: Update prices (may zero volume/turnover for non-traded symbols)
      await syncAllPrices();
      await syncIndexSnapshot();
      await syncSubIndices();

      // Step 3: History + technicals
      await syncAllSymbolHistories();
      await syncTechnicals();

      // Step 4: Metadata refresh
      await seedCompanyMaster();

      console.log("✅ [Scheduler] EOD sync complete");
    } catch (err) {
      console.error("❌ [Scheduler] EOD sync error:", err.message);
    }
  },
  { timezone: "Asia/Kathmandu" }
);

// ─── Weekly metadata deep refresh (Sunday 10:30 NPT) ─────────────────────────
// Runs once a week before the market opens to catch any new listings or
// regulatory body / sector changes that might not appear in the daily seed.

cron.schedule(
  "30 10 * * 0",
  async () => {
    console.log("📅 [Scheduler] Weekly metadata refresh...");
    await seedCompanyMaster();
  },
  { timezone: "Asia/Kathmandu" }
);

console.log("⏰ [Scheduler] NEPSE pipeline scheduler v2 initialized");
