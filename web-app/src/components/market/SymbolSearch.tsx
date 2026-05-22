"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNepse, useSymbolSearch } from "@/hooks/useNepse";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";

export function SymbolSearch() {
  const router = useRouter();
  const { sectors: sectorData } = useNepse();
  const { results, searching, search } = useSymbolSearch();
  const [query, setQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, search]);

  const sectors = ["All", ...sectorData.map((s) => s._id).sort()];

  const filteredSymbols = results.filter((s) => {
    return selectedSector === "All" || s.sector === selectedSector;
  });

  return (
    <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-medium">Company Search</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search symbol or company..."
                className="pl-9 h-9 text-sm w-full bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-transparent transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-border/50 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium">Symbol / Company</th>
                <th className="px-4 py-3 font-medium text-right">LTP</th>
                <th className="px-4 py-3 font-medium text-right">Change</th>
                <th className="px-4 py-3 font-medium text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {searching ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Searching...
                  </td>
                </tr>
              ) : filteredSymbols.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No companies found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSymbols.map((stock, index) => (
                  <tr
                    key={stock.symbol ? `${stock.symbol}-${index}` : index}
                    onClick={() => router.push(`/companyDetails/${stock.symbol}`)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stock.symbol}</span>
                        <span className="text-muted-foreground text-xs hidden sm:inline-block max-w-[150px] truncate">
                          {stock.companyName}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{stock.sector}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {stock.ltp.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={`flex flex-col items-end ${stock.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        <span>{stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}</span>
                        <span className="text-xs">{stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {stock.volume ? stock.volume.toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
