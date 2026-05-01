import Simulator from "../models/Simulator.js";
import MarketData from "../models/MarketData.js";

// @desc   Get simulator portfolio
// @route  GET /api/simulator
export const getSimulator = async (req, res, next) => {
  try {
    let sim = await Simulator.findOne({ user: req.user._id });
    if (!sim) {
      sim = await Simulator.create({ user: req.user._id });
    }

    // Update current prices
    const symbols = sim.holdings.map((h) => h.symbol);
    if (symbols.length > 0) {
      const marketData = await MarketData.find({ symbol: { $in: symbols } }).select(
        "symbol ltp"
      );
      const priceMap = {};
      marketData.forEach((m) => (priceMap[m.symbol] = m.ltp));

      sim.holdings.forEach((h) => {
        if (priceMap[h.symbol]) h.currentPrice = priceMap[h.symbol];
      });
      sim.recalculate();
      await sim.save();
    }

    res.json(sim);
  } catch (error) {
    next(error);
  }
};

// @desc   Place simulated order
// @route  POST /api/simulator/order
export const placeOrder = async (req, res, next) => {
  try {
    const { symbol, type, quantity, price } = req.body;
    const totalAmount = quantity * price;

    let sim = await Simulator.findOne({ user: req.user._id });
    if (!sim) sim = await Simulator.create({ user: req.user._id });

    // Get company info
    const marketData = await MarketData.findOne({ symbol });
    const companyName = marketData?.companyName || symbol;

    if (type === "BUY") {
      if (sim.cash < totalAmount) {
        return res.status(400).json({
          message: `Insufficient cash. Available: NPR ${sim.cash.toLocaleString()}`,
        });
      }

      sim.cash -= totalAmount;

      const existingIdx = sim.holdings.findIndex((h) => h.symbol === symbol);
      if (existingIdx >= 0) {
        const h = sim.holdings[existingIdx];
        const totalCost = h.avgBuyPrice * h.quantity + price * quantity;
        h.quantity += quantity;
        h.avgBuyPrice = totalCost / h.quantity;
        h.currentPrice = price;
      } else {
        sim.holdings.push({ symbol, companyName, quantity, avgBuyPrice: price, currentPrice: price });
      }
    } else if (type === "SELL") {
      const existingIdx = sim.holdings.findIndex((h) => h.symbol === symbol);
      if (existingIdx === -1) {
        return res.status(400).json({ message: "You don't hold this symbol in simulator" });
      }

      const h = sim.holdings[existingIdx];
      if (h.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient quantity. You hold ${h.quantity} shares.`,
        });
      }

      // Track win/loss
      const pnl = (price - h.avgBuyPrice) * quantity;
      sim.totalTrades++;
      if (pnl > 0) sim.winningTrades++;
      sim.winRate =
        sim.totalTrades > 0
          ? parseFloat(((sim.winningTrades / sim.totalTrades) * 100).toFixed(1))
          : 0;

      sim.cash += totalAmount;
      h.quantity -= quantity;
      if (h.quantity === 0) sim.holdings.splice(existingIdx, 1);
    }

    // Record order
    sim.orders.push({
      symbol,
      type,
      quantity,
      price,
      totalAmount,
      status: "EXECUTED",
    });

    sim.recalculate();

    // Record daily value snapshot
    sim.valueHistory.push({
      date: new Date(),
      value: sim.totalPortfolioValue,
      cash: sim.cash,
    });

    await sim.save();
    res.status(201).json(sim);
  } catch (error) {
    next(error);
  }
};

// @desc   Get order history
// @route  GET /api/simulator/orders
export const getOrders = async (req, res, next) => {
  try {
    const sim = await Simulator.findOne({ user: req.user._id }).select("orders");
    if (!sim) return res.json([]);

    const orders = [...sim.orders].sort(
      (a, b) => new Date(b.executedAt) - new Date(a.executedAt)
    );
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc   Reset simulator (start fresh)
// @route  POST /api/simulator/reset
export const resetSimulator = async (req, res, next) => {
  try {
    const sim = await Simulator.findOne({ user: req.user._id });
    if (!sim) return res.status(404).json({ message: "Simulator not found" });

    sim.cash = sim.startingCapital;
    sim.holdings = [];
    sim.orders = [];
    sim.totalPortfolioValue = sim.startingCapital;
    sim.totalPnL = 0;
    sim.totalPnLPercent = 0;
    sim.totalTrades = 0;
    sim.winningTrades = 0;
    sim.winRate = 0;
    sim.valueHistory = [];

    await sim.save();
    res.json({ message: "Simulator reset to initial state", sim });
  } catch (error) {
    next(error);
  }
};