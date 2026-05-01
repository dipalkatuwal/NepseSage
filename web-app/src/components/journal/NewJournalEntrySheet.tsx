"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JournalEntry } from "@/lib/services";

const EMOTIONS = [
  "confident",
  "neutral",
  "fearful",
  "greedy",
  "anxious",
  "excited",
  "frustrated",
  "calm",
];

type CreateEntryFn = (payload: Parameters<typeof import("@/lib/services").journalAPI.createEntry>[0]) => Promise<{ success: boolean; entry?: JournalEntry }>;

export function NewJournalEntrySheet({
  createEntry,
  onSuccess,
}: {
  createEntry?: CreateEntryFn;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    symbol: "",
    tradeType: "BUY" as "BUY" | "SELL" | "HOLD",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    pnl: "",
    emotionBefore: "neutral",
    emotionAfter: "",
    reasoning: "",
    lessonsLearned: "",
    marketCondition: "sideways" as
      | "bullish"
      | "bearish"
      | "sideways"
      | "volatile",
    tradeDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async () => {
    if (!form.symbol || !form.reasoning || form.reasoning.length < 10) return;
    setLoading(true);

    const pnlVal = form.pnl ? parseFloat(form.pnl) : undefined;
    const qty = form.quantity ? parseInt(form.quantity) : undefined;
    const entryP = form.entryPrice ? parseFloat(form.entryPrice) : undefined;
    const exitP = form.exitPrice ? parseFloat(form.exitPrice) : undefined;

    // Auto-calc P&L if entry + exit + qty given
    const calcPnl =
      entryP && exitP && qty ? (exitP - entryP) * qty : pnlVal;
    const calcPnlPct =
      entryP && exitP ? ((exitP - entryP) / entryP) * 100 : undefined;

    const result = await createEntry?.({
      symbol: form.symbol.toUpperCase(),
      tradeType: form.tradeType,
      entryPrice: entryP,
      exitPrice: exitP,
      quantity: qty,
      pnl: calcPnl,
      pnlPercent: calcPnlPct,
      emotionBefore: form.emotionBefore,
      emotionAfter: form.emotionAfter || undefined,
      reasoning: form.reasoning,
      lessonsLearned: form.lessonsLearned || undefined,
      marketCondition: form.marketCondition,
      tradeDate: form.tradeDate,
    });

    setLoading(false);
    if (result?.success) {
      onSuccess?.();
      setOpen(false);
      setForm({
        symbol: "",
        tradeType: "BUY",
        entryPrice: "",
        exitPrice: "",
        quantity: "",
        pnl: "",
        emotionBefore: "neutral",
        emotionAfter: "",
        reasoning: "",
        lessonsLearned: "",
        marketCondition: "sideways",
        tradeDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="text-sm text-primary hover:text-primary/80 hover:bg-transparent h-auto p-0"
        >
          + New Entry
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Log Trade Entry</SheetTitle>
          <SheetDescription>
            Record your trade and emotional state for behavioral analysis.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-5 py-6">
          {/* Symbol + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">Symbol</Label>
              <Input
                placeholder="e.g. NICA"
                value={form.symbol}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    symbol: e.target.value.toUpperCase(),
                  }))
                }
                className="uppercase font-heading"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">Trade Type</Label>
              <Select
                value={form.tradeType}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    tradeType: v as "BUY" | "SELL" | "HOLD",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                  <SelectItem value="HOLD">HOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">Entry Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, entryPrice: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">Exit Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={form.exitPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, exitPrice: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">Quantity</Label>
              <Input
                type="number"
                placeholder="100"
                value={form.quantity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quantity: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Date + Market Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">Trade Date</Label>
              <Input
                type="date"
                value={form.tradeDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tradeDate: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="clinical-label text-[0.65rem]">
                Market Condition
              </Label>
              <Select
                value={form.marketCondition}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    marketCondition: v as typeof form.marketCondition,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullish">Bullish</SelectItem>
                  <SelectItem value="bearish">Bearish</SelectItem>
                  <SelectItem value="sideways">Sideways</SelectItem>
                  <SelectItem value="volatile">Volatile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Emotion Before */}
          <div className="flex flex-col gap-3">
            <Label className="clinical-label text-[0.65rem]">
              Emotion Before Trade
            </Label>
            <ToggleGroup
              type="single"
              value={form.emotionBefore}
              onValueChange={(v) =>
                v && setForm((p) => ({ ...p, emotionBefore: v }))
              }
              className="justify-start flex-wrap gap-2"
            >
              {EMOTIONS.map((e) => (
                <ToggleGroupItem
                  key={e}
                  value={e}
                  className="capitalize text-xs h-7 px-3 bg-secondary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {e}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Reasoning */}
          <div className="flex flex-col gap-2">
            <Label className="clinical-label text-[0.65rem]">
              Trade Reasoning
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              placeholder="Why did you make this trade? Be specific about your thesis..."
              value={form.reasoning}
              onChange={(e) =>
                setForm((p) => ({ ...p, reasoning: e.target.value }))
              }
              className="resize-none h-20"
            />
            <p className="text-[10px] text-muted-foreground">
              Min 10 characters. More detail = better AI analysis.
            </p>
          </div>

          {/* Lessons */}
          <div className="flex flex-col gap-2">
            <Label className="clinical-label text-[0.65rem] flex items-center gap-1">
              <Tag className="w-3 h-3" /> Lessons Learned (optional)
            </Label>
            <Textarea
              placeholder="What did this trade teach you?"
              value={form.lessonsLearned}
              onChange={(e) =>
                setForm((p) => ({ ...p, lessonsLearned: e.target.value }))
              }
              className="resize-none h-16"
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            className="w-full"
            disabled={
              loading || !form.symbol || form.reasoning.length < 10
            }
            onClick={handleSubmit}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Analyzing…
              </span>
            ) : (
              "Save Entry"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
