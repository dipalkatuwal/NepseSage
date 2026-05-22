"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio } from "@/hooks/usePortfolio";

export function RiskMeter() {
  const { stats, loading } = usePortfolio();

  const beta = stats?.beta ?? 0;

  // Clamp beta to 0–2 range for the gauge arc calculation
  const clampedBeta = Math.max(0, Math.min(beta, 2));
  // Convert to a 0–1 fraction for the arc sweep
  const fraction = clampedBeta / 2;

  // Risk label based on beta
  const riskLabel =
    beta > 1.5
      ? "Very High"
      : beta > 1.2
      ? "High"
      : beta > 0.9
      ? "Moderate-High"
      : beta > 0.5
      ? "Moderate"
      : beta > 0
      ? "Low"
      : "No Data";

  // Arc color based on risk
  const arcColor =
    beta > 1.3
      ? "var(--color-destructive)"
      : beta > 0.9
      ? "var(--color-warning)"
      : "var(--color-success)";

  // SVG arc: full arc goes from (20,90) to (180,90) — 160° sweep
  // We use a parametric approach for the active arc endpoint
  const cx = 100, cy = 90, r = 80;
  const startAngle = Math.PI;          // left (180°)
  const endAngle = 0;                  // right (0°)
  const activeAngle = startAngle - fraction * Math.PI;
  const activeX = cx + r * Math.cos(activeAngle);
  const activeY = cy - r * Math.sin(activeAngle);

  // SVG arc path for the active portion
  const largeArc = fraction > 0.5 ? 1 : 0;
  const activePath =
    fraction > 0
      ? `M 20 90 A ${r} ${r} 0 ${largeArc} 1 ${activeX.toFixed(1)} ${activeY.toFixed(1)}`
      : "";

  if (loading) {
    return (
      <Card className="card-clinical p-0 shadow-none">
        <CardHeader className="p-5 pb-0 text-center flex items-center mb-4">
          <CardTitle className="clinical-label">Risk Meter</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex flex-col items-center justify-center">
          <Skeleton className="h-24 w-48 mb-2" />
          <Skeleton className="h-7 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardHeader className="p-5 pb-0 text-center flex items-center mb-4">
        <CardTitle className="clinical-label">Risk Meter</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 flex flex-col items-center justify-center">
        <div className="relative h-24 w-48 mb-2">
          <svg viewBox="0 0 200 100" className="h-full w-full">
            {/* Background arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Active arc based on real beta */}
            {activePath && (
              <path
                d={activePath}
                fill="none"
                stroke={arcColor}
                strokeWidth="12"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
        <span className="stat-value text-2xl">{beta.toFixed(2)}</span>
        <span className="clinical-label mt-1">Portfolio Beta · {riskLabel}</span>
      </CardContent>
    </Card>
  );
}
