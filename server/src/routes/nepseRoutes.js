import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSummary,
  getSymbols,
  getSymbol,
  getGainers,
  getLosers,
  getHistory,
  getTechnical,
  searchSymbols,
  getSectors,
} from "../controllers/nepseController.js";

const router = express.Router();

// Public routes (no auth needed for market data)
router.get("/summary", getSummary);
router.get("/symbols", getSymbols);
router.get("/search", searchSymbols);
router.get("/gainers", getGainers);
router.get("/losers", getLosers);
router.get("/sectors", getSectors);
router.get("/symbol/:symbol", getSymbol);
router.get("/history/:symbol", getHistory);
router.get("/technical/:symbol", protect, getTechnical);

export default router;