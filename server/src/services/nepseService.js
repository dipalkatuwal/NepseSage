/**
 * NEPSE Data Service
 * Fetches live market data from public NEPSE sources.
 *
 * Primary: nepse.com.np official API (if available)
 * Fallback: merolagani.com / sharesansar.com scraping
 *
 * All data is cached in MongoDB (MarketData collection)
 * and refreshed every 5 minutes during trading hours.
 */

import MarketData from "../models/MarketData.js";

// Known NEPSE symbols with company names (seed data)
export const NEPSE_SYMBOLS = {
  NABIL: { name: "Nabil Bank Limited", sector: "Commercial Banks" },
  NTC: { name: "Nepal Telecom", sector: "Telecom" },
  NICA: { name: "NIC Asia Bank Limited", sector: "Commercial Banks" },
  ADBL: { name: "Agricultural Development Bank", sector: "Commercial Banks" },
  SCB: { name: "Standard Chartered Bank Nepal", sector: "Commercial Banks" },
  EBL: { name: "Everest Bank Limited", sector: "Commercial Banks" },
  BOKL: { name: "Bank of Kathmandu", sector: "Commercial Banks" },
  HBL: { name: "Himalayan Bank Limited", sector: "Commercial Banks" },
  SBI: { name: "Nepal SBI Bank", sector: "Commercial Banks" },
  MBL: { name: "Machhapuchchhre Bank", sector: "Commercial Banks" },
  GBIME: { name: "Global IME Bank", sector: "Commercial Banks" },
  KBL: { name: "Kumari Bank Limited", sector: "Commercial Banks" },
  SANIMA: { name: "Sanima Bank Limited", sector: "Commercial Banks" },
  LBBL: { name: "Laxmi Sunrise Bank", sector: "Commercial Banks" },
  PCBL: { name: "Prime Commercial Bank", sector: "Commercial Banks" },
  NBL: { name: "Nepal Bank Limited", sector: "Commercial Banks" },
  RBBL: { name: "Rastriya Banijya Bank", sector: "Commercial Banks" },
  MEGA: { name: "Mega Bank Nepal", sector: "Commercial Banks" },
  CZBIL: { name: "Citizen Bank International", sector: "Commercial Banks" },
  NIB: { name: "Nepal Investment Mega Bank", sector: "Commercial Banks" },
  NLIC: { name: "Nepal Life Insurance Company", sector: "Life Insurance" },
  ALICL: { name: "Asian Life Insurance", sector: "Life Insurance" },
  LICN: { name: "Life Insurance Company Nepal", sector: "Life Insurance" },
  ULIF: { name: "Union Life Insurance", sector: "Life Insurance" },
  SRBL: { name: "Sunrise First Microfinance", sector: "Microfinance" },
  CHCL: { name: "Chilime Hydropower", sector: "Hydropower" },
  BPCL: { name: "Butwal Power Company", sector: "Hydropower" },
  UPPER: { name: "Upper Tamakoshi Hydropower", sector: "Hydropower" },
  NHPC: { name: "National Hydropower Company", sector: "Hydropower" },
  API: { name: "Api Power Company", sector: "Hydropower" },
};

/**
 * Fetch live data from NEPSE official API
 * Endpoint: https://nepalstock.com.np/api/nots/securityDailyTradeStat/58
 */
export const fetchLiveNepseData = async () => {
  try {
    const response = await fetch(
      "https://nepalstock.com.np/api/nots/nepse-data/market-summary",
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NepseSage/1.0",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) throw new Error(`NEPSE API error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn("⚠️  NEPSE live fetch failed, using cached data:", err.message);
    return null;
  }
};

/**
 * Fetch all security prices from NEPSE
 */
export const fetchAllSecurities = async () => {
  try {
    const response = await fetch(
      "https://nepalstock.com.np/api/nots/security?nonDelisted=true",
      {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) throw new Error(`Securities fetch failed: ${response.status}`);
    const data = await response.json();
    return data?.body || [];
  } catch (err) {
    console.warn("⚠️  Securities fetch failed:", err.message);
    return [];
  }
};

/**
 * Fetch OHLCV history for a specific symbol
 */
export const fetchSymbolHistory = async (symbol, days = 90) => {
  try {
    // NEPSE floorsheet / price history
    const response = await fetch(
      `https://nepalstock.com.np/api/nots/market/graphdata/${symbol}/chart?start=&end=`,
      {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
    const data = await response.json();
    return data?.body || [];
  } catch (err) {
    console.warn(`⚠️  History fetch for ${symbol} failed:`, err.message);
    return [];
  }
};

/**
 * Update or create market data entry for a symbol
 */
export const upsertMarketData = async (symbolData) => {
  const { symbol, ...data } = symbolData;
  return MarketData.findOneAndUpdate(
    { symbol },
    { ...data, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
};

/**
 * Get market data for a symbol (from cache)
 */
export const getSymbolData = async (symbol) => {
  const data = await MarketData.findOne({ symbol: symbol.toUpperCase() });
  return data;
};

/**
 * Get top gainers from cache
 */
export const getTopGainers = async (limit = 10) => {
  return MarketData.find({ isActive: true })
    .sort({ changePercent: -1 })
    .limit(limit)
    .select("symbol companyName ltp change changePercent volume");
};

/**
 * Get top losers from cache
 */
export const getTopLosers = async (limit = 10) => {
  return MarketData.find({ isActive: true })
    .sort({ changePercent: 1 })
    .limit(limit)
    .select("symbol companyName ltp change changePercent volume");
};

/**
 * Get market summary (index + breadth)
 */
export const getMarketSummary = async () => {
  const all = await MarketData.find({ isActive: true }).select(
    "changePercent ltp volume turnover"
  );
  const gainers = all.filter((s) => s.changePercent > 0).length;
  const losers = all.filter((s) => s.changePercent < 0).length;
  const unchanged = all.filter((s) => s.changePercent === 0).length;
  const totalTurnover = all.reduce((sum, s) => sum + (s.turnover || 0), 0);

  return {
    totalSymbols: all.length,
    gainers,
    losers,
    unchanged,
    totalTurnover,
    advanceDeclineRatio: losers > 0 ? (gainers / losers).toFixed(2) : "∞",
  };
};

/**
 * Seed initial market data with mock prices (used when live fetch fails)
 */
export const seedMockData = async () => {
  const count = await MarketData.countDocuments();
  if (count > 0) return;

  console.log("📊 Seeding initial mock NEPSE data...");
  const mockEntries = Object.entries(NEPSE_SYMBOLS).map(
    ([symbol, { name, sector }]) => {
      const basePrice = Math.floor(Math.random() * 1500) + 200;
      const change = (Math.random() - 0.5) * 50;
      return {
        symbol,
        companyName: name,
        sector,
        ltp: basePrice + change,
        open: basePrice,
        high: basePrice + Math.abs(change) + 10,
        low: basePrice - Math.abs(change) - 5,
        close: basePrice + change,
        previousClose: basePrice,
        change: change,
        changePercent: (change / basePrice) * 100,
        volume: Math.floor(Math.random() * 50000) + 1000,
        turnover: Math.floor(Math.random() * 5000000) + 100000,
        high52Week: basePrice * 1.4,
        low52Week: basePrice * 0.6,
        lastUpdated: new Date(),
        isActive: true,
      };
    }
  );

  await MarketData.insertMany(mockEntries);
  console.log(`✅ Seeded ${mockEntries.length} NEPSE symbols`);
};