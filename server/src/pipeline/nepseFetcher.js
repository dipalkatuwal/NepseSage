/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NepseSage — NEPSE Fetcher Service                   ║
 * ║  Single source of truth for every @rumess/nepse-api call.        ║
 * ║  Returns RAW responses — no transformation is done here.         ║
 * ║  All mapping is delegated to nepseAdapter.js.                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Usage (from nepse sync service):
 *   import { fetchAllSecurities, fetchSecurityDetail } from './nepseFetcher.js';
 *   const raw = await fetchAllSecurities();
 */

import { Nepse } from "@rumess/nepse-api";

// ─── Singleton client ─────────────────────────────────────────────────────────

let _client = null;
let _initialized = false;

/**
 * Returns the singleton Nepse client, initialising it once.
 * NEPSE's official server has a broken SSL cert chain, so TLS
 * verification must be disabled (this is only the scraper→NEPSE
 * internal hop; user traffic is unaffected).
 */
async function getClient() {
  if (_initialized && _client) return _client;

  _client = new Nepse();
  _client.setTLSVerification(false); // required — NEPSE SSL quirk

  try {
    // `init()` performs the token deobfuscation handshake.
    // @rumess/nepse-api handles the salt arrays internally.
    if (typeof _client.init === "function") {
      await _client.init();
    }
    _initialized = true;
    console.log("✅ @rumess/nepse-api client initialized");
  } catch (err) {
    // Mark uninitialised so the next call retries
    _initialized = false;
    console.error("❌ nepse-api init failed:", err.message);
    throw err;
  }

  return _client;
}

// ─── Generic wrapper ──────────────────────────────────────────────────────────

/**
 * Wraps every API call with error isolation.
 * Returns null on failure so the sync service can fall back gracefully.
 */
/**
 * Sleeps for `ms` milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps every API call with error isolation and exponential backoff.
 * Retries up to MAX_RETRIES times on failure; returns null when all attempts fail.
 * This prevents socket hang-ups from NEPSE rate-limiting from crashing the sync.
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500; // 1.5 s → 3 s → 6 s

async function safeCall(label, fn) {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const client = await getClient();
      const result = await fn(client);
      return result;
    } catch (err) {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        console.warn(`⚠️  NepseFetcher [${label}] failed after ${MAX_RETRIES} attempts:`, err.message);
        return null;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`⚠️  NepseFetcher [${label}] attempt ${attempt} failed, retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }
  return null;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Live market data for all listed securities.
 * Used for the main sync loop — prices, volume, turnover, change.
 * @returns {Promise<Array|null>}
 */
export const fetchAllSecurities = () =>
  safeCall("getLiveMarket", (c) => c.getLiveMarket());

/**
 * Full detail for a single security including 52-week range.
 * @param {string} symbol  e.g. "NABIL"
 * @returns {Promise<object|null>}
 */
export const fetchSecurityDetail = (symbol) =>
  safeCall(`getSecurityDetails(${symbol})`, (c) =>
    c.getSecurityDetails(symbol.toUpperCase())
  );

/**
 * OHLCV price history graph for a symbol.
 * Returns compact { d, o, h, l, c, v } objects — adapted in nepseAdapter.
 * @param {string} symbol
 * @returns {Promise<Array|null>}
 */
export const fetchSecurityGraph = (symbol) =>
  safeCall(`getSecurityDailyGraph(${symbol})`, (c) =>
    c.getSecurityDailyGraph(symbol.toUpperCase())
  );

/**
 * Top 10 gainers list.
 * @returns {Promise<Array|null>}
 */
export const fetchTopGainers = () =>
  safeCall("getTopTenGainers", (c) => c.getTopTenGainers());

/**
 * Top 10 losers list.
 * @returns {Promise<Array|null>}
 */
export const fetchTopLosers = () =>
  safeCall("getTopTenLosers", (c) => c.getTopTenLosers());

/**
 * Top 10 by turnover (value traded).
 * @returns {Promise<Array|null>}
 */
export const fetchTopTurnover = () =>
  safeCall("getTopTenTurnoverScrips", (c) => c.getTopTenTurnoverScrips());

/**
 * Top 10 by trade count.
 * @returns {Promise<Array|null>}
 */
export const fetchTopTrades = () =>
  safeCall("getTopTenTradeScrips", (c) => c.getTopTenTradeScrips());

/**
 * Top 10 by transaction count.
 * @returns {Promise<Array|null>}
 */
export const fetchTopTransactions = () =>
  safeCall("getTopTenTransactionScrips", (c) => c.getTopTenTransactionScrips());

/**
 * NEPSE composite index and sub-indices.
 * Contains current index value, point change, % change, turnover, volume.
 * @returns {Promise<Array|null>}
 */
export const fetchNepseIndex = () =>
  safeCall("getNepseIndex", (c) => c.getNepseIndex());

/**
 * NEPSE index daily graph (historical index values for charting).
 * @returns {Promise<Array|null>}
 */
export const fetchNepseIndexGraph = () =>
  safeCall("getNepseIndexDailyGraph", (c) => c.getNepseIndexDailyGraph());

/**
 * NEPSE sub-indices (sector-wise indices).
 * @returns {Promise<Array|null>}
 */
export const fetchNepseSubIndices = () =>
  safeCall("getNepseSubIndices", (c) => c.getNepseSubIndices());

/**
 * Market open/close status.
 * @returns {Promise<object|null>}  { isOpen, asOf }
 */
export const fetchMarketStatus = () =>
  safeCall("getMarketStatus", (c) => c.getMarketStatus());

/**
 * Market summary from the official endpoint.
 * @returns {Promise<object|null>}
 */
export const fetchMarketSummary = () =>
  safeCall("getMarketSummary", (c) => c.getMarketSummary());

/**
 * Floorsheet (transaction-level trades).
 * Potentially large — fetcher returns raw; controller paginates.
 * @returns {Promise<Array|null>}
 */
export const fetchFloorsheet = () =>
  safeCall("getFloorSheet", (c) => c.getFloorSheet());

/**
 * All listed company objects (master list).
 * Useful for search autocomplete seeding.
 * @returns {Promise<Array|null>}
 */
export const fetchCompanyList = () =>
  safeCall("getCompanyList", (c) => c.getCompanyList());

/**
 * All security objects (includes inactive).
 * @returns {Promise<Array|null>}
 */
export const fetchSecurityList = () =>
  safeCall("getSecurityList", (c) => c.getSecurityList());

/**
 * Market depth for a symbol (bid/ask levels).
 * @param {string} symbol
 * @returns {Promise<object|null>}
 */
export const fetchMarketDepth = (symbol) =>
  safeCall(`getMarketDepth(${symbol})`, (c) =>
    c.getMarketDepth(symbol.toUpperCase())
  );

/**
 * Today's intraday price/volume history for the entire market.
 * Returns tick-by-tick data for market-wide trading timeline.
 * @returns {Promise<Array|null>}
 */
export const fetchTodaysPriceVolumeHistory = () =>
  safeCall("getTodaysPriceVolumeHistory", (c) =>
    c.getTodaysPriceVolumeHistory()
  );

/**
 * NEPSE index daily graph (general — may differ from getNepseIndexDailyGraph).
 * @returns {Promise<Array|null>}
 */
export const fetchIndexDailyGraph = () =>
  safeCall("getIndexDailyGraph", (c) => c.getIndexDailyGraph());

/**
 * Extended price + volume history for a single security.
 * Longer range than getSecurityDailyGraph — unlocks volume bar charts.
 * @param {string} symbol  e.g. "NABIL"
 * @returns {Promise<Array|null>}
 */
export const fetchSecurityPriceVolumeHistory = (symbol) =>
  safeCall(`getSecurityPriceVolumeHistory(${symbol})`, (c) =>
    c.getSecurityPriceVolumeHistory(symbol.toUpperCase())
  );
