"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import { marketSummary } from "./market-data";

function formatVolume(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return String(v);
}

const summaryStats = [
    {
        label: "Total Turnover",
        value: `Rs. ${marketSummary.totalTurnover.toFixed(2)} Cr`,
        icon: Activity,
    },
    {
        label: "Total Trades",
        value: marketSummary.totalTrades.toLocaleString(),
        icon: Activity,
    },
    {
        label: "Total Volume",
        value: formatVolume(marketSummary.totalVolume),
        icon: Activity,
    },
    {
        label: "52W High",
        value: marketSummary.high52Week.toLocaleString(),
        icon: TrendingUp,
    },
    {
        label: "52W Low",
        value: marketSummary.low52Week.toLocaleString(),
        icon: TrendingDown,
    },
];

export function MarketSummary() {
    const positive = marketSummary.change >= 0;
    
    // Breadth calculations
    const totalBreadth = (marketSummary.advances || 0) + (marketSummary.declines || 0) + (marketSummary.unchanged || 0);
    const advPercent = totalBreadth > 0 ? ((marketSummary.advances || 0) / totalBreadth) * 100 : 0;
    const decPercent = totalBreadth > 0 ? ((marketSummary.declines || 0) / totalBreadth) * 100 : 0;
    const unchPercent = totalBreadth > 0 ? ((marketSummary.unchanged || 0) / totalBreadth) * 100 : 0;

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
                                        {marketSummary.indexValue.toLocaleString("en-IN", {
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
                                            {marketSummary.change.toFixed(2)} ({positive ? "+" : ""}
                                            {marketSummary.changePercent.toFixed(2)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Breadth */}
                        {marketSummary.advances !== undefined && (
                            <div className="flex-1 w-full lg:max-w-md">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="clinical-label">Market Breadth</span>
                                    <div className="flex gap-3 text-xs font-medium">
                                        <span className="text-success">{marketSummary.advances} Adv</span>
                                        <span className="text-destructive">{marketSummary.declines} Dec</span>
                                        <span className="text-muted-foreground">{marketSummary.unchanged} Unc</span>
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
                            <div className="text-right hidden sm:block">
                                <p className="clinical-label mb-1">Market Cap (Cr)</p>
                                <span className="font-semibold text-sm">Rs. {(marketSummary.marketCap || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-8 w-px bg-border hidden sm:block" />
                            <div className="text-right">
                                <p className="clinical-label mb-1">Market Status</p>
                                <Badge
                                    className={`text-xs font-semibold border-0 ${marketSummary.status === "Open"
                                            ? "badge-bullish"
                                            : marketSummary.status === "Pre-Open"
                                                ? "bg-warning/15 text-warning"
                                                : "bg-secondary text-muted-foreground"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${marketSummary.status === "Open"
                                                ? "bg-success animate-pulse"
                                                : marketSummary.status === "Pre-Open"
                                                    ? "bg-warning"
                                                    : "bg-muted-foreground"
                                            }`}
                                    />
                                    {marketSummary.status}
                                </Badge>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="clinical-label mb-1">Last Updated</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-mono text-xs">{marketSummary.lastUpdated}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-border">
                        {summaryStats.map((s) => (
                            <div key={s.label} className="p-4 first:divide-x-0">
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
