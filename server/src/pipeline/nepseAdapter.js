/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NepseSage — NEPSE Data Adapter                      ║
 * ║  Transforms raw @rumess/nepse-api responses into the internal    ║
 * ║  schema consumed by MarketData (MongoDB) and all API routes.     ║
 * ║                                                                  ║
 * ║  Rule: NOTHING outside this file should know the raw API shape.  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * RAW FIELD REFERENCE  (@rumess/nepse-api)
 * ─────────────────────────────────────────────────────────────────
 *  getLiveMarket() / getTopTenGainers() / getTopTenLosers()
 *    row.symbol               → ticker (e.g. "NABIL")
 *    row.securityName         → company full name
 *    row.sectorName           → sector string
 *    row.lastTradedPrice      → LTP
 *    row.openPrice            → open
 *    row.highPrice            → daily high
 *    row.lowPrice             → daily low
 *    row.previousClose        → prev close (derive change from this)
 *    row.totalTradedQuantity  → volume (shares)
 *    row.totalTradedValue     → turnover (NPR)
 *    row.percentageChange     → % change (signed float, e.g. -1.42)
 *
 *  getNepseIndex()
 *    row.index                → index name ("NEPSE")
 *    row.currentValue         → current index points
 *    row.change               → absolute point change
 *    row.perChange            → % change
 *    row.turnOver             → total market turnover
 *    row.totalTradedShares    → total shares traded
 *    row.totalTransactions    → total transaction count
 *
 *  getMarketSummary() / getMarketStatus()
 *    summary.isOpen           → bool
 *    summary.asOf             → ISO date string
 *
 *  getSecurityDetails(symbol)
 *    detail.symbol
 *    detail.securityName
 *    detail.sectorName
 *    detail.lastTradedPrice
 *    detail.openPrice, highPrice, lowPrice
 *    detail.previousClose
 *    detail.totalTradedQuantity
 *    detail.totalTradedValue
 *    detail.percentageChange
 *    detail.fiftyTwoWeekHigh   → 52w high
 *    detail.fiftyTwoWeekLow    → 52w low
 *
 *  getSecurityDailyGraph(symbol)
 *    array of { d, o, h, l, c, v } (date, OHLCV compact keys)
 *
 *  getFloorSheet()
 *    row.transactionId, row.symbol, row.buyerMemberId,
 *    row.sellerMemberId, row.contractQuantity, row.contractRate,
 *    row.contractAmount, row.tradeTime
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { normalizeSector } from "../utils/sectorNormalizer.js";

const safeNum = (val, fallback = 0) => {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
};

const deriveChange = (ltp, prevClose) => {
  const l = safeNum(ltp);
  const p = safeNum(prevClose);
  return p > 0 ? l - p : 0;
};

// ─── Security row (from getLiveMarket, gainers, losers lists) ─────────────────

/**
 * @param {object} raw  — one item from getLiveMarket() / getTopTenGainers() etc.
 * @returns {object}    — shape matching MarketData mongoose schema
 */
export function adaptSecurityRow(raw) {
  if (!raw) return null;

  const ltp = safeNum(raw.lastTradedPrice);
  const prevClose = safeNum(raw.previousClose);
  const change = deriveChange(ltp, prevClose);
  const changePercent = safeNum(raw.percentageChange, change && prevClose ? (change / prevClose) * 100 : 0);

  return {
    symbol: (raw.symbol || raw.securitySymbol || "").toUpperCase().trim(),
    companyName: raw.securityName || raw.companyName || raw.symbol || "",
    sector: normalizeSector(raw.sectorName || raw.businessSector || ""),
    ltp,
    open: safeNum(raw.openPrice),
    high: safeNum(raw.highPrice),
    low: safeNum(raw.lowPrice),
    close: ltp,                          // close = LTP during/after session
    previousClose: prevClose,
    change: safeNum(raw.change, change),
    changePercent,
    volume: safeNum(raw.totalTradeQuantity ?? raw.totalTradedQuantity ?? raw.volume),
    turnover: safeNum(raw.totalTradeValue ?? raw.totalTradedValue ?? raw.turnover),
    high52Week: safeNum(raw.fiftyTwoWeekHigh || raw.high52Week),
    low52Week: safeNum(raw.fiftyTwoWeekLow || raw.low52Week),
    lastUpdated: new Date(),
    isActive: true,
  };
}

// ─── Full security detail (getSecurityDetails) ────────────────────────────────

/**
 * Extends adaptSecurityRow with 52-week and extra metadata.
 * @param {object} raw  — response from getSecurityDetails(symbol)
 * @returns {object}
 */
export function adaptSecurityDetail(raw) {
  if (!raw) return null;

  const trade = raw.securityDailyTradeDto || {};
  const sec = raw.security || {};
  const company = sec.companyId || {};
  const sectorMaster = company.sectorMaster || {};

  const ltp = safeNum(trade.lastTradedPrice || raw.lastTradedPrice);
  const prevClose = safeNum(trade.previousClose || raw.previousClose);
  const change = deriveChange(ltp, prevClose);
  const changePercent = safeNum(
    raw.percentageChange ?? trade.percentageChange,
    change && prevClose ? (change / prevClose) * 100 : 0
  );

  return {
    symbol: (sec.symbol || raw.symbol || raw.securitySymbol || "").toUpperCase().trim(),
    companyName: company.companyName || sec.securityName || raw.securityName || raw.companyName || "",
    sector: normalizeSector(sectorMaster.sectorDescription || sec.sectorName || raw.sectorName || ""),
    ltp,
    open: safeNum(trade.openPrice || raw.openPrice),
    high: safeNum(trade.highPrice || raw.highPrice),
    low: safeNum(trade.lowPrice || raw.lowPrice),
    close: ltp,
    previousClose: prevClose,
    change: safeNum(trade.change ?? raw.change, change),
    changePercent,
    volume: safeNum(trade.totalTradeQuantity ?? trade.totalTradedQuantity ?? raw.totalTradeQuantity ?? raw.totalTradedQuantity ?? raw.volume),
    turnover: safeNum(trade.totalTradeValue ?? trade.totalTradedValue ?? raw.totalTradeValue ?? raw.totalTradedValue ?? raw.turnover),
    high52Week: safeNum(trade.fiftyTwoWeekHigh || raw.fiftyTwoWeekHigh || raw.high52Week),
    low52Week: safeNum(trade.fiftyTwoWeekLow || raw.fiftyTwoWeekLow || raw.low52Week),
    companyEmail: company.email || raw.companyEmail || "",
    website: company.companyWebsite || raw.website || "",
    regulatoryBody: sectorMaster.regulatoryBody || raw.regulatoryBody || "",
    instrumentType: sec.instrumentType?.description || raw.instrumentType || "",

    // Fundamental share/capital data — present in getSecurityDetails response
    listingDate: (() => {
      const d = company.listingDate || sec.listingDate || raw.listingDate;
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    })(),
    totalListedShares: safeNum(
      sec.totalListedShares ?? company.totalListedShares ?? raw.totalListedShares
    ),
    totalPaidUpValue: safeNum(
      sec.totalPaidUpValue ?? company.totalPaidUpValue ?? raw.totalPaidUpValue
    ),
    // Market cap = totalListedShares × LTP (computed here so it's always current)
    marketCapitalization: (() => {
      const shares = safeNum(sec.totalListedShares ?? company.totalListedShares ?? raw.totalListedShares);
      return shares > 0 ? shares * ltp : 0;
    })(),

    lastUpdated: new Date(),
    isActive: true,
  };
}

// ─── OHLCV history (getSecurityDailyGraph) ────────────────────────────────────

/**
 * @param {Array}  rawGraph — array from getSecurityDailyGraph()
 * @returns {Array<{date,open,high,low,close,volume}>}
 */
export function adaptOHLCVHistory(rawGraph) {
  if (!Array.isArray(rawGraph)) return [];

  return rawGraph
    .filter(Boolean)
    .map((row) => ({
      date: row.d ? new Date(row.d) : new Date(row.date || row.businessDate),
      open: safeNum(row.o ?? row.open ?? row.openPrice),
      high: safeNum(row.h ?? row.high ?? row.highPrice),
      low: safeNum(row.l ?? row.low ?? row.lowPrice),
      close: safeNum(row.c ?? row.close ?? row.closePrice ?? row.lastTradedPrice),
      volume: safeNum(row.v ?? row.volume ?? row.totalTradedQuantity),
    }))
    .filter((r) => r.close > 0)           // drop bad rows
    .sort((a, b) => a.date - b.date);     // ensure chronological
}

// ─── NEPSE index (getNepseIndex) ──────────────────────────────────────────────

/**
 * @param {Array}  rawIndices — array from getNepseIndex()
 * @returns {object}           — { nepseIndex, change, changePercent, turnover, volume, transactions }
 */
export function adaptMarketIndex(rawIndices) {
  if (!Array.isArray(rawIndices) || rawIndices.length === 0) return null;

  // Primary index is the one named "NEPSE" or the first entry
  const main = rawIndices.find((r) => {
    const idxName = (r.index || r.indexName || "").toUpperCase();
    return idxName === "NEPSE" || idxName === "NEPSE INDEX";
  }) || rawIndices[0];

  return {
    nepseIndex: safeNum(main.currentValue ?? main.value),
    change: safeNum(main.change),
    changePercent: safeNum(main.perChange ?? main.percentageChange),
    turnover: safeNum(main.turnOver ?? main.totalTurnover),
    totalVolume: safeNum(main.totalTradedShares ?? main.totalVolume),
    totalTransactions: safeNum(main.totalTransactions),
    asOf: main.asOf || main.businessDate || new Date().toISOString(),
  };
}

// ─── Market status ────────────────────────────────────────────────────────────

/**
 * @param {object} raw  — from getMarketStatus() or getMarketSummary()
 * @returns {{ isOpen: boolean, asOf: string }}
 */
export function adaptMarketStatus(raw) {
  if (!raw) return { isOpen: false, asOf: new Date().toISOString() };
  return {
    isOpen: raw.isOpen === true || raw.isOpen === "OPEN" || raw.marketStatus === "OPEN",
    asOf: raw.asOf || raw.businessDate || new Date().toISOString(),
  };
}

// ─── Floorsheet ───────────────────────────────────────────────────────────────

/**
 * @param {Array}  rawSheet — from getFloorSheet()
 * @returns {Array<FloorsheetEntry>}  — shape matches FloorsheetEntry UI interface
 */
export function adaptFloorsheet(rawSheet) {
  if (!Array.isArray(rawSheet)) return [];

  return rawSheet.map((row, idx) => ({
    id: String(row.transactionId ?? row.id ?? idx),
    date: row.tradeTime || row.date || new Date().toISOString(),
    symbol: (row.symbol || row.securitySymbol || "").toUpperCase(),
    buyerBroker: safeNum(row.buyerMemberId ?? row.buyerBroker),
    sellerBroker: safeNum(row.sellerMemberId ?? row.sellerBroker),
    quantity: safeNum(row.contractQuantity ?? row.quantity),
    rate: safeNum(row.contractRate ?? row.rate),
    amount: safeNum(row.contractAmount ?? row.amount),
    type: "regular",          // NEPSE API doesn't classify; UI handles display
  }));
}

// ─── Summary aggregation ──────────────────────────────────────────────────────

/**
 * Build the /api/nepse/summary payload from already-adapted security rows.
 * Called by the controller after fetching from MongoDB cache.
 *
 * @param {Array}  adaptedRows   — array of MarketData docs from MongoDB
 * @param {object} indexSnapshot — result of adaptMarketIndex()
 * @returns {object}
 */
export function buildMarketSummary(adaptedRows, indexSnapshot) {
  const gainers = adaptedRows.filter((r) => r.changePercent > 0).length;
  const losers = adaptedRows.filter((r) => r.changePercent < 0).length;
  const unchanged = adaptedRows.filter((r) => r.changePercent === 0).length;
  const totalTurnover = adaptedRows.reduce((s, r) => s + (r.turnover || 0), 0);
  const totalVolume = adaptedRows.reduce((s, r) => s + (r.volume || 0), 0);

  return {
    totalSymbols: adaptedRows.length,
    gainers,
    losers,
    unchanged,
    totalTurnover,
    totalVolume,
    advanceDeclineRatio: losers > 0 ? (gainers / losers).toFixed(2) : "∞",
    // Index data merged in if available
    ...(indexSnapshot ?? {}),
  };
}

// ─── Per-symbol price+volume history (getSecurityPriceVolumeHistory) ───────────

/**
 * Adapts the extended per-symbol price+volume history.
 * Used for volume bar charts on the company details page.
 *
 * Raw shapes observed from @rumess/nepse-api:
 *   { businessDate, lastTradedPrice, totalTradedQuantity, totalTradedValue }
 *   or compact { d, c, v } keys
 *
 * @param {Array} raw  — from getSecurityPriceVolumeHistory(symbol)
 * @returns {Array<{date, price, volume, turnover}>}
 */
export function adaptPriceVolumeHistory(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(Boolean)
    .map((row) => ({
      date: row.businessDate
        ? new Date(row.businessDate)
        : row.d
        ? new Date(row.d)
        : new Date(row.date || 0),
      price: safeNum(
        row.lastTradedPrice ?? row.closePrice ?? row.c ?? row.close
      ),
      volume: safeNum(
        row.totalTradedQuantity ?? row.totalTradeQuantity ?? row.v ?? row.volume
      ),
      turnover: safeNum(
        row.totalTradedValue ?? row.totalTradeValue ?? row.turnover
      ),
    }))
    .filter((r) => r.price > 0 || r.volume > 0)
    .sort((a, b) => a.date - b.date);
}

// ─── Today's market-wide price/volume history (getTodaysPriceVolumeHistory) ────

/**
 * Adapts intraday tick-by-tick market timeline.
 * Used for a "Today's Trading" sparkline on the market summary page.
 *
 * @param {Array} raw  — from getTodaysPriceVolumeHistory()
 * @returns {Array<{time, price, volume}>}
 */
export function adaptTodaysPriceVolumeHistory(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(Boolean)
    .map((row) => ({
      time: row.tradeTime || row.businessDate || row.time || null,
      price: safeNum(
        row.lastTradedPrice ?? row.price ?? row.closePrice
      ),
      volume: safeNum(
        row.totalTradedQuantity ?? row.totalTradeQuantity ?? row.volume
      ),
    }))
    .filter((r) => r.price > 0);
}
