import cron from "node-cron";
import {
  fetchAllSecurities,
  upsertMarketData,
  seedMockData,
  NEPSE_SYMBOLS,
} from "./nepseService.js";
import MarketData from "../models/MarketData.js";

/**
 * Sync live NEPSE prices into MongoDB cache
 */
const syncNepseData = async () => {
  console.log("🔄 Syncing NEPSE market data...");
  try {
    const securities = await fetchAllSecurities();

    if (securities.length === 0) {
      console.warn("⚠️  No securities returned from NEPSE API");
      return;
    }

    let updated = 0;
    for (const sec of securities) {
      // Map NEPSE API response fields to our schema
      // Adjust field names based on actual NEPSE API response structure
      const symbolInfo = NEPSE_SYMBOLS[sec.symbol] || {};
      await upsertMarketData({
        symbol: sec.symbol || sec.ticker,
        companyName: sec.securityName || symbolInfo.name || sec.symbol,
        sector: sec.sectorName || symbolInfo.sector || "Unknown",
        ltp: sec.lastTradedPrice || sec.ltp || 0,
        open: sec.openPrice || 0,
        high: sec.highPrice || 0,
        low: sec.lowPrice || 0,
        close: sec.closePrice || sec.lastTradedPrice || 0,
        previousClose: sec.previousClose || 0,
        change: sec.change || 0,
        changePercent: sec.percentageChange || 0,
        volume: sec.totalTradedQuantity || 0,
        turnover: sec.totalTradedValue || 0,
      });
      updated++;
    }

    console.log(`✅ Synced ${updated} NEPSE symbols`);
  } catch (err) {
    console.error("❌ NEPSE sync error:", err.message);
  }
};

/**
 * NEPSE trading hours (Nepal time = UTC+5:45)
 * Market: 11:00 AM – 3:00 PM Sunday–Thursday
 *
 * Schedules:
 * - Every 5 min during market hours (Sun–Thu 11:00–15:00 NPT)
 * - Once at 15:30 for end-of-day close prices
 */

// Seed mock data on startup if DB is empty
seedMockData();

// Every 5 minutes, Sunday–Thursday (cron in UTC, NPT = UTC+5:45)
// 11:00 NPT = 05:15 UTC, 15:00 NPT = 09:15 UTC
cron.schedule("*/5 5-9 * * 0-4", syncNepseData, {
  timezone: "Asia/Kathmandu",
});

// End-of-day snapshot at 15:30 NPT Sunday–Thursday
cron.schedule("30 15 * * 0-4", syncNepseData, {
  timezone: "Asia/Kathmandu",
});

console.log("⏰ NEPSE scheduler initialized");