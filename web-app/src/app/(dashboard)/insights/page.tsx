import type { Metadata } from "next";
import { InsightsClient } from "@/components/dashboard/InsightsClient";

export const metadata: Metadata = {
  title: "Insights — NEPSE Sage AI",
  description: "Real-time market insights from verified analysts",
};

export default function InsightsPage() {
  return <InsightsClient />;
}
