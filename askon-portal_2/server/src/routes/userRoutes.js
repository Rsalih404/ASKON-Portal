import express from "express";
import { auth } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = express.Router();

/* ---- Profil GET (me veya ?userId=...) ---- */
router.get("/profile", auth, async (req, res) => {
  try {
    const canImpersonate = ["admin", "superadmin"].includes(
      String(req.user.role || "").toLowerCase()
    );
    const id = (req.query?.userId && canImpersonate) ? req.query.userId : req.user.id;

    const user = await User.findById(id)
      .select("-passwordHash -__v")          // gerekiyorsa: -tcNo
      .lean();

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json(user);
  } catch (e) {
    console.error("profile get error:", e);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

/* ---- Profil PUT (sadece kendi) ---- */
router.put("/profile", auth, async (req, res) => {
  try {
    const { birthDate, address, phone, about, email } = req.body || {};
    const update = {};

    // tarih güvenli parse
    if (birthDate !== undefined) {
      const ts = Date.parse(birthDate);
      update.birthDate = Number.isNaN(ts) ? null : new Date(ts);
    }
    if (address !== undefined) update.address = String(address).trim().slice(0, 250);
    if (phone   !== undefined) update.phone   = String(phone).trim().slice(0, 30);
    if (about   !== undefined) update.about   = String(about).trim().slice(0, 500);
    if (email   !== undefined) update.email   = String(email).trim().toLowerCase();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-passwordHash -__v").lean();

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json({ message: "Güncellendi", user });
  } catch (e) {
    console.error("profile put error:", e);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;
