// server/src/middleware/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";

/* uploads klasörü garanti */
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* dosya adı: zaman damgası + orijinal */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || "file")
      .replace(/[^\w\-.]+/g, "_")
      .replace(/_+/g, "_");
    const stamp = Date.now();
    cb(null, `${stamp}-${safe}`);
  }
});

/* kabul edilecek tipler (geniş tutuyoruz) */
const ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
];

/* filtre */
function fileFilter(_req, file, cb) {
  if (!file.mimetype || ACCEPT.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Bu dosya türüne izin verilmiyor: " + file.mimetype));
}

/* 50MB limit; istersen artır */
export const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});
