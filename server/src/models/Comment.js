import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    insight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Insight",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxLength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
