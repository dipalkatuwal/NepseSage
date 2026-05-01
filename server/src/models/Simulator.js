import mongoose from "mongoose";

const STARTING_CAPITAL = 1_000_000; // NPR 10 Lakh

const simHoldingSchema = new mongoose.Schema({
  symbol: { type: String, uppercase: true },
  companyName: { type: String, default: "" },
  quantity: { type: Number, default: 0 },
  avgBuyPrice: { type: Number, default: 0 },
  currentPrice: { type: Number, default: 0 },
});

const simOrderSchema = new mongoose.Schema(
  {
    symbol: { type: String, uppercase: true },
    type: { type: String, enum: ["BUY", "SELL"] },
    quantity: { type: Number },
    price: { type: Number },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: ["EXECUTED", "CANCELLED"],
      default: "EXECUTED",
    },
    executedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const simulatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    cash: { type: Number, default: STARTING_CAPITAL },
    startingCapital: { type: Number, default: STARTING_CAPITAL },
    holdings: [simHoldingSchema],
    orders: [simOrderSchema],
    // Metrics
    totalPortfolioValue: { type: Number, default: STARTING_CAPITAL },
    totalPnL: { type: Number, default: 0 },
    totalPnLPercent: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    winningTrades: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    // Value history for chart
    valueHistory: [
      {
        date: { type: Date, default: Date.now },
        value: { type: Number },
        cash: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

simulatorSchema.methods.recalculate = function () {
  const holdingsValue = this.holdings.reduce(
    (sum, h) => sum + (h.currentPrice || h.avgBuyPrice) * h.quantity,
    0
  );
  this.totalPortfolioValue = this.cash + holdingsValue;
  this.totalPnL = this.totalPortfolioValue - this.startingCapital;
  this.totalPnLPercent =
    ((this.totalPortfolioValue - this.startingCapital) / this.startingCapital) *
    100;
};

export default mongoose.model("Simulator", simulatorSchema);