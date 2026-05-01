import mongoose from "mongoose";

const EMOTIONS = [
  "confident",
  "fearful",
  "greedy",
  "neutral",
  "anxious",
  "excited",
  "frustrated",
  "calm",
];

const BIASES = [
  "FOMO",
  "Revenge Trading",
  "Overconfidence",
  "Loss Aversion",
  "Confirmation Bias",
  "Anchoring",
  "Herd Mentality",
  "None",
];

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Trade details
    symbol: { type: String, required: true, uppercase: true },
    tradeType: { type: String, enum: ["BUY", "SELL", "HOLD"], required: true },
    entryPrice: { type: Number },
    exitPrice: { type: Number },
    quantity: { type: Number },
    pnl: { type: Number, default: 0 },
    pnlPercent: { type: Number, default: 0 },

    // Behavioral tracking
    emotionBefore: { type: String, enum: EMOTIONS, required: true },
    emotionAfter: { type: String, enum: EMOTIONS },
    detectedBiases: { type: [{ type: String, enum: BIASES }], default: [] },
    isRedFlag: { type: Boolean, default: false },

    // Reflection
    reasoning: { type: String, required: true }, // Why did you make this trade?
    lessonsLearned: { type: String, default: "" },
    marketCondition: {
      type: String,
      enum: ["bullish", "bearish", "sideways", "volatile"],
      default: "sideways",
    },

    // AI analysis result
    aiAnalysis: { type: String, default: "" },

    tradeDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

journalEntrySchema.pre("save", function () {
  const biases = [];

  // FOMO: bought after big rally, emotion = excited/greedy
  if (
    this.tradeType === "BUY" &&
    ["excited", "greedy"].includes(this.emotionBefore)
  ) {
    biases.push("FOMO");
  }

  // Revenge trading: sold at loss, emotion = frustrated
  if (
    this.tradeType === "SELL" &&
    this.pnl < 0 &&
    this.emotionBefore === "frustrated"
  ) {
    biases.push("Revenge Trading");
  }

  // Overconfidence: emotion = confident with no reasoning
  if (
    this.emotionBefore === "confident" &&
    this.reasoning &&
    this.reasoning.length < 20
  ) {
    biases.push("Overconfidence");
  }

  // Loss aversion: holding losers (HOLD with pnl < 0)
  if (this.tradeType === "HOLD" && this.pnl < 0) {
    biases.push("Loss Aversion");
  }

  if (biases.length > 0) {
    this.detectedBiases = [...new Set([...(this.detectedBiases || []), ...biases])];
    this.isRedFlag = true;
  }
});

export default mongoose.model("JournalEntry", journalEntrySchema);