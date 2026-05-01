"use client";

import { useState, useEffect, useCallback } from "react";
import { simulatorAPI, type Simulator } from "@/lib/services";
import { toast } from "sonner";

export function useSimulator() {
  const [sim, setSim] = useState<Simulator | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

  const fetchSim = useCallback(async () => {
    try {
      setLoading(true);
      const data = await simulatorAPI.get();
      setSim(data);
    } catch {
      toast.error("Failed to load simulator");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSim();
  }, [fetchSim]);

  const placeOrder = useCallback(
    async (payload: {
      symbol: string;
      type: "BUY" | "SELL";
      quantity: number;
      price: number;
    }) => {
      try {
        setOrderLoading(true);
        const updated = await simulatorAPI.placeOrder(payload);
        setSim(updated);
        toast.success(
          `${payload.type} ${payload.quantity} × ${payload.symbol} @ NPR ${payload.price.toLocaleString()}`
        );
        return { success: true };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Order failed";
        toast.error(msg);
        return { success: false, error: msg };
      } finally {
        setOrderLoading(false);
      }
    },
    []
  );

  const resetSim = useCallback(async () => {
    try {
      await simulatorAPI.reset();
      await fetchSim();
      toast.success("Simulator reset to NPR 10,00,000");
    } catch {
      toast.error("Reset failed");
    }
  }, [fetchSim]);

  return { sim, loading, orderLoading, fetchSim, placeOrder, resetSim };
}
