/**
 * scripts/seedCompanyMaster.js
 *
 * One-time / manual script to seed the company master list and run
 * an initial full history sync for all symbols.
 *
 * Usage:
 *   node --experimental-vm-modules scripts/seedCompanyMaster.js
 *
 * DO NOT run this in production automatically — it fires many parallel
 * API calls. Run once manually after fresh deploy, then let the EOD
 * cron handle ongoing syncing.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Delay imports until after dotenv loads
const { default: connectDB } = await import("../src/config/db.js");
const { seedCompanyMaster, syncAllPrices, syncPriorityHistories } = await import("../src/pipeline/nepseSyncService.js");

async function main() {
  await connectDB();
  console.log("🌱 Starting company master seed...");

  await seedCompanyMaster();
  console.log("✅ Company master done");

  await syncAllPrices();
  console.log("✅ Initial price sync done");

  await syncPriorityHistories();
  console.log("✅ Priority history sync done");

  console.log("\n✅ All done. Disconnect and exit.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
