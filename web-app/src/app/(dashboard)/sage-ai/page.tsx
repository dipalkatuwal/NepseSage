import type { Metadata } from "next";
import SageAIClient from "./SageAIClient";

export const metadata: Metadata = {
  title: "Sage AI — NepseSage",
  description: "AI-powered market analysis chat",
};

export default function SageAIPage() {
  return <SageAIClient />;
}
