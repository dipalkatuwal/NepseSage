import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { addTransactionSchema, bulkTransactionSchema } from "../utils/schemas.js";
import {
  getPortfolio,
  addTransaction,
  addBulkTransactions,
  getTransactions,
  getPortfolioHistory,
  deleteTransaction,
} from "../controllers/portfolioController.js";

const router = express.Router();

router.use(protect);

router.get("/", getPortfolio);
router.post("/transaction", validate(addTransactionSchema), addTransaction);
router.post("/bulk-transactions", validate(bulkTransactionSchema), addBulkTransactions);
router.get("/transactions", getTransactions);
router.get("/history", getPortfolioHistory);
router.delete("/transaction/:id", deleteTransaction);

export default router;