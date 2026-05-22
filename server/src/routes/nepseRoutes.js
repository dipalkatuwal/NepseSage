/**
 * NepseSage — NEPSE API Routes  v2
 *
 * v2 changes:
 *  • /symbols kept as alias for /search (backward compat, same handler)
 *  • NEW: /chart-series/:symbol    — full indicator series for charting
 *  • NEW: /index-history/breadth   — advance/decline series
 *  • /index-daily-graph now delegates to /index-history (same data)
 *  • Rate limiting enforced in controller for live-fetch endpoints
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSummary,
  searchSymbols,
  getSymbols,          // alias for searchSymbols (backward compat)
  getSymbol,
  getGainers,
  getLosers,
  getTopTurnover,
  getHistory,
  getTechnical,
  getChartSeries,
  getSectors,
  getFloorsheet,
  getMarketDepth,
  getMarketStatus,
  triggerSymbolSync,
  getIndexHistory,
  getIndexBreadth,
  getSubIndices,
  backfillSectors,
  getPriceVolumeHistory,
  getTodayVolumeHistory,
  getIndexDailyGraphData,
} from "../controllers/nepseController.js";

const router = express.Router();

// ─── Market overview ──────────────────────────────────────────────────────────
router.get("/summary",              getSummary);
router.get("/status",               getMarketStatus);

// ─── Symbol search & listing ──────────────────────────────────────────────────
router.get("/search",               searchSymbols);
router.get("/symbols",              getSymbols);        // alias → same handler
router.get("/symbol/:symbol",       getSymbol);

// ─── Movers ───────────────────────────────────────────────────────────────────
router.get("/gainers",              getGainers);
router.get("/losers",               getLosers);
router.get("/turnover",             getTopTurnover);

// ─── Sector analysis ──────────────────────────────────────────────────────────
router.get("/sectors",              getSectors);

// ─── Price history (DB-backed) ────────────────────────────────────────────────
router.get("/history/:symbol",      getHistory);
router.get("/price-volume-history/:symbol", getPriceVolumeHistory);

// ─── Technical analysis ───────────────────────────────────────────────────────
// /technical    — latest indicator values (pre-computed at EOD, live fallback)
// /chart-series — full arrays for rendering multi-panel indicator charts (NEW)
router.get("/technical/:symbol",    getTechnical);
router.get("/chart-series/:symbol", getChartSeries);

// ─── Index history (DB time-series) ──────────────────────────────────────────
// /index-history?range=1M|3M|1Y|ALL  or  ?days=90
// /index-history/breadth              — advance/decline series (NEW)
// /index-daily-graph                  — deprecated alias (delegates to index-history)
router.get("/index-history/breadth", getIndexBreadth);
router.get("/index-history",         getIndexHistory);
router.get("/index-daily-graph",     getIndexDailyGraphData);

// ─── Sub-indices ──────────────────────────────────────────────────────────────
router.get("/sub-indices",          getSubIndices);

// ─── Live-fetch endpoints (rate-limited in controller) ───────────────────────
router.get("/floorsheet",           getFloorsheet);
router.get("/depth/:symbol",        getMarketDepth);
router.get("/today-volume-history", getTodayVolumeHistory);

// ─── Protected / admin (requires JWT) ────────────────────────────────────────
router.post("/sync/:symbol",        protect, triggerSymbolSync);
router.post("/backfill-sectors",    protect, backfillSectors);

export default router;
