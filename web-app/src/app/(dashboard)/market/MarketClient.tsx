"use client";

import { MarketSubNav } from "@/components/market/MarketSubNav";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MarketSummary } from "@/components/market/MarketSummary";
import { MarketChart } from "@/components/market/MarketChart";
import { TopMovers } from "@/components/market/TopMovers";
import { SectorPerformance } from "@/components/market/SectorPerformance";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { FundamentalsPanel } from "@/components/market/FundamentalsPanel";



export function MarketClient() {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SymbolSearch />
          </div>
          <div>
            <FundamentalsPanel />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="companies" className="mt-0 outline-none">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SymbolSearch />
          </div>
          <div>
            <FundamentalsPanel />
          </div>
        </div>
      </TabsContent>




    </Tabs>
  );
}
