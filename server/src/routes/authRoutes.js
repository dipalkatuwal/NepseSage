import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { registerSchema, loginSchema } from "../utils/schemas.js";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  upgradeToPro,
  downgradeToFree,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/change-password", protect, changePassword);

router.post("/upgrade", protect, upgradeToPro);
router.post("/downgrade", protect, downgradeToFree);

export default router;