import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { simOrderSchema } from "../utils/schemas.js";
import {
  getSimulator,
  placeOrder,
  getOrders,
  resetSimulator,
} from "../controllers/simulatorController.js";

const router = express.Router();

router.use(protect);

router.get("/", getSimulator);
router.post("/order", validate(simOrderSchema), placeOrder);
router.get("/orders", getOrders);
router.post("/reset", resetSimulator);

export default router;