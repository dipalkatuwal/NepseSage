"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ThumbsUp, MessageSquare, FileText, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  title: string;
  // portfolio
  portfolioValue: number;
  returnPct: string;
  returnRaw: number;
  totalTrades: number;
  winRate: string;
  winningTrades: number;
  // community
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  // score
  compositeScore: number;
  reputation: string;
  reputationRaw: number;
  badges: string[];
  isCurrentUser: boolean;
}

interface CurrentUser extends LeaderboardEntry {}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: CurrentUser | null;
  total: number;
  period: string;
}

const periodMap: Record<string, string> = {
  Weekly: "weekly",
  Monthly: "monthly",
  "All-Time": "all-time",
};

function fmtNPR(val: number) {
  if (val >= 1_000_000) return "NPR " + (val / 1_000_000).toFixed(2) + "L";
  if (val >= 1_000) return "NPR " + (val / 1_000).toFixed(1) + "K";
  return "NPR " + val.toFixed(0);
}

export default function LeaderboardClient() {
  const [period, setPeriod] = useState("Monthly");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/leaderboard?period=${periodMap[period]}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm animate-pulse">
        Loading leaderboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-clinical text-center py-12">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs text-primary underline">
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="card-clinical text-center py-12">
        <p className="text-sm text-muted-foreground">No activity yet. Be the first to trade and post!</p>
      </div>
    );
  }

  const { leaderboard, currentUser, total } = data;
  const top3Raw = leaderboard.slice(0, 3);
  const podiumOrder = [top3Raw[1], top3Raw[0], top3Raw[2]].filter(Boolean);
  const directory = leaderboard.slice(3);
  const topUser = top3Raw[0];

  // Comparison metrics: you vs top user
  const metrics = currentUser && topUser
    ? [
        {
          label: "Portfolio Value",
          icon: Wallet,
          you: Math.min(100, (currentUser.portfolioValue / topUser.portfolioValue) * 100),
          youLabel: fmtNPR(currentUser.portfolioValue),
          topLabel: fmtNPR(topUser.portfolioValue),
        },
        {
          label: "Community Likes",
          icon: ThumbsUp,
          you: topUser.totalLikes > 0 ? Math.min(100, (currentUser.totalLikes / topUser.totalLikes) * 100) : 0,
          youLabel: String(currentUser.totalLikes),
          topLabel: String(topUser.totalLikes),
        },
        {
          label: "Insight Score",
          icon: FileText,
          you: topUser.compositeScore > 0 ? Math.min(100, (currentUser.compositeScore / topUser.compositeScore) * 100) : 0,
          youLabel: String(currentUser.compositeScore),
          topLabel: String(topUser.compositeScore),
        },
      ]
    : [];

  return (
    <AuthGuard
      require="user"
      featureName="Leaderboard"
      featureDesc="Sign in to see how you rank against other NepseSageinvestors and track your performance."
    >
    <>
      {/* ── Podium ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {podiumOrder.map((a) => {
          const isTop = a.rank === 1;
          const rankLabel = a.rank === 1 ? "1st" : a.rank === 2 ? "2nd" : "3rd";
          return (
            <div
              key={String(a.userId)}
              className={`card-clinical text-center ${isTop ? "border-primary/40 pb-6 pt-8 order-first md:order-none" : "pb-5 pt-6"}`}
            >
              {isTop && <span className="badge-bullish mb-3 inline-block">⭐ Sage Supreme</span>}
              <p className="text-xs text-muted-foreground mb-1">{rankLabel}</p>
              <div className={`mx-auto mb-3 flex items-center justify-center rounded-full bg-secondary ${isTop ? "h-16 w-16" : "h-12 w-12"}`}>
                <span className={`font-heading font-bold ${isTop ? "text-lg" : "text-sm"}`}>{a.name[0]}</span>
              </div>
              <h3 className={`font-heading font-bold ${isTop ? "text-lg" : "text-sm"}`}>{a.name}</h3>
              <p className="text-xs text-primary font-medium">{a.title}</p>

              {/* Three pillars */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="clinical-label text-[10px]">Portfolio</p>
                  <span className={`font-heading text-xs font-bold ${a.returnRaw >= 0 ? "positive" : "negative"}`}>
                    {a.returnPct}
                  </span>
                </div>
                <div>
                  <p className="clinical-label text-[10px]">Likes</p>
                  <span className="font-heading text-xs font-bold">{a.totalLikes}</span>
                </div>
                <div>
                  <p className="clinical-label text-[10px]">Posts</p>
                  <span className="font-heading text-xs font-bold">{a.totalPosts}</span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {a.badges.slice(0, 2).map((b) => (
                  <span key={b} className="badge-bullish text-[10px]">{b}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Score legend ───────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-lg border border-border bg-secondary/20 px-4 py-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Score breakdown:</span>
        <span>📈 <span className="text-foreground font-medium">45%</span> Simulator portfolio value</span>
        <span>👍 <span className="text-foreground font-medium">30%</span> Total likes on insights</span>
        <span>💬 <span className="text-foreground font-medium">15%</span> Comments received</span>
        <span>📝 <span className="text-foreground font-medium">10%</span> Posts published</span>
      </div>

      {/* ── Ranking Directory ──────────────────────────────────────────────── */}
      <div className="card-clinical overflow-hidden">
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold">Ranking Directory</h2>
            <p className="text-xs text-muted-foreground">
              Composite score across portfolio, likes & comments — {total} traders ranked.
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {["Weekly", "Monthly", "All-Time"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                disabled={loading}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm animate-pulse">
            Loading {period.toLowerCase()} rankings…
          </div>
        ) : directory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Only {total} trader{total !== 1 ? "s" : ""} so far — more rankings will appear as the community grows.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="clinical-label pb-3 text-left">Rank</th>
                  <th className="clinical-label pb-3 text-left">Analyst</th>
                  <th className="clinical-label pb-3 text-right">Portfolio</th>
                  <th className="clinical-label pb-3 text-right">Return</th>
                  <th className="clinical-label pb-3 text-right">
                    <span className="flex items-center justify-end gap-1"><ThumbsUp className="h-3 w-3" /> Likes</span>
                  </th>
                  <th className="clinical-label pb-3 text-right">
                    <span className="flex items-center justify-end gap-1"><MessageSquare className="h-3 w-3" /> Comments</span>
                  </th>
                  <th className="clinical-label pb-3 text-right">Score</th>
                  <th className="clinical-label pb-3 text-left pl-4">Badges</th>
                </tr>
              </thead>
              <tbody>
                {directory.map((r) => (
                  <tr
                    key={String(r.userId)}
                    className={`border-b border-border/50 ${r.isCurrentUser ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-3">
                      <span className="font-heading text-lg font-bold">{String(r.rank).padStart(2, "0")}</span>
                      {r.isCurrentUser && (
                        <span className="ml-2 text-[10px] text-primary font-semibold">YOU</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-xs font-medium">{fmtNPR(r.portfolioValue)}</td>
                    <td className={`py-3 text-right text-sm font-semibold ${r.returnRaw >= 0 ? "positive" : "negative"}`}>
                      <span className="flex items-center justify-end gap-1">
                        {r.returnRaw >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {r.returnPct}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm">{r.totalLikes}</td>
                    <td className="py-3 text-right text-sm">{r.totalComments}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-bold px-2 py-0.5">
                        {r.compositeScore}
                      </span>
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex gap-1 flex-wrap">
                        {r.badges.slice(0, 2).map((b) => (
                          <span key={b} className="badge-bullish text-[10px]">{b}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 50 && (
          <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
            View Complete Rankings ↓
          </button>
        )}
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analyst Comparison */}
        <div className="lg:col-span-2 card-clinical">
          <h3 className="font-heading text-lg font-bold">Analyst Comparison</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Your metrics vs {topUser?.name ?? "top performer"}.
          </p>
          {currentUser && metrics.length > 0 ? (
            metrics.map((m) => (
              <div key={m.label} className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="clinical-label flex items-center gap-1.5">
                    <m.icon className="h-3 w-3" />{m.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    You ({m.youLabel}) vs {topUser?.name} ({m.topLabel})
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="absolute inset-0 rounded-full bg-primary/20" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${Math.min(100, m.you)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Start trading in the Simulator and posting Insights to see your comparison here.
            </p>
          )}
        </div>

        {/* Your Rank Card */}
        <div className="card-clinical text-center">
          <p className="clinical-label">Your Current Rank</p>
          {currentUser ? (
            <>
              <span className="stat-value text-4xl mt-2 block">#{currentUser.rank}</span>
              <p className="text-xs text-muted-foreground mt-1">Score: <span className="text-primary font-bold">{currentUser.compositeScore}</span></p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-secondary p-2">
                  <p className="clinical-label text-[10px]">Return</p>
                  <p className={`text-xs font-bold ${currentUser.returnRaw >= 0 ? "positive" : "negative"}`}>{currentUser.returnPct}</p>
                </div>
                <div className="rounded-md bg-secondary p-2">
                  <p className="clinical-label text-[10px]">Likes</p>
                  <p className="text-xs font-bold">{currentUser.totalLikes}</p>
                </div>
                <div className="rounded-md bg-secondary p-2">
                  <p className="clinical-label text-[10px]">Posts</p>
                  <p className="text-xs font-bold">{currentUser.totalPosts}</p>
                </div>
              </div>

              <div className="mt-3 rounded-md bg-secondary p-3">
                <p className="clinical-label mb-1">To Reach Top 10</p>
                {leaderboard[9] && currentUser.rank > 10 ? (
                  <p className="text-xs font-bold">
                    +{(leaderboard[9].compositeScore - currentUser.compositeScore)} score needed
                  </p>
                ) : currentUser.rank <= 10 ? (
                  <p className="text-xs font-bold positive">You're in the Top 10! 🎉</p>
                ) : (
                  <p className="text-xs font-bold">Trade more & post insights to rank up</p>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="stat-value text-4xl mt-2 block text-muted-foreground">—</span>
              <p className="text-xs text-muted-foreground mt-2">
                Trade in the Simulator and post Insights to get ranked.
              </p>
            </>
          )}
          <button
            onClick={() => (window.location.href = "/simulator")}
            className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Go to Simulator
          </button>
        </div>
      </div>
    </>
    </AuthGuard>
  );
}
