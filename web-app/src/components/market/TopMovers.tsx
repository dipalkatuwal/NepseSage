"use client";

import { useState } from "react";
import { useNepse } from "@/hooks/useNepse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { MarketSymbol } from "@/lib/services";
import Link from "next/link";

type Tab = "gainers" | "losers";

const PREVIEW_COUNT = 5;

function formatVolume(v?: number): string {
    if (!v) return "-";
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
}

function MoverRow({ mover, positive }: { mover: MarketSymbol; positive: boolean }) {
    return (
        <Link
            href={`/companyDetails/${mover.symbol}`}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group hover:bg-secondary/30 cursor-pointer -mx-5 px-5 transition-colors block"
        >
            <div className="flex items-center gap-3">
                <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center text-[10px] font-heading font-bold shrink-0 ${
                        positive
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                    }`}
                >
                    {mover.symbol.slice(0, 3)}
                </div>
                <div>
                    <p className="font-heading text-sm font-bold text-foreground leading-tight">
                        {mover.symbol}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {mover.companyName}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="clinical-label">Vol</p>
                    <p className="text-xs font-mono text-muted-foreground">
                        {formatVolume(mover.volume)}
                    </p>
                </div>
                <div className="text-right min-w-[72px]">
                    <p className="font-heading text-sm font-semibold text-foreground">
                        {mover.ltp.toLocaleString("en-IN", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                        })}
                    </p>
                    <p
                        className={`text-xs font-semibold font-heading ${
                            positive ? "positive" : "negative"
                        }`}
                    >
                        {positive ? "+" : ""}
                        {mover.changePercent.toFixed(2)}%
                    </p>
                </div>
            </div>
        </Link>
    );
}

export function TopMovers() {
    const { gainers, losers, loading } = useNepse();
    const [tab, setTab] = useState<Tab>("gainers");
    const [expanded, setExpanded] = useState(false);

    const movers = tab === "gainers" ? gainers : losers;
    const visible = expanded ? movers : movers.slice(0, PREVIEW_COUNT);
    const hasMore = movers.length > PREVIEW_COUNT;

    // Reset expanded state when switching tabs
    function handleTabChange(next: Tab) {
        setTab(next);
        setExpanded(false);
    }

    if (loading && gainers.length === 0 && losers.length === 0) {
        return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
    }

    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="p-5 pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="clinical-label">Top Movers</CardTitle>
                    <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
                        <button
                            onClick={() => handleTabChange("gainers")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-heading font-semibold transition-all ${
                                tab === "gainers"
                                    ? "bg-success/15 text-success border border-success/20"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <TrendingUp className="h-3 w-3" />
                            Gainers
                        </button>
                        <button
                            onClick={() => handleTabChange("losers")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-heading font-semibold transition-all ${
                                tab === "losers"
                                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <TrendingDown className="h-3 w-3" />
                            Losers
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 mt-3 pb-2 border-b border-border">
                    <p className="clinical-label">Symbol</p>
                    <p className="clinical-label text-right hidden sm:block">Volume</p>
                    <p className="clinical-label text-right">LTP / Change</p>
                </div>
            </CardHeader>

            <CardContent className="px-5 pb-1 pt-0">
                {visible.length > 0 ? (
                    visible.map((m) => (
                        <MoverRow key={m.symbol} mover={m} positive={tab === "gainers"} />
                    ))
                ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                        No data available right now.
                    </div>
                )}
            </CardContent>

            {/* View more / View less */}
            {hasMore && (
                <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-heading font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors border-t border-border/50 rounded-b-xl"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            View less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            View {movers.length - PREVIEW_COUNT} more
                        </>
                    )}
                </button>
            )}
        </Card>
    );
}
