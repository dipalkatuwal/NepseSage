"use client";

import { useNepse } from "@/hooks/useNepse";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";

function formatVolume(v: number | undefined | null): string {
    const n = Number(v) || 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatTurnover(v: number | undefined | null): string {
    const n = Number(v) || 0;
    if (n === 0) return "Rs. —";
    if (n >= 1_000_000_000) return `Rs. ${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(1)}K`;
    return `Rs. ${n}`;
}

function formatMarketTime(raw: string | null | undefined): string {
    if (!raw) return "-";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${date} | ${time}`;
}

export function MarketSummary() {
    const { summary, loading } = useNepse();

    if (loading && !summary) {
        return <div className="animate-pulse h-[200px] w-full bg-muted rounded-xl" />;
    }

    if (!summary) return null;

    const positive = summary.indexChange >= 0;

    // Breadth calculations
    const totalBreadth = summary.gainers + summary.losers + summary.unchanged;
    const advPercent = totalBreadth > 0 ? (summary.gainers / totalBreadth) * 100 : 0;
    const decPercent = totalBreadth > 0 ? (summary.losers / totalBreadth) * 100 : 0;
    const unchPercent = totalBreadth > 0 ? (summary.unchanged / totalBreadth) * 100 : 0;

    const summaryStats = [
        {
            label: "Total Turnover",
            value: formatTurnover(summary.totalTurnover),
            icon: Activity,
        },
        {
            label: "Total Volume",
            value: formatVolume(summary.totalVolume),
            icon: Activity,
        },
        {
            label: "Listed Symbols",
            value: (summary.totalSymbols ?? 0).toLocaleString(),
            icon: Activity,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Primary index card */}
            <Card className="card-clinical p-0 shadow-none overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-5 border-b border-border">
                        {/* Index value */}
                        <div className="flex flex-1 items-end gap-4">
                            <div>
                                <p className="clinical-label mb-1">NEPSE Index</p>
                                <div className="flex items-end gap-3">
                                    <span className="font-heading text-4xl font-bold text-foreground">
                                        {(summary.nepseIndex ?? 0).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <div className={`flex items-center gap-1 mb-1 ${positive ? "positive" : "negative"}`}>
                                        {positive ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                        <span className="font-heading text-lg font-semibold">
                                            {positive ? "+" : ""}
                                            {(summary.indexChange ?? 0).toFixed(2)} ({positive ? "+" : ""}
                                            {(summary.indexChangePercent ?? 0).toFixed(2)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Breadth */}
                        {summary.gainers !== undefined && (
                            <div className="flex-1 w-full lg:max-w-md">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="clinical-label">Market Breadth</span>
                                    <div className="flex gap-3 text-xs font-medium">
                                        <span className="text-success">{summary.gainers} Adv</span>
                                        <span className="text-destructive">{summary.losers} Dec</span>
                                        <span className="text-muted-foreground">{summary.unchanged} Unc</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
                                    <div className="h-full bg-success transition-all duration-500" style={{ width: `${advPercent}%` }} />
                                    <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${decPercent}%` }} />
                                    <div className="h-full bg-muted-foreground/40 transition-all duration-500" style={{ width: `${unchPercent}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Status + last updated */}
                        <div className="flex items-center gap-4 lg:ml-auto">
                            <div className="h-8 w-px bg-border hidden sm:block" />
                            <div className="text-right">
                                <p className="clinical-label mb-1">Market Status</p>
                                <Badge
                                    className={`text-xs font-semibold border-0 ${summary.isMarketOpen
                                            ? "badge-bullish"
                                            : "bg-secondary text-muted-foreground"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${summary.isMarketOpen
                                                ? "bg-success animate-pulse"
                                                : "bg-muted-foreground"
                                            }`}
                                    />
                                    {summary.isMarketOpen ? "Open" : "Closed"}
                                </Badge>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="clinical-label mb-1">Last Updated</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-mono text-xs">{formatMarketTime(summary.marketAsOf)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 divide-x divide-border">
                        {summaryStats.map((s) => (
                            <div key={s.label} className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <p className="clinical-label">{s.label}</p>
                                </div>
                                <span className="stat-value text-sm">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
