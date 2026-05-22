import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import simulatorRoutes from "./routes/simulatorRoutes.js";
import nepseRoutes from "./routes/nepseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

// ── NEPSE data pipeline (replaces old services/nepseScheduler.js) ──────────────
// This imports the new modular scheduler which internally calls
// nepseSyncService → nepseFetcher → nepseAdapter → MongoDB
import "./pipeline/nepseScheduler.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth",      authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/journal",   journalRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/nepse",     nepseRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/insights",  insightRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NepseSage server running on port ${PORT}`);
});
