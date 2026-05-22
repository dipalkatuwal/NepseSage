import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

router.use(protect);

router.get("/", getLeaderboard);

export default router;
