// trigger rebuild
"use client";

import { floorsheetData } from "@/lib/market-data-complete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const getTypeBadge = (type: string) => {
  switch (type) {
    case "bulk":
      return <Badge className="bg-purple-500 hover:bg-purple-600 border-none">Bulk</Badge>;
    case "promoter":
      return <Badge className="bg-blue-500 hover:bg-blue-600 border-none">Promoter</Badge>;
    case "fii":
      return <Badge className="bg-orange-500 hover:bg-orange-600 border-none">FII</Badge>;
    case "mutual_fund":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">Mutual Fund</Badge>;
    default:
      return <Badge variant="outline">Regular</Badge>;
  }
};

export function FloorsheetData() {
  return (
    <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-medium">Live Floorsheet (Significant Trades)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-center">Buyer → Seller</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium text-right">Rate</th>
                <th className="px-4 py-3 font-medium text-right">Amount (Rs)</th>
                <th className="px-4 py-3 font-medium text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {floorsheetData.map((trade) => (
                <tr key={trade.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-emerald-500 font-medium">{trade.buyerBroker}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="text-rose-500 font-medium">{trade.sellerBroker}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {trade.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trade.rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {trade.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getTypeBadge(trade.type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
