"use client";

import { useState, useEffect, useCallback } from "react";
import { nepseAPI, type MarketSymbol } from "@/lib/services";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketSummary {
  totalSymbols: number;
  gainers: number;
  losers: number;
  unchanged: number;
  totalTurnover: number;
  totalVolume: number;
  advanceDeclineRatio: string;
  // Index fields — now populated from IndexSnapshot via pipeline
  nepseIndex: number;
  indexChange: number;
  indexChangePercent: number;
  indexTurnover: number;
  totalTransactions: number;
  // Market status
  isMarketOpen: boolean;
  marketAsOf: string | null;
}

export interface SectorData {
  _id: string;
  avgChange: number;
  totalTurnover: number;
  totalVolume: number;
  symbolCount: number;
  gainers: number;
  losers: number;
}

// ─── useNepse ─────────────────────────────────────────────────────────────────

export function useNepse() {
  const [gainers, setGainers] = useState<MarketSymbol[]>([]);
  const [losers, setLosers] = useState<MarketSymbol[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [sectors, setSectors] = useState<SectorData[]>([]);
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
      // silent — use cached state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 minutes (aligned with backend cron)
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return { gainers, losers, summary, sectors, loading, fetchMarketData };
}

// ─── useSymbolSearch ──────────────────────────────────────────────────────────

export function useSymbolSearch() {
  const [results, setResults] = useState<MarketSymbol[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q === undefined || q === null) {
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

// ─── useSymbolDetail ──────────────────────────────────────────────────────────

export function useSymbolDetail(symbol: string | null) {
  const [detail, setDetail] = useState<MarketSymbol | null>(null);
  const [history, setHistory] = useState<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]>([]);
  const [pvHistory, setPvHistory] = useState<{ date: string; price: number; volume: number; turnover: number }[]>([]);
  // Initialize as TRUE so the page shows skeleton immediately, not error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch symbol detail first — this must succeed for the page to render
        const d = await nepseAPI.getSymbol(symbol);
        if (mounted) setDetail(d);

        // Fetch history independently — failure just means an empty chart,
        // NOT a page-level error. This prevents NEPSE graph API latency
        // from blocking the entire page load.
        nepseAPI.getHistory(symbol, 90)
          .then((h) => { if (mounted) setHistory(h?.history ?? []); })
          .catch(() => { if (mounted) setHistory([]); });
          
        // Fetch new price+volume history
        nepseAPI.getPriceVolumeHistory(symbol, 90)
          .then((h) => { if (mounted) setPvHistory(h?.pvHistory ?? []); })
          .catch(() => { if (mounted) setPvHistory([]); });

      } catch (err: any) {
        if (mounted) {
          const status = err?.response?.status;
          if (status === 404) {
            setError(`Symbol "${symbol}" not found in NEPSE.`);
          } else if (status === 401) {
            setError("Authentication required. Please log in.");
          } else {
            setError("Failed to load symbol data. Check your connection.");
          }
          setDetail(null);
          setHistory([]);
          setPvHistory([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [symbol]);

  return { detail, history, pvHistory, loading, error };
}
