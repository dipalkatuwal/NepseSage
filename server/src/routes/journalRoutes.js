import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { journalEntrySchema } from "../utils/schemas.js";
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  getDisciplineScore,
  getBiases,
  getEmotionStats,
} from "../controllers/journalController.js";

const router = express.Router();

router.use(protect);

router.get("/discipline", getDisciplineScore);
router.get("/biases", getBiases);
router.get("/emotions", getEmotionStats);
router.get("/", getEntries);
router.post("/", validate(journalEntrySchema), createEntry);
router.get("/:id", getEntry);
router.put("/:id", updateEntry);
router.delete("/:id", deleteEntry);

export default router;