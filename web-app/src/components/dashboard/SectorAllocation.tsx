"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio } from "@/hooks/usePortfolio";

// Fixed set of colors for sectors
const SECTOR_COLORS = [
  "var(--color-primary)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "hsl(160 60% 45%)",
  "hsl(270 50% 55%)",
  "hsl(200 70% 50%)",
  "var(--color-muted-foreground)",
];

export function SectorAllocation() {
  const { portfolio, loading } = usePortfolio();

  // Compute sector breakdown from real holdings
  const holdings = portfolio?.holdings ?? [];
  const sectorMap = new Map<string, number>();

  holdings.forEach((h) => {
    const sector = h.sector || "Other";
    const value = h.quantity * h.currentPrice;
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + value);
  });

  const totalValue = Array.from(sectorMap.values()).reduce((a, b) => a + b, 0);

  // Sort by value descending, cap at 6 sectors + "Other"
  let sectors = Array.from(sectorMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // If more than 6 sectors, merge the tail into "Other"
  if (sectors.length > 6) {
    const top = sectors.slice(0, 5);
    const rest = sectors.slice(5);
    const otherValue = rest.reduce((s, r) => s + r.value, 0);
    top.push({
      name: "Other",
      value: otherValue,
      percent: totalValue > 0 ? (otherValue / totalValue) * 100 : 0,
    });
    sectors = top;
  }

  // Build SVG donut stroke-dasharray offsets
  const circumference = 2 * Math.PI * 40; // r=40
  let cumulativeOffset = 0;

  const topSector = sectors[0];

  if (loading) {
    return (
      <Card className="card-clinical p-0 shadow-none">
        <CardHeader className="p-5 pb-4">
          <CardTitle className="clinical-label">Sector Allocation</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-center justify-center py-2">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-clinical p-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <CardTitle className="clinical-label">Sector Allocation</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex items-center justify-center py-2">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="16"
              />
              {/* Sector arcs */}
              {sectors.map((sec, i) => {
                const dashLength = (sec.percent / 100) * circumference;
                const dashGap = circumference - dashLength;
                const offset = -cumulativeOffset;
                cumulativeOffset += dashLength;

                return (
                  <circle
                    key={sec.name}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                    strokeWidth="16"
                    strokeDasharray={`${dashLength} ${dashGap}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {topSector ? (
                <>
                  <span className="stat-value text-lg">
                    {topSector.percent.toFixed(0)}%
                  </span>
                  <span
                    className="clinical-label"
                    style={{ fontSize: "0.55rem" }}
                  >
                    {topSector.name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No holdings
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {sectors.map((sec, i) => (
            <div key={sec.name} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{
                  backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length],
                }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {sec.name} ({sec.percent.toFixed(0)}%)
              </span>
            </div>
          ))}
          {sectors.length === 0 && (
            <span className="text-xs text-muted-foreground col-span-2 text-center py-2">
              Add holdings to see allocation
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
