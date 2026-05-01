import Portfolio from "../models/Portfolio.js";
import MarketData from "../models/MarketData.js";

// @desc   Get user portfolio
// @route  GET /api/portfolio
export const getPortfolio = async (req, res, next) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id });
    }

    // Enrich holdings with live prices
    const symbols = portfolio.holdings.map((h) => h.symbol);
    if (symbols.length > 0) {
      const marketData = await MarketData.find({ symbol: { $in: symbols } }).select(
        "symbol ltp changePercent"
      );
      const priceMap = {};
      marketData.forEach((m) => (priceMap[m.symbol] = m));

      portfolio.holdings.forEach((h) => {
        if (priceMap[h.symbol]) {
          h.currentPrice = priceMap[h.symbol].ltp;
        }
      });
      portfolio.recalculate();
      await portfolio.save();
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
};

// @desc   Add transaction (BUY or SELL)
// @route  POST /api/portfolio/transaction
export const addTransaction = async (req, res, next) => {
  try {
    const { symbol, type, quantity, price, notes, date } = req.body;
    const totalAmount = quantity * price;

    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id });
    }

    // Get company info
    const marketData = await MarketData.findOne({ symbol });
    const companyName = marketData?.companyName || symbol;
    const sector = marketData?.sector || "Unknown";

    if (type === "BUY") {
      const existingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol);

      if (existingIdx >= 0) {
        // Update average buy price
        const existing = portfolio.holdings[existingIdx];
        const totalCost =
          existing.avgBuyPrice * existing.quantity + price * quantity;
        existing.quantity += quantity;
        existing.avgBuyPrice = totalCost / existing.quantity;
        existing.currentPrice = price;
      } else {
        portfolio.holdings.push({
          symbol,
          companyName,
          sector,
          quantity,
          avgBuyPrice: price,
          currentPrice: price,
        });
      }
    } else if (type === "SELL") {
      const existingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol);
      if (existingIdx === -1) {
        return res.status(400).json({ message: "You don't hold this symbol" });
      }

      const existing = portfolio.holdings[existingIdx];
      if (existing.quantity < quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient quantity. You hold ${existing.quantity} shares.` });
      }

      existing.quantity -= quantity;
      if (existing.quantity === 0) {
        portfolio.holdings.splice(existingIdx, 1);
      }
    }

    // Add to transaction history
    portfolio.transactions.push({
      symbol,
      type,
      quantity,
      price,
      totalAmount,
      notes,
      date: date ? new Date(date) : new Date(),
    });

    portfolio.recalculate();
    await portfolio.save();

    res.status(201).json(portfolio);
  } catch (error) {
    next(error);
  }
};

// @desc   Add multiple transactions (CSV Import / Bulk Manual)
// @route  POST /api/portfolio/bulk-transactions
export const addBulkTransactions = async (req, res, next) => {
  try {
    const { transactions } = req.body;
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ message: "No transactions provided" });
    }

    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id });
    }

    const symbols = [...new Set(transactions.map((t) => t.symbol))];
    const marketData = await MarketData.find({ symbol: { $in: symbols } });
    const marketMap = {};
    marketData.forEach((m) => (marketMap[m.symbol] = m));

    for (const txn of transactions) {
      const { symbol, type, quantity, price, notes, date } = txn;
      const totalAmount = quantity * price;

      const companyName = marketMap[symbol]?.companyName || symbol;
      const sector = marketMap[symbol]?.sector || "Unknown";

      if (type === "BUY") {
        const existingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol);
        if (existingIdx >= 0) {
          const existing = portfolio.holdings[existingIdx];
          const totalCost = existing.avgBuyPrice * existing.quantity + price * quantity;
          existing.quantity += quantity;
          existing.avgBuyPrice = totalCost / existing.quantity;
          existing.currentPrice = price;
        } else {
          portfolio.holdings.push({
            symbol,
            companyName,
            sector,
            quantity,
            avgBuyPrice: price,
            currentPrice: price,
          });
        }
      } else if (type === "SELL") {
        const existingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol);
        if (existingIdx >= 0) {
          const existing = portfolio.holdings[existingIdx];
          if (existing.quantity >= quantity) {
            existing.quantity -= quantity;
            if (existing.quantity === 0) {
              portfolio.holdings.splice(existingIdx, 1);
            }
          }
        }
      }

      portfolio.transactions.push({
        symbol,
        type,
        quantity,
        price,
        totalAmount,
        notes,
        date: date ? new Date(date) : new Date(),
      });
    }

    portfolio.recalculate();
    await portfolio.save();

    res.status(201).json(portfolio);
  } catch (error) {
    next(error);
  }
};

// @desc   Get transaction history
// @route  GET /api/portfolio/transactions
export const getTransactions = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.json([]);

    const { symbol, type, limit = 50, page = 1 } = req.query;
    let txns = portfolio.transactions;

    if (symbol) txns = txns.filter((t) => t.symbol === symbol.toUpperCase());
    if (type) txns = txns.filter((t) => t.type === type.toUpperCase());

    // Sort newest first
    txns.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = txns.length;
    const paginated = txns.slice((page - 1) * limit, page * limit);

    res.json({ transactions: paginated, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// @desc   Get portfolio value history (for chart)
// @route  GET /api/portfolio/history
export const getPortfolioHistory = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id }).select(
      "valueHistory totalCurrentValue totalInvested totalPnL totalPnLPercent"
    );
    res.json(portfolio || { valueHistory: [] });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a transaction (correction)
// @route  DELETE /api/portfolio/transaction/:id
export const deleteTransaction = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio)
      return res.status(404).json({ message: "Portfolio not found" });

    const txnIdx = portfolio.transactions.findIndex(
      (t) => t._id.toString() === req.params.id
    );
    if (txnIdx === -1)
      return res.status(404).json({ message: "Transaction not found" });

    portfolio.transactions.splice(txnIdx, 1);
    await portfolio.save();
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    next(error);
  }
};