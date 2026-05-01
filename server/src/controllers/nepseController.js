import MarketData from "../models/MarketData.js";
import {
  getTopGainers,
  getTopLosers,
  getMarketSummary,
  fetchSymbolHistory,
  upsertMarketData,
} from "../services/nepseService.js";
import { analyzeSymbol } from "../services/technicalAnalysis.js";

// @desc   Get market summary (index, breadth)
// @route  GET /api/nepse/summary
export const getSummary = async (req, res, next) => {
  try {
    const summary = await getMarketSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// @desc   Get all active symbols (for search/autocomplete)
// @route  GET /api/nepse/symbols
export const getSymbols = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = { isActive: true };

    if (q) {
      filter.$or = [
        { symbol: { $regex: q.toUpperCase(), $options: "i" } },
        { companyName: { $regex: q, $options: "i" } },
      ];
    }

    const symbols = await MarketData.find(filter)
      .select("symbol companyName sector ltp changePercent")
      .limit(20)
      .sort({ symbol: 1 });

    res.json(symbols);
  } catch (error) {
    next(error);
  }
};

// @desc   Get single symbol data
// @route  GET /api/nepse/symbol/:symbol
export const getSymbol = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await MarketData.findOne({ symbol });

    if (!data) {
      return res.status(404).json({ message: `Symbol ${symbol} not found` });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc   Get top gainers
// @route  GET /api/nepse/gainers
export const getGainers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const gainers = await getTopGainers(Number(limit));
    res.json(gainers);
  } catch (error) {
    next(error);
  }
};

// @desc   Get top losers
// @route  GET /api/nepse/losers
export const getLosers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const losers = await getTopLosers(Number(limit));
    res.json(losers);
  } catch (error) {
    next(error);
  }
};

// @desc   Get OHLCV history for chart
// @route  GET /api/nepse/history/:symbol
export const getHistory = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { days = 90 } = req.query;

    const data = await MarketData.findOne({ symbol }).select(
      "symbol ohlcvHistory ltp"
    );
    if (!data) {
      return res.status(404).json({ message: `Symbol ${symbol} not found` });
    }

    const history = data.ohlcvHistory.slice(-Number(days));
    res.json({ symbol, history });
  } catch (error) {
    next(error);
  }
};

// @desc   Get technical analysis for a symbol
// @route  GET /api/nepse/technical/:symbol
export const getTechnical = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await MarketData.findOne({ symbol });

    if (!data) {
      return res.status(404).json({ message: `Symbol ${symbol} not found` });
    }

    const analysis = analyzeSymbol(data);
    res.json({
      symbol,
      currentPrice: data.ltp,
      change: data.change,
      changePercent: data.changePercent,
      ...analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Search symbols
// @route  GET /api/nepse/search
export const searchSymbols = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);

    const results = await MarketData.find({
      isActive: true,
      $or: [
        { symbol: { $regex: `^${q.toUpperCase()}` } },
        { companyName: { $regex: q, $options: "i" } },
      ],
    })
      .select("symbol companyName sector ltp change changePercent")
      .limit(10);

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// @desc   Get sector performance
// @route  GET /api/nepse/sectors
export const getSectors = async (req, res, next) => {
  try {
    const sectors = await MarketData.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$sector",
          avgChange: { $avg: "$changePercent" },
          totalTurnover: { $sum: "$turnover" },
          symbolCount: { $sum: 1 },
          gainers: {
            $sum: { $cond: [{ $gt: ["$changePercent", 0] }, 1, 0] },
          },
          losers: {
            $sum: { $cond: [{ $lt: ["$changePercent", 0] }, 1, 0] },
          },
        },
      },
      { $sort: { avgChange: -1 } },
    ]);

    res.json(sectors);
  } catch (error) {
    next(error);
  }
};