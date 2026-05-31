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
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-clinical p-0 shadow-none">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statsData.map((s) => (
        <Card key={s.label} className="card-clinical p-0 shadow-none">
          <CardContent className="p-4">
            <p className="clinical-label text-[10px]">{s.label}</p>
            <div className="mt-1.5 flex items-end justify-between gap-1">
              <span className="stat-value text-lg leading-tight">{s.value}</span>
              <div className="flex flex-col items-end shrink-0">
                {s.change && (
                  <span className={`text-xs font-semibold ${s.positive ? "positive" : "negative"}`}>
                    {s.change}
                  </span>
                )}
                {s.isWarning && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
              </div>
            </div>
            {"isScore" in s && s.isScore && (
              <Progress value={s.scoreValue} className="h-1 mt-2 bg-secondary" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
