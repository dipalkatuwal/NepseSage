import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { z } from "zod";
import {
  getInsights,
  createInsight,
  toggleLike,
  deleteInsight,
} from "../controllers/insightController.js";

const createInsightSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  text: z.string().min(10, "Insight text must be at least 10 characters").max(1000),
  isPublic: z.boolean().optional(),
});

const router = express.Router();

router.use(protect);

router.get("/", getInsights);
router.post("/", validate(createInsightSchema), createInsight);
router.post("/:id/like", toggleLike);
router.delete("/:id", deleteInsight);

export default router;
