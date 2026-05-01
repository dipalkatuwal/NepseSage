"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Filter, Download, MoreVertical, Plus, Upload } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { toast } from "sonner";

export function CoreHoldingsTable() {
  const { portfolio, loading, addTransaction, addBulkTransactions } = usePortfolio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Manual entry state
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualType, setManualType] = useState<"BUY" | "SELL">("BUY");
  const [manualQty, setManualQty] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualDate, setManualDate] = useState("");

  const holdings = portfolio?.holdings ?? [];

  const handleManualSubmit = async () => {
    if (!manualSymbol || !manualQty || !manualPrice) {
      toast.error("Please fill required fields");
      return;
    }
    const res = await addTransaction({
      symbol: manualSymbol.toUpperCase(),
      type: manualType,
      quantity: Number(manualQty),
      price: Number(manualPrice),
      date: manualDate || undefined,
    });
    if (res.success) {
      setIsDialogOpen(false);
      setManualSymbol("");
      setManualQty("");
      setManualPrice("");
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
      // Assume format: Symbol, Type, Quantity, Price, Date
      const transactions = [];
      for (let i = 1; i < rows.length; i++) { // skip header
        const cols = rows[i].split(",");
        if (cols.length >= 4) {
          transactions.push({
            symbol: cols[0].toUpperCase().trim(),
            type: cols[1].toUpperCase().trim() as "BUY" | "SELL",
            quantity: Number(cols[2]),
            price: Number(cols[3]),
            date: cols[4] ? cols[4].trim() : undefined,
          });
        }
      }

      if (transactions.length > 0) {
        const res = await addBulkTransactions({ transactions });
        if (res.success) {
          setIsDialogOpen(false);
        }
      } else {
        toast.error("No valid transactions found in CSV");
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (holdings.length === 0) return;
    const rows = [
      ["Symbol", "Sector", "Qty", "Avg Cost", "LTP", "P/L %", "Market Value"],
      ...holdings.map((h) => {
        const pnl =
          h.currentPrice > 0
            ? (((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2)
            : "0.00";
        const value = (h.currentPrice || h.avgBuyPrice) * h.quantity;
        return [
          h.symbol,
          h.sector,
          h.quantity,
          h.avgBuyPrice.toFixed(2),
          h.currentPrice.toFixed(2),
          `${Number(pnl) >= 0 ? "+" : ""}${pnl}%`,
          `Rs. ${value.toLocaleString()}`,
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.csv";
    a.click();
    toast.success("Portfolio exported");
  };

  if (loading) {
    return (
      <Card className="card-clinical p-0 shadow-none overflow-hidden">
        <CardHeader className="p-5 pb-0">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-clinical p-0 shadow-none overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 pb-0 gap-3 sm:gap-0">
        <CardTitle className="clinical-label text-sm">Core Holdings</CardTitle>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>


            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="manual" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="csv">CSV Import</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Symbol</label>
                      <Input placeholder="e.g. NABIL" value={manualSymbol} onChange={e => setManualSymbol(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Type</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={manualType}
                        onChange={e => setManualType(e.target.value as "BUY" | "SELL")}
                      >
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Quantity</label>
                      <Input type="number" placeholder="0" value={manualQty} onChange={e => setManualQty(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Price</label>
                      <Input type="number" placeholder="0.00" value={manualPrice} onChange={e => setManualPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Date (Optional)</label>
                    <Input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                  </div>
                  <Button className="w-full mt-2" onClick={handleManualSubmit}>Save Transaction</Button>
                </TabsContent>
                <TabsContent value="csv" className="mt-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-3 bg-muted rounded-full">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Upload CSV File</p>
                      <p className="text-xs text-muted-foreground mt-1">Format: Symbol, Type, Quantity, Price, Date</p>
                    </div>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('csv-upload')?.click()}>
                      Choose File
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-4 w-4" />
          </Button> */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 overflow-x-auto">
        {holdings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No holdings yet. Add your first BUY transaction to get started.
          </div>
        ) : (
          <Table className="w-full min-w-[700px] ">
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="clinical-label h-auto py-3">Symbol</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-right">Qty</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-right">Avg Cost</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-right">LTP</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-right">P/L %</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-right">Market Value</TableHead>
                <TableHead className="h-auto w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {holdings.map((h) => {
                const price = h.currentPrice || h.avgBuyPrice;
                const pnlPct =
                  ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100;
                const value = price * h.quantity;
                const positive = pnlPct >= 0;

                return (
                  <TableRow
                    key={h.symbol}
                    className="border-b border-border/50 hover:bg-secondary/20 h-[56px]"
                  >
                    {/* SYMBOL */}
                    <TableCell className="py-3 font-heading text-sm font-bold">
                      <div className="flex flex-col leading-tight">
                        <span>{h.symbol}</span>
                        <span className="text-[10px] text-muted-foreground font-sans font-normal">
                          {h.sector}
                        </span>
                      </div>
                    </TableCell>

                    {/* QTY */}
                    <TableCell className="py-3 text-right text-sm text-muted-foreground tabular-nums">
                      {h.quantity.toLocaleString()}
                    </TableCell>

                    {/* AVG COST */}
                    <TableCell className="py-3 text-right text-sm text-muted-foreground tabular-nums">
                      {h.avgBuyPrice.toFixed(2)}
                    </TableCell>

                    {/* LTP */}
                    <TableCell className="py-3 text-right text-sm tabular-nums">
                      {price.toFixed(2)}
                    </TableCell>

                    {/* P/L */}
                    <TableCell
                      className={`py-3 text-right text-sm font-semibold tabular-nums ${positive ? "positive" : "negative"
                        }`}
                    >
                      {positive ? "+" : ""}
                      {pnlPct.toFixed(2)}%
                    </TableCell>

                    {/* VALUE */}
                    <TableCell className="py-3 text-right text-sm tabular-nums">
                      Rs. {value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>

                    {/* ACTION */}
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                addTransaction({
                                  symbol: h.symbol,
                                  type: "BUY",
                                  quantity: 1,
                                  price,
                                })
                              }
                            >
                              Buy More
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                addTransaction({
                                  symbol: h.symbol,
                                  type: "SELL",
                                  quantity: h.quantity,
                                  price,
                                })
                              }
                            >
                              Sell All
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Chart</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
