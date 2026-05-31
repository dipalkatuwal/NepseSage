"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";
import { SageIntelligenceCard } from "@/components/dashboard/SageIntelligenceCard";
import { CoreHoldingsTable } from "@/components/dashboard/CoreHoldingsTable";
import { OpportunityRadar } from "@/components/dashboard/OpportunityRadar";
import { RiskMeter } from "@/components/dashboard/RiskMeter";
import { Watchlist } from "@/components/dashboard/Watchlist";
import { SectorAllocation } from "@/components/dashboard/SectorAllocation";
import { CommunityBuzz } from "@/components/dashboard/CommunityBuzz";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content - 2 cols on lg */}
        <div className="lg:col-span-2 space-y-4">
          <SageIntelligenceCard />
          <CoreHoldingsTable />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectorAllocation />
            <RiskMeter />
          </div>
        </div>

        {/* Right Sidebar — on mobile renders after main content */}
        <div className="space-y-4">
          <Watchlist />
          <OpportunityRadar />
          <CommunityBuzz />
        </div>
      </div>
    </div>
  );
}
