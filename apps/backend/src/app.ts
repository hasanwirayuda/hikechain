import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectRedis } from "./shared/lib/redis";
import { initSocket } from "./shared/lib/socket";
import { initFirebase } from "./shared/lib/firebase";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middleware/error.middleware";

// ── Routes ────────────────────────────────────────────────
import authRoutes from "./modules/auth/auth.routes";
import groupRoutes from "./modules/groups/groups.routes";
import sessionRoutes from "./modules/sessions/sessions.routes";
import trackingRoutes from "./modules/tracking/tracking.routes";
import mountainRoutes from "./modules/mountains/mountains.routes";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ?? 3000;

// ── Global middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));

// Rate limiting — 100 req / 15 menit per IP
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ── Routes ────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/mountains", mountainRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/sessions", trackingRoutes); // sharing /sessions/:id prefix

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 + error handler — harus paling bawah
app.use(notFoundHandler);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  await connectRedis();
  initSocket(server);
  initFirebase();

  server.listen(PORT, () => {
    console.log(`\n🏔️  HikeChain API running on http://localhost:${PORT}`);
    console.log(`📡  Socket.io ready`);
    console.log(`🌿  Environment: ${process.env.NODE_ENV ?? "development"}\n`);
  });
};

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
