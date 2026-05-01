"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { topGainers, topLosers, type TopMover } from "./market-data";

type Tab = "gainers" | "losers";

function formatVolume(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
}

function MoverRow({ mover, positive }: { mover: TopMover; positive: boolean }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 group hover:bg-secondary/30 -mx-5 px-5 transition-colors">
            <div className="flex items-center gap-3">
                <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center text-[10px] font-heading font-bold shrink-0 ${positive
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
                        className={`text-xs font-semibold font-heading ${positive ? "positive" : "negative"
                            }`}
                    >
                        {positive ? "+" : ""}
                        {mover.changePercent.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
}

export function TopMovers() {
    const [tab, setTab] = useState<Tab>("gainers");
    const movers = tab === "gainers" ? topGainers : topLosers;

    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="p-5 pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="clinical-label">Top Movers</CardTitle>
                    <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
                        <button
                            onClick={() => setTab("gainers")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-heading font-semibold transition-all ${tab === "gainers"
                                ? "bg-success/15 text-success border border-success/20"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <TrendingUp className="h-3 w-3" />
                            Gainers
                        </button>
                        <button
                            onClick={() => setTab("losers")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-heading font-semibold transition-all ${tab === "losers"
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
            <CardContent className="px-5 pb-5 pt-0">
                {movers.map((m) => (
                    <MoverRow key={m.symbol} mover={m} positive={tab === "gainers"} />
                ))}
            </CardContent>
        </Card>
    );
}
