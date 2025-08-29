// server/src/utils/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadsBase =
  process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(__dirname, "..", "uploads");

fs.mkdirSync(uploadsBase, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsBase),
  filename: (req, file, cb) => {
    const safe = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const ext  = path.extname(file.originalname) || "";
    cb(null, `${safe}.${Date.now()}${ext}`);
  }
});

export const upload = multer({ storage });
export { uploadsBase };
