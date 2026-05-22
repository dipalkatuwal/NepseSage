import type { Metadata } from "next";
import { AuthGuard } from "@/components/shared/AuthGuard";
import SimulatorClient from "./SimulatorClient";

export const metadata: Metadata = {
  title: "Simulator — NepseSage",
  description: "Practice trading with virtual portfolio",
};

export default function SimulatorPage() {
  return (
    <AuthGuard
      require="pro"
      featureName="Simulator"
      featureDesc="Practice trading with real NEPSE data and a virtual portfolio. Zero risk, full experience."
    >
      <SimulatorClient />
    </AuthGuard>
  );
}
