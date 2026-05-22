import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import { connectDB } from "../src/config/db.js";
import { fetchAllSecurities, fetchMarketStatus } from "../src/pipeline/nepseFetcher.js";
import MarketData from "../src/models/MarketData.js";

async function main() {
  await connectDB();

  console.log("=== 1. Market Status ===");
  const status = await fetchMarketStatus();
  console.log("Market Status:", JSON.stringify(status, null, 2));

  console.log("\n=== 2. Live Market API ===");
  const securities = await fetchAllSecurities();
  if (securities) {
    console.log(`Fetched ${securities.length} securities from live API.`);
    const withVolume = securities.filter(s => (s.totalTradedQuantity || 0) > 0);
    console.log(`Securities with volume > 0: ${withVolume.length}`);
    const zeroVolume = securities.filter(s => (s.totalTradedQuantity || 0) === 0);
    console.log(`Securities with volume = 0: ${zeroVolume.length}`);
    if (securities.length > 0) {
      console.log("Sample (first):", JSON.stringify(securities[0], null, 2));
    }
  } else {
    console.log("fetchAllSecurities() returned null/empty");
  }

  console.log("\n=== 3. Database State ===");
  const totalActive = await MarketData.countDocuments({ isActive: true });
  const withVol = await MarketData.countDocuments({ isActive: true, volume: { $gt: 0 } });
  const zeroVol = await MarketData.countDocuments({ isActive: true, volume: 0 });
  const withChange = await MarketData.countDocuments({ isActive: true, changePercent: { $ne: 0 } });
  console.log(`Total active: ${totalActive}`);
  console.log(`With volume > 0: ${withVol}`);
  console.log(`With volume = 0: ${zeroVol}`);
  console.log(`With changePercent != 0: ${withChange}`);

  // Sample a few docs with volume=0 to see if they have ltp/previousClose
  const sampleZero = await MarketData.find({ isActive: true, volume: 0 })
    .select("symbol ltp previousClose change changePercent volume turnover lastUpdated")
    .limit(5)
    .lean();
  console.log("\nSample docs with volume=0:", JSON.stringify(sampleZero, null, 2));

  // Sample a few docs with volume > 0
  const samplePositive = await MarketData.find({ isActive: true, volume: { $gt: 0 } })
    .select("symbol ltp previousClose change changePercent volume turnover lastUpdated")
    .limit(3)
    .lean();
  console.log("\nSample docs with volume>0:", JSON.stringify(samplePositive, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
