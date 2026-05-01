"use client";

import { fundamentals } from "@/lib/market-data-complete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, PieChart, Info } from "lucide-react";

export function FundamentalsPanel() {
  // Using NICA as the default example, in reality this would be driven by selection
  const data = fundamentals[0];

  if (!data) return null;

  return (
    <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-medium">Fundamentals Snapshot</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
          {data.symbol}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto space-y-6">
        
        {/* Key Ratios */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Key Valuation Ratios
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1">P/E Ratio</div>
              <div className="text-lg font-semibold">{data.peRatio.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1">P/B Ratio</div>
              <div className="text-lg font-semibold">{data.pbRatio.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1">Book Value</div>
              <div className="text-lg font-semibold">Rs. {data.bookValue.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1">ROE</div>
              <div className="text-lg font-semibold text-emerald-500">{data.roe.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* EPS Track */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <PieChart className="w-4 h-4" />
            EPS Progression
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
              <span className="text-muted-foreground">Q1</span>
              <span className="font-medium">Rs. {data.eps.q1.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
              <span className="text-muted-foreground">Q2</span>
              <span className="font-medium">Rs. {data.eps.q2.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
              <span className="text-muted-foreground">Q3</span>
              <span className="font-medium">Rs. {data.eps.q3.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm border-l-2 border-primary">
              <span className="font-medium text-foreground">Q4 (Current)</span>
              <span className="font-semibold text-primary">Rs. {data.eps.q4.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dividends */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            Dividends & Returns
          </h4>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-emerald-600/80 dark:text-emerald-400/80">Dividend Yield</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.dividendYield.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-xs mt-3 pt-2 border-t border-emerald-500/10">
              <span className="text-muted-foreground">Ex-Date</span>
              <span className="font-medium">{data.exDividendDate}</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
