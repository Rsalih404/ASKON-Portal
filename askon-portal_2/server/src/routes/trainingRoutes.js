// server/src/routes/trainingRoutes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/roles.js";
import { uploader } from "../middleware/upload.js";
import { Training } from "../models/Training.js";
import { TrainingView } from "../models/TrainingView.js";

const router = Router();

/* CREATE (admin) */
router.post("/",
  auth, allow("admin","superadmin"),
  uploader.array("files", 10),
  async (req, res) => {
    const {
      title, description, category, contentHtml, videoLink,
      status, publishAt, mandatoryFor
    } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: "Başlık ve açıklama zorunlu" });

    const files = (req.files || []).map(f => ({
      originalName: f.originalname,
      url: `/uploads/${f.filename}`,
      size: f.size,
      mimeType: f.mimetype
    }));

    const t = await Training.create({
      title, description, category, contentHtml, videoLink,
      files,
      status: status || "published",
      publishAt: publishAt ? new Date(publishAt) : undefined,
      mandatoryFor: {
        stajyer:       mandatoryFor?.stajyer ?? false,
        personelMavi:  mandatoryFor?.personelMavi ?? false,
        personelBeyaz: mandatoryFor?.personelBeyaz ?? false,
        everyone:      mandatoryFor?.everyone ?? true
      }
    });
    return res.status(201).json({ message: "Eğitim oluşturuldu", training: t });
});

/* LIST (role filtresi) */
router.get("/", auth, async (req, res) => {
  const role = req.user.role;
  const q = { status: "published" };
  const or = [{ "mandatoryFor.everyone": true }];
  if (role === "stajyer")  or.push({ "mandatoryFor.stajyer": true });
  if (role === "personel") { or.push({ "mandatoryFor.personelMavi": true }, { "mandatoryFor.personelBeyaz": true }); }
  if (role === "admin")    or.push({ "mandatoryFor.everyone": true }); // admin hepsini görür + aşağıda admin-list opsiyonu
  if (role === "superadmin") or.push({ "mandatoryFor.everyone": true });
  q.$or = or;

  const list = await Training.find(q).sort({ createdAt: -1 }).lean();
  return res.json({ items: list });
});

/* ADMIN: tüm eğitimleri (taslak vs dahil) listele */
router.get("/admin/all", auth, allow("admin","superadmin"), async (_req, res) => {
  const all = await Training.find({}).sort({ createdAt: -1 }).lean();
  return res.json({ items: all });
});

/* DETAIL */
router.get("/:id", auth, async (req, res) => {
  const t = await Training.findById(req.params.id).lean();
  if (!t) return res.status(404).json({ message: "Bulunamadı" });
  return res.json(t);
});

/* UPDATE (admin) */
router.put("/:id", auth, allow("admin","superadmin"), uploader.array("files", 10), async (req, res) => {
  const { title, description, category, contentHtml, videoLink, status, publishAt, mandatoryFor } = req.body || {};
  const set = {};
  if (title) set.title = title;
  if (description) set.description = description;
  if (category) set.category = category;
  if (contentHtml !== undefined) set.contentHtml = contentHtml;
  if (videoLink !== undefined) set.videoLink = videoLink;
  if (status) set.status = status;
  if (publishAt) set.publishAt = new Date(publishAt);
  if (mandatoryFor) set.mandatoryFor = mandatoryFor;

  const files = (req.files || []).map(f => ({
    originalName: f.originalname,
    url: `/uploads/${f.filename}`,
    size: f.size,
    mimeType: f.mimetype
  }));
  if (files.length) set.$push = { files: { $each: files } };

  const updated = await Training.findByIdAndUpdate(req.params.id, set, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Bulunamadı" });
  return res.json({ message: "Güncellendi", training: updated });
});

/* DELETE (admin) */
router.delete("/:id", auth, allow("admin","superadmin"), async (req, res) => {
  await Training.findByIdAndDelete(req.params.id);
  return res.json({ message: "Silindi" });
});

/* VIEW LOG: kullanıcı görüntüledi */
router.post("/:id/view", auth, async (req, res) => {
  await TrainingView.updateOne(
    { trainingId: req.params.id, userId: req.user.id },
    { $setOnInsert: { trainingId: req.params.id, userId: req.user.id, viewedAt: new Date() } },
    { upsert: true }
  );
  return res.json({ ok: true });
});

/* ADMIN: kimler görüntülemiş */
router.get("/:id/viewers", auth, allow("admin","superadmin"), async (req, res) => {
  const viewers = await TrainingView.find({ trainingId: req.params.id })
    .populate("userId", "firstName lastName username role department")
    .sort({ viewedAt: -1 })
    .lean();
  return res.json({ items: viewers });
});

export default router;
