"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, TrendingUp } from "lucide-react";
import { nepseAPI, type TechnicalAnalysis } from "@/lib/services";

interface Props {
  symbol?: string;
}

export function FundamentalsPanel({ symbol }: Props) {
  const [data, setData] = useState<TechnicalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await nepseAPI.getTechnical(symbol);
        if (mounted) setData(res);
      } catch {
        // fail silently
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [symbol]);

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm h-full">
        <CardHeader className="pb-3 border-b border-border/50">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!symbol || !data) {
    return (
      <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-medium">Technical Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Search for a symbol above to see technical analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: "Current Price", value: `Rs. ${data.currentPrice.toFixed(2)}` },
    { label: "Change", value: `${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%`, colored: true, positive: data.changePercent >= 0 },
    { label: "RSI (14)", value: data.rsi14 != null ? data.rsi14.toFixed(1) : "—" },
    { label: "SMA 20", value: data.sma20 != null ? `Rs. ${data.sma20.toFixed(2)}` : "—" },
    { label: "SMA 50", value: data.sma50 != null ? `Rs. ${data.sma50.toFixed(2)}` : "—" },
    { label: "Support", value: data.supportResistance.support != null ? `Rs. ${data.supportResistance.support.toFixed(2)}` : "—" },
    { label: "Resistance", value: data.supportResistance.resistance != null ? `Rs. ${data.supportResistance.resistance.toFixed(2)}` : "—" },
    { label: "Signal", value: data.signal },
  ];

  return (
    <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-medium">Technical Snapshot</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
          {symbol}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
              <div
                className={`text-base font-semibold ${
                  m.colored ? (m.positive ? "text-emerald-500" : "text-rose-500") : ""
                }`}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {data.trend && (
          <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{data.trend}</span>
            </div>
            {data.accumulationSignal && (
              <p className="text-xs text-muted-foreground mt-1">{data.accumulationSignal}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
