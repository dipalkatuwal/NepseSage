/**
 * Technical Analysis Engine
 * Computes RSI, MACD, SMA, EMA, Support/Resistance from OHLCV data
 */

/**
 * Simple Moving Average
 */
export const sma = (values, period) => {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

/**
 * Exponential Moving Average
 */
export const ema = (values, period) => {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let emaVal = sma(values.slice(0, period), period);
  for (let i = period; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k);
  }
  return emaVal;
};

/**
 * RSI - Relative Strength Index (14-period standard)
 */
export const rsi = (closes, period = 14) => {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothed RSI
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

/**
 * MACD - Moving Average Convergence Divergence
 * Returns { macd, signal, histogram }
 */
export const macd = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (closes.length < slowPeriod + signalPeriod) return null;

  // Build EMA series for MACD line
  const macdLine = [];
  for (let i = slowPeriod - 1; i < closes.length; i++) {
    const slice = closes.slice(0, i + 1);
    const fastEma = ema(slice, fastPeriod);
    const slowEma = ema(slice, slowPeriod);
    if (fastEma !== null && slowEma !== null) {
      macdLine.push(fastEma - slowEma);
    }
  }

  if (macdLine.length < signalPeriod) return null;

  const signalLine = ema(macdLine, signalPeriod);
  const macdValue = macdLine[macdLine.length - 1];

  return {
    macd: parseFloat(macdValue.toFixed(2)),
    signal: parseFloat(signalLine.toFixed(2)),
    histogram: parseFloat((macdValue - signalLine).toFixed(2)),
  };
};

/**
 * Bollinger Bands
 */
export const bollingerBands = (closes, period = 20, stdDev = 2) => {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const middle = sma(slice, period);
  const variance =
    slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: parseFloat((middle + stdDev * std).toFixed(2)),
    middle: parseFloat(middle.toFixed(2)),
    lower: parseFloat((middle - stdDev * std).toFixed(2)),
  };
};

/**
 * Support & Resistance detection using pivot points
 */
export const supportResistance = (ohlcv, lookback = 20) => {
  if (ohlcv.length < lookback) return { support: null, resistance: null };

  const recent = ohlcv.slice(-lookback);
  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);

  // Find local pivot highs (resistance)
  const pivotHighs = [];
  const pivotLows = [];

  for (let i = 2; i < recent.length - 2; i++) {
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i + 2]
    ) {
      pivotHighs.push(highs[i]);
    }
    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i + 2]
    ) {
      pivotLows.push(lows[i]);
    }
  }

  return {
    support: pivotLows.length > 0 ? Math.max(...pivotLows) : Math.min(...lows),
    resistance:
      pivotHighs.length > 0 ? Math.min(...pivotHighs) : Math.max(...highs),
  };
};

/**
 * Trend detection (bullish / bearish / sideways)
 */
export const detectTrend = (closes, period = 20) => {
  if (closes.length < period) return "sideways";
  const s = sma(closes.slice(-period), period);
  const recent = closes.slice(-5);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

  if (recentAvg > s * 1.02) return "bullish";
  if (recentAvg < s * 0.98) return "bearish";
  return "sideways";
};

/**
 * Accumulation/Distribution signal
 */
export const accumulationSignal = (ohlcv) => {
  if (ohlcv.length < 10) return "neutral";
  const recent = ohlcv.slice(-10);

  let accumDays = 0;
  let distribDays = 0;
  recent.forEach((day) => {
    const clv = ((day.close - day.low) - (day.high - day.close)) / (day.high - day.low || 1);
    if (clv > 0.3 && day.volume > 0) accumDays++;
    if (clv < -0.3 && day.volume > 0) distribDays++;
  });

  if (accumDays > distribDays + 2) return "accumulation";
  if (distribDays > accumDays + 2) return "distribution";
  return "neutral";
};

/**
 * Full technical analysis for a symbol
 */
export const analyzeSymbol = (marketData) => {
  const ohlcv = marketData.ohlcvHistory || [];
  const closes = ohlcv.map((c) => c.close);

  if (closes.length < 30) {
    return {
      rsi: null,
      macd: null,
      sma20: null,
      sma50: null,
      bollingerBands: null,
      supportResistance: { support: null, resistance: null },
      trend: "unknown",
      signal: "insufficient data",
      accumulationSignal: "neutral",
    };
  }

  const rsiValue = rsi(closes);
  const macdValue = macd(closes);
  const sma20Value = sma(closes, 20);
  const sma50Value = sma(closes, 50);
  const bb = bollingerBands(closes);
  const sr = supportResistance(ohlcv);
  const trend = detectTrend(closes);
  const accum = accumulationSignal(ohlcv);

  // Overall signal
  let signal = "neutral";
  let bullishSignals = 0;
  let bearishSignals = 0;

  if (rsiValue !== null) {
    if (rsiValue < 30) bullishSignals++; // oversold
    if (rsiValue > 70) bearishSignals++; // overbought
  }
  if (macdValue) {
    if (macdValue.histogram > 0) bullishSignals++;
    if (macdValue.histogram < 0) bearishSignals++;
  }
  if (trend === "bullish") bullishSignals++;
  if (trend === "bearish") bearishSignals++;
  if (accum === "accumulation") bullishSignals++;
  if (accum === "distribution") bearishSignals++;

  if (bullishSignals >= 3) signal = "bullish";
  else if (bearishSignals >= 3) signal = "bearish";

  return {
    rsi: rsiValue ? parseFloat(rsiValue.toFixed(2)) : null,
    macd: macdValue,
    sma20: sma20Value ? parseFloat(sma20Value.toFixed(2)) : null,
    sma50: sma50Value ? parseFloat(sma50Value.toFixed(2)) : null,
    bollingerBands: bb,
    supportResistance: sr,
    trend,
    signal,
    accumulationSignal: accum,
  };
};