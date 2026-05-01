"use client";

import { useJournal } from "@/hooks/useJournal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { BehavioralEngine } from "@/components/journal/BehavioralEngine";
import { PsychologicalSentimentTrend } from "@/components/journal/PsychologicalSentimentTrend";
import { DisciplineHeatMap } from "@/components/journal/DisciplineHeatMap";
import { TradeJournalTable } from "@/components/journal/TradeJournalTable";

export default function JournalClient() {
  const { entries, loading, createEntry, deleteEntry, fetchEntries } = useJournal();

  return (
    <AuthGuard
      featureName="Behavior Lab"
      featureDesc="The Behavior Lab uses AI to analyze your trading psychology and discipline. Sign in to log your trades and get clinical feedback on your biases."
    >
      <TooltipProvider delayDuration={300}>
        <h1 className="font-heading text-2xl font-bold">Behavior Lab</h1>
        <p className="mt-1 text-sm text-muted-foreground mb-6">
          Analyze the psychology behind your trades. The Sage AI identifies pattern-matching biases and provides clinical feedback.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BehavioralEngine />
          <PsychologicalSentimentTrend />
        </div>

        <DisciplineHeatMap />
        <TradeJournalTable
          entries={entries}
          loading={loading}
          deleteEntry={deleteEntry}
          createEntry={createEntry}
          onEntryCreated={fetchEntries}
        />
      </TooltipProvider>
    </AuthGuard>
  );
}
