"use client";

import { useNepse, type SectorData } from "@/hooks/useNepse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// ─── Official NEPSE sector → short label for chart axis ──────────────────────
const SECTOR_SHORT: Record<string, string> = {
    "Commercial Banks":          "Comm. Banks",
    "Development Banks":         "Dev. Banks",
    "Finance":                   "Finance",
    "Microfinance":              "MFI",
    "Life Insurance":            "Life Ins.",
    "Non Life Insurance":        "Non-Life",
    "Hydro Power":               "Hydro",
    "Manufacturing And Processing": "Mfg.",
    "Hotels And Tourism":        "Hotels",
    "Trading":                   "Trading",
    "Investment":                "Investment",
    "Mutual Fund":               "Mutual Fund",
    "Others":                    "Others",
    "Corporate Debenture":       "Debenture",
    "Preference Share":          "Pref. Share",
    "Promoter Share":            "Promoter",
};

function shortName(sector: string): string {
    return SECTOR_SHORT[sector] ?? sector.split(" ")[0];
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
    active?: boolean;
    payload?: { value: number; payload: SectorData }[];
}

function ChartTooltip({ active, payload }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const positive = d.avgChange >= 0;
    const turnoverCr = (d.totalTurnover / 1e7).toFixed(2);
    return (
        <div className="card-clinical py-2 px-3 shadow-lg text-sm space-y-1">
            <p className="font-heading font-bold text-xs">{d._id}</p>
            <p className={`font-heading font-semibold ${positive ? "positive" : "negative"}`}>
                {positive ? "+" : ""}{d.avgChange.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
                {d.gainers}↑ {d.losers}↓ · {d.symbolCount} stocks
            </p>
            <p className="text-[10px] text-muted-foreground">
                Turnover: Rs. {turnoverCr}Cr
            </p>
        </div>
    );
}

// ─── Sector card ──────────────────────────────────────────────────────────────

function SectorCard({ sector }: { sector: SectorData }) {
    const positive = sector.avgChange >= 0;
    const winRate =
        sector.symbolCount > 0
            ? Math.round((sector.gainers / sector.symbolCount) * 100)
            : 0;
    const turnoverCr = (sector.totalTurnover / 1e7).toFixed(1);

    return (
        <div className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 hover:bg-secondary/20 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <p className="font-heading text-xs font-bold text-foreground leading-tight">
                        {sector._id}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                        {sector.symbolCount} listed · Rs.{turnoverCr}Cr
                    </p>
                </div>
                <span
                    className={`font-heading text-sm font-bold shrink-0 ml-2 ${positive ? "positive" : "negative"}`}
                >
                    {positive ? "+" : ""}{sector.avgChange.toFixed(2)}%
                </span>
            </div>

            {/* Advance/decline breadth bar */}
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

// ─── Main component ───────────────────────────────────────────────────────────

export function SectorPerformance() {
    const { sectors, loading } = useNepse();

    // Filter out non-equity sectors (Corporate Debenture, Preference Share, Promoter Share, Mutual Fund)
    const NON_EQUITY_SECTORS = [
        "Corporate Debenture",
        "Preference Share",
        "Promoter Share",
        "Mutual Fund",
        "Unknown"
    ];
    const clean = sectors.filter(
        (s) => s._id && !NON_EQUITY_SECTORS.includes(s._id) && s.symbolCount > 0
    );
    const sorted = [...clean].sort((a, b) => b.avgChange - a.avgChange);

    const best  = sorted.length > 0 ? sorted[0] : null;
    const worst = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    // Chart data — map to short axis labels
    const chartData = sorted.map((s) => ({
        ...s,
        label: shortName(s._id),
    }));

    if (loading) {
        return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
    }

    if (sorted.length === 0) return null;

    return (
        <Card className="card-clinical p-0 shadow-none">
            <CardHeader className="p-5 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle className="clinical-label">Sector Performance</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Today&apos;s avg change by sector · {sorted.length} sectors
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {best && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-heading">Best</span>
                                <Badge className="badge-bullish border-0 text-[10px]">
                                    {best._id} +{best.avgChange.toFixed(2)}%
                                </Badge>
                            </div>
                        )}
                        {worst && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-heading">Worst</span>
                                <Badge className="badge-bearish border-0 text-[10px]">
                                    {worst._id} {worst.avgChange.toFixed(2)}%
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 pt-0 space-y-6">
                {/* Bar chart with short labels */}
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 40 }}
                        barSize={18}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            horizontal
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{
                                fontSize: 9,
                                fontFamily: "var(--font-heading)",
                                fill: "var(--color-muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
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
                            {chartData.map((s) => (
                                <Cell
                                    key={s._id}
                                    fill={s.avgChange >= 0 ? "var(--color-success)" : "var(--color-destructive)"}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Sector grid — one card per official sector with live data */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {sorted.map((s) => (
                        <SectorCard key={s._id} sector={s} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
