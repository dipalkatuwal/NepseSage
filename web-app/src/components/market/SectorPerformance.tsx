"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sectors, type SectorData } from "./market-data";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
    Cell,
} from "recharts";

const sorted = [...sectors].sort((a, b) => b.avgChange - a.avgChange);
const best = sorted[0];
const worst = sorted[sorted.length - 1];

interface TooltipProps {
    active?: boolean;
    payload?: { value: number; payload: SectorData }[];
    label?: string;
}

function ChartTooltip({ active, payload }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const positive = d.avgChange >= 0;
    return (
        <div className="card-clinical py-2 px-3 shadow-lg text-sm space-y-1">
            <p className="font-heading font-bold text-xs">{d.name}</p>
            <p className={`font-heading font-semibold ${positive ? "positive" : "negative"}`}>
                {positive ? "+" : ""}
                {d.avgChange.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
                {d.gainers}↑ {d.losers}↓ · {d.symbolCount} stocks
            </p>
            <p className="text-[10px] text-muted-foreground">
                Turnover: Rs. {d.totalTurnover.toFixed(2)} Cr
            </p>
        </div>
    );
}

function SectorCard({ sector }: { sector: SectorData }) {
    const positive = sector.avgChange >= 0;
    const winRate = Math.round((sector.gainers / sector.symbolCount) * 100);

    return (
        <div className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 hover:bg-secondary/20 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <p className="font-heading text-xs font-bold text-foreground">
                        {sector.shortName}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                        {sector.symbolCount} listed
                    </p>
                </div>
                <span
                    className={`font-heading text-sm font-bold ${positive ? "positive" : "negative"}`}
                >
                    {positive ? "+" : ""}
                    {sector.avgChange.toFixed(2)}%
                </span>
            </div>

            {/* Breadth bar */}
            <div className="w-full h-1 rounded-full bg-destructive/20 overflow-hidden">
                <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${winRate}%` }}
                />
            </div>
            <div className="flex justify-between mt-1">
                <p className="text-[9px] text-muted-foreground">{sector.gainers}↑</p>
                <p className="text-[9px] text-muted-foreground">{sector.losers}↓</p>
            </div>
        </div>
    );
}

export function SectorPerformance() {
    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="p-5 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle className="clinical-label">Sector Performance</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Today&apos;s avg change by sector
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-heading">Best</span>
                            <Badge className="badge-bullish border-0 text-[10px]">
                                {best.shortName} +{best.avgChange.toFixed(2)}%
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-heading">Worst</span>
                            <Badge className="badge-bearish border-0 text-[10px]">
                                {worst.shortName} {worst.avgChange.toFixed(2)}%
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-6">
                {/* Bar chart */}
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                        data={sorted}
                        margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                        barSize={20}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            horizontal={true}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="shortName"
                            tick={{
                                fontSize: 9,
                                fontFamily: "var(--font-heading)",
                                fill: "var(--color-muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{
                                fontSize: 9,
                                fontFamily: "var(--font-heading)",
                                fill: "var(--color-muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-secondary)" }} />
                        <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
                        <Bar dataKey="avgChange" radius={[3, 3, 0, 0]}>
                            {sorted.map((s) => (
                                <Cell
                                    key={s.shortName}
                                    fill={
                                        s.avgChange >= 0
                                            ? "var(--color-success)"
                                            : "var(--color-destructive)"
                                    }
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Sector grid cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {sorted.map((s) => (
                        <SectorCard key={s.shortName} sector={s} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
