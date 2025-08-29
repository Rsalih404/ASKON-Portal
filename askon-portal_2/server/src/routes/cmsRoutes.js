// server/src/routes/cmsRoutes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/roles.js";
import { CMSPage } from "../models/CMSPage.js";

const router = Router();

function sanitizeSlug(s = "") {
  return String(s).trim().toLowerCase();
}

/* -------------------------------------------------------
 * GET /api/cms/:slug  (HERKESE AÇIK)
 * - Sayfa yoksa, varsayılan bir sayfa oluşturup geri döner
 * ----------------------------------------------------- */
router.get("/:slug", async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);

  let page = await CMSPage.findOne({ slug }).lean();
  if (!page) {
    // varsayılan görünürlük (her role açık) + basit içerik
    page = await CMSPage.create({
      slug,
      title: "Oryantasyon - Genel Bilgiler",
      html: `
        <h2>Hoş geldiniz 👋</h2>
        <p>Bu sayfa henüz düzenlenmedi. Yönetim panelinden içeriği güncelleyebilirsiniz.</p>
        <ul>
          <li><b>Çalışma Düzeni:</b> Mesai ve mola saatlerine uyalım.</li>
          <li><b>Güvenlik:</b> İSG kurallarına tam uyum zorunludur.</li>
          <li><b>İletişim:</b> Sorularınız için mentorunuza başvurun.</li>
        </ul>
      `,
      visibleFor: {
        stajyer: true,
        personelMavi: true,
        personelBeyaz: true,
        admin: true,
        superadmin: true
      }
    });
    // create() doc döndürdü; frontend için lean() şeması gibi gönderelim
    page = page.toObject();
  }
  return res.json(page);
});

/* -------------------------------------------------------
 * (Opsiyonel) Listeleme: sadece admin/superadmin
 * GET /api/cms
 * ----------------------------------------------------- */
router.get("/", auth, allow("admin", "superadmin"), async (_req, res) => {
  const items = await CMSPage.find().sort({ updatedAt: -1 }).lean();
  res.json({ items, total: items.length });
});

/* -------------------------------------------------------
 * Oluşturma: admin/superadmin
 * POST /api/cms
 * body: { slug, title, html?, visibleFor? }
 * ----------------------------------------------------- */
router.post("/", auth, allow("admin", "superadmin"), async (req, res) => {
  const { slug, title, html, visibleFor } = req.body || {};
  const s = sanitizeSlug(slug);
  if (!s || !title) {
    return res.status(400).json({ message: "slug ve title zorunlu" });
  }

  const created = await CMSPage.create({
    slug: s,
    title,
    html: html || "",
    visibleFor: visibleFor || {
      stajyer: true, personelMavi: true, personelBeyaz: true, admin: true, superadmin: true
    }
  });

  return res.status(201).json({ message: "Sayfa oluşturuldu", page: created });
});

/* -------------------------------------------------------
 * Güncelleme: admin/superadmin
 * PUT /api/cms/:slug
 * body: { title?, html?, visibleFor? }
 * ----------------------------------------------------- */
router.put("/:slug", auth, allow("admin", "superadmin"), async (req, res) => {
  const s = sanitizeSlug(req.params.slug);
  const { title, html, visibleFor } = req.body || {};

  const updated = await CMSPage.findOneAndUpdate(
    { slug: s },
    {
      $set: {
        ...(title ? { title } : {}),
        ...(html !== undefined ? { html } : {}),
        ...(visibleFor ? { visibleFor } : {})
      }
    },
    { new: true, upsert: false }
  ).lean();

  if (!updated) return res.status(404).json({ message: "Bulunamadı" });
  return res.json({ message: "Güncellendi", page: updated });
});

export default router;
