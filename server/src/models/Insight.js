import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    sentiment: {
      type: String,
      enum: ["bullish", "bearish", "neutral"],
      default: "neutral",
    },
    text: {
      type: String,
      required: true,
      maxLength: 1000,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Insight || mongoose.model("Insight", insightSchema);
