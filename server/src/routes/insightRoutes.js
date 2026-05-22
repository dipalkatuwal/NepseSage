import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { z } from "zod";
import {
  getInsights,
  getMyInsights,
  createInsight,
  updateInsight,
  toggleLike,
  getComments,
  postComment,
  deleteComment,
  deleteInsight,
} from "../controllers/insightController.js";

const createInsightSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  text: z.string().min(10, "Insight text must be at least 10 characters").max(1000),
  isPublic: z.boolean().optional(),
});

const updateInsightSchema = z.object({
  sentiment: z.enum(["bullish", "bearish", "neutral"]).optional(),
  text: z.string().min(10).max(1000).optional(),
  isPublic: z.boolean().optional(),
});

const router = express.Router();

router.use(protect);

router.get("/", getInsights);
router.get("/mine", getMyInsights);
router.post("/", validate(createInsightSchema), createInsight);
router.put("/:id", validate(updateInsightSchema), updateInsight);
router.post("/:id/like", toggleLike);
router.get("/:id/comments", getComments);
router.post("/:id/comments", postComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.delete("/:id", deleteInsight);

export default router;
