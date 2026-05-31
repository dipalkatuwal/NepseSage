/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NepseSage — NEPSE API Route Controller  v2          ║
 * ║                                                                  ║
 * ║  v2 upgrades:                                                    ║
 * ║  • getIndexHistory — serves from IndexHistory DB (time-series)   ║
 * ║    with live NEPSE API as graceful fallback                       ║
 * ║  • searchSymbols merges /search and /symbols — one endpoint      ║
 * ║  • getTechnical — serves pre-computed technicals from DB;        ║
 * ║    recomputes live only when computedAt is stale (> 24 h)        ║
 * ║  • getChartSeries — new: full RSI/MACD/BB series for charting    ║
 * ║  • Rate-limiting applied to live-fetch endpoints                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import MarketData from "../models/MarketData.js";
import IndexSnapshot from "../models/IndexSnapshot.js";
import IndexHistory from "../models/IndexHistory.js";
import { normalizeSector } from "../utils/sectorNormalizer.js";
import { analyzeSymbol, computeChartSeries } from "../services/technicalAnalysis.js";
import {
  syncSymbolDetail,
  getMarketOpenStatus,
  runEODSnapshotIfNeeded,
} from "../pipeline/nepseSyncService.js";
import {
  adaptFloorsheet,
  adaptPriceVolumeHistory,
  adaptTodaysPriceVolumeHistory,
} from "../pipeline/nepseAdapter.js";
import {
  fetchFloorsheet,
  fetchMarketDepth,
  fetchNepseIndexGraph,
  fetchSecurityPriceVolumeHistory,
  fetchTodaysPriceVolumeHistory,
  fetchTopTurnover,
} from "../pipeline/nepseFetcher.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrSyncSymbol(symbol) {
  let doc = await MarketData.findOne({ symbol });

  if (!doc && symbol.includes("/")) {
    doc = await MarketData.findOne({ symbol: { $regex: `^${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
  }

  if (!doc) {
    try {
      doc = await syncSymbolDetail(symbol);
    } catch (err) {
      console.warn(`⚠️  [getOrSyncSymbol] syncSymbolDetail failed for ${symbol}:`, err.message);
    }
  }

  if (!doc && symbol.includes("/")) {
    const prefix = symbol.split("/")[0];
    doc = await MarketData.findOne({
      symbol: { $regex: `^${prefix}`, $options: "i" },
    });
    if (doc) {
      console.log(`ℹ️  [getOrSyncSymbol] Resolved ${symbol} via prefix match → ${doc.symbol}`);
    }
  }

  return doc;
}

/** Is the stored technical data still fresh (computed today)? */
function technicalsAreFresh(doc) {
  const computedAt = doc?.technicals?.computedAt;
  if (!computedAt) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return new Date(computedAt) >= todayStart;
}

// ─── In-memory rate limiter ───────────────────────────────────────────────────

const rateLimitMap = new Map();
const LIVE_FETCH_LIMIT = 10;

function checkRateLimit(ip, endpoint) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  if (entry.count > LIVE_FETCH_LIMIT) return true;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// ─── GET /api/nepse/summary ───────────────────────────────────────────────────

export const getSummary = async (req, res, next) => {
  try {
    const [allDocs, indexDoc, statusRaw] = await Promise.all([
      MarketData.find({ isActive: true }).select("changePercent ltp volume turnover"),
      IndexSnapshot.findOne({ key: "NEPSE" }),
      getMarketOpenStatus(),
    ]);

    // ── Visitor-triggered EOD snapshot ────────────────────────────────────────
    // If the market is closed and our DB is behind the last trading day,
    // kick off a background sync. This is fire-and-forget — the response
    // is served immediately from what's in the DB right now.
    if (!(statusRaw?.isOpen)) {
      runEODSnapshotIfNeeded();
    }

    // Only count companies actually traded (volume > 0) for correct breadth
    const tradedDocs = allDocs.filter((r) => (r.volume || 0) > 0);

    const gainers   = tradedDocs.filter((r) => r.changePercent > 0).length;
    const losers    = tradedDocs.filter((r) => r.changePercent < 0).length;
    const unchanged = tradedDocs.filter((r) => r.changePercent === 0).length;
    const liveTurnover = tradedDocs.reduce((s, r) => s + (r.turnover || 0), 0);
    const liveVolume   = tradedDocs.reduce((s, r) => s + (r.volume   || 0), 0);

    // After market close the sync zeros MarketData volume/turnover.
    // Fall back to IndexSnapshot which preserves the final session totals.
    // Note: IndexSnapshot uses field name "turnover" (not "totalTurnover").
    const snapshotTurnover = Number(indexDoc?.turnover) || 0;
    const snapshotVolume   = Number(indexDoc?.totalVolume) || 0;

    const totalTurnover = liveTurnover > 0 ? liveTurnover : snapshotTurnover;
    const totalVolume   = liveVolume   > 0 ? liveVolume   : snapshotVolume;

    res.json({
      totalSymbols:       allDocs.length,
      gainers,
      losers,
      unchanged,
      totalTurnover,                                      // always a number ≥ 0
      totalVolume,                                        // always a number ≥ 0
      advanceDeclineRatio: losers > 0 ? (gainers / losers).toFixed(2) : "∞",
      nepseIndex:         Number(indexDoc?.nepseIndex)        || 0,
      indexChange:        Number(indexDoc?.change)            || 0,
      indexChangePercent: Number(indexDoc?.changePercent)     || 0,
      indexTurnover:      Number(indexDoc?.turnover)          || 0,
      totalTransactions:  Number(indexDoc?.totalTransactions) || 0,
      asOf:               indexDoc?.asOf              ?? null,
      isMarketOpen:       statusRaw?.isOpen           ?? false,
      marketAsOf:         statusRaw?.asOf             ?? null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/search ────────────────────────────────────────────────────

export const searchSymbols = async (req, res, next) => {
  try {
    const { q, fields } = req.query;
    const defaultLimit = q ? 30 : 1000;
    const maxLimit     = q ? 100 : 1000;
    const limit = Math.min(Number(req.query.limit) || defaultLimit, maxLimit);

    let filter = { isActive: true };
    if (q?.length >= 1) {
      filter.$or = [
        { symbol:      { $regex: `^${q.toUpperCase()}` } },
        { companyName: { $regex: q, $options: "i" } },
      ];
    }

    const selectFull    = "symbol companyName sector ltp change changePercent volume turnover";
    const selectMinimal = "symbol companyName sector ltp changePercent";
    const select = fields === "minimal" ? selectMinimal : selectFull;

    const results = await MarketData.find(filter)
      .select(select)
      .limit(limit)
      .sort(q ? { symbol: 1 } : { turnover: -1, symbol: 1 });

    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const getSymbols = searchSymbols;

// ─── GET /api/nepse/symbol/:symbol ────────────────────────────────────────────

export const getSymbol = async (req, res, next) => {
  try {
    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const doc = await getOrSyncSymbol(symbol);
    if (!doc) return res.status(404).json({ message: `Symbol ${symbol} not found` });
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/gainers ───────────────────────────────────────────────────

export const getGainers = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const docs = await MarketData.find({ isActive: true, changePercent: { $gt: 0 } })
      .sort({ changePercent: -1 })
      .limit(limit)
      .select("symbol companyName sector ltp change changePercent volume turnover");
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/losers ────────────────────────────────────────────────────

export const getLosers = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const docs = await MarketData.find({ isActive: true, changePercent: { $lt: 0 } })
      .sort({ changePercent: 1 })
      .limit(limit)
      .select("symbol companyName sector ltp change changePercent volume turnover");
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/turnover ──────────────────────────────────────────────────

export const getTopTurnover = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const docs = await MarketData.find({ isActive: true, turnover: { $gt: 0 } })
      .sort({ turnover: -1 })
      .limit(limit)
      .select("symbol companyName sector ltp change changePercent volume turnover");
    if (docs.length > 0) return res.json(docs);

    const raw = await fetchTopTurnover();
    res.json(raw || []);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/sectors ───────────────────────────────────────────────────

export const getSectors = async (req, res, next) => {
  try {
    const sectors = await MarketData.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:           "$sector",
          avgChange:     { $avg: { $cond: [{ $gt: ["$volume", 0] }, "$changePercent", null] } },
          totalTurnover: { $sum: "$turnover" },
          totalVolume:   { $sum: "$volume" },
          symbolCount:   { $sum: 1 },
          gainers:       { $sum: { $cond: [{ $and: [{ $gt: ["$volume", 0] }, { $gt: ["$changePercent", 0] }] }, 1, 0] } },
          losers:        { $sum: { $cond: [{ $and: [{ $gt: ["$volume", 0] }, { $lt: ["$changePercent", 0] }] }, 1, 0] } },
        },
      },
      { $addFields: { avgChange: { $ifNull: ["$avgChange", 0] } } },
      { $sort: { avgChange: -1 } },
    ]);

    // ── Post-close fallback ──────────────────────────────────────────────────
    // After market close, MarketData.turnover/volume are zeroed by syncAllPrices().
    // IndexSnapshot stores one doc per NEPSE sub-index (e.g. "Banking", "Hydro Power")
    // which retains the confirmed session totals. Merge those in when the
    // aggregation returns zero total turnover across all sectors.
    const totalAggTurnover = sectors.reduce((s, r) => s + (r.totalTurnover || 0), 0);

    if (totalAggTurnover === 0) {
      const snapshots = await IndexSnapshot.find({ key: { $ne: "NEPSE" } }).lean();

      // Map each sub-index snapshot key to a canonical sector name
      const snapshotMap = {};
      for (const snap of snapshots) {
        const canonical = normalizeSector(snap.key);
        if (canonical && canonical !== "Others") {
          if (!snapshotMap[canonical] || (snap.turnover || 0) > (snapshotMap[canonical].turnover || 0)) {
            snapshotMap[canonical] = { turnover: snap.turnover || 0, totalVolume: snap.totalVolume || 0 };
          }
        }
      }

      // Merge snapshot values into aggregated sector rows
      for (const sector of sectors) {
        const snap = snapshotMap[sector._id];
        if (snap) {
          sector.totalTurnover = snap.turnover;
          sector.totalVolume   = snap.totalVolume;
        }
      }
    }

    res.json(sectors);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/history/:symbol ──────────────────────────────────────────

export const getHistory = async (req, res, next) => {
  try {
    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const days   = Math.min(Number(req.query.days) || 90, 365);
    const doc    = await MarketData.findOne({ symbol }).select("symbol ohlcvHistory ltp");

    if (!doc) return res.status(404).json({ message: `Symbol ${symbol} not found` });

    const history = (doc.ohlcvHistory || []).slice(-days);
    res.json({ symbol, history });

    if (history.length === 0) {
      syncSymbolDetail(symbol).catch((err) =>
        console.warn(`[getHistory] bg sync failed ${symbol}:`, err.message)
      );
    }
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/technical/:symbol ────────────────────────────────────────

export const getTechnical = async (req, res, next) => {
  try {
    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const doc    = await getOrSyncSymbol(symbol);
    if (!doc) return res.status(404).json({ message: `Symbol ${symbol} not found` });

    let technicals;

    if (technicalsAreFresh(doc)) {
      technicals = doc.technicals;
    } else {
      technicals = analyzeSymbol(doc);
      MarketData.updateOne(
        { symbol },
        { $set: { "technicals.computedAt": new Date(), ...flattenTechnicals(technicals) } }
      ).catch(() => {});
    }

    const bollingerBands = technicals.bollingerBands || (
      technicals.bbUpper !== undefined && technicals.bbUpper !== null &&
      technicals.bbMiddle !== undefined && technicals.bbMiddle !== null &&
      technicals.bbLower !== undefined && technicals.bbLower !== null
        ? { upper: technicals.bbUpper, middle: technicals.bbMiddle, lower: technicals.bbLower }
        : null
    );

    const supportResistance = technicals.supportResistance || {
      support: technicals.supportLevel ?? null,
      resistance: technicals.resistanceLevel ?? null,
    };

    const techObj = typeof technicals.toObject === "function" ? technicals.toObject() : { ...technicals };

    res.json({
      symbol,
      currentPrice:  doc.ltp,
      change:        doc.change,
      changePercent: doc.changePercent,
      high52Week:    doc.high52Week,
      low52Week:     doc.low52Week,
      ...techObj,
      bollingerBands,
      supportResistance,
    });
  } catch (error) {
    next(error);
  }
};

function flattenTechnicals(t) {
  return {
    "technicals.rsi14":              t.rsi14,
    "technicals.macd":               t.macd,
    "technicals.macdSignal":         t.macdSignal,
    "technicals.macdHistogram":      t.macdHistogram,
    "technicals.sma20":              t.sma20,
    "technicals.sma50":              t.sma50,
    "technicals.ema20":              t.ema20,
    "technicals.bbUpper":            t.bbUpper,
    "technicals.bbMiddle":           t.bbMiddle,
    "technicals.bbLower":            t.bbLower,
    "technicals.supportLevel":       t.supportLevel,
    "technicals.resistanceLevel":    t.resistanceLevel,
    "technicals.trend":              t.trend,
    "technicals.signal":             t.signal,
    "technicals.accumulationSignal": t.accumulationSignal,
  };
}

// ─── GET /api/nepse/chart-series/:symbol ──────────────────────────────────────

export const getChartSeries = async (req, res, next) => {
  try {
    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const days   = Math.min(Number(req.query.days) || 180, 365);
    const doc    = await MarketData.findOne({ symbol }).select("symbol ohlcvHistory ltp");

    if (!doc) return res.status(404).json({ message: `Symbol ${symbol} not found` });

    const ohlcv = (doc.ohlcvHistory || []).slice(-days);

    if (ohlcv.length < 30) {
      return res.json({ symbol, message: "Insufficient history for series computation", ...emptySeriesShape() });
    }

    const series = computeChartSeries(ohlcv);
    res.json({ symbol, currentPrice: doc.ltp, ...series });
  } catch (error) {
    next(error);
  }
};

function emptySeriesShape() {
  return {
    dates: [], candles: [], volume: [],
    rsi: [], sma20: [], sma50: [], ema20: [],
    macdLine: [], macdSignal: [], macdHistogram: [],
    bbUpper: [], bbMiddle: [], bbLower: [],
  };
}

// ─── GET /api/nepse/index-history ─────────────────────────────────────────────

export const getIndexHistory = async (req, res, next) => {
  try {
    let days = Math.min(Number(req.query.days) || 90, 1825);

    const rangeMap = { "1D": 1, "1W": 5, "1M": 22, "3M": 66, "1Y": 252, "ALL": 1825 };
    if (req.query.range && rangeMap[req.query.range]) {
      days = rangeMap[req.query.range];
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const dbHistory = await IndexHistory.find({ date: { $gte: since } })
      .sort({ date: 1 })
      .select("date nepseIndex change changePercent turnover gainers losers")
      .lean();

    // Serve from DB only when we have a reasonable number of rows relative
    // to what was requested. If the DB is thin (fresh install, never backfilled),
    // fall through to the live NEPSE API so the chart always shows something.
    const minExpected = Math.min(days, 5); // at least 5 rows, or fewer if range is tiny
    if (dbHistory.length >= minExpected) {
      const formatted = dbHistory.map((row) => ({
        time:          row.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
        date:          row.date,
        value:         row.nepseIndex,
        change:        row.change,
        changePercent: row.changePercent,
        turnover:      row.turnover,
        gainers:       row.gainers,
        losers:        row.losers,
      }));
      return res.json(formatted);
    }

    console.warn(`[getIndexHistory] DB has only ${dbHistory.length} rows (need ${minExpected}) — falling back to live API`);
    const raw = await fetchNepseIndexGraph();
    if (!raw || !Array.isArray(raw)) return res.json([]);

    const adapted = raw
      .filter(Boolean)
      .map((point) => {
        const value   = parseFloat(point.close ?? point.index ?? point.value ?? point.c ?? 0);
        const dateStr = point.businessDate ?? point.date ?? point.d ?? point.tradeDate;
        let time = "";
        if (dateStr) {
          const d = new Date(dateStr);
          time = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        return { time, value };
      })
      .filter((p) => p.value > 0);

    res.json(adapted);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/index-history/breadth ─────────────────────────────────────

export const getIndexBreadth = async (req, res, next) => {
  try {
    const days  = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await IndexHistory.find({ date: { $gte: since } })
      .sort({ date: 1 })
      .select("date gainers losers unchanged nepseIndex")
      .lean();

    res.json(rows.map((r) => ({
      date:      r.date,
      time:      r.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      gainers:   r.gainers,
      losers:    r.losers,
      unchanged: r.unchanged,
      index:     r.nepseIndex,
    })));
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/status ────────────────────────────────────────────────────

export const getMarketStatus = async (req, res, next) => {
  try {
    const status = await getMarketOpenStatus();

    // ── Visitor-triggered EOD snapshot ────────────────────────────────────────
    // Fire-and-forget: if market is closed and DB is stale, sync in background.
    if (!(status?.isOpen)) {
      runEODSnapshotIfNeeded();
    }

    res.json(status ?? { isOpen: false, asOf: null });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/floorsheet ────────────────────────────────────────────────

export const getFloorsheet = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    if (checkRateLimit(ip, "floorsheet")) {
      return res.status(429).json({ message: "Too many requests — please wait a minute" });
    }

    const raw = await fetchFloorsheet();
    if (!raw) return res.json([]);

    const adapted = adaptFloorsheet(raw);
    const { symbol, limit = 100 } = req.query;
    const filtered = symbol ? adapted.filter((r) => r.symbol === symbol.toUpperCase()) : adapted;

    res.json(filtered.slice(0, Number(limit)));
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/market-depth/:symbol ──────────────────────────────────────

export const getMarketDepth = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    if (checkRateLimit(ip, "depth")) {
      return res.status(429).json({ message: "Too many requests — please wait a minute" });
    }

    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const raw = await fetchMarketDepth(symbol);
    res.json(raw || { symbol, bids: [], asks: [] });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/sub-indices ───────────────────────────────────────────────

export const getSubIndices = async (req, res, next) => {
  try {
    const docs = await IndexSnapshot.find({ key: { $ne: "NEPSE" } })
      .sort({ nepseIndex: -1 })
      .lean();
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/price-volume-history/:symbol ──────────────────────────────

export const getPriceVolumeHistory = async (req, res, next) => {
  try {
    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const days   = Math.min(Number(req.query.days) || 365, 365);
    const doc    = await MarketData.findOne({ symbol }).select("symbol pvHistory ohlcvHistory");

    if (!doc) return res.status(404).json({ message: `Symbol ${symbol} not found` });

    const ohlcv = (doc.ohlcvHistory || []).slice(-days);
    if (ohlcv.length > 0 && ohlcv.some((r) => r.turnover > 0)) {
      const pvHistory = ohlcv.map((r) => ({
        date: r.date, price: r.close, volume: r.volume, turnover: r.turnover,
      }));
      return res.json({ symbol, pvHistory });
    }

    const pvHistory = (doc.pvHistory || []).slice(-days);
    res.json({ symbol, pvHistory });

    if (pvHistory.length === 0) {
      fetchSecurityPriceVolumeHistory(symbol)
        .then(async (raw) => {
          const adapted = adaptPriceVolumeHistory(raw || []);
          if (adapted.length > 0) {
            await MarketData.updateOne({ symbol }, { $set: { pvHistory: adapted.slice(-365) } });
          }
        })
        .catch((err) => console.warn(`[getPriceVolumeHistory] bg fetch failed ${symbol}:`, err.message));
    }
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/today-volume-history ──────────────────────────────────────

export const getTodayVolumeHistory = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    if (checkRateLimit(ip, "today-volume")) {
      return res.status(429).json({ message: "Too many requests — please wait a minute" });
    }

    const raw     = await fetchTodaysPriceVolumeHistory();
    const adapted = adaptTodaysPriceVolumeHistory(raw || []);
    res.json(adapted);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/nepse/index-daily-graph (deprecated) ────────────────────────────

export const getIndexDailyGraphData = async (req, res, next) => {
  return getIndexHistory(req, res, next);
};

// ─── POST /api/nepse/sync/:symbol ────────────────────────────────────────────

export const triggerSymbolSync = async (req, res, next) => {
  try {
    const symbol = (req.params[0] ?? req.params.symbol).toUpperCase();
    const doc    = await syncSymbolDetail(symbol);
    if (!doc) return res.status(404).json({ message: `Sync failed for ${symbol}` });
    res.json({ message: `Synced ${symbol}`, ltp: doc.ltp, lastUpdated: doc.lastUpdated });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/nepse/backfill-sectors ────────────────────────────────────────

export const backfillSectors = async (req, res, next) => {
  try {
    const { backfillSectors: doBackfill } = await import("../utils/sectorNormalizer.js");
    const result = await doBackfill(MarketData);
    res.json({ message: "Sector backfill complete", ...result });
  } catch (error) {
    next(error);
  }
};
