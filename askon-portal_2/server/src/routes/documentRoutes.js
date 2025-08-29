// server/src/routes/documentRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import { auth } from "../middleware/auth.js";
import { upload, uploadsBase } from "../utils/uploads.js";
import { Document } from "../models/Document.js";

const router = express.Router();

/* =========================================================
 *  LISTE: /api/documents[?userId=]  (kişisel liste)
 *  - admin/superadmin ?userId ile başka kullanıcınınkini görebilir
 * =======================================================*/
router.get("/", auth, async (req, res) => {
  const { userId } = req.query || {};
  const myRole = String(req.user.role || "").toLowerCase();
  const owner =
    userId && ["admin", "superadmin"].includes(myRole) ? userId : req.user.id;

  const items = await Document.find({ user: owner })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ items });
});

/* =========================================================
 *  YÜKLE: /api/documents (kişisel)
 * =======================================================*/
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Dosya gerekli" });
    }
    const title = (req.body?.title || req.file.originalname || "Belge").trim();
    const category = (req.body?.category || "").trim();

    const url = `/uploads/${path.basename(req.file.path)}`;
    const doc = await Document.create({
      user: req.user.id,
      title,
      category: category || undefined,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url
      }
    });

    res.status(201).json({ message: "Yüklendi", id: doc._id, item: doc });
  } catch (e) {
    console.error("upload error:", e);
    res.status(500).json({ message: "Yükleme sırasında hata" });
  }
});

/* =========================================================
 *  GENEL (ORYANTASYON) BELGELER: /api/documents/public
 *  - owner bağlı olmayan kayıtlar
 *  - visibleFor alanına göre filtre
 * =======================================================*/
router.get("/public", auth, async (req, res) => {
  try {
    const role = String(req.user.role || "").toLowerCase();
    const ptype = String(req.user.personelType || "").toLowerCase();

    let key = null;
    if (role === "stajyer") key = "visibleFor.stajyer";
    else if (role === "admin") key = "visibleFor.admin";
    else if (role === "superadmin") key = "visibleFor.superadmin";
    else if (role === "personel") {
      key = ptype === "beyaz" ? "visibleFor.personelBeyaz" : "visibleFor.personelMavi";
    }

    const where = {
      $and: [
        { user: { $exists: false } },
        { owner: { $exists: false } },
        { uploader: { $exists: false } },
        { createdBy: { $exists: false } },
        { userId: { $exists: false } },
        { ownerId: { $exists: false } }
      ],
      ...(key
        ? { $or: [{ [key]: true }, { visibleFor: { $exists: false } }] }
        : { visibleFor: { $exists: false } })
    };

    const items = await Document.find(where).sort({ createdAt: -1 }).lean();
    res.json({ items, total: items.length });
  } catch (e) {
    console.error("GET /api/documents/public error:", e);
    res.status(500).json({ message: "Belgeler getirilemedi" });
  }
});

/* =========================================================
 *  İNDİR: /api/documents/:id/download
 *  - sahibi veya admin/superadmin
 * =======================================================*/
router.get("/:id/download", auth, async (req, res) => {
  const doc = await Document.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: "Belge bulunamadı" });

  const me = String(req.user.id);
  const role = String(req.user.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

  const ownerIds = [
    doc.user, doc.userId, doc.owner, doc.ownerId, doc.uploader, doc.createdBy, doc.file?.userId
  ].filter(Boolean).map(String);
  const isOwner = ownerIds.includes(me);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Yetki yok" });
  }

  const abs = path.join(uploadsBase, path.basename(doc.file?.url || ""));
  if (!doc.file?.url || !fs.existsSync(abs)) {
    return res.status(404).json({ message: "Dosya yok" });
  }

  res.download(abs, doc.file.originalName || "belge");
});

/* =========================================================
 *  YENİDEN ADLANDIR: /api/documents/:id
 *  - sahibi veya admin/superadmin
 * =======================================================*/
router.put("/:id", auth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Belge bulunamadı" });

  const me = String(req.user.id);
  const role = String(req.user.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";
  const isOwner = [doc.user, doc.userId, doc.owner, doc.ownerId]
    .filter(Boolean).map(String).includes(me);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Sadece kendi belgenizi düzenleyebilirsiniz" });
  }

  const { title } = req.body || {};
  doc.title = (title || doc.title || "").trim() || "Belge";
  await doc.save();
  res.json({ message: "Güncellendi" });
});

/* =========================================================
 *  SİL: /api/documents/:id
 *  - sahibi veya admin/superadmin
 * =======================================================*/
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Belge bulunamadı" });

    const me = String(req.user.id);
    const role = String(req.user.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";

    const ownerIds = [
      doc.user, doc.userId, doc.owner, doc.ownerId, doc.uploader, doc.createdBy, doc.file?.userId
    ].filter(Boolean).map(String);
    const isOwner = ownerIds.includes(me);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Sadece kendi belgenizi silebilirsiniz" });
    }

    const filePath = path.join(uploadsBase, path.basename(doc.file?.url || ""));
    await Document.deleteOne({ _id: doc._id });

    if (doc.file?.url && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }

    return res.json({ message: "Silindi" });
  } catch (e) {
    console.error("DELETE /api/documents/:id error:", e);
    return res.status(500).json({ message: "Silme sırasında hata" });
  }
});

export default router;
