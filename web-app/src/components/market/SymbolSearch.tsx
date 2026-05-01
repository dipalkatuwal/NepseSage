"use client";

import { useState } from "react";
import { symbolMaster } from "@/lib/market-data-complete";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export function SymbolSearch() {
  const [query, setQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");

  const sectors = ["All", ...Array.from(new Set(symbolMaster.map((s) => s.sector)))];

  const filteredSymbols = symbolMaster.filter((s) => {
    const matchesSearch = s.symbol.toLowerCase().includes(query.toLowerCase()) || 
                          s.companyName.toLowerCase().includes(query.toLowerCase());
    const matchesSector = selectedSector === "All" || s.sector === selectedSector;
    return matchesSearch && matchesSector;
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium">Symbol / Company</th>
                <th className="px-4 py-3 font-medium text-right">LTP</th>
                <th className="px-4 py-3 font-medium text-right">Change</th>
                <th className="px-4 py-3 font-medium text-right">52W H/L</th>
                <th className="px-4 py-3 font-medium text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredSymbols.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-muted/20 transition-colors cursor-pointer">
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
                    {stock.currentLtp.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`flex flex-col items-end ${stock.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      <span>{stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}</span>
                      <span className="text-xs">{stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <div className="text-emerald-500">{stock.high52Week.toFixed(2)}</div>
                    <div className="text-rose-500">{stock.low52Week.toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    Rs. {stock.marketCap.toLocaleString()} Cr
                  </td>
                </tr>
              ))}
              {filteredSymbols.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No companies found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
