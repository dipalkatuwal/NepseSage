"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { insightsAPI, type Insight } from "@/lib/services";
import Link from "next/link";

export function CommunityBuzz() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchBuzz = async () => {
      try {
        const res = await insightsAPI.getInsights({ limit: 3 });
        if (mounted) setInsights(res.insights ?? []);
      } catch {
        // fail silently — will show empty state
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBuzz();
    return () => { mounted = false; };
  }, []);

  const sentimentColor = (s: string) =>
    s === "bullish"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      : s === "bearish"
      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <CardTitle className="clinical-label">Community Buzz</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 space-y-3">
        {loading ? (
          <>
            {[1, 2].map((i) => (
              <div key={i} className="rounded-md bg-secondary p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </>
        ) : insights.length === 0 ? (
          <div className="rounded-md bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">
              No community insights yet. Be the first to share!
            </p>
          </div>
        ) : (
          insights.map((insight) => (
            <div key={insight._id} className="rounded-md bg-secondary p-3">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {insight.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold">
                  {insight.user?.name ?? "Anonymous"}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 h-4 ${sentimentColor(insight.sentiment)}`}
                >
                  {insight.sentiment}
                </Badge>
                {insight.symbol && (
                  <span className="text-xs text-muted-foreground">
                    #{insight.symbol}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {insight.text}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/60">
                  {new Date(insight.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  ♥ {insight.likes}
                </span>
              </div>
            </div>
          ))
        )}
        <Link href="/insights">
          <Button variant="outline" className="w-full text-xs mt-3 h-8">
            View All Insights
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
