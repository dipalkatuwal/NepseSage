"use client";

import { MarketSubNav } from "@/components/market/MarketSubNav";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MarketSummary } from "@/components/market/MarketSummary";
import { MarketChart } from "@/components/market/MarketChart";
import { TopMovers } from "@/components/market/TopMovers";
import { SectorPerformance } from "@/components/market/SectorPerformance";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { FundamentalsPanel } from "@/components/market/FundamentalsPanel";
import { CompanyList } from "@/components/market/CompanyList";

import { useRouter } from "next/navigation";

interface MarketClientProps {
  activeTab?: "overview" | "sectors" | "companies";
}

export function MarketClient({ activeTab = "overview" }: MarketClientProps) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === "overview") router.push("/market");
    else if (value === "sectors") router.push("/sectors");
    else if (value === "companies") router.push("/companies");
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <MarketSubNav />

      <TabsContent value="overview" className="mt-0 outline-none">
        <div className="space-y-6">
          <MarketSummary />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MarketChart />
            </div>
            <div>
              <TopMovers />
            </div>
          </div>
          <SectorPerformance />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SymbolSearch />
            </div>
            <div>
              <FundamentalsPanel />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="sectors" className="mt-0 outline-none">
        <SectorPerformance />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <SymbolSearch />
          </div>
          <div>
            <FundamentalsPanel />
          </div>
        </div>
      </TabsContent>

      {/* ── Companies tab: full live listing fetched from MongoDB ── */}
      <TabsContent value="companies" className="mt-0 outline-none">
        <CompanyList />
      </TabsContent>
    </Tabs>
  );
}
