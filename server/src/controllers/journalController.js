import JournalEntry from "../models/JournalEntry.js";
import User from "../models/User.js";
import {
  calculateDisciplineScore,
  getBiasPatterns,
} from "../services/disciplineService.js";

// @desc   Create journal entry
// @route  POST /api/journal
export const createEntry = async (req, res, next) => {
  try {
    const entry = await JournalEntry.create({
      user: req.user._id,
      ...req.body,
    });

    // Recalculate discipline score and save to user
    const { score } = await calculateDisciplineScore(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { disciplineScore: score });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc   Get all journal entries
// @route  GET /api/journal
export const getEntries = async (req, res, next) => {
  try {
    const {
      symbol,
      tradeType,
      isRedFlag,
      limit = 20,
      page = 1,
      startDate,
      endDate,
    } = req.query;

    const filter = { user: req.user._id };
    if (symbol) filter.symbol = symbol.toUpperCase();
    if (tradeType) filter.tradeType = tradeType.toUpperCase();
    if (isRedFlag !== undefined) filter.isRedFlag = isRedFlag === "true";
    if (startDate || endDate) {
      filter.tradeDate = {};
      if (startDate) filter.tradeDate.$gte = new Date(startDate);
      if (endDate) filter.tradeDate.$lte = new Date(endDate);
    }

    const total = await JournalEntry.countDocuments(filter);
    const entries = await JournalEntry.find(filter)
      .sort({ tradeDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ entries, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single journal entry
// @route  GET /api/journal/:id
export const getEntry = async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc   Update journal entry
// @route  PUT /api/journal/:id
export const updateEntry = async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    // Recalculate discipline score
    const { score } = await calculateDisciplineScore(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { disciplineScore: score });

    res.json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc   Delete journal entry
// @route  DELETE /api/journal/:id
export const deleteEntry = async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc   Get discipline score + breakdown
// @route  GET /api/journal/discipline
export const getDisciplineScore = async (req, res, next) => {
  try {
    const result = await calculateDisciplineScore(req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc   Get bias patterns (Behavior Lab analytics)
// @route  GET /api/journal/biases
export const getBiases = async (req, res, next) => {
  try {
    const patterns = await getBiasPatterns(req.user._id);
    res.json(patterns);
  } catch (error) {
    next(error);
  }
};

// @desc   Get emotion stats for chart
// @route  GET /api/journal/emotions
export const getEmotionStats = async (req, res, next) => {
  try {
    const entries = await JournalEntry.find({ user: req.user._id }).select(
      "emotionBefore emotionAfter pnl tradeDate isRedFlag"
    );

    // Emotion frequency
    const emotionFreq = {};
    entries.forEach((e) => {
      emotionFreq[e.emotionBefore] = (emotionFreq[e.emotionBefore] || 0) + 1;
    });

    // Emotion vs P&L correlation
    const emotionPnl = {};
    entries.forEach((e) => {
      if (e.pnl !== 0) {
        if (!emotionPnl[e.emotionBefore]) {
          emotionPnl[e.emotionBefore] = { total: 0, count: 0 };
        }
        emotionPnl[e.emotionBefore].total += e.pnl;
        emotionPnl[e.emotionBefore].count++;
      }
    });

    const emotionAvgPnl = Object.entries(emotionPnl).map(([emotion, data]) => ({
      emotion,
      avgPnl: parseFloat((data.total / data.count).toFixed(2)),
      count: data.count,
    }));

    res.json({ emotionFrequency: emotionFreq, emotionAvgPnl });
  } catch (error) {
    next(error);
  }
};