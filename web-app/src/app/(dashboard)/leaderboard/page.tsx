import type { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard — NepseSage",
  description: "Top analyst rankings on NepseSage",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
