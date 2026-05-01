import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 0 },
  avgBuyPrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, default: 0 },
  sector: { type: String, default: "Unknown" },
});

const transactionSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true },
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    notes: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    holdings: [holdingSchema],
    transactions: [transactionSchema],
    // Computed metrics (updated on each trade)
    totalInvested: { type: Number, default: 0 },
    totalCurrentValue: { type: Number, default: 0 },
    totalPnL: { type: Number, default: 0 },
    totalPnLPercent: { type: Number, default: 0 },
    portfolioBeta: { type: Number, default: 1.0 },
    // Snapshot history for chart (daily close values)
    valueHistory: [
      {
        date: { type: Date, default: Date.now },
        value: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// Recalculate totals before saving
portfolioSchema.methods.recalculate = function () {
  this.totalInvested = this.holdings.reduce(
    (sum, h) => sum + h.avgBuyPrice * h.quantity,
    0
  );
  this.totalCurrentValue = this.holdings.reduce(
    (sum, h) => sum + (h.currentPrice || h.avgBuyPrice) * h.quantity,
    0
  );
  this.totalPnL = this.totalCurrentValue - this.totalInvested;
  this.totalPnLPercent =
    this.totalInvested > 0
      ? (this.totalPnL / this.totalInvested) * 100
      : 0;
};

export default mongoose.model("Portfolio", portfolioSchema);