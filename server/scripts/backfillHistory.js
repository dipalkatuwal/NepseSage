/**
 * scripts/backfillHistory.js
 *
 * Run once to retroactively fetch OHLCV history for ALL active symbols
 * and compute technical indicators for every symbol that has data.
 *
 * This populates the database with historical price data so chart-series
 * and technical endpoints work immediately for every symbol.
 *
 * Usage:
 *   node --experimental-vm-modules scripts/backfillHistory.js
 *
 * Expected runtime: 10–30 minutes for ~220 symbols (NEPSE rate-limited).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { default: connectDB } = await import("../src/config/db.js");
const { syncAllSymbolHistories, syncTechnicals } = await import("../src/pipeline/nepseSyncService.js");

async function main() {
  await connectDB();
  console.log("📊 Starting full history backfill...");
  console.log("   This will take 10-30 minutes. Do not interrupt.\n");

  const result = await syncAllSymbolHistories();
  console.log(`\n✅ History backfill: synced=${result.synced}, failed=${result.failed}`);

  console.log("\n⚙️  Computing technical indicators for all symbols...");
  const techResult = await syncTechnicals();
  console.log(`✅ Technicals: computed=${techResult.computed}, skipped=${techResult.skipped}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
