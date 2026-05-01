import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { aiAnalysisSchema, aiChatSchema } from "../utils/schemas.js";
import {
  analyzeStock,
  chat,
  analyzeJournalEntry,
  getMarketSentiment,
} from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);

router.post("/analyze", validate(aiAnalysisSchema), analyzeStock);
router.post("/chat", validate(aiChatSchema), chat);
router.post("/journal-analysis", analyzeJournalEntry);
router.get("/sentiment", getMarketSentiment);

export default router;