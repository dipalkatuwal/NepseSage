import type { Metadata } from "next";
import JournalClient from "./JournalClient";

export const metadata: Metadata = {
  title: "Behavior Lab — NepseSage",
  description: "Analyze the psychology behind your trades",
};

export default function JournalPage() {
  return <JournalClient />;
}
