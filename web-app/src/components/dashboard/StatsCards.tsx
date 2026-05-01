"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useJournal } from "@/hooks/useJournal";
import { useAuth } from "@/context/AuthContext";

export function StatsCards() {
  const { user } = useAuth();
  const { stats, loading: portfolioLoading } = usePortfolio();
  const { discipline, loading: journalLoading } = useJournal();

  const loading = portfolioLoading || journalLoading;

  const formatNPR = (val: number) =>
    `Rs. ${Math.abs(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const disciplineScore = discipline?.score ?? user?.disciplineScore ?? 75;

  const statsData = [
    {
      label: "Portfolio Value",
      value: stats ? formatNPR(stats.totalValue) : "Rs. —",
      change: stats
        ? `${stats.totalPnLPercent >= 0 ? "+" : ""}${stats.totalPnLPercent.toFixed(2)}%`
        : null,
      positive: stats ? stats.totalPnLPercent >= 0 : true,
    },
    {
      label: "Total P/L",
      value: stats
        ? `${stats.totalPnL >= 0 ? "+" : "-"}${formatNPR(stats.totalPnL)}`
        : "Rs. —",
      change: stats
        ? `${stats.totalPnLPercent >= 0 ? "+" : ""}${stats.totalPnLPercent.toFixed(2)}%`
        : null,
      positive: stats ? stats.totalPnL >= 0 : true,
    },
    {
      label: "Discipline Score",
      value: `${disciplineScore}/100`,
      change: discipline?.trend === "improving"
        ? "↑ Improving"
        : discipline?.trend === "declining"
        ? "↓ Declining"
        : null,
      positive: discipline?.trend !== "declining",
      isScore: true,
      scoreValue: disciplineScore,
    },
    {
      label: "Risk Rating",
      value: stats
        ? stats.beta > 1.3
          ? "High"
          : stats.beta > 0.9
          ? "Moderate-High"
          : "Moderate"
        : "Moderate-High",
      change: null,
      positive: false,
      isWarning: stats ? stats.beta > 1.3 : true,
    },
  ];

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-clinical p-0 shadow-none">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((s) => (
        <Card key={s.label} className="card-clinical p-0 shadow-none">
          <CardContent className="p-5 pb-5">
            <p className="clinical-label">{s.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="stat-value text-xl">{s.value}</span>
              {s.change && (
                <span
                  className={`text-sm font-semibold ${s.positive ? "positive" : "negative"}`}
                >
                  {s.change}
                </span>
              )}
              {s.isWarning && (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
            </div>
            {"isScore" in s && s.isScore && (
              <Progress
                value={s.scoreValue}
                className="h-1.5 mt-2 bg-secondary"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
