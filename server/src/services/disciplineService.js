/**
 * Discipline Score Engine
 * Computes a 0-100 score based on trading journal behavior
 */

import JournalEntry from "../models/JournalEntry.js";

/**
 * Calculate discipline score for a user based on their journal
 */
export const calculateDisciplineScore = async (userId) => {
  const entries = await JournalEntry.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50); // Last 50 trades

  if (entries.length === 0) return { score: 75, breakdown: {}, trend: "stable" };

  let score = 100;
  const breakdown = {
    redFlagPenalty: 0,
    biasFrequency: {},
    emotionalConsistency: 0,
    reasoningQuality: 0,
    winLossBalance: 0,
  };

  // Penalty per red flag trade (-3 each, capped at -30)
  const redFlags = entries.filter((e) => e.isRedFlag).length;
  const redFlagPenalty = Math.min(redFlags * 3, 30);
  score -= redFlagPenalty;
  breakdown.redFlagPenalty = redFlagPenalty;

  // Bias frequency tracking
  const biasCount = {};
  entries.forEach((e) => {
    (e.detectedBiases || []).forEach((b) => {
      biasCount[b] = (biasCount[b] || 0) + 1;
    });
  });
  breakdown.biasFrequency = biasCount;

  // Emotional consistency: penalize if emotionBefore is mostly fearful/greedy
  const badEmotions = entries.filter((e) =>
    ["fearful", "greedy", "frustrated", "anxious"].includes(e.emotionBefore)
  ).length;
  const emotionalPenalty = Math.min(
    Math.round((badEmotions / entries.length) * 20),
    20
  );
  score -= emotionalPenalty;
  breakdown.emotionalConsistency = emotionalPenalty;

  // Reasoning quality: reward detailed reasoning
  const avgReasoningLength =
    entries.reduce((sum, e) => sum + (e.reasoning?.length || 0), 0) /
    entries.length;
  if (avgReasoningLength > 100) score += 5;
  if (avgReasoningLength < 20) score -= 5;
  breakdown.reasoningQuality = avgReasoningLength;

  // Win/loss balance
  const profitableTrades = entries.filter((e) => e.pnl > 0).length;
  const winRate =
    entries.length > 0 ? (profitableTrades / entries.length) * 100 : 0;
  if (winRate > 60) score += 5;
  if (winRate < 30) score -= 5;
  breakdown.winLossBalance = parseFloat(winRate.toFixed(1));

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Trend: compare last 10 vs previous 10
  let trend = "stable";
  if (entries.length >= 20) {
    const recent = entries.slice(0, 10);
    const older = entries.slice(10, 20);
    const recentFlags = recent.filter((e) => e.isRedFlag).length;
    const olderFlags = older.filter((e) => e.isRedFlag).length;
    if (recentFlags < olderFlags - 1) trend = "improving";
    if (recentFlags > olderFlags + 1) trend = "declining";
  }

  return { score, breakdown, trend, totalEntries: entries.length };
};

/**
 * Get bias pattern summary for a user
 */
export const getBiasPatterns = async (userId) => {
  const entries = await JournalEntry.find({
    user: userId,
    isRedFlag: true,
  }).sort({ createdAt: -1 });

  const patterns = {};
  entries.forEach((e) => {
    (e.detectedBiases || []).forEach((bias) => {
      if (!patterns[bias]) {
        patterns[bias] = { count: 0, symbols: new Set(), recentDate: null };
      }
      patterns[bias].count++;
      patterns[bias].symbols.add(e.symbol);
      if (!patterns[bias].recentDate) {
        patterns[bias].recentDate = e.createdAt;
      }
    });
  });

  // Convert sets to arrays
  return Object.entries(patterns).map(([bias, data]) => ({
    bias,
    count: data.count,
    symbols: Array.from(data.symbols),
    recentDate: data.recentDate,
    severity:
      data.count >= 5 ? "high" : data.count >= 3 ? "medium" : "low",
  }));
};