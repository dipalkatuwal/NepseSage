/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              NepseSage — NEPSE Sync Service  v2                  ║
 * ║  Orchestrates the full pipeline:                                 ║
 * ║    Fetcher → Adapter → MongoDB upsert                            ║
 * ║                                                                  ║
 * ║  v2 upgrades:                                                    ║
 * ║  • appendIndexHistory() — accumulates IndexHistory daily rows    ║
 * ║  • syncTechnicals()     — pre-computes & stores all indicators   ║
 * ║  • mergeTurnoverIntoOHLCV() — unifies pvHistory into ohlcvHistory║
 * ║  • runStartupSync() rate-limited — no thundering herd on boot    ║
 * ║  • syncAllSymbolHistories() — full EOD history for all symbols   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import MarketData from "../models/MarketData.js";
import IndexSnapshot from "../models/IndexSnapshot.js";
import IndexHistory from "../models/IndexHistory.js";
import { normalizeSector } from "../utils/sectorNormalizer.js";
import { analyzeSymbol } from "../services/technicalAnalysis.js";
import {
  fetchAllSecurities,
  fetchSecurityDetail,
  fetchSecurityGraph,
  fetchSecurityPriceVolumeHistory,
  fetchNepseIndex,
  fetchNepseIndexGraph,
  fetchTopGainers,
  fetchTopLosers,
  fetchCompanyList,
  fetchSecurityList,
  fetchMarketStatus,
  fetchNepseSubIndices,
} from "./nepseFetcher.js";
import {
  adaptSecurityRow,
  adaptSecurityDetail,
  adaptOHLCVHistory,
  adaptPriceVolumeHistory,
  adaptMarketIndex,
  adaptMarketStatus,
} from "./nepseAdapter.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const HISTORY_BATCH_SIZE = 5;
const INTER_BATCH_DELAY_MS = 3000; // 3 s between batches — reduces NEPSE rate-limit hits

const PRIORITY_SYMBOLS = [
  "NABIL", "NTC", "NICA", "ADBL", "SCB", "EBL", "GBIME",
  "UPPER", "CHCL", "NHPC", "NLIC", "CIT",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** UTC midnight for today — used as the unique date key in IndexHistory. */
function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── Core upsert ──────────────────────────────────────────────────────────────

/**
 * Upserts one adapted security row into MarketData.
 * Price fields always updated; metadata only updated when non-empty.
 */
async function upsertSecurity(adaptedRow) {
  if (!adaptedRow?.symbol) return null;
  const { symbol, sector, companyName, companyEmail, website,
          regulatoryBody, instrumentType, isActive, ...priceFields } = adaptedRow;

  // After market close the NEPSE API still returns all symbols but with
  // volume=0 and turnover=0. Writing those zeros would wipe out the
  // session's turnover data that sector/summary queries rely on.
  // Only update volume and turnover when the incoming value is > 0.
  if ((priceFields.volume ?? 0) === 0)   delete priceFields.volume;
  if ((priceFields.turnover ?? 0) === 0) delete priceFields.turnover;

  const update = { $set: { symbol, ...priceFields, lastUpdated: new Date() } };

  const metaUpdate = {};
  if (companyName && companyName !== symbol)             metaUpdate.companyName    = companyName;
  if (sector && sector !== "Unknown" && sector !== "Others") metaUpdate.sector     = sector;
  if (companyEmail)   metaUpdate.companyEmail   = companyEmail;
  if (website)        metaUpdate.website        = website;
  if (regulatoryBody) metaUpdate.regulatoryBody = regulatoryBody;
  if (instrumentType) metaUpdate.instrumentType = instrumentType;
  if (typeof isActive === "boolean") metaUpdate.isActive = isActive;
  // Fundamental fields — only overwrite when the adapter returned real values
  if (adaptedRow.listingDate)                                metaUpdate.listingDate           = adaptedRow.listingDate;
  if ((adaptedRow.totalListedShares ?? 0) > 0)              metaUpdate.totalListedShares     = adaptedRow.totalListedShares;
  if ((adaptedRow.totalPaidUpValue ?? 0) > 0)               metaUpdate.totalPaidUpValue      = adaptedRow.totalPaidUpValue;
  if ((adaptedRow.marketCapitalization ?? 0) > 0)           metaUpdate.marketCapitalization  = adaptedRow.marketCapitalization;

  if (Object.keys(metaUpdate).length > 0) {
    update.$set = { ...update.$set, ...metaUpdate };
  }

  return MarketData.findOneAndUpdate({ symbol }, update, { upsert: true, returnDocument: "after" });
}

// ─── Full price sync ──────────────────────────────────────────────────────────

export async function syncAllPrices() {

  const raw = await fetchAllSecurities();
  if (!raw || raw.length === 0) {
    console.warn("⚠️  [SyncService] No securities returned — skipping sync");
    return { synced: 0, failed: 0 };
  }

  // Extract all symbols returned in this sync to identify today's active traded set
  const activeSymbols = raw
    .map((row) => (row.symbol || row.securitySymbol || "").toUpperCase().trim())
    .filter(Boolean);

  let synced = 0, failed = 0;
  for (const row of raw) {
    try {
      const adapted = adaptSecurityRow(row);
      if (adapted?.symbol) { await upsertSecurity(adapted); synced++; }
    } catch (err) {
      failed++;
      console.error(`❌ [SyncService] upsert failed ${row?.symbol}:`, err.message);
    }
  }

  // ─── Reset INTRADAY-only fields for symbols absent from today's live feed ──
  //
  // IMPORTANT: Only zero out change/changePercent/volume/turnover — these are
  // session-specific metrics that should be 0 for a stock that didn't trade today.
  //
  // DO NOT zero ltp or previousClose. A stock that traded last week at NPR 500
  // and didn't trade today still has ltp = 500 — that is its last valid price.
  // Zeroing ltp would make the stock look like it has no price at all.
  //
  // GUARD: Only run this reset when the market actually returned live data
  // (activeSymbols.length > 0). If getLiveMarket() returned empty because
  // the market is closed, we skip the reset entirely — otherwise every stock
  // would be zeroed overnight/on weekends/after a multi-day gap.
  if (activeSymbols.length > 50) {
    // Threshold of 50 guards against a partial/empty response from NEPSE
    // being mistakenly treated as "no stocks traded today".
    // On a real trading day, NEPSE lists 200+ securities.
    try {
      const resetResult = await MarketData.updateMany(
        {
          isActive: true,
          symbol: { $nin: activeSymbols },
          // Only reset symbols that were traded recently (volume > 0),
          // to avoid touching already-clean non-trading-day records.
          volume: { $gt: 0 },
        },
        {
          $set: {
            change: 0,
            changePercent: 0,
            volume: 0,
            turnover: 0,
            // ltp and previousClose are intentionally NOT reset here.
            // They hold the last valid traded price across sessions.
            lastUpdated: new Date(),
          },
        }
      );
      if (resetResult.modifiedCount > 0) {
        console.log(`🧹 [SyncService] Reset intraday fields for ${resetResult.modifiedCount} non-traded symbols (ltp preserved)`);
      }
    } catch (err) {
      console.error("❌ [SyncService] Failed to reset non-traded symbols:", err.message);
    }
  } else {
    console.warn(`⚠️  [SyncService] syncAllPrices — only ${activeSymbols.length} symbols returned from NEPSE; skipping non-traded reset (market may be closed or partial response)`);
  }

  console.log(`✅ [SyncService] syncAllPrices — synced: ${synced}, failed: ${failed}`);
  return { synced, failed };
}

// ─── Index snapshot sync ──────────────────────────────────────────────────────

export async function syncIndexSnapshot() {
  const raw = await fetchNepseIndex();
  if (!raw) return null;

  const adapted = adaptMarketIndex(raw);
  if (!adapted) return null;

  // Build the update — always refresh index/change fields, but only update
  // turnover and totalVolume when the API returns non-zero values.
  // After market close the NEPSE API returns 0s for these fields, which
  // would wipe out the confirmed EOD totals saved by appendIndexHistory().
  const updateFields = {
    key:               "NEPSE",
    nepseIndex:        adapted.nepseIndex,
    change:            adapted.change,
    changePercent:     adapted.changePercent,
    totalTransactions: adapted.totalTransactions,
    asOf:              adapted.asOf,
    savedAt:           new Date(),
  };
  if ((adapted.turnover || 0) > 0)     updateFields.turnover    = adapted.turnover;
  if ((adapted.totalVolume || 0) > 0)  updateFields.totalVolume = adapted.totalVolume;

  await IndexSnapshot.findOneAndUpdate(
    { key: "NEPSE" },
    { $set: updateFields },
    { upsert: true, returnDocument: "after" }
  );

  return adapted;
}

// ─── Append confirmed EOD row to IndexHistory ────────────────────────────────

/**
 * Saves today's CONFIRMED end-of-day index data to IndexHistory.
 *
 * ONLY called from the 15:30 NPT EOD cron — never from startup.
 * This guarantees the row always contains the real closing value,
 * not a mid-session or stale snapshot.
 *
 * Advance/decline counts are read from MarketData at the same moment,
 * so they reflect the final session breadth.
 */
export async function appendIndexHistory() {
  const raw = await fetchNepseIndex();
  if (!raw) {
    console.warn("⚠️  [SyncService] appendIndexHistory — no index data");
    return null;
  }

  const adapted = adaptMarketIndex(raw);
  if (!adapted) return null;

  // Real A/D/U from the live MarketData collection (no extra API call)
  // Only include companies that were actually traded (volume > 0) to avoid stale/delisted data
  const [gainers, losers, unchanged] = await Promise.all([
    MarketData.countDocuments({ isActive: true, volume: { $gt: 0 }, changePercent: { $gt: 0 } }),
    MarketData.countDocuments({ isActive: true, volume: { $gt: 0 }, changePercent: { $lt: 0 } }),
    MarketData.countDocuments({ isActive: true, volume: { $gt: 0 }, changePercent: 0 }),
  ]);

  const today = todayUTC();

  const doc = await IndexHistory.findOneAndUpdate(
    { date: today },
    {
      $set: {
        date: today,
        nepseIndex:        adapted.nepseIndex,
        change:            adapted.change,
        changePercent:     adapted.changePercent,
        turnover:          adapted.turnover,
        totalVolume:       adapted.totalVolume,
        totalTransactions: adapted.totalTransactions,
        asOf:              adapted.asOf,
        gainers,
        losers,
        unchanged,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`✅ [SyncService] appendIndexHistory — index ${adapted.nepseIndex} saved for ${today.toDateString()}`);
  return doc;
}

// ─── Backfill IndexHistory from NEPSE daily graph ────────────────────────────

/**
 * Recovers missing IndexHistory rows for days the server was down.
 * Uses getNepseIndexDailyGraph() which returns historical daily index values.
 *
 * Called from runStartupSync() when missedDays > 0.
 * Safe to call multiple times — uses upsert so existing rows are never overwritten.
 */
export async function backfillIndexHistory() {

  const raw = await fetchNepseIndexGraph();
  if (!Array.isArray(raw) || raw.length === 0) {
    console.warn("⚠️  [SyncService] backfillIndexHistory — no graph data returned");
    return;
  }

  let inserted = 0, skipped = 0;

  for (const row of raw) {
    try {
      // Parse the date — graph returns businessDate or d field
      const rawDate = row.businessDate || row.d || row.date;
      if (!rawDate) { skipped++; continue; }

      const date = new Date(rawDate);
      date.setUTCHours(0, 0, 0, 0);
      if (isNaN(date.getTime())) { skipped++; continue; }

      // Skip today — today's row must only come from the confirmed EOD cron
      const todayMidnight = todayUTC();
      if (date.getTime() === todayMidnight.getTime()) { skipped++; continue; }

      const nepseIndex    = parseFloat(row.closingIndex ?? row.currentValue ?? row.value ?? row.c ?? 0);
      const change        = parseFloat(row.change ?? 0);
      const changePercent = parseFloat(row.perChange ?? row.percentageChange ?? 0);
      const turnover      = parseFloat(row.turnOver ?? row.totalTurnover ?? row.turnover ?? 0);
      const totalVolume   = parseFloat(row.totalTradedShares ?? row.totalVolume ?? row.volume ?? 0);

      if (nepseIndex <= 0) { skipped++; continue; }

      // upsert — never overwrite a row that already has good data
      const existing = await IndexHistory.findOne({ date });
      if (existing && existing.nepseIndex > 0) { skipped++; continue; }

      await IndexHistory.findOneAndUpdate(
        { date },
        {
          $set: {
            date, nepseIndex, change, changePercent,
            turnover, totalVolume,
            asOf: rawDate,
          },
        },
        { upsert: true }
      );
      inserted++;
    } catch (err) {
      console.warn("⚠️  [SyncService] backfillIndexHistory row failed:", err.message);
    }
  }

  console.log(`✅ [SyncService] backfillIndexHistory — inserted: ${inserted}, skipped: ${skipped}`);
}

// ─── Sub-indices sync ─────────────────────────────────────────────────────────

export async function syncSubIndices() {
  const raw = await fetchNepseSubIndices();
  if (!raw || !Array.isArray(raw)) {
    console.warn("⚠️  [SyncService] syncSubIndices — no data");
    return { synced: 0 };
  }

  let synced = 0;
  for (const item of raw) {
    try {
      const key = (item.index || item.indexName || item.name || "").trim();
      if (!key) continue;

      // Only overwrite turnover/totalVolume when the API returns non-zero values.
      // Post-close the sub-index API returns 0s for these fields; writing them
      // would wipe out the confirmed session totals we rely on for the sector fallback.
      const incomingTurnover    = parseFloat(item.totalTurnover ?? item.turnover ?? 0);
      const incomingTotalVolume = parseFloat(item.totalVolume ?? item.volume ?? 0);

      const setFields = {
        key,
        nepseIndex:    parseFloat(item.currentValue ?? item.indexValue ?? item.value ?? 0),
        change:        parseFloat(item.absoluteChange ?? item.change ?? 0),
        changePercent: parseFloat(item.percentageChange ?? item.changePercent ?? 0),
        asOf:          item.asOf ?? item.date ?? new Date().toISOString(),
        savedAt:       new Date(),
      };
      if (incomingTurnover    > 0) setFields.turnover    = incomingTurnover;
      if (incomingTotalVolume > 0) setFields.totalVolume = incomingTotalVolume;

      await IndexSnapshot.findOneAndUpdate(
        { key },
        { $set: setFields },
        { upsert: true, returnDocument: "after" }
      );
      synced++;
    } catch (err) {
      console.warn("⚠️  [SyncService] syncSubIndices upsert failed:", err.message);
    }
  }

  console.log(`✅ [SyncService] syncSubIndices — ${synced}/${raw.length} saved`);
  return { synced };
}

// ─── Market status ────────────────────────────────────────────────────────────

export async function getMarketOpenStatus() {
  const raw = await fetchMarketStatus();
  return adaptMarketStatus(raw);
}

// ─── Single symbol deep sync ──────────────────────────────────────────────────

const activeSyncs = new Map();

export async function syncSymbolDetail(symbol) {
  const sym = symbol.toUpperCase().trim();
  if (activeSyncs.has(sym)) return activeSyncs.get(sym);

  const syncPromise = (async () => {
    try {

      const [rawDetail, rawGraph, rawPvHistory] = await Promise.all([
        fetchSecurityDetail(sym),
        fetchSecurityGraph(sym),
        fetchSecurityPriceVolumeHistory(sym),
      ]);

      if (!rawDetail) {
        console.warn(`⚠️  [SyncService] No detail for ${sym}`);
        return null;
      }

      const adapted = adaptSecurityDetail(rawDetail);
      const ohlcvHistory = adaptOHLCVHistory(rawGraph || []);
      const pvHistory = adaptPriceVolumeHistory(rawPvHistory || []);

      // Merge turnover from pvHistory into ohlcvHistory
      const pvMap = new Map(pvHistory.map((p) => [p.date.toDateString(), p.turnover]));
      ohlcvHistory.forEach((row) => {
        const key = row.date.toDateString();
        if (pvMap.has(key)) row.turnover = pvMap.get(key);
      });

      // Enrich sector/name from nested detail structure
      const deepSector = rawDetail?.security?.companyId?.sectorMaster?.sectorDescription;
      if (deepSector && adapted) adapted.sector = normalizeSector(deepSector);

      const deepName = rawDetail?.security?.companyId?.companyName;
      if (deepName && adapted && (!adapted.companyName || adapted.companyName === adapted.symbol)) {
        adapted.companyName = deepName;
      }

      const doc = await MarketData.findOneAndUpdate(
        { symbol: sym },
        {
          $set: {
            ...adapted,
            ohlcvHistory: ohlcvHistory.slice(-365),
            pvHistory:    pvHistory.slice(-365),
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      // individual symbol logs suppressed — caller logs summary
      return doc;
    } catch (err) {
      console.error(`❌ [SyncService] syncSymbolDetail — ${sym}:`, err.message);
      throw err;
    } finally {
      activeSyncs.delete(sym);
    }
  })();

  activeSyncs.set(sym, syncPromise);
  return syncPromise;
}

// ─── Priority history sync ────────────────────────────────────────────────────

export async function syncPriorityHistories() {
  let ok = 0, fail = 0;
  for (let i = 0; i < PRIORITY_SYMBOLS.length; i += HISTORY_BATCH_SIZE) {
    const batch = PRIORITY_SYMBOLS.slice(i, i + HISTORY_BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((sym) => syncSymbolDetail(sym)));
    results.forEach((r) => (r.status === "fulfilled" && r.value ? ok++ : fail++));
    await sleep(INTER_BATCH_DELAY_MS);
  }
  const failNote = fail > 0 ? `, ${fail} failed` : "";
  console.log(`✅ [SyncService] Priority histories — ${ok}/${PRIORITY_SYMBOLS.length} synced${failNote}`);
}

// ─── NEW: Full EOD history sync for ALL active symbols ────────────────────────

/**
 * Syncs OHLCV history for every active symbol in the DB.
 * Run at end-of-day so tomorrow's charts are pre-populated.
 * Batched at HISTORY_BATCH_SIZE with delays to avoid NEPSE rate-limiting.
 *
 * @returns {{ synced: number, failed: number, skipped: number }}
 */
export async function syncAllSymbolHistories() {
  const symbols = await MarketData.find({ isActive: true }).select("symbol").lean();
  console.log(`🔄 [SyncService] Backfilling OHLCV for ${symbols.length} symbols...`);

  let synced = 0, failed = 0;

  for (let i = 0; i < symbols.length; i += HISTORY_BATCH_SIZE) {
    const batch = symbols.slice(i, i + HISTORY_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((s) => syncSymbolDetail(s.symbol))
    );
    results.forEach((r, idx) => {
      if (r.status === "fulfilled" && r.value) synced++;
      else { failed++; console.warn(`⚠️  History sync failed for ${batch[idx].symbol}`); }
    });

    // Progress log every 50 symbols
    if ((i + HISTORY_BATCH_SIZE) % 50 === 0 || i + HISTORY_BATCH_SIZE >= symbols.length) {
      const done = Math.min(i + HISTORY_BATCH_SIZE, symbols.length);
      console.log(`  ↳ OHLCV backfill ${done}/${symbols.length}`);
    }

    await sleep(INTER_BATCH_DELAY_MS);
  }

  console.log(`✅ [SyncService] OHLCV backfill — ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

// ─── NEW: EOD technical indicator pre-computation ─────────────────────────────

/**
 * Pre-computes RSI, MACD, SMA, Bollinger Bands for every symbol that has
 * enough history (≥ 30 data points) and stores results in MarketData.technicals.
 *
 * This moves indicator computation off the hot API path — /technical/:symbol
 * now serves pre-computed values from DB instead of recalculating live.
 *
 * @returns {{ computed: number, skipped: number }}
 */
export async function syncTechnicals() {

  // Only fetch documents that have history
  const docs = await MarketData.find({
    isActive: true,
    "ohlcvHistory.0": { $exists: true },
  }).select("symbol ohlcvHistory").lean();

  let computed = 0, skipped = 0;

  for (const doc of docs) {
    try {
      if ((doc.ohlcvHistory || []).length < 30) { skipped++; continue; }

      const indicators = analyzeSymbol(doc);

      await MarketData.updateOne(
        { symbol: doc.symbol },
        {
          $set: {
            technicals: {
              rsi14:              indicators.rsi14,
              macd:               indicators.macd,
              macdSignal:         indicators.macdSignal,
              macdHistogram:      indicators.macdHistogram,
              sma20:              indicators.sma20,
              sma50:              indicators.sma50,
              ema20:              indicators.ema20,
              bbUpper:            indicators.bbUpper,
              bbMiddle:           indicators.bbMiddle,
              bbLower:            indicators.bbLower,
              supportLevel:       indicators.supportLevel,
              resistanceLevel:    indicators.resistanceLevel,
              trend:              indicators.trend,
              signal:             indicators.signal,
              accumulationSignal: indicators.accumulationSignal,
              computedAt:         new Date(),
            },
          },
        }
      );
      computed++;
    } catch (err) {
      console.warn(`⚠️  [SyncService] syncTechnicals failed for ${doc.symbol}:`, err.message);
    }
  }

  console.log(`✅ [SyncService] syncTechnicals — computed: ${computed}, skipped (insufficient data): ${skipped}`);
  return { computed, skipped };
}

// ─── Company list seed ────────────────────────────────────────────────────────

export async function seedCompanyMaster() {

  let rawList = await fetchCompanyList();
  if (!rawList || rawList.length === 0) {
    console.warn("⚠️  [SyncService] fetchCompanyList empty — trying fetchSecurityList");
    rawList = await fetchSecurityList();
  }
  if (!rawList || rawList.length === 0) {
    console.warn("⚠️  [SyncService] Both lists empty — skipping seed");
    return;
  }

  let inserted = 0;

  for (const co of rawList) {
    try {
      const symbol = (co.symbol || co.ticker || co.securityShortName || "").toUpperCase().trim();
      if (!symbol) continue;
      const name = co.companyName || co.securityName || co.name || symbol;
      const sector = normalizeSector(co.sectorName || co.businessSector || co.industryGroupName || "");
      const isActive = (co.status || "A") !== "D";

      await MarketData.findOneAndUpdate(
        { symbol },
        {
          $setOnInsert: {
            symbol, ltp: 0, change: 0, changePercent: 0,
            volume: 0, turnover: 0, lastUpdated: new Date(),
          },
          $set: {
            companyName: name, sector, isActive,
            companyEmail:  co.companyEmail  || "",
            website:       co.website       || "",
            regulatoryBody: co.regulatoryBody || "",
            instrumentType: co.instrumentType || co.securityType || "",
            status:        co.status || "A",
          },
        },
        { upsert: true }
      );
      inserted++;
    } catch (err) {
      console.warn("⚠️  [SyncService] seedCompanyMaster upsert failed:", err.message);
    }
  }

  const total = await MarketData.countDocuments();
  console.log(`✅ [SyncService] Company master — ${inserted}/${rawList.length} processed, ${total} total in DB`);
}

// ─── Full startup sync — rate-limited ─────────────────────────────────────────

/**
 * Returns the number of NEPSE trading days (Sun–Thu) that have passed
 * since the given date, not counting today.
 *
 * Used to detect how many sessions were missed while the server was down.
 */
function missedTradingDays(sinceDate) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  let count = 0;
  const cursor = new Date(sinceDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const todayUTCMidnight = new Date();
  todayUTCMidnight.setUTCHours(0, 0, 0, 0);

  cursor.setUTCDate(cursor.getUTCDate() + 1); // start from the day AFTER last sync
  while (cursor < todayUTCMidnight) {
    const dow = cursor.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
    if (dow >= 0 && dow <= 4) count++; // NEPSE: Sun(0)–Thu(4)
    cursor.setTime(cursor.getTime() + MS_PER_DAY);
  }
  return count;
}

/**
 * Checks whether the DB has valid price data from within the last 7 days,
 * and how many trading days have been missed since the last sync.
 *
 * Returns { fresh: boolean, missedDays: number, lastUpdated: Date|null }
 */
async function checkDBState() {
  try {
    const latest = await MarketData.findOne({ isActive: true, ltp: { $gt: 0 } })
      .sort({ lastUpdated: -1 })
      .select("lastUpdated symbol ltp")
      .lean();

    if (!latest) return { fresh: false, missedDays: 0, lastUpdated: null };

    const lastUpdated = new Date(latest.lastUpdated);
    const ageDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const missed = missedTradingDays(lastUpdated);

    console.log(`📊 [SyncService] DB state — last sync: ${lastUpdated.toDateString()}, age: ${ageDays.toFixed(1)}d, missed trading days: ${missed}`);

    return {
      fresh: ageDays < 7,
      missedDays: missed,
      lastUpdated,
    };
  } catch (err) {
    console.warn("⚠️  [SyncService] checkDBState failed:", err.message);
    return { fresh: false, missedDays: 0, lastUpdated: null };
  }
}

/**
 * Run once on server startup.
 *
 * Rules:
 *   - appendIndexHistory() is NEVER called here — it must only run at EOD
 *     (15:30 cron) so it always contains confirmed closing data, not a
 *     mid-session or stale value.
 *   - syncIndexSnapshot() is NOT called here — it is only meaningful during
 *     market hours. Outside market hours it just writes stale data.
 *
 * Strategy:
 *   1. Seed company master (safe, additive).
 *   2. Market OPEN  → syncAllPrices() (live data available, reset is safe).
 *      Market CLOSED + DB stale → syncAllPrices() (data too old to trust).
 *      Market CLOSED + DB fresh → skip syncAllPrices() — getLiveMarket()
 *        returns empty data which would zero all LTPs.
 *   3. Missed trading days → backfill:
 *        - syncAllSymbolHistories() restores OHLCV candles from getSecurityDailyGraph()
 *        - backfillIndexHistory() restores index rows from getNepseIndexDailyGraph()
 *        - syncTechnicals() recomputes RSI/MACD/BB from restored history
 *   4. Priority histories — always, so top symbols have fast chart loads.
 */
export async function runStartupSync() {
  console.log("🚀 [SyncService] Running startup sync...");
  try {
    await seedCompanyMaster();
    await sleep(2000);

    const [marketStatus, dbState] = await Promise.all([
      getMarketOpenStatus(),
      checkDBState(),
    ]);

    const isMarketOpen = marketStatus?.isOpen ?? false;
    console.log(`📊 [SyncService] Market is ${isMarketOpen ? "OPEN" : "CLOSED"}, DB is ${dbState.fresh ? "FRESH" : "STALE"}, missed days: ${dbState.missedDays}`);

    // ── Step 2: Live price sync ───────────────────────────────────────────────
    if (isMarketOpen || !dbState.fresh) {
      await syncAllPrices();
      await sleep(1000);
    } else {
      console.log("⏸️  [SyncService] Skipping syncAllPrices — market closed, existing prices are valid");
    }

    // ── Step 3: Backfill any missed trading days ──────────────────────────────
    if (dbState.missedDays > 0) {
      console.log(`📅 [SyncService] Backfilling ${dbState.missedDays} missed trading day(s)...`);
      await syncAllSymbolHistories();   // OHLCV candles from getSecurityDailyGraph()
      await backfillIndexHistory();     // Index rows from getNepseIndexDailyGraph()
      await syncTechnicals();           // Recompute RSI/MACD/BB from restored data
      console.log("✅ [SyncService] Backfill complete");
    }

    // ── Step 4: Priority histories ────────────────────────────────────────────
    await syncPriorityHistories();

    console.log("✅ [SyncService] Startup sync complete");
  } catch (err) {
    console.error("❌ [SyncService] Startup sync error:", err.message);
  }
}