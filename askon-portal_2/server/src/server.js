import "dotenv/config";               
import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminUsersRoutes from "./routes/adminUsers.js";   
import documentRoutes from "./routes/documentRoutes.js";
import trainingRoutes from "./routes/trainingRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";

const app = express();

// __dirname hesapla (ESM)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// uploads klasörü (env ile özelleştirilebilir)
const uploadsAbs = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "uploads")
);

// ---------- Middlewares ----------
app.use(cors({
  origin: [/^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/localhost:\d+$/],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("tiny"));

// statik dosyalar
app.use("/uploads", express.static(uploadsAbs));  // ✅ tek kez mount et

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/quizzes", quizRoutes);

// health check
app.get("/", (_req, res) => res.json({ ok: true }));

// ---------- Start ----------
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(); // 🔗 tek bağlanma noktası (db.js)
  app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda`);
  });
}

// graceful shutdown (opsiyonel)
process.on("SIGINT", async () => {
  console.log("\n🛑 Kapanıyor...");
  const { default: mongoose } = await import("mongoose");
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
});

start();
