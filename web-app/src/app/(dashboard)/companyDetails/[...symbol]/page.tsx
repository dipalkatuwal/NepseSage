"use client";
 
import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useSymbolDetail } from "@/hooks/useNepse";
import { nepseAPI, aiAPI, type TechnicalAnalysis, type MarketSymbol } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Activity,
  Send,
  Brain,
  Info,
  HelpCircle,
} from "lucide-react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
} from "recharts";
 
interface PageProps {
  params: Promise<{ symbol: string[] }>;
}
 
// Standard helper for dynamic trend indicator classes
function changeClass(pct: number) {
  return pct > 0 ? "positive" : pct < 0 ? "negative" : "text-muted-foreground";
}
 
// Beautiful custom tooltip representing OHLC candle overview on hover
function StockTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isUp = data.value >= data.open;
  return (
    <div className="card-clinical p-3 shadow-xl border border-border/80 bg-background/95 backdrop-blur-md rounded-lg max-w-xs text-xs space-y-1.5 font-sans">
      <div className="flex justify-between items-center gap-4">
        <span className="font-heading font-bold text-muted-foreground">{label}</span>
        <span className={`font-semibold font-heading ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
          {isUp ? "▲" : "▼"} {((data.value - data.open) / (data.open || 1) * 100).toFixed(2)}%
        </span>
      </div>
      <div className="h-px bg-border/40 my-1" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Close:</span>
          <span className="font-mono font-semibold text-foreground">Rs. {data.value.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-mono text-muted-foreground">Rs. {data.open.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">High:</span>
          <span className="font-mono text-emerald-500">Rs. {data.high.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Low:</span>
          <span className="font-mono text-rose-500">Rs. {data.low.toFixed(1)}</span>
        </div>
      </div>
      {data.volume > 0 && (
        <div className="pt-1 text-[10px] text-muted-foreground flex justify-between border-t border-border/30 mt-1">
          <span>Volume:</span>
          <span className="font-mono">{data.volume.toLocaleString()}</span>
        </div>
      )}
      {data.turnover > 0 && (
        <div className="text-[10px] text-muted-foreground flex justify-between">
          <span>Turnover:</span>
          <span className="font-mono">Rs. {data.turnover.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function VolumeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="card-clinical p-3 shadow-xl border border-border/80 bg-background/95 backdrop-blur-md rounded-lg max-w-xs text-xs space-y-1.5 font-sans">
      <div className="font-heading font-bold text-muted-foreground mb-1">{label}</div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Volume:</span>
        <span className="font-mono font-semibold text-foreground">{data.volume.toLocaleString()}</span>
      </div>
      {data.turnover > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Turnover:</span>
          <span className="font-mono font-semibold text-foreground">Rs. {data.turnover.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
 
// Client side custom Markdown renderer for SSE streams
function formatBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-foreground">{part}</strong>;
    }
    return part;
  });
}
 
function parseCustomMarkdown(text: string) {
  if (!text) return null;
  const blocks = text.split("\n");
  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return <div key={idx} className="h-2" />;
 
    if (trimmed.startsWith("###")) {
      return (
        <h4 key={idx} className="text-sm font-heading font-bold text-primary mt-4 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          {trimmed.replace("###", "").trim()}
        </h4>
      );
    }
    if (trimmed.startsWith("##")) {
      return (
        <h3 key={idx} className="text-base font-heading font-bold text-foreground mt-5 mb-2.5 border-b border-border/30 pb-1">
          {trimmed.replace("##", "").trim()}
        </h3>
      );
    }
    if (trimmed.startsWith("#")) {
      return (
        <h2 key={idx} className="text-lg font-heading font-bold text-foreground mt-6 mb-3">
          {trimmed.replace("#", "").trim()}
        </h2>
      );
    }
 
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <li key={idx} className="text-sm text-muted-foreground ml-4 list-disc py-0.5">
          {formatBoldText(trimmed.substring(1).trim())}
        </li>
      );
    }
 
    return (
      <p key={idx} className="text-sm text-muted-foreground leading-relaxed mb-2.5">
        {formatBoldText(trimmed)}
      </p>
    );
  });
}
 
interface ExtendedMarketSymbol extends MarketSymbol {
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  turnover?: number;
  high52Week?: number;
  low52Week?: number;
  // These come through from the full /symbol/:symbol endpoint
  // (already declared on MarketSymbol but re-listed here for clarity)
  instrumentType?: string;
  listingDate?: string | null;
  totalListedShares?: number;
  totalPaidUpValue?: number;
  marketCapitalization?: number;
  totalTrades?: number;
  close?: number;
}
 
export default function CompanyDetailsPage({ params }: PageProps) {
  const { symbol: rawSymbol } = use(params);
  // rawSymbol is string[] from catch-all — join to restore slashes (e.g. ["GBILD86","87"] → "GBILD86/87")
  const symbol = (Array.isArray(rawSymbol) ? rawSymbol.join("/") : rawSymbol).toUpperCase();
 
  // Fetch details and history from existing useSymbolDetail hook
  const { detail: rawDetail, history, pvHistory, loading: detailLoading, error: detailError } = useSymbolDetail(symbol);
  const detail = rawDetail as ExtendedMarketSymbol | null;
 
  // State for technical analysis endpoints
  const [technical, setTechnical] = useState<TechnicalAnalysis | null>(null);
  const [techLoading, setTechLoading] = useState(true);
  const [techError, setTechError] = useState<string | null>(null);
 
  // Chart states
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("90D");
 
  // Sage AI states
  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const reportEndRef = useRef<HTMLDivElement>(null);
 
  // Fetch technical data on mount
  useEffect(() => {
    let mounted = true;
    const fetchTech = async () => {
      try {
        setTechLoading(true);
        setTechError(null);
        const data = await nepseAPI.getTechnical(symbol);
        if (mounted) setTechnical(data);
      } catch (err: any) {
        if (mounted) {
          const status = err?.response?.status;
          if (status === 401) {
            setTechError("Login required for technical analysis.");
          } else if (status === 404) {
            setTechError("No technical data for this symbol.");
          } else {
            setTechError("Technical data unavailable.");
          }
        }
      } finally {
        if (mounted) setTechLoading(false);
      }
    };
    fetchTech();
    return () => {
      mounted = false;
    };
  }, [symbol]);
 
  // Scroll to bottom of AI log when streaming updates
  useEffect(() => {
    if (aiLoading) {
      reportEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiReport, aiLoading]);
 
  // Generator logic for SSE streams
  const handleGenerateReport = async (question?: string) => {
    setAiLoading(true);
    if (!question) {
      setAiReport("");
    } else {
      setAiReport((prev) => prev + `\n\n---\n\n### Query: ${question}\n\n`);
    }
 
    try {
      const generator = aiAPI.analyzeStock(symbol, question);
      for await (const chunk of generator) {
        setAiReport((prev) => prev + chunk);
      }
    } catch {
      setAiReport((prev) => prev + "\n\n*Error: Unable to stream from Sage AI. Please try again.*");
    } finally {
      setAiLoading(false);
    }
  };
 
  // Merge history (OHLC) and pvHistory (volume/turnover) by date
  const unifiedDataMap = new Map();
  (history || []).forEach(h => {
    const key = new Date(h.date).toISOString().split('T')[0];
    unifiedDataMap.set(key, { ...h });
  });
  
  (pvHistory || []).forEach(h => {
    const key = new Date(h.date).toISOString().split('T')[0];
    const existing = unifiedDataMap.get(key) || {};
    unifiedDataMap.set(key, { ...existing, ...h });
  });

  const mergedData = Array.from(unifiedDataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format chart history values
  const chartData = mergedData.map((h) => ({
    time: new Date(h.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: h.close ?? h.price,
    open: h.open ?? h.price,
    high: h.high ?? h.price,
    low: h.low ?? h.price,
    volume: h.volume ?? 0,
    turnover: h.turnover ?? 0,
  }));
 
  // Slice history details based on timeframe
  const slicedChartData = chartData.slice(
    timeRange === "7D" ? -7 : timeRange === "30D" ? -30 : -90
  );
 
  // Dynamic YAxis sizing for price
  const prices = slicedChartData.map((d) => d.value);
  const minVal = prices.length ? Math.min(...prices) : 0;
  const maxVal = prices.length ? Math.max(...prices) : 0;
  const pad = (maxVal - minVal) * 0.1 || 5;
  const yDomain: [number, number] = [
    Math.floor(Math.max(0, minVal - pad)),
    Math.ceil(maxVal + pad),
  ];

  // Dynamic YAxis sizing for volume (prevent bars from overlapping the price area too much)
  const volumes = slicedChartData.map((d) => d.volume);
  const maxVol = volumes.length ? Math.max(...volumes) : 0;
  const volDomain: [number, number] = [0, maxVol * 4];
 
  const isUpToday = detail ? (detail.changePercent ?? 0) >= 0 : true;
  const trendColor = isUpToday ? "var(--color-success)" : "var(--color-destructive)";
 
  const isLoading = detailLoading || techLoading;
 
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <div>
          <Link
            href="/market"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition gap-1.5 mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition group-hover:-translate-x-1" />
            Back to Market overview
          </Link>
        </div>
 
        {isLoading ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/50 border border-border/40 p-6 rounded-xl">
            <div className="space-y-2.5">
              <Skeleton className="h-7 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-7 w-32 ml-auto" />
              <Skeleton className="h-5 w-24 ml-auto" />
            </div>
          </div>
        ) : !detail ? (
          <Card className="card-clinical p-8 text-center">
            <Info className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <h2 className="text-lg font-bold">Failed to load symbol details</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {detailError ?? `Symbol "${symbol}" might not be traded or indexed in NEPSE.`}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/30 backdrop-blur-sm border border-border/40 p-6 rounded-xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-heading">{detail.symbol}</h1>
                <Badge variant="outline" className="text-xs uppercase bg-secondary/80">
                  {detail.sector}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                {detail.companyName}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 font-heading">
              <div className="text-2xl font-bold text-foreground">
                Rs. {detail.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${changeClass(detail.changePercent ?? 0)}`}>
                  {detail.changePercent >= 0 ? "+" : ""}
                  {detail.change.toFixed(2)} ({detail.changePercent >= 0 ? "+" : ""}
                  {detail.changePercent.toFixed(2)}%)
                </span>
                <span className="text-[10px] text-muted-foreground font-sans font-normal">
                  Today
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
 
      {/* CHART AND INDICTORS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART PORTLET */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-clinical p-0 overflow-hidden shadow-none border-border/40">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
              <div>
                <CardTitle className="clinical-label flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" />
                  Historical trajectory
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detailLoading
                    ? "Loading charts..."
                    : slicedChartData.length === 0
                    ? "No price history available"
                    : `${slicedChartData.length} trading days loaded`}
                </p>
              </div>
              <div className="flex items-center bg-secondary/70 border border-border/20 rounded-md p-0.5 gap-0.5">
                {(["7D", "30D", "90D"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded text-xs font-heading font-semibold transition-all ${
                      timeRange === range
                        ? "bg-card text-foreground shadow-sm border border-border/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-5 pt-0">
              {detailLoading ? (
                <Skeleton className="h-[260px] w-full rounded-md" />
              ) : slicedChartData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
                  Price metrics unavailable for this company range.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart
                      data={slicedChartData}
                      margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                      syncId="stockChart"
                    >
                      <defs>
                        <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={trendColor} stopOpacity={0.16} />
                          <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{
                          fontSize: 10,
                          fontFamily: "var(--font-heading)",
                          fill: "var(--color-muted-foreground)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      {/* Price Axis */}
                      <YAxis
                        yAxisId="price"
                        domain={yDomain}
                        tick={{
                          fontSize: 10,
                          fontFamily: "var(--font-heading)",
                          fill: "var(--color-muted-foreground)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v.toLocaleString()}
                        width={52}
                      />
                      {/* Volume Axis (hidden, scaled to keep bars small at bottom) */}
                      <YAxis
                        yAxisId="volume"
                        domain={volDomain}
                        hide
                      />
                      <Tooltip content={<StockTooltip />} />
                      
                      {/* Volume Bar Overlay */}
                      <Bar
                        yAxisId="volume"
                        dataKey="volume"
                        fill="var(--color-muted)"
                        fillOpacity={0.6}
                        maxBarSize={8}
                        radius={[2, 2, 0, 0]}
                      />
                      
                      {/* Price Area */}
                      <Area
                        yAxisId="price"
                        type="monotone"
                        dataKey="value"
                        stroke={trendColor}
                        strokeWidth={2}
                        fill="url(#detailGrad)"
                        dot={false}
                        activeDot={{
                          r: 4.5,
                          fill: trendColor,
                          stroke: "var(--color-card)",
                          strokeWidth: 2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  {/* Dedicated Volume Sub-Chart */}
                  <div className="pt-2 border-t border-border/20">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 pl-12">
                      Volume History
                    </div>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart
                        data={slicedChartData}
                        margin={{ top: 5, right: 15, left: -10, bottom: 0 }}
                        syncId="stockChart"
                      >
                        <YAxis
                          domain={[0, maxVol]}
                          tick={{
                            fontSize: 10,
                            fontFamily: "var(--font-heading)",
                            fill: "var(--color-muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                          width={52}
                        />
                        <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }} />
                        <Bar
                          dataKey="volume"
                          fill="var(--color-primary)"
                          fillOpacity={0.8}
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
 
          {/* KEY STATISTICS & 52-WEEK RANGE */}
          {detail && (
            <Card className="card-clinical border-border/40 shadow-none p-5">
              <h3 className="clinical-label text-sm font-heading font-bold mb-3 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary" />
                Key Market Statistics
              </h3>
              <Separator className="mb-4" />

              {/* ── Instrument meta row (always show for NCDs / non-equity) ── */}
              {(detail.instrumentType || detail.listingDate) && (
                <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
                  {detail.instrumentType && (
                    <span className="px-2 py-0.5 rounded bg-secondary/60 border border-border/20 font-mono">
                      {detail.instrumentType}
                    </span>
                  )}
                  {detail.listingDate && (
                    <span className="px-2 py-0.5 rounded bg-secondary/60 border border-border/20">
                      Listed {new Date(detail.listingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              )}

              {/* ── Session price grid ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Prev Close</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {detail.previousClose && detail.previousClose > 0
                      ? `Rs. ${detail.previousClose.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Open</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {detail.open && detail.open > 0
                      ? `Rs. ${detail.open.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Day Range</span>
                  <p className="text-sm font-bold font-heading mt-1 text-emerald-500">
                    {detail.low && detail.low > 0 && detail.high && detail.high > 0
                      ? `Rs. ${detail.low.toFixed(1)} – ${detail.high.toFixed(1)}`
                      : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Close Price*</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {/* Close* is the official EOD price; falls back to LTP when market is open */}
                    {detail.close && detail.close > 0
                      ? `Rs. ${detail.close.toFixed(2)}`
                      : detail.ltp > 0
                      ? `Rs. ${detail.ltp.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Volume</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {detail.volume && detail.volume > 0
                      ? detail.volume.toLocaleString()
                      : <span className="text-muted-foreground text-xs">No trades today</span>}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Trades</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {detail.totalTrades && (detail.totalTrades as any) > 0
                      ? (detail.totalTrades as any).toLocaleString()
                      : <span className="text-muted-foreground text-xs">No trades today</span>}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Listed Shares</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {detail.totalListedShares && detail.totalListedShares > 0
                      ? detail.totalListedShares.toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Paid Up Value</span>
                  <p className="text-sm font-bold font-heading mt-1">
                    {detail.totalPaidUpValue && detail.totalPaidUpValue > 0
                      ? `Rs. ${(detail.totalPaidUpValue / 1_000_000).toFixed(2)}M`
                      : "—"}
                  </p>
                </div>
                {detail.marketCapitalization && detail.marketCapitalization > 0 && (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/20 sm:col-span-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Market Cap</span>
                    <p className="text-sm font-bold font-heading mt-1">
                      Rs. {detail.marketCapitalization >= 1_000_000_000
                        ? `${(detail.marketCapitalization / 1_000_000_000).toFixed(2)}B`
                        : `${(detail.marketCapitalization / 1_000_000).toFixed(2)}M`}
                    </p>
                  </div>
                )}
              </div>
 
              {/* 52-Week Range progress bar */}
              {detail.high52Week !== undefined && detail.low52Week !== undefined && detail.high52Week > 0 && detail.low52Week > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>52-Week Low: <strong className="text-foreground">Rs. {detail.low52Week.toFixed(1)}</strong></span>
                    <span>52-Week High: <strong className="text-foreground">Rs. {detail.high52Week.toFixed(1)}</strong></span>
                  </div>
                  {/* Visual progress bar */}
                  <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden relative border border-border/30">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-yellow-500 to-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((detail.ltp - detail.low52Week) / (detail.high52Week - detail.low52Week)) * 100))}%`
                      }}
                    />
                    {/* Tick marker for current price */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white border border-black shadow"
                      style={{
                        left: `${Math.min(99, Math.max(0, ((detail.ltp - detail.low52Week) / (detail.high52Week - detail.low52Week)) * 100))}%`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Current Price (Rs. {detail.ltp.toFixed(1)}) is at the{" "}
                    <strong className="text-foreground font-semibold">
                      {((detail.ltp - detail.low52Week) / (detail.high52Week - detail.low52Week) * 100).toFixed(0)}%
                    </strong>{" "}
                    percentile of its 52-week trading range.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
 
        {/* TECHNICAL BREAKDOWN PORTLET */}
        <div>
          {isLoading ? (
            <Card className="card-clinical h-full border-border/40 space-y-4 p-5">
              <Skeleton className="h-6 w-32" />
              <Separator />
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </Card>
          ) : !technical ? (
            <Card className="card-clinical h-full flex flex-col justify-center items-center p-6 border-border/40 text-center text-muted-foreground">
              <HelpCircle className="w-8 h-8 mb-2" />
              {techError ?? "No technical analysis statistics available."}
            </Card>
          ) : (
            <Card className="card-clinical h-full border-border/40 flex flex-col justify-between shadow-none p-5">
              <div>
                <h3 className="clinical-label text-sm font-heading font-bold mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" />
                  Technical Level Diagnostics
                </h3>
                <Separator className="mb-4" />
 
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Overall Signal</span>
                    <Badge
                      className={`font-semibold capitalize text-[10px] py-0 px-2 h-5 ${
                        technical.signal === "bullish"
                          ? "bg-success/15 text-success hover:bg-success/20 border-none"
                          : technical.signal === "bearish"
                          ? "bg-destructive/15 text-destructive hover:bg-destructive/20 border-none"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border-none"
                      }`}
                    >
                      {technical.signal}
                    </Badge>
                  </div>
 
                  <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">RSI (14-period)</span>
                    <span className="font-heading font-semibold text-foreground">
                      {technical.rsi14 ? technical.rsi14.toFixed(2) : "—"}
                    </span>
                  </div>
 
                  <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">SMA 20</span>
                    <span className="font-heading font-semibold text-foreground">
                      {technical.sma20 ? `Rs. ${technical.sma20.toFixed(1)}` : "—"}
                    </span>
                  </div>
 
                  <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">SMA 50</span>
                    <span className="font-heading font-semibold text-foreground">
                      {technical.sma50 ? `Rs. ${technical.sma50.toFixed(1)}` : "—"}
                    </span>
                  </div>
 
                  <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Support Level</span>
                    <span className="font-heading font-semibold text-success">
                      {technical.supportResistance?.support
                        ? `Rs. ${technical.supportResistance.support.toFixed(1)}`
                        : "—"}
                    </span>
                  </div>
 
                  <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Resistance Level</span>
                    <span className="font-heading font-semibold text-destructive">
                      {technical.supportResistance?.resistance
                        ? `Rs. ${technical.supportResistance.resistance.toFixed(1)}`
                        : "—"}
                    </span>
                  </div>
 
                  {technical.bollingerBands && (
                    <div className="flex justify-between items-center text-xs py-1 border-b border-border/30">
                      <span className="text-muted-foreground">Bollinger Upper / Lower</span>
                      <span className="font-heading text-[11px] text-muted-foreground">
                        <span className="text-foreground">
                          {technical.bollingerBands.upper.toFixed(1)}
                        </span>{" "}
                        /{" "}
                        <span className="text-foreground">
                          {technical.bollingerBands.lower.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
 
              <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/40 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Market Diagnostics</span>
                </div>
                <div className="text-muted-foreground pt-1">
                  Trend orientation is strictly{" "}
                  <strong className="text-foreground">{technical.trend || "sideways"}</strong>{" "}
                  showing a status of{" "}
                  <strong className="text-foreground font-semibold">
                    {technical.accumulationSignal || "neutral"}
                  </strong>
                  .
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
 
      {/* SAGE AI CLINICAL REPORT SECTION */}
      <Card className="card-clinical border-border/40 shadow-none relative overflow-hidden bg-background/40">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-5 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <CardTitle className="text-base font-semibold">Sage AI Diagnostic Assistant</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate dynamic real-time evaluations using indicators, averages, and clinical trends
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleGenerateReport()}
            disabled={aiLoading}
            className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/35 transition gap-1.5 h-8 text-xs font-semibold px-3.5 rounded-lg"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            {aiLoading ? "Consulting..." : "Generate AI Diagnostic"}
          </Button>
        </CardHeader>
 
        <CardContent className="p-5 space-y-4">
          <div className="min-h-[160px] max-h-[350px] overflow-y-auto bg-black/25 rounded-lg p-4 border border-border/40 select-text">
            {aiReport ? (
              <div className="space-y-1">
                {parseCustomMarkdown(aiReport)}
                <div ref={reportEndRef} />
              </div>
            ) : (
              <div className="h-[120px] flex flex-col justify-center items-center text-muted-foreground/60 text-xs">
                <Brain className="w-8 h-8 opacity-40 mb-2" />
                No diagnostics requested yet. Click 'Generate AI Diagnostic' or submit a custom prompt below.
              </div>
            )}
          </div>
 
          {/* CUSTOM PROMPT CHAT INPUT */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customQuestion.trim() || aiLoading) return;
              const q = customQuestion;
              setCustomQuestion("");
              handleGenerateReport(q);
            }}
            className="flex gap-2 items-center"
          >
            <Input
              type="text"
              placeholder={`Ask Sage AI anything about ${symbol} (e.g., Is it a good buy right now?)`}
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              disabled={aiLoading}
              className="bg-background/50 border-border/50 text-sm focus-visible:ring-1 focus-visible:ring-ring flex-1 h-9 rounded-lg"
            />
            <Button
              type="submit"
              disabled={aiLoading || !customQuestion.trim()}
              size="icon"
              className="h-9 w-9 bg-primary hover:bg-primary/90 transition text-primary-foreground rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
