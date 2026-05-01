"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useSimulator } from "@/hooks/useSimulator";
import { nepseAPI } from "@/lib/services";

export default function SimulatorClient() {
  const { sim, loading, orderLoading, placeOrder, resetSim } = useSimulator();

  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  const fetchLTP = async () => {
    if (!symbol) return;
    try {
      const data = await nepseAPI.getSymbol(symbol.toUpperCase());
      if (data?.ltp) setPrice(data.ltp.toFixed(2));
    } catch {
      // symbol not found
    }
  };

  const handleOrder = async (type: "BUY" | "SELL") => {
    if (!symbol || !qty || !price) return;
    await placeOrder({
      symbol: symbol.toUpperCase(),
      type,
      quantity: parseInt(qty),
      price: parseFloat(price),
    });
    setQty("");
    setPrice("");
  };

  const formatNPR = (v: number) =>
    `Rs. ${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const statsData = sim
    ? [
        { label: "Virtual Balance", value: formatNPR(sim.cash) },
        {
          label: "Total P/L",
          value: `${sim.totalPnL >= 0 ? "+" : "-"}${formatNPR(sim.totalPnL)}`,
          positive: sim.totalPnL >= 0,
        },
        { label: "Win Rate", value: `${sim.winRate.toFixed(1)}%` },
        { label: "Total Trades", value: String(sim.totalTrades) },
      ]
    : [
        { label: "Virtual Balance", value: "Rs. 10,00,000" },
        { label: "Total P/L", value: "+Rs. 0" },
        { label: "Win Rate", value: "0%" },
        { label: "Total Trades", value: "0" },
      ];

  return (
    <AuthGuard
      featureName="Trading Simulator"
      featureDesc="The Trading Simulator allows you to practice your strategies with Rs. 10,00,000 in virtual capital. Sign in to start your paper trading journey without risk."
    >
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Trading Simulator</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        <div>
          <h1 className="font-heading text-2xl font-bold">Trading Simulator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice your strategies with virtual capital. No risk, real market data.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Lock className="w-4 h-4" /> Reset Simulation
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the simulator?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset your balance back to Rs. 10,00,000 and clear all
                positions and order history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetSim}>
                Yes, Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsData.map((s) => (
          <Card key={s.label} className="card-clinical p-0 shadow-none">
            <CardContent className="p-5">
              <p className="clinical-label text-[10px] uppercase">{s.label}</p>
              <span
                className={`stat-value text-xl mt-2 block ${("positive" in s && s.positive) ? "positive" : ""}`}
              >
                {loading ? <Skeleton className="h-7 w-24" /> : s.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="h-[500px]">
        {/* @ts-ignore */}
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-full w-full rounded-lg border border-border"
        >
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full flex flex-col bg-card p-4">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                <h3 className="clinical-label text-sm">Market Simulation</h3>
                <div className="flex gap-2">
                  <Button size="icon" variant="default" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 rounded-md bg-secondary/50 flex items-center justify-center border border-border mt-2">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm font-semibold">
                    Live Simulation Chart
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a symbol and place an order to begin
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border" />
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full flex flex-col gap-4 bg-muted/20 p-4">
              {/* Quick Trade */}
              <Card className="card-clinical p-0 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border">
                  <CardTitle className="clinical-label text-xs">
                    Quick Trade
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Symbol (e.g. NICA)"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      onBlur={fetchLTP}
                      className="w-full text-sm uppercase font-heading bg-background"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Qty"
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="text-sm bg-background font-mono"
                      />
                      <Input
                        placeholder="Price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="text-sm bg-background font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        className="w-full font-semibold"
                        disabled={orderLoading || !symbol || !qty || !price}
                        onClick={() => handleOrder("BUY")}
                      >
                        {orderLoading ? "..." : "Buy"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full font-semibold"
                        disabled={orderLoading || !symbol || !qty || !price}
                        onClick={() => handleOrder("SELL")}
                      >
                        {orderLoading ? "..." : "Sell"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Positions */}
              <Card className="card-clinical p-0 shadow-none flex-1 overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-2 border-b border-border shrink-0">
                  <CardTitle className="clinical-label text-xs">
                    Open Positions (Right Click)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-y-auto space-y-2">
                  {loading ? (
                    [...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))
                  ) : !sim?.holdings?.length ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No open positions
                    </p>
                  ) : (
                    sim.holdings.map((h) => {
                      const pnlPct = h.currentPrice
                        ? (
                            ((h.currentPrice - h.avgBuyPrice) /
                              h.avgBuyPrice) *
                            100
                          ).toFixed(2)
                        : "0.00";
                      const positive = parseFloat(pnlPct) >= 0;

                      return (
                        <ContextMenu key={h.symbol}>
                          <ContextMenuTrigger>
                            <div className="flex items-center justify-between rounded-md bg-background border border-border p-3 transition hover:bg-secondary/50 cursor-context-menu">
                              <div>
                                <span className="font-heading text-sm font-bold">
                                  {h.symbol}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2 font-mono">
                                  {h.quantity} units
                                </span>
                              </div>
                              <span
                                className={`text-sm font-semibold ${positive ? "positive" : "negative"}`}
                              >
                                {positive ? "+" : ""}
                                {pnlPct}%
                              </span>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              onClick={() =>
                                handleOrder("SELL")
                              }
                            >
                              Close Position{" "}
                              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem>View Chart</ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AuthGuard>
  );
}
