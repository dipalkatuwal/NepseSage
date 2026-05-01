"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { indexHistory1D, indexHistory1W, indexHistory1M, marketSummary } from "./market-data";

type Range = "1D" | "1W" | "1M";

const RANGES: Range[] = ["1D", "1W", "1M"];

const DATA_MAP: Record<Range, typeof indexHistory1D> = {
    "1D": indexHistory1D,
    "1W": indexHistory1W,
    "1M": indexHistory1M,
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const isPositive = marketSummary.change >= 0;
    return (
        <div className="card-clinical py-2 px-3 shadow-lg text-sm">
            <p className="clinical-label mb-0.5">{label}</p>
            <p className={`font-heading font-bold text-base ${isPositive ? "positive" : "negative"}`}>
                {val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>
    );
}

export function MarketChart() {
    const [range, setRange] = useState<Range>("1D");
    const data = DATA_MAP[range];
    const isPositive = marketSummary.change >= 0;

    // Compute domain with small padding
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15;
    const yDomain: [number, number] = [Math.floor(min - pad), Math.ceil(max + pad)];

    const strokeColor = isPositive ? "var(--color-success)" : "var(--color-destructive)";

    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-4">
                <div>
                    <CardTitle className="clinical-label">NEPSE Index Trend</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Historical performance
                    </p>
                </div>
                <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
                    {RANGES.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 rounded text-xs font-heading font-semibold transition-all ${range === r
                                    ? "bg-card text-foreground shadow-sm border border-border"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-2 pb-5 pt-0">
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.18} />
                                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
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
                        />
                        <YAxis
                            domain={yDomain}
                            tick={{ fontSize: 10, fontFamily: "var(--font-heading)", fill: "var(--color-muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v.toLocaleString()}
                            width={58}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fill="url(#chartGrad)"
                            dot={false}
                            activeDot={{ r: 4, fill: strokeColor, stroke: "var(--color-card)", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
