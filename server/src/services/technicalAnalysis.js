/**
 * Technical Analysis Engine
 * Computes RSI, MACD, SMA, EMA, Bollinger Bands, Support/Resistance from OHLCV data.
 *
 * UPGRADE v2:
 *   - Fixed O(n²) MACD: now uses incremental EMA — O(n) single pass
 *   - Added computeFullSeries() — returns complete indicator series for chart rendering
 *     (each function now has a "latest value" variant and a "full series" variant)
 *   - Added EMA-20 computation
 *   - Added VWAP (intraday) stub for future use
 */

// ─── Core primitives ──────────────────────────────────────────────────────────

/**
 * Simple Moving Average — latest value only.
 */
export const sma = (values, period) => {
  if (!values || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

/**
 * SMA series — returns an array of length = values.length
 * (first `period-1` entries are null, then the rolling average).
 */
export const smaSeries = (values, period) => {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
};

/**
 * Exponential Moving Average — INCREMENTAL O(n), not O(n²).
 * Seeded with SMA of the first `period` values, then applies the
 * multiplier forward. Returns the final EMA value.
 */
export const ema = (values, period) => {
  if (!values || values.length < period) return null;
  const k = 2 / (period + 1);
  // Seed: SMA of first `period` values
  let emaVal = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k);
  }
  return emaVal;
};

/**
 * EMA series — returns array of length = values.length.
 * First `period-1` entries are null, then rolling EMA using incremental update.
 */
export const emaSeries = (values, period) => {
  const result = new Array(values.length).fill(null);
  if (values.length < period) return result;

  const k = 2 / (period + 1);
  // Seed with SMA of first window
  let current = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = current;

  for (let i = period; i < values.length; i++) {
    current = values[i] * k + current * (1 - k);
    result[i] = current;
  }
  return result;
};

// ─── RSI ──────────────────────────────────────────────────────────────────────

/**
 * RSI (14-period standard) — returns latest value only.
 */
export const rsi = (closes, period = 14) => {
  if (!closes || closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
  }

  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
};

/**
 * RSI series — returns array of length = closes.length.
 * Uses Wilder's smoothing (same as rsi() above).
 */
export const rsiSeries = (closes, period = 14) => {
  const result = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
};

// ─── MACD — O(n) incremental ──────────────────────────────────────────────────

/**
 * MACD — returns { macd, signal, histogram } for the latest bar.
 * FIXED: uses incremental EMA (O(n)) instead of the old O(n²) full recompute.
 */
export const macd = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!closes || closes.length < slowPeriod + signalPeriod) return null;

  const fastEmas = emaSeries(closes, fastPeriod);
  const slowEmas = emaSeries(closes, slowPeriod);

  // MACD line = fastEMA - slowEMA (only where both are non-null)
  const macdLine = closes.map((_, i) => {
    if (fastEmas[i] === null || slowEmas[i] === null) return null;
    return fastEmas[i] - slowEmas[i];
  });

  // Signal = EMA of MACD line (using only non-null values)
  const validMacd = macdLine.filter((v) => v !== null);
  if (validMacd.length < signalPeriod) return null;

  const signalVal = ema(validMacd, signalPeriod);
  const macdVal = macdLine[macdLine.length - 1];

  if (macdVal === null || signalVal === null) return null;

  return {
    macd: parseFloat(macdVal.toFixed(2)),
    signal: parseFloat(signalVal.toFixed(2)),
    histogram: parseFloat((macdVal - signalVal).toFixed(2)),
  };
};

/**
 * MACD series — returns { macdLine, signalLine, histogram } arrays.
 * All arrays have length = closes.length; leading entries are null.
 * Used for charting the full MACD indicator panel.
 */
export const macdSeries = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const n = closes.length;
  const empty = () => new Array(n).fill(null);

  if (n < slowPeriod + signalPeriod) {
    return { macdLine: empty(), signalLine: empty(), histogram: empty() };
  }

  const fastEmas = emaSeries(closes, fastPeriod);
  const slowEmas = emaSeries(closes, slowPeriod);

  // Build MACD line
  const macdLine = closes.map((_, i) => {
    if (fastEmas[i] === null || slowEmas[i] === null) return null;
    return parseFloat((fastEmas[i] - slowEmas[i]).toFixed(4));
  });

  // Build signal line: EMA of MACD line (incremental, ignoring nulls)
  const signalLine = new Array(n).fill(null);
  const firstValidIdx = macdLine.findIndex((v) => v !== null);
  const macdValues = macdLine.slice(firstValidIdx).filter((v) => v !== null);

  if (macdValues.length >= signalPeriod) {
    const k = 2 / (signalPeriod + 1);
    let sigEma = macdValues.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;

    // Find the index in macdLine corresponding to signalPeriod-th valid value
    let validCount = 0;
    for (let i = firstValidIdx; i < n; i++) {
      if (macdLine[i] === null) continue;
      validCount++;
      if (validCount < signalPeriod) continue;
      if (validCount === signalPeriod) {
        signalLine[i] = parseFloat(sigEma.toFixed(4));
      } else {
        sigEma = macdLine[i] * k + sigEma * (1 - k);
        signalLine[i] = parseFloat(sigEma.toFixed(4));
      }
    }
  }

  // Histogram = MACD - Signal
  const histogram = macdLine.map((m, i) => {
    if (m === null || signalLine[i] === null) return null;
    return parseFloat((m - signalLine[i]).toFixed(4));
  });

  return { macdLine, signalLine, histogram };
};

// ─── Bollinger Bands ──────────────────────────────────────────────────────────

export const bollingerBands = (closes, period = 20, stdDev = 2) => {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper:  parseFloat((middle + stdDev * std).toFixed(2)),
    middle: parseFloat(middle.toFixed(2)),
    lower:  parseFloat((middle - stdDev * std).toFixed(2)),
  };
};

/**
 * Bollinger Bands series — { upper, middle, lower } arrays of length n.
 */
export const bollingerBandsSeries = (closes, period = 20, stdDev = 2) => {
  const n = closes.length;
  const upper  = new Array(n).fill(null);
  const middle = new Array(n).fill(null);
  const lower  = new Array(n).fill(null);

  for (let i = period - 1; i < n; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / period;
    const std = Math.sqrt(variance);
    middle[i] = parseFloat(avg.toFixed(2));
    upper[i]  = parseFloat((avg + stdDev * std).toFixed(2));
    lower[i]  = parseFloat((avg - stdDev * std).toFixed(2));
  }

  return { upper, middle, lower };
};

// ─── Support & Resistance ─────────────────────────────────────────────────────

export const supportResistance = (ohlcv, lookback = 20) => {
  if (!ohlcv || ohlcv.length < lookback) return { support: null, resistance: null };

  const recent = ohlcv.slice(-lookback);
  const highs = recent.map((c) => c.high);
  const lows  = recent.map((c) => c.low);

  const pivotHighs = [];
  const pivotLows  = [];

  for (let i = 2; i < recent.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      pivotHighs.push(highs[i]);
    }
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      pivotLows.push(lows[i]);
    }
  }

  return {
    support:    pivotLows.length  > 0 ? Math.max(...pivotLows)  : Math.min(...lows),
    resistance: pivotHighs.length > 0 ? Math.min(...pivotHighs) : Math.max(...highs),
  };
};

// ─── Trend detection ──────────────────────────────────────────────────────────

export const detectTrend = (closes, period = 20) => {
  if (!closes || closes.length < period) return "sideways";
  const s = sma(closes.slice(-period), period);
  const recentAvg = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  if (recentAvg > s * 1.02) return "bullish";
  if (recentAvg < s * 0.98) return "bearish";
  return "sideways";
};

// ─── Accumulation/Distribution ────────────────────────────────────────────────

export const accumulationSignal = (ohlcv) => {
  if (!ohlcv || ohlcv.length < 10) return "neutral";
  const recent = ohlcv.slice(-10);
  let accumDays = 0;
  let distribDays = 0;
  recent.forEach((day) => {
    const range = day.high - day.low || 1;
    const clv = ((day.close - day.low) - (day.high - day.close)) / range;
    if (clv > 0.3 && day.volume > 0) accumDays++;
    if (clv < -0.3 && day.volume > 0) distribDays++;
  });
  if (accumDays > distribDays + 2) return "accumulation";
  if (distribDays > accumDays + 2) return "distribution";
  return "neutral";
};

// ─── Full single-symbol analysis (for API response + DB storage) ──────────────

/**
 * analyzeSymbol — computes all indicators from a MarketData document.
 * Returns a flat object suitable for merging into MarketData.technicals.
 *
 * Called by:
 *   - getTechnical endpoint (on-demand, cached in DB for today)
 *   - syncTechnicals (EOD batch — populates all active symbols)
 */
export const analyzeSymbol = (marketData) => {
  const ohlcv   = marketData.ohlcvHistory || [];
  const closes  = ohlcv.map((c) => c.close).filter(Boolean);

  if (closes.length < 30) {
    return {
      rsi14: null, macd: null, sma20: null, sma50: null,
      ema20: null, bollingerBands: null,
      supportResistance: { support: null, resistance: null },
      trend: "unknown", signal: "insufficient data",
      accumulationSignal: "neutral",
    };
  }

  const rsiValue  = rsi(closes);
  const macdValue = macd(closes);           // O(n) now
  const sma20Val  = sma(closes, 20);
  const sma50Val  = sma(closes, 50);
  const ema20Val  = ema(closes, 20);
  const bb        = bollingerBands(closes);
  const sr        = supportResistance(ohlcv);
  const trend     = detectTrend(closes);
  const accum     = accumulationSignal(ohlcv);

  let bullishSignals = 0;
  let bearishSignals = 0;

  if (rsiValue !== null) {
    if (rsiValue < 30) bullishSignals++;
    if (rsiValue > 70) bearishSignals++;
  }
  if (macdValue) {
    if (macdValue.histogram > 0) bullishSignals++;
    if (macdValue.histogram < 0) bearishSignals++;
  }
  if (trend === "bullish") bullishSignals++;
  if (trend === "bearish") bearishSignals++;
  if (accum === "accumulation") bullishSignals++;
  if (accum === "distribution") bearishSignals++;

  const signal =
    bullishSignals >= 3 ? "bullish" :
    bearishSignals >= 3 ? "bearish" : "neutral";

  return {
    rsi14:              rsiValue  ? parseFloat(rsiValue.toFixed(2))       : null,
    macd:               macdValue?.macd     ?? null,
    macdSignal:         macdValue?.signal   ?? null,
    macdHistogram:      macdValue?.histogram ?? null,
    sma20:              sma20Val  ? parseFloat(sma20Val.toFixed(2))        : null,
    sma50:              sma50Val  ? parseFloat(sma50Val.toFixed(2))        : null,
    ema20:              ema20Val  ? parseFloat(ema20Val.toFixed(2))        : null,
    bbUpper:            bb?.upper  ?? null,
    bbMiddle:           bb?.middle ?? null,
    bbLower:            bb?.lower  ?? null,
    supportLevel:       sr.support,
    resistanceLevel:    sr.resistance,
    trend,
    signal,
    accumulationSignal: accum,
    bollingerBands:     bb,
    supportResistance:  sr,
  };
};

/**
 * computeChartSeries — returns complete indicator series arrays suitable for
 * rendering multi-panel charts on the frontend (candlestick + RSI + MACD).
 *
 * Called by the /api/nepse/chart-series/:symbol endpoint.
 * Each array has the same length as ohlcvHistory, with null for leading entries.
 */
export const computeChartSeries = (ohlcv) => {
  const closes  = ohlcv.map((c) => c.close);
  const dates   = ohlcv.map((c) => c.date);
  const volumes = ohlcv.map((c) => c.volume);

  const rsiArr  = rsiSeries(closes, 14);
  const sma20Arr = smaSeries(closes, 20);
  const sma50Arr = smaSeries(closes, 50);
  const ema20Arr = emaSeries(closes, 20);
  const { macdLine, signalLine, histogram } = macdSeries(closes);
  const { upper, middle, lower } = bollingerBandsSeries(closes);

  return {
    dates,
    candles: ohlcv.map((c) => ({
      date: c.date, open: c.open, high: c.high, low: c.low, close: c.close,
    })),
    volume: volumes,
    rsi: rsiArr,
    sma20: sma20Arr,
    sma50: sma50Arr,
    ema20: ema20Arr,
    macdLine,
    macdSignal: signalLine,
    macdHistogram: histogram,
    bbUpper: upper,
    bbMiddle: middle,
    bbLower: lower,
  };
};
