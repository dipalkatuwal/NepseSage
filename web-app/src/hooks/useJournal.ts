"use client";

import { useState, useEffect, useCallback } from "react";
import {
  journalAPI,
  type JournalEntry,
  type DisciplineScore,
} from "@/lib/services";
import { toast } from "sonner";

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [discipline, setDiscipline] = useState<DisciplineScore | null>(null);
  const [biases, setBiases] = useState<
    { bias: string; count: number; severity: string; symbols: string[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(
    async (params?: {
      symbol?: string;
      tradeType?: string;
      isRedFlag?: boolean;
      page?: number;
    }) => {
      try {
        setLoading(true);
        const data = await journalAPI.getEntries({ limit: 20, ...params });
        setEntries(data.entries);
        setTotal(data.total);
      } catch {
        toast.error("Failed to load journal entries");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchDiscipline = useCallback(async () => {
    try {
      const data = await journalAPI.getDisciplineScore();
      setDiscipline(data);
    } catch {
      // silent
    }
  }, []);

  const fetchBiases = useCallback(async () => {
    try {
      const data = await journalAPI.getBiases();
      setBiases(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchDiscipline();
    fetchBiases();
  }, [fetchEntries, fetchDiscipline, fetchBiases]);

  const createEntry = useCallback(
    async (
      payload: Parameters<typeof journalAPI.createEntry>[0]
    ) => {
      try {
        const entry = await journalAPI.createEntry(payload);
        setEntries((prev) => [entry, ...prev]);
        // Refresh discipline score
        fetchDiscipline();
        fetchBiases();
        toast.success("Journal entry saved");
        // Warn if red flag detected
        if (entry.isRedFlag && entry.detectedBiases.length > 0) {
          toast.warning(
            `Bias detected: ${entry.detectedBiases.join(", ")}`,
            { duration: 5000 }
          );
        }
        return { success: true, entry };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to save entry";
        toast.error(msg);
        return { success: false };
      }
    },
    [fetchDiscipline, fetchBiases]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        await journalAPI.deleteEntry(id);
        setEntries((prev) => prev.filter((e) => e._id !== id));
        fetchDiscipline();
        toast.success("Entry deleted");
      } catch {
        toast.error("Failed to delete entry");
      }
    },
    [fetchDiscipline]
  );

  return {
    entries,
    total,
    discipline,
    biases,
    loading,
    fetchEntries,
    createEntry,
    deleteEntry,
  };
}
