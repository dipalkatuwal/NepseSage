"use client";

import { useState, useEffect, useCallback } from "react";
import { useNepse } from "@/hooks/useNepse";
import { nepseAPI, IndexPoint } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = "1W" | "1M" | "3M" | "1Y" | "ALL";

const RANGES: { label: Range; days: number }[] = [
    { label: "1W",  days: 5   },
    { label: "1M",  days: 22  },
    { label: "3M",  days: 66  },
    { label: "1Y",  days: 252 },
    { label: "ALL", days: 1825 },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
    active?: boolean;
    payload?: { value: number; payload: IndexPoint }[];
    label?: string;
    isPositive: boolean;
}

function CustomTooltip({ active, payload, label, isPositive }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    const val   = point.value;

    return (
        <div className="card-clinical py-2 px-3 shadow-lg text-sm min-w-[140px]">
            <p className="clinical-label mb-0.5">{label}</p>
            <p className={`font-heading font-bold text-base ${isPositive ? "positive" : "negative"}`}>
                {val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {point.changePercent !== undefined && (
                <p className={`text-xs mt-0.5 ${(point.changePercent ?? 0) >= 0 ? "positive" : "negative"}`}>
                    {(point.changePercent ?? 0) >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(point.changePercent ?? 0).toFixed(2)}%
                </p>
            )}
            {point.turnover !== undefined && point.turnover > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                    Vol: NPR {(point.turnover / 1e7).toFixed(1)}Cr
                </p>
            )}
            {point.gainers !== undefined && (
                <p className="text-xs text-muted-foreground mt-0.5">
                    ▲{point.gainers} ▼{point.losers}
                </p>
            )}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketChart() {
    const { summary } = useNepse();
    const [range, setRange]           = useState<Range>("3M");
    const [history, setHistory]       = useState<IndexPoint[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<"db" | "live" | null>(null);

    const loadHistory = useCallback(async (selectedRange: Range) => {
        setLoading(true);
        setError(null);
        try {
            const raw = await nepseAPI.getIndexHistory(selectedRange);
            if (Array.isArray(raw) && raw.length > 0) {
                setHistory(raw);
                // If data has changePercent/gainers fields it came from our DB
                setDataSource(raw[0].changePercent !== undefined ? "db" : "live");
            } else {
                setHistory([]);
                setDataSource(null);
            }
        } catch (err) {
            setError("Failed to load index history");
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory(range);
    }, [range, loadHistory]);

    const isPositive = summary ? summary.indexChange >= 0 : true;

    const values  = history.map((d) => d.value);
    const min     = values.length ? Math.min(...values) : 0;
    const max     = values.length ? Math.max(...values) : 0;
    const pad     = (max - min) * 0.12 || 10;
    const yDomain: [number, number] = [Math.floor(min - pad), Math.ceil(max + pad)];

    const strokeColor = isPositive ? "var(--color-success)" : "var(--color-destructive)";

    // Thin ticks for large datasets
    const tickInterval = history.length > 60 ? Math.floor(history.length / 8) : 0;

    const subtitleText = loading
        ? "Loading…"
        : error
        ? error
        : history.length === 0
        ? "No data available"
        : `${history.length} trading days · ${dataSource === "db" ? "DB ✓" : "Live"}`;

    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-4">
                <div>
                    <CardTitle className="clinical-label">NEPSE Index Trend</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitleText}</p>
                </div>

                {/* Range selector */}
                <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
                    {RANGES.map(({ label }) => (
                        <button
                            key={label}
                            onClick={() => setRange(label)}
                            className={`px-3 py-1 rounded text-xs font-heading font-semibold transition-all ${
                                range === label
                                    ? "bg-card text-foreground shadow-sm border border-border"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="px-2 pb-5 pt-0">
                {loading ? (
                    <Skeleton className="h-[220px] w-full rounded-md" />
                ) : history.length === 0 ? (
                    <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>{error ?? "No index history available yet."}</span>
                        {!error && (
                            <span className="text-[10px] opacity-60">
                                Data accumulates after the first end-of-day sync (15:30 NPT)
                            </span>
                        )}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart
                            data={history}
                            margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.18} />
                                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0}    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--color-border)"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10, fontFamily: "var(--font-heading)", fill: "var(--color-muted-foreground)" }}
                                axisLine={false}
                                tickLine={false}
                                dy={6}
                                interval={tickInterval}
                            />

                            <YAxis
                                domain={yDomain}
                                tick={{ fontSize: 10, fontFamily: "var(--font-heading)", fill: "var(--color-muted-foreground)" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => v.toLocaleString()}
                                width={62}
                            />

                            <Tooltip content={<CustomTooltip isPositive={isPositive} />} />

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={strokeColor}
                                strokeWidth={2}
                                fill="url(#chartGrad)"
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: strokeColor,
                                    stroke: "var(--color-card)",
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
