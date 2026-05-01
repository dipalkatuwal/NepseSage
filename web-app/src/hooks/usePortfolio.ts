"use client";

import { useState, useEffect, useCallback } from "react";
import { portfolioAPI, type Portfolio, type Transaction } from "@/lib/services";
import { toast } from "sonner";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const data = await portfolioAPI.get();
      setPortfolio(data);
      setError(null);
    } catch {
      setError("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const addTransaction = useCallback(
    async (payload: {
      symbol: string;
      type: "BUY" | "SELL";
      quantity: number;
      price: number;
      notes?: string;
      date?: string;
    }) => {
      try {
        const updated = await portfolioAPI.addTransaction(payload);
        setPortfolio(updated);
        toast.success(
          `${payload.type} order for ${payload.symbol} executed successfully`
        );
        return { success: true };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Transaction failed";
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    []
  );

  const addBulkTransactions = useCallback(
    async (payload: {
      transactions: {
        symbol: string;
        type: "BUY" | "SELL";
        quantity: number;
        price: number;
        notes?: string;
        date?: string;
      }[];
    }) => {
      try {
        const updated = await portfolioAPI.addBulkTransactions(payload);
        setPortfolio(updated);
        toast.success(`Successfully added ${payload.transactions.length} transactions`);
        return { success: true };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Bulk import failed";
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await portfolioAPI.deleteTransaction(id);
      toast.success("Transaction deleted");
      await fetchPortfolio();
    } catch {
      toast.error("Failed to delete transaction");
    }
  }, [fetchPortfolio]);

  // Computed stats from portfolio
  const stats = portfolio
    ? {
        totalValue: portfolio.totalCurrentValue,
        totalInvested: portfolio.totalInvested,
        totalPnL: portfolio.totalPnL,
        totalPnLPercent: portfolio.totalPnLPercent,
        holdingsCount: portfolio.holdings.length,
        beta: portfolio.portfolioBeta,
      }
    : null;

  return {
    portfolio,
    stats,
    loading,
    error,
    fetchPortfolio,
    addTransaction,
    addBulkTransactions,
    deleteTransaction,
  };
}
