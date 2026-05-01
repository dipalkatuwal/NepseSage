"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { aiAPI } from "@/lib/services";

export function SageIntelligenceCard() {
  const [sentiment, setSentiment] = useState<{
    sentiment: string;
    summary: string;
    gainers: number;
    losers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await aiAPI.getSentiment();
        setSentiment(data);
        setUpdatedAt(
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Card className="card-clinical p-0 shadow-none">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge className="badge-bullish flex border-0 items-center gap-1.5 hover:bg-transparent">
            <Sparkles className="h-3 w-3" /> Sage Intelligence
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {updatedAt}
          </span>
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground capitalize">
          Market Sentiment:{" "}
          {sentiment?.sentiment === "bullish"
            ? "Selective Accumulation"
            : sentiment?.sentiment === "bearish"
            ? "Risk-Off Mode"
            : "Neutral Consolidation"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {sentiment?.summary ??
            "NEPSE market analysis unavailable. Check back during trading hours."}
        </p>
        {sentiment && (
          <p className="mt-1 text-xs text-muted-foreground">
            {sentiment.gainers} advancing · {sentiment.losers} declining
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-primary hover:bg-primary/90 hover:text-white text-white border-0 text-xs"
          >
            Execute Rebalance
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Full Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
