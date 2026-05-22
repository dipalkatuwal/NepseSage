import Insight from "../models/Insight.js";
import Comment from "../models/Comment.js";
import MarketData from "../models/MarketData.js";
import mongoose from "mongoose";

// @desc   Get paginated insights with sector/sort/sentiment filters
// @route  GET /api/insights
export const getInsights = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, symbol, sentiment, sector, sort = "latest" } = req.query;

    const query = { isPublic: true };
    if (symbol) query.symbol = symbol.toUpperCase();
    if (sentiment && sentiment !== "all") query.sentiment = sentiment.toLowerCase();
    if (sector && sector !== "all") query.sector = sector;

    // Sort strategy
    let sortObj = {};
    if (sort === "popular") sortObj = { likes: -1, createdAt: -1 };
    else if (sort === "trending") sortObj = { commentCount: -1, likes: -1 };
    else sortObj = { createdAt: -1 }; // latest

    const skip = (Number(page) - 1) * Number(limit);

    const insights = await Insight.find(query)
      .populate("user", "name disciplineScore")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Insight.countDocuments(query);

    // Build isLikedByMe per insight for the requesting user only.
    // Always compare as hex strings — avoids ObjectId vs BSON type mismatches
    // that occur when using .lean() (ObjectIds become plain BSON objects).
    const currentUserId = req.user._id.toString();

    const shaped = insights.map((ins) => {
      const { likedBy, ...rest } = ins;
      const isLikedByMe = Array.isArray(likedBy)
        ? likedBy.some((id) => String(id) === currentUserId)
        : false;
      return { ...rest, isLikedByMe };
    });

    res.json({
      insights: shaped,
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
    const sector = marketData?.sector || "Others";

    const baseConfidence = req.user.disciplineScore || 50;
    const confidence = Math.min(
      Math.max(baseConfidence + Math.floor(Math.random() * 20 - 10), 0),
      100
    );

    const insight = await Insight.create({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      company,
      sector,
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

// @desc   Toggle like on insight (any logged-in user)
// @route  POST /api/insights/:id/like
export const toggleLike = async (req, res, next) => {
  try {
    const insight = await Insight.findById(req.params.id);
    if (!insight) return res.status(404).json({ message: "Insight not found" });

    const userId = req.user._id.toString();

    // Check if this specific user has already liked — compare as strings
    const alreadyLiked = insight.likedBy.some(
      (id) => id.toString() === userId
    );

    let updatedInsight;

    if (alreadyLiked) {
      // Unlike: remove only this user's ID, clamp likes to 0
      updatedInsight = await Insight.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { likedBy: req.user._id },
          $inc: { likes: -1 },
        },
        { new: true }
      );
      // Ensure likes never goes negative
      if (updatedInsight.likes < 0) {
        await Insight.findByIdAndUpdate(req.params.id, { $set: { likes: 0 } });
        updatedInsight.likes = 0;
      }
    } else {
      // Like: use $addToSet to prevent duplicate entries at DB level
      updatedInsight = await Insight.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { likedBy: req.user._id },
          $inc: { likes: 1 },
        },
        { new: true }
      );
    }

    // Return: liked = true means the current user NOW likes this insight
    res.json({ likes: updatedInsight.likes, liked: !alreadyLiked });
  } catch (error) {
    next(error);
  }
};

// @desc   Get comments for an insight
// @route  GET /api/insights/:id/comments
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ insight: req.params.id })
      .populate("user", "name disciplineScore")
      .sort({ createdAt: -1 });

    res.json({ comments, total: comments.length });
  } catch (error) {
    next(error);
  }
};

// @desc   Post a comment on an insight
// @route  POST /api/insights/:id/comments
export const postComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 1) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const insight = await Insight.findById(req.params.id);
    if (!insight) return res.status(404).json({ message: "Insight not found" });

    const comment = await Comment.create({
      insight: req.params.id,
      user: req.user._id,
      text: text.trim(),
    });

    // Increment commentCount on insight
    insight.commentCount = (insight.commentCount || 0) + 1;
    await insight.save();

    const populated = await comment.populate("user", "name disciplineScore");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a comment
// @route  DELETE /api/insights/:id/comments/:commentId
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();

    // Decrement commentCount
    await Insight.findByIdAndUpdate(req.params.id, {
      $inc: { commentCount: -1 },
    });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc   Get insights posted by the logged-in user
// @route  GET /api/insights/mine
export const getMyInsights = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const insights = await Insight.find({ user: req.user._id })
      .populate("user", "name disciplineScore")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Insight.countDocuments({ user: req.user._id });

    const currentUserId = req.user._id.toString();
    const shaped = insights.map((ins) => {
      const { likedBy, ...rest } = ins;
      const isLikedByMe = Array.isArray(likedBy)
        ? likedBy.some((id) => String(id) === currentUserId)
        : false;
      return { ...rest, isLikedByMe };
    });

    res.json({
      insights: shaped,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update insight (owner only — text, sentiment, isPublic)
// @route  PUT /api/insights/:id
export const updateInsight = async (req, res, next) => {
  try {
    const insight = await Insight.findById(req.params.id);
    if (!insight) return res.status(404).json({ message: "Insight not found" });

    if (insight.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { text, sentiment, isPublic } = req.body;
    if (text !== undefined) insight.text = text;
    if (sentiment !== undefined) insight.sentiment = sentiment;
    if (isPublic !== undefined) insight.isPublic = isPublic;

    await insight.save();
    const populated = await insight.populate("user", "name disciplineScore");
    const plain = populated.toObject();
    const { likedBy, ...rest } = plain;
    const isLikedByMe = Array.isArray(likedBy)
      ? likedBy.some((id) => String(id) === req.user._id.toString())
      : false;

    res.json({ ...rest, isLikedByMe });
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
      return res.status(403).json({ message: "Not authorized" });
    }

    await Comment.deleteMany({ insight: req.params.id });
    await insight.deleteOne();
    res.json({ message: "Insight deleted" });
  } catch (error) {
    next(error);
  }
};
