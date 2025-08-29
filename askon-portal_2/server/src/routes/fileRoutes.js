import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { auth } from "../middleware/auth.js";
import { File } from "../models/File.js";

const router = Router();

// KAYITLAR ve STATIC SERVİS AYNI KÖKE BAKSIN diye tek sabit:
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userDir = path.join(UPLOAD_ROOT, "users", req.user.id);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

// 500MB / dosya
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Çoklu upload (input name="files")
router.post("/my", auth, upload.array("files", 10), async (req, res) => {
  const files = req.files || [];
  const docs = await File.insertMany(files.map(f => ({
    user: req.user.id,
    originalName: f.originalname,
    mimeType:     f.mimetype,
    size:         f.size,
    path:         path.relative(process.cwd(), f.path).replace(/\\/g, "/"),
    url:          `/uploads/users/${req.user.id}/${path.basename(f.path)}`
  })));
  res.status(201).json({ files: docs });
});

router.get("/my", auth, async (req, res) => {
  const items = await File.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ files: items });
});

router.delete("/my/:id", auth, async (req, res) => {
  const doc = await File.findOne({ _id: req.params.id, user: req.user.id });
  if (!doc) return res.status(404).json({ message: "Dosya bulunamadı" });

  try {
    const abs = path.resolve(process.cwd(), doc.path);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) {}
  await doc.deleteOne();
  res.json({ ok: true });
});

export default router;
