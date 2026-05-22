import Simulator from "../models/Simulator.js";
import Insight from "../models/Insight.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

// Score weights
const W_PORTFOLIO   = 0.45;  // simulator portfolio value
const W_LIKES       = 0.30;  // total likes across all insights
const W_COMMENTS    = 0.15;  // total comments received
const W_POSTS       = 0.10;  // number of posts published

// @desc   Get leaderboard rankings based on simulator money + insight popularity
// @route  GET /api/leaderboard?period=monthly|weekly|all-time
// @access Private
export const getLeaderboard = async (req, res, next) => {
  try {
    const { period = "all-time" } = req.query;

    // ── 1. Date filter for period ────────────────────────────────────────────
    let since = null;
    if (period === "weekly") {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "monthly") {
      since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // ── 2. Fetch all users ───────────────────────────────────────────────────
    const users = await User.find({}).select("_id name disciplineScore createdAt").lean();
    const userIds = users.map((u) => u._id);

    // ── 3. Simulator data — one doc per user ─────────────────────────────────
    const simulators = await Simulator.find({ user: { $in: userIds } }).lean();
    const simMap = {};
    for (const s of simulators) {
      simMap[String(s.user)] = s;
    }

    // ── 4. Aggregate insights per user (likes + comments + post count) ───────
    const insightMatchStage = since
      ? { user: { $in: userIds }, isPublic: true, createdAt: { $gte: since } }
      : { user: { $in: userIds }, isPublic: true };

    const insightAgg = await Insight.aggregate([
      { $match: insightMatchStage },
      {
        $group: {
          _id: "$user",
          totalLikes:    { $sum: "$likes" },
          totalComments: { $sum: "$commentCount" },
          totalPosts:    { $sum: 1 },
        },
      },
    ]);

    const insightMap = {};
    for (const row of insightAgg) {
      insightMap[String(row._id)] = row;
    }

    // ── 5. Build scored entries for every user ───────────────────────────────
    // Compute raw maxima for normalisation (avoid division by zero)
    const allSims    = simulators;
    const maxPortfolio = Math.max(...allSims.map((s) => s.totalPortfolioValue || 0), 1);
    const allInsights  = insightAgg;
    const maxLikes    = Math.max(...allInsights.map((i) => i.totalLikes), 1);
    const maxComments = Math.max(...allInsights.map((i) => i.totalComments), 1);
    const maxPosts    = Math.max(...allInsights.map((i) => i.totalPosts), 1);

    const entries = users.map((user) => {
      const uid  = String(user._id);
      const sim  = simMap[uid];
      const ins  = insightMap[uid] || { totalLikes: 0, totalComments: 0, totalPosts: 0 };

      // Normalised 0–100 sub-scores
      const portfolioScore = sim
        ? ((sim.totalPortfolioValue || 0) / maxPortfolio) * 100
        : 0;
      const likesScore    = (ins.totalLikes    / maxLikes)    * 100;
      const commentsScore = (ins.totalComments / maxComments) * 100;
      const postsScore    = (ins.totalPosts    / maxPosts)    * 100;

      // Weighted composite score (0–100)
      const compositeScore =
        portfolioScore * W_PORTFOLIO +
        likesScore     * W_LIKES    +
        commentsScore  * W_COMMENTS +
        postsScore     * W_POSTS;

      return {
        user,
        sim,
        ins,
        compositeScore,
        portfolioValue: sim?.totalPortfolioValue   || 1_000_000,
        returnPct:      sim?.totalPnLPercent        || 0,
        totalTrades:    sim?.totalTrades            || 0,
        winRate:        sim?.winRate                || 0,
        totalLikes:     ins.totalLikes,
        totalComments:  ins.totalComments,
        totalPosts:     ins.totalPosts,
      };
    });

    // ── 6. Sort by composite score descending ────────────────────────────────
    entries.sort((a, b) => b.compositeScore - a.compositeScore);

    // ── 7. Shape into leaderboard entries ────────────────────────────────────
    const ranked = entries.map((e, idx) => {
      const { user, returnPct, totalTrades, winRate } = e;

      // Reputation = composite score scaled to a human-friendly number
      const reputation = Math.round(500 + e.compositeScore * 20);

      // Badges
      const badges = [];
      if (winRate >= 70)          badges.push("Accuracy King");
      if (totalTrades >= 50)      badges.push("Volume Trader");
      if (returnPct >= 50)        badges.push("Bull Rider");
      if (returnPct >= 100)       badges.push("100x Club");
      if (e.totalLikes >= 50)     badges.push("Community Favourite");
      if (e.totalPosts >= 20)     badges.push("Prolific Analyst");
      if (e.totalComments >= 30)  badges.push("Discussion Starter");
      if ((user.disciplineScore || 0) >= 80) badges.push("Iron Discipline");
      if (returnPct < 0)          badges.push("Learning Curve");
      if (badges.length === 0)    badges.push("Active Trader");

      // Title
      let title = "Market Apprentice";
      if (idx === 0)       title = "Master Portfolio Strategist";
      else if (idx === 1)  title = "Silver Sage";
      else if (idx === 2)  title = "Bronze Catalyst";
      else if (idx < 10)   title = "Elite Analyst";
      else if (idx < 25)   title = "Senior Trader";
      else if (idx < 50)   title = "Rising Star";

      return {
        rank:          idx + 1,
        userId:        user._id,
        name:          user.name,
        title,
        // Portfolio
        portfolioValue:   e.portfolioValue,
        returnPct:        (returnPct >= 0 ? "+" : "") + returnPct.toFixed(1) + "%",
        returnRaw:        returnPct,
        totalTrades,
        winRate:          winRate ? winRate.toFixed(1) + "%" : "N/A",
        winningTrades:    e.sim?.winningTrades || 0,
        // Community
        totalLikes:    e.totalLikes,
        totalComments: e.totalComments,
        totalPosts:    e.totalPosts,
        // Score
        compositeScore:   Math.round(e.compositeScore),
        reputation:       reputation.toLocaleString(),
        reputationRaw:    reputation,
        badges,
        isCurrentUser: req.user && String(user._id) === String(req.user._id),
      };
    });

    // Current user's entry
    const currentUserEntry = req.user
      ? ranked.find((r) => r.isCurrentUser) || null
      : null;

    res.json({
      leaderboard: ranked.slice(0, 50),
      currentUser: currentUserEntry,
      total: ranked.length,
      period,
    });
  } catch (error) {
    next(error);
  }
};
