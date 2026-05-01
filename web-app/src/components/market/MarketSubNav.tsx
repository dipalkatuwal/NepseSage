"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LayoutDashboard, PieChart, Building2 } from "lucide-react";

export function MarketSubNav() {
  return (
    <div className="w-full overflow-x-auto scrollbar-none border-b border-border mb-6">
      <TabsList className="h-7 w-max inline-flex items-center justify-start bg-transparent p-0 text-muted-foreground gap-1">
        <TabsTrigger
          value="overview"
          className="rounded-none border-b-2 border-transparent px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold transition hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
        >
          Overview
        </TabsTrigger>

        <TabsTrigger
          value="sectors"
          className="rounded-none border-b-2 border-transparent px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold transition hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
        >
          Sectors
        </TabsTrigger>

        <TabsTrigger
          value="companies"
          className="rounded-none border-b-2 border-transparent px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold transition hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
        >
          Companies
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
