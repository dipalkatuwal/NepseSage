"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { portfolioAPI, type Portfolio } from "@/lib/services";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TransactionPayload {
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  notes?: string;
  date?: string;
}

interface PortfolioContextValue {
  portfolio: Portfolio | null;
  stats: {
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercent: number;
    holdingsCount: number;
    beta: number;
  } | null;
  loading: boolean;
  error: string | null;
  fetchPortfolio: () => Promise<void>;
  addTransaction: (
    payload: TransactionPayload
  ) => Promise<{ success: boolean; error?: string }>;
  addBulkTransactions: (payload: {
    transactions: TransactionPayload[];
  }) => Promise<{ success: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const PortfolioContext = createContext<PortfolioContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function PortfolioProvider({ children }: { children: ReactNode }) {
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

  const addTransaction = useCallback(async (payload: TransactionPayload) => {
    try {
      const updated = await portfolioAPI.addTransaction(payload);
      // Single shared state update — all consumers re-render immediately
      setPortfolio(updated);
      toast.success(
        `${payload.type} order for ${payload.symbol} executed successfully`
      );
      return { success: true };
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Transaction failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, []);

  const addBulkTransactions = useCallback(
    async (payload: { transactions: TransactionPayload[] }) => {
      try {
        const updated = await portfolioAPI.addBulkTransactions(payload);
        // Single shared state update — all consumers re-render immediately
        setPortfolio(updated);
        toast.success(
          `Successfully added ${payload.transactions.length} transactions`
        );
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

  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        await portfolioAPI.deleteTransaction(id);
        toast.success("Transaction deleted");
        await fetchPortfolio();
      } catch {
        toast.error("Failed to delete transaction");
      }
    },
    [fetchPortfolio]
  );

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

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        stats,
        loading,
        error,
        fetchPortfolio,
        addTransaction,
        addBulkTransactions,
        deleteTransaction,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePortfolioContext(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error("usePortfolioContext must be used inside <PortfolioProvider>");
  }
  return ctx;
}
