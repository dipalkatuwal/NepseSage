"use client";

import { useState, useEffect, useCallback } from "react";
import { nepseAPI, type MarketSymbol } from "@/lib/services";

export function useNepse() {
  const [gainers, setGainers] = useState<MarketSymbol[]>([]);
  const [losers, setLosers] = useState<MarketSymbol[]>([]);
  const [summary, setSummary] = useState<{
    totalSymbols: number;
    gainers: number;
    losers: number;
    totalTurnover: number;
    advanceDeclineRatio: string;
  } | null>(null);
  const [sectors, setSectors] = useState<
    {
      _id: string;
      avgChange: number;
      totalTurnover: number;
      symbolCount: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      const [sum, gain, lose, sec] = await Promise.all([
        nepseAPI.getSummary(),
        nepseAPI.getGainers(10),
        nepseAPI.getLosers(10),
        nepseAPI.getSectors(),
      ]);
      setSummary(sum);
      setGainers(gain);
      setLosers(lose);
      setSectors(sec);
    } catch {
      // silent — use cached data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return { gainers, losers, summary, sectors, loading, fetchMarketData };
}

export function useSymbolSearch() {
  const [results, setResults] = useState<MarketSymbol[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const data = await nepseAPI.searchSymbols(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  return { results, searching, search };
}
