"use client";

// Re-export from the shared context so all components get the same state.
// Previously each component created its own isolated useState — that meant
// addTransaction in CoreHoldingsTable updated only its own copy, while
// SectorAllocation and RiskMeter still held stale data until page refresh.
//
// Now there is exactly ONE portfolio state (inside PortfolioProvider).
// Every call to usePortfolio() across the dashboard reads & writes that
// single store, so LTP, P/L, Sector Allocation, and Risk Meter all update
// the instant a transaction is added — no refresh needed.
export { usePortfolioContext as usePortfolio } from "@/context/PortfolioContext";
