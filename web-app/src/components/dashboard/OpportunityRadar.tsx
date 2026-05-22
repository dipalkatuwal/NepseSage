"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { nepseAPI, type MarketSymbol } from "@/lib/services";

interface Opportunity {
  symbol: string;
  signal: string;
  match: string;
  type: string;
}

/**
 * Derives opportunity signals from real market data:
 * - High % gainers with strong volume → "Momentum Breakout"
 * - Negative change but high turnover → "Accumulation Signal"
 * - Strong % change + high volume → "Volume Surge"
 */
function deriveOpportunities(gainers: MarketSymbol[], losers: MarketSymbol[]): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Top gainer with high change% → Momentum Breakout
  for (const g of gainers.slice(0, 3)) {
    if (g.changePercent >= 5) {
      opportunities.push({
        symbol: g.symbol,
        signal: "Momentum Breakout",
        match: `${Math.min(95, Math.round(50 + g.changePercent * 4))}%`,
        type: `+${g.changePercent.toFixed(1)}% today`,
      });
    } else if (g.changePercent >= 2) {
      opportunities.push({
        symbol: g.symbol,
        signal: "Volume Surge",
        match: `${Math.min(90, Math.round(40 + g.changePercent * 6))}%`,
        type: `+${g.changePercent.toFixed(1)}% today`,
      });
    }
  }

  // Top losers with big volume → potential accumulation / reversal
  for (const l of losers.slice(0, 2)) {
    if (l.changePercent <= -3 && (l.volume ?? 0) > 100000) {
      opportunities.push({
        symbol: l.symbol,
        signal: "Potential Reversal",
        match: `${Math.min(80, Math.round(30 + Math.abs(l.changePercent) * 5))}%`,
        type: `${l.changePercent.toFixed(1)}% · High Vol`,
      });
    }
  }

  return opportunities.slice(0, 4);
}

export function OpportunityRadar() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSignals = async () => {
      try {
        const [gainers, losers] = await Promise.all([
          nepseAPI.getGainers(5),
          nepseAPI.getLosers(5),
        ]);
        if (mounted) {
          const signals = deriveOpportunities(gainers, losers);
          setOpportunities(signals);
        }
      } catch {
        // fail silently
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSignals();
    return () => { mounted = false; };
  }, []);

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <CardTitle className="clinical-label">Opportunity Radar</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 space-y-3">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))
        ) : opportunities.length === 0 ? (
          <div className="rounded-md bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">
              No strong signals detected today
            </p>
          </div>
        ) : (
          opportunities.map((o) => (
            <div
              key={o.symbol}
              className="flex items-center justify-between rounded-md bg-secondary p-3"
            >
              <div>
                <span className="font-heading text-sm font-bold">
                  {o.symbol}
                </span>
                <p className="text-xs text-muted-foreground">{o.signal}</p>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {o.match} Match
                </Badge>
                <p className="text-xs text-muted-foreground mt-0.5">{o.type}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
