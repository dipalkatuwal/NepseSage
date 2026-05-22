"use client";

import { useState, useRef } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download, MoreVertical, Plus, Upload, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedHolding {
  symbol: string;
  quantity: number;
  ltp: number;
  lastClosingPrice: number;
  marketValue: number;
}
interface ParseResult {
  holderName?: string;
  boid?: string;
  holdings: ParsedHolding[];
  errors: string[];
}

// ── MeroShare PDF token parser ────────────────────────────────────────────────
// pdf.js emits text as individual positioned tokens (not full lines).
// We walk the token array, find numbered-row anchors like "1." "2.", grab the
// next uppercase symbol, then collect the next run of numbers.
// Column order: qty | lastClosingPrice | valueLC | ltp | valueLTP
function parseMeroShareTokens(tokens: string[]): ParseResult {
  const result: ParseResult = { holdings: [], errors: [] };

  const flat = tokens.join(" ");

  const nameMatch = flat.match(/Holder\s+Name\s*:\s*([A-Z][A-Z\s]+?)(?:Address|BOID)/i);
  if (nameMatch) result.holderName = nameMatch[1].replace(/\s+/g, " ").trim();

  const boidMatch = flat.match(/BOID\s*:\s*(\d{10,})/i);
  if (boidMatch) result.boid = boidMatch[1].trim();

  const numDotRe = /^\d+\.$/;
  const symbolRe = /^[A-Z][A-Z0-9]{1,10}$/;
  const numRe    = /^\d+(\.\d+)?$/;

  for (let i = 0; i < tokens.length; i++) {
    if (!numDotRe.test(tokens[i])) continue;

    let j = i + 1;
    while (j < tokens.length && tokens[j].trim() === "") j++;
    if (j >= tokens.length || !symbolRe.test(tokens[j])) continue;

    const symbol = tokens[j];
    j++;

    const nums: number[] = [];
    while (j < tokens.length && nums.length < 6) {
      const t = tokens[j].trim();
      if (numRe.test(t)) {
        nums.push(parseFloat(t));
      } else if (t !== "" && !numDotRe.test(t)) {
        break;
      }
      j++;
    }

    if (nums.length >= 5) {
      const [qty, lastClose, , ltp, valueLTP] = nums;
      result.holdings.push({
        symbol, quantity: qty,
        ltp: ltp > 0 ? ltp : lastClose,
        lastClosingPrice: lastClose,
        marketValue: valueLTP,
      });
    } else if (nums.length >= 2) {
      result.holdings.push({
        symbol, quantity: nums[0], ltp: nums[1],
        lastClosingPrice: nums[1], marketValue: nums[0] * nums[1],
      });
    }
  }

  if (result.holdings.length === 0) {
    result.errors.push("No holdings found. Make sure this is a MeroShare 'Summary Statement Of Account's Share Values' PDF.");
  }
  return result;
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsvText(text: string): ParseResult {
  const result: ParseResult = { holdings: [], errors: [] };
  const rows = text.split("\n").map((r) => r.trim()).filter(Boolean);
  if (rows.length < 2) {
    result.errors.push("CSV appears empty or has only a header row.");
    return result;
  }

  const header = rows[0].toLowerCase();

  if (header.includes("scrip") || header.includes("current balance")) {
    const cols    = header.split(",").map((c) => c.trim());
    const scripIdx = cols.findIndex((c) => c.includes("scrip"));
    const balIdx   = cols.findIndex((c) => c.includes("current balance") || c === "balance");
    const ltpIdx   = cols.findIndex((c) => c === "ltp" || c.includes("last transaction"));
    const lcpIdx   = cols.findIndex((c) => c.includes("last closing"));

    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i].split(",").map((p) => p.trim());
      const symbol = parts[scripIdx]?.toUpperCase();
      const qty    = parseFloat(parts[balIdx]);
      const ltp    = ltpIdx >= 0 ? parseFloat(parts[ltpIdx]) : NaN;
      const lcp    = lcpIdx >= 0 ? parseFloat(parts[lcpIdx]) : NaN;
      const price  = !isNaN(ltp) && ltp > 0 ? ltp : !isNaN(lcp) ? lcp : NaN;
      if (symbol && !isNaN(qty) && !isNaN(price)) {
        result.holdings.push({ symbol, quantity: qty, ltp: price, lastClosingPrice: lcp || price, marketValue: qty * price });
      } else {
        result.errors.push(`Row ${i + 1}: skipped — invalid data`);
      }
    }
    return result;
  }

  // NepseSage standard: Symbol, Type, Quantity, Price, Date
  for (let i = 1; i < rows.length; i++) {
    const parts = rows[i].split(",").map((p) => p.trim());
    if (parts.length >= 4) {
      const symbol = parts[0].toUpperCase();
      const qty    = parseFloat(parts[2]);
      const price  = parseFloat(parts[3]);
      if (symbol && !isNaN(qty) && !isNaN(price)) {
        result.holdings.push({ symbol, quantity: qty, ltp: price, lastClosingPrice: price, marketValue: qty * price });
      } else {
        result.errors.push(`Row ${i + 1}: skipped — invalid data`);
      }
    }
  }

  if (result.holdings.length === 0) {
    result.errors.push("No valid rows found. Accepted formats: NepseSage CSV or MeroShare CSV.");
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CoreHoldingsTable() {
  const { portfolio, loading, addTransaction, addBulkTransactions } = usePortfolio();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ── Buy/Sell dialog state ──────────────────────────────────────────────────
  const [bsOpen, setBsOpen] = useState(false);
  const [bsSymbol, setBsSymbol] = useState("");
  const [bsMaxQty, setBsMaxQty] = useState(0);
  const [bsCurrentPrice, setBsCurrentPrice] = useState(0);
  const [bsType, setBsType] = useState<"BUY" | "SELL">("BUY");
  const [bsQty, setBsQty] = useState("");
  const [bsPrice, setBsPrice] = useState("");
  const [bsSubmitting, setBsSubmitting] = useState(false);

  const openBuySell = (symbol: string, currentPrice: number, heldQty: number) => {
    setBsSymbol(symbol);
    setBsCurrentPrice(currentPrice);
    setBsMaxQty(heldQty);
    setBsType("BUY");
    setBsQty("");
    setBsPrice(currentPrice.toFixed(2));
    setBsOpen(true);
  };

  const handleBsSubmit = async () => {
    const qty = Number(bsQty);
    const price = Number(bsPrice);
    if (!qty || qty <= 0 || !price || price <= 0) {
      toast.error("Enter a valid quantity and price");
      return;
    }
    if (bsType === "SELL" && qty > bsMaxQty) {
      toast.error(`You only hold ${bsMaxQty} shares`);
      return;
    }
    setBsSubmitting(true);
    const res = await addTransaction({ symbol: bsSymbol, type: bsType, quantity: qty, price });
    setBsSubmitting(false);
    if (res.success) setBsOpen(false);
  };

  const [manualSymbol, setManualSymbol] = useState("");
  const [manualType,   setManualType]   = useState<"BUY" | "SELL">("BUY");
  const [manualQty,    setManualQty]    = useState("");
  const [manualPrice,  setManualPrice]  = useState("");
  const [manualDate,   setManualDate]   = useState("");

  const [parseResult,   setParseResult]   = useState<ParseResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importDone,    setImportDone]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const holdings = portfolio?.holdings ?? [];

  // ── Manual submit ──────────────────────────────────────────────────────────
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
      setManualSymbol(""); setManualQty(""); setManualPrice("");
    }
  };

  // ── Confirm import ─────────────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.holdings.length === 0) return;
    setImportLoading(true);
    const transactions = parseResult.holdings.map((h) => ({
      symbol: h.symbol,
      type: "BUY" as const,
      quantity: h.quantity,
      price: h.ltp > 0 ? h.ltp : h.lastClosingPrice,
    }));
    const res = await addBulkTransactions({ transactions });
    setImportLoading(false);
    if (res.success) {
      setImportDone(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        setParseResult(null);
        setImportDone(false);
      }, 1500);
    }
  };

  const resetImport = () => {
    setParseResult(null);
    setImportDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Unified file upload: auto-detects CSV vs PDF ───────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    setImportLoading(true);
    setParseResult(null);

    if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();

        type PdfjsLib = {
          GlobalWorkerOptions: { workerSrc: string };
          getDocument: (src: { data: ArrayBuffer }) => {
            promise: Promise<{
              numPages: number;
              getPage: (n: number) => Promise<{
                getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
              }>;
            }>;
          };
        };
        type WindowWithPdfjs = Window & { pdfjsLib?: PdfjsLib };

        if (!(window as WindowWithPdfjs).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload  = () => resolve();
            script.onerror = () => reject(new Error("Failed to load pdf.js"));
            document.head.appendChild(script);
          });
          const lib = (window as WindowWithPdfjs).pdfjsLib;
          if (lib) {
            lib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
        }

        const pdfjsLib = (window as WindowWithPdfjs).pdfjsLib!;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const allTokens: string[] = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page    = await pdf.getPage(p);
          const content = await page.getTextContent();
          content.items.forEach((item) => {
            item.str.split(/\s+/).forEach((t) => { if (t) allTokens.push(t); });
          });
        }

        setParseResult(parseMeroShareTokens(allTokens));
      } catch (err) {
        console.error(err);
        toast.error("Failed to read PDF. Make sure it's a valid MeroShare portfolio PDF.");
      } finally {
        setImportLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setParseResult(parseCsvText(text));
        setImportLoading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read CSV file.");
        setImportLoading(false);
      };
      reader.readAsText(file);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (holdings.length === 0) return;
    const rows = [
      ["Symbol", "Sector", "Qty", "Avg Cost", "LTP", "P/L %", "Market Value"],
      ...holdings.map((h) => {
        const pnl = h.currentPrice > 0
          ? (((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2)
          : "0.00";
        const value = (h.currentPrice || h.avgBuyPrice) * h.quantity;
        return [
          h.symbol, h.sector, h.quantity,
          h.avgBuyPrice.toFixed(2), h.currentPrice.toFixed(2),
          `${Number(pnl) >= 0 ? "+" : ""}${pnl}%`,
          `Rs. ${value.toLocaleString()}`,
        ];
      }),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "portfolio.csv"; a.click();
    toast.success("Portfolio exported");
  };

  // ── Import preview panel ───────────────────────────────────────────────────
  const ImportPreview = () => {
    if (importLoading) return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Parsing file…</p>
      </div>
    );

    if (importDone) return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-emerald-500">
        <CheckCircle2 className="h-8 w-8" />
        <p className="text-sm font-semibold">Import successful!</p>
      </div>
    );

    if (!parseResult) return null;

    return (
      <div className="mt-4 space-y-3">
        {(parseResult.holderName || parseResult.boid) && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
            {parseResult.holderName && <p>Holder: <span className="text-foreground font-medium">{parseResult.holderName}</span></p>}
            {parseResult.boid && <p>BOID: <span className="text-foreground font-mono">{parseResult.boid}</span></p>}
          </div>
        )}
        {parseResult.errors.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 space-y-1">
            {parseResult.errors.map((e, i) => (
              <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 shrink-0" /> {e}
              </p>
            ))}
          </div>
        )}
        {parseResult.holdings.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              Found <span className="text-foreground font-semibold">{parseResult.holdings.length}</span> holding{parseResult.holdings.length !== 1 ? "s" : ""} — will be imported as BUY transactions at LTP.
            </p>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Symbol</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">LTP</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.holdings.map((h, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-2 font-bold font-heading">{h.symbol}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{h.quantity.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(h.ltp || h.lastClosingPrice).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        Rs. {h.marketValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="text-xs" onClick={resetImport}>Cancel</Button>
              <Button size="sm" className="text-xs flex-1" onClick={handleConfirmImport} disabled={importLoading}>
                {importLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Import {parseResult.holdings.length} Holding{parseResult.holdings.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}
        {parseResult.holdings.length === 0 && parseResult.errors.length > 0 && (
          <Button variant="outline" size="sm" className="text-xs w-full" onClick={resetImport}>Try Again</Button>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="card-clinical p-0 shadow-none overflow-hidden">
        <CardHeader className="p-5 pb-0">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="card-clinical p-0 shadow-none overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 pb-0 gap-3 sm:gap-0">
        <CardTitle className="clinical-label text-sm">Core Holdings</CardTitle>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetImport(); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Holdings</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="manual" className="w-full mt-4" onValueChange={() => resetImport()}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="import">Import File</TabsTrigger>
                </TabsList>

                {/* ── Manual ── */}
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Symbol</label>
                      <Input placeholder="e.g. NABIL" value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Type</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={manualType}
                        onChange={(e) => setManualType(e.target.value as "BUY" | "SELL")}
                      >
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Quantity</label>
                      <Input type="number" placeholder="0" value={manualQty} onChange={(e) => setManualQty(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Price (Rs.)</label>
                      <Input type="number" placeholder="0.00" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Date (Optional)</label>
                    <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                  </div>
                  <Button className="w-full mt-2" onClick={handleManualSubmit}>Save Transaction</Button>
                </TabsContent>

                {/* ── Import ── */}
                <TabsContent value="import" className="mt-4">
                  {!parseResult && !importLoading && (
                    <>
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3 hover:border-primary/40 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="p-3 bg-muted rounded-full">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Upload CSV or PDF</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to browse — format is detected automatically
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px]">CSV</Badge>
                          <Badge variant="outline" className="text-[10px]">MeroShare PDF</Badge>
                        </div>
                      </div>
                      <div className="mt-3 rounded-md bg-muted/40 px-3 py-2.5 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Supported formats:</p>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div><span className="text-foreground font-medium">MeroShare PDF</span> — "Summary Statement Of Account's Share Values" from meroshare.cdsc.com.np</div>
                          <div><span className="text-foreground font-medium">MeroShare CSV</span> — CSV export with Scrip / Current Balance / LTP columns</div>
                          <div><span className="text-foreground font-medium">NepseSage CSV</span> — Symbol, Type, Quantity, Price, Date</div>
                        </div>
                        <p className="text-xs text-muted-foreground pt-0.5">
                          All holdings are imported as <span className="text-foreground font-medium">BUY</span> transactions at LTP.
                        </p>
                      </div>
                    </>
                  )}
                  <ImportPreview />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost" size="icon"
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
          <Table className="w-full min-w-[700px]">
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
                const price   = h.currentPrice || h.avgBuyPrice;
                const pnlPct  = ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100;
                const value   = price * h.quantity;
                const positive = pnlPct >= 0;
                return (
                  <TableRow key={h.symbol} className="border-b border-border/50 hover:bg-secondary/20 h-[56px]">
                    <TableCell className="py-3 font-heading text-sm font-bold">
                      <Link
                        href={`/companyDetails/${h.symbol}`}
                        className="flex flex-col leading-tight hover:text-primary transition-colors cursor-pointer group"
                      >
                        <span className="group-hover:underline">{h.symbol}</span>
                        <span className="text-[10px] text-muted-foreground font-sans font-normal">{h.sector}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm text-muted-foreground tabular-nums">
                      {h.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm text-muted-foreground tabular-nums">
                      {h.avgBuyPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm tabular-nums">
                      {price.toFixed(2)}
                    </TableCell>
                    <TableCell className={`py-3 text-right text-sm font-semibold tabular-nums ${positive ? "positive" : "negative"}`}>
                      {positive ? "+" : ""}{pnlPct.toFixed(2)}%
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm tabular-nums">
                      Rs. {value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openBuySell(h.symbol, price, h.quantity)}>
                              Buy / Sell
                            </DropdownMenuItem>
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
      {/* ── Buy / Sell Dialog ─────────────────────────────────────────── */}
      <Dialog open={bsOpen} onOpenChange={(open) => { if (!bsSubmitting) setBsOpen(open); }}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-base">
              {bsSymbol}
              <span className="ml-2 text-xs font-sans font-normal text-muted-foreground">
                LTP {bsCurrentPrice.toFixed(2)} · Holding {bsMaxQty} shares
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Buy / Sell toggle */}
          <div className="flex rounded-md overflow-hidden border border-border mt-2">
            <button
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${bsType === "BUY" ? "bg-emerald-500 text-white" : "bg-transparent text-muted-foreground hover:bg-muted"}`}
              onClick={() => setBsType("BUY")}
            >
              Buy
            </button>
            <button
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${bsType === "SELL" ? "bg-red-500 text-white" : "bg-transparent text-muted-foreground hover:bg-muted"}`}
              onClick={() => setBsType("SELL")}
            >
              Sell
            </button>
          </div>

          <div className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Quantity</label>
              <Input
                type="number"
                min={1}
                max={bsType === "SELL" ? bsMaxQty : undefined}
                placeholder={bsType === "SELL" ? `Max ${bsMaxQty}` : "0"}
                value={bsQty}
                onChange={(e) => setBsQty(e.target.value)}
              />
              {bsType === "SELL" && bsQty && Number(bsQty) > bsMaxQty && (
                <p className="text-xs text-red-500">Exceeds held quantity ({bsMaxQty})</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Price (Rs.)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={bsPrice}
                onChange={(e) => setBsPrice(e.target.value)}
              />
            </div>

            {/* Summary row */}
            {bsQty && bsPrice && Number(bsQty) > 0 && Number(bsPrice) > 0 && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs flex justify-between text-muted-foreground">
                <span>Total</span>
                <span className="text-foreground font-semibold">
                  Rs. {(Number(bsQty) * Number(bsPrice)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}

            <Button
              className={`w-full mt-1 ${bsType === "SELL" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
              onClick={handleBsSubmit}
              disabled={bsSubmitting}
            >
              {bsSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
              {bsType === "BUY" ? "Execute Buy" : "Execute Sell"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}