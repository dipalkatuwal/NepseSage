"use client";

import { useState } from "react";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { NewJournalEntrySheet } from "./NewJournalEntrySheet";
import type { JournalEntry } from "@/lib/services";

const EMOTION_COLOR: Record<string, string> = {
  confident: "badge-bullish",
  calm: "badge-bullish",
  neutral: "bg-secondary text-muted-foreground",
  fearful: "badge-bearish",
  greedy: "badge-bearish",
  frustrated: "badge-bearish",
  anxious: "bg-warning/10 text-warning border-warning/20",
  excited: "bg-primary/10 text-primary border-primary/20",
};

export function TradeJournalTable({
  entries,
  loading,
  deleteEntry,
  createEntry,
  onEntryCreated,
}: {
  entries: JournalEntry[];
  loading: boolean;
  deleteEntry: (id: string) => Promise<void>;
  createEntry?: Parameters<typeof import("@/components/journal/NewJournalEntrySheet").NewJournalEntrySheet>[0]["createEntry"];
  onEntryCreated?: () => void;
}) {
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);

  return (
    <Card className="card-clinical p-0 shadow-none overflow-hidden mt-6">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="clinical-label">Detailed Trade Journal</CardTitle>
        <NewJournalEntrySheet createEntry={createEntry} onSuccess={onEntryCreated} />
      </CardHeader>
      <CardContent className="p-2 overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No journal entries yet. Click &quot;+ New Entry&quot; to log your first trade.
          </div>
        ) : (
          <Table className="w-full min-w-[700px]">
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="clinical-label h-auto py-3">Symbol</TableHead>
                <TableHead className="clinical-label h-auto py-3">Date</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-center">Emotion</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-center">P&L</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-center">Flags</TableHead>
                <TableHead className="clinical-label h-auto py-3">Reasoning</TableHead>
                <TableHead className="clinical-label h-auto py-3 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...entries]
                .sort((a, b) => {
                  const dateDiff = new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime();
                  if (dateDiff !== 0) return dateDiff;
                  // Same date: fall back to MongoDB ObjectId order (newer _id = created later)
                  return b._id > a._id ? 1 : b._id < a._id ? -1 : 0;
                })
                .map((e) => (
                  <TableRow
                    key={e._id}
                    className="border-b border-border/50 hover:bg-secondary/20"
                  >
                    <TableCell className="py-3">
                      <span className="font-heading text-sm font-bold">
                        {e.symbol}
                      </span>
                      <p className="text-xs text-muted-foreground">{e.tradeType}</p>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground font-mono">
                      {new Date(e.tradeDate).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`border-0 rounded px-2 py-0.5 text-[10px] font-semibold capitalize ${EMOTION_COLOR[e.emotionBefore] ?? "bg-secondary text-muted-foreground"}`}
                      >
                        {e.emotionBefore}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`py-3 text-center text-sm font-bold ${e.pnl > 0 ? "positive" : e.pnl < 0 ? "negative" : "text-muted-foreground"}`}
                    >
                      {e.pnl !== 0
                        ? `${e.pnl > 0 ? "+" : ""}Rs. ${Math.abs(e.pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {e.isRedFlag ? (
                        <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">
                          {e.detectedBiases[0] ?? "Flag"}
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                          Clean
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground w-1/3 truncate max-w-xs">
                      {e.reasoning}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewEntry(e)}>
                            <MoreVertical className="h-3.5 w-3.5 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteEntry(e._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!viewEntry} onOpenChange={(o) => !o && setViewEntry(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Trade Details: {viewEntry?.symbol}</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Date</span>
                  <p className="font-medium">{new Date(viewEntry.tradeDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Type</span>
                  <p className="font-medium">{viewEntry.tradeType}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Entry Price</span>
                  <p className="font-medium">{viewEntry.entryPrice ? `Rs. ${viewEntry.entryPrice}` : "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Exit Price</span>
                  <p className="font-medium">{viewEntry.exitPrice ? `Rs. ${viewEntry.exitPrice}` : "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Quantity</span>
                  <p className="font-medium">{viewEntry.quantity || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">P&L</span>
                  <p className={`font-bold ${viewEntry.pnl > 0 ? "positive" : viewEntry.pnl < 0 ? "negative" : ""}`}>
                    {viewEntry.pnl !== 0 ? `Rs. ${viewEntry.pnl.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Emotion Before</span>
                  <p className="font-medium capitalize">{viewEntry.emotionBefore}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Market Condition</span>
                  <p className="font-medium capitalize">{viewEntry.marketCondition || "—"}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Reasoning</span>
                <p className="text-sm mt-1 bg-secondary p-3 rounded-md">{viewEntry.reasoning}</p>
              </div>

              {viewEntry.lessonsLearned && (
                <div>
                  <span className="text-xs text-muted-foreground">Lessons Learned</span>
                  <p className="text-sm mt-1 bg-secondary/50 p-3 rounded-md">{viewEntry.lessonsLearned}</p>
                </div>
              )}

              {viewEntry.isRedFlag && (
                <div>
                  <span className="text-xs text-muted-foreground">Detected Biases</span>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {viewEntry.detectedBiases.map(b => (
                      <Badge key={b} variant="destructive">{b}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
