import Insight from "../models/Insight.js";
import MarketData from "../models/MarketData.js";

// @desc   Get paginated insights
// @route  GET /api/insights
export const getInsights = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, symbol, sentiment } = req.query;
    
    const query = { isPublic: true };
    if (symbol) query.symbol = symbol.toUpperCase();
    if (sentiment && sentiment !== "all") query.sentiment = sentiment.toLowerCase();

    const skip = (Number(page) - 1) * Number(limit);
    
    const insights = await Insight.find(query)
      .populate("user", "name disciplineScore profile.experience")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Insight.countDocuments(query);

    res.json({
      insights,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Create new insight
// @route  POST /api/insights
export const createInsight = async (req, res, next) => {
  try {
    const { symbol, sentiment, text, isPublic } = req.body;

    const marketData = await MarketData.findOne({ symbol: symbol.toUpperCase() });
    const company = marketData?.companyName || symbol.toUpperCase();

    // Mock AI calculating confidence based on user's discipline score + text
    const baseConfidence = req.user.disciplineScore || 50;
    const confidence = Math.min(Math.max(baseConfidence + Math.floor(Math.random() * 20 - 10), 0), 100);

    const insight = await Insight.create({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      company,
      sentiment,
      text,
      confidence,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    res.status(201).json(insight);
  } catch (error) {
    next(error);
  }
};

// @desc   Toggle like on insight
// @route  POST /api/insights/:id/like
export const toggleLike = async (req, res, next) => {
  try {
    const insight = await Insight.findById(req.params.id);
    if (!insight) return res.status(404).json({ message: "Insight not found" });

    const alreadyLiked = insight.likedBy.includes(req.user._id);
    if (alreadyLiked) {
      insight.likedBy = insight.likedBy.filter((id) => id.toString() !== req.user._id.toString());
      insight.likes -= 1;
    } else {
      insight.likedBy.push(req.user._id);
      insight.likes += 1;
    }

    await insight.save();
    res.json({ likes: insight.likes, liked: !alreadyLiked });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete insight
// @route  DELETE /api/insights/:id
export const deleteInsight = async (req, res, next) => {
  try {
    const insight = await Insight.findById(req.params.id);
    if (!insight) return res.status(404).json({ message: "Insight not found" });

    if (insight.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this insight" });
    }

    await insight.deleteOne();
    res.json({ message: "Insight deleted successfully" });
  } catch (error) {
    next(error);
  }
};
