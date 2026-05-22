import mongoose from "mongoose";

/**
 * Stores the latest NEPSE composite index snapshot.
 * Keyed by "NEPSE" (one document, continuously overwritten).
 * Extended to also store sub-index rows if needed.
 */
const indexSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "NEPSE" },
    // Main index numbers
    nepseIndex: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    // Market breadth (total)
    turnover: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    // Timestamp from NEPSE
    asOf: { type: String, default: "" },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("IndexSnapshot", indexSnapshotSchema);
