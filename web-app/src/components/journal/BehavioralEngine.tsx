"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournal } from "@/hooks/useJournal";

export function BehavioralEngine() {
  const { discipline, biases, loading } = useJournal();

  const topBias = biases.find((b) => b.severity === "high") ?? biases[0];
  const topStrength =
    discipline && discipline.breakdown.redFlagPenalty < 10
      ? "Disciplined execution — low red-flag rate in recent trades."
      : null;

  if (loading) {
    return (
      <Card className="card-clinical p-0 shadow-none">
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-5 pb-4">
        <CardTitle className="clinical-label text-primary">
          Sage Behavioral Engine
        </CardTitle>
        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-xs">⚙️</span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 space-y-4">
        {topBias ? (
          <Alert
            variant="destructive"
            className="bg-destructive/10 border-destructive/20 text-destructive"
          >
            <AlertTriangle className="h-4 w-4" color="currentColor" />
            <AlertTitle className="text-sm font-semibold mb-1">
              Detected Bias: {topBias.bias}
            </AlertTitle>
            <AlertDescription className="text-xs opacity-90 leading-relaxed">
              Detected {topBias.count} time{topBias.count > 1 ? "s" : ""} across{" "}
              {topBias.symbols.join(", ")}. Review your entry timing and emotional
              state before the next trade.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-primary/10 border-primary/20 text-primary">
            <CheckCircle className="h-4 w-4" color="currentColor" />
            <AlertTitle className="text-sm font-semibold mb-1">
              No Biases Detected
            </AlertTitle>
            <AlertDescription className="text-xs opacity-90 leading-relaxed text-foreground">
              Great work — no behavioral flags in your recent trades. Keep
              logging to maintain your discipline baseline.
            </AlertDescription>
          </Alert>
        )}

        {topStrength && (
          <Alert className="bg-primary/10 border-primary/20 text-primary">
            <CheckCircle className="h-4 w-4" color="currentColor" />
            <AlertTitle className="text-sm font-semibold mb-1">
              Strength: Disciplined Execution
            </AlertTitle>
            <AlertDescription className="text-xs opacity-90 leading-relaxed text-foreground">
              {topStrength}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex gap-8 border-t border-border pt-4">
          <div>
            <p className="clinical-label flex items-center gap-1">
              Discipline Score
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Based on bias frequency, emotional consistency, and
                    reasoning quality across your last 50 trades.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <span className="stat-value text-xl">{discipline?.score ?? 75}</span>
            <span className="text-xs text-muted-foreground"> /100</span>
          </div>
          <div>
            <p className="clinical-label flex items-center gap-1">
              Trend
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Compared to your previous 10 trades.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <span
              className={`stat-value text-xl capitalize ${discipline?.trend === "improving" ? "positive" : discipline?.trend === "declining" ? "negative" : ""}`}
            >
              {discipline?.trend ?? "Stable"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
