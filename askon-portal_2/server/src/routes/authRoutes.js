import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { signUser } from "../utils/jwt.js";
import { makeUsername, toAsciiTR } from "../utils/username.js";

const router = express.Router();

/* -------- Kayıt (opsiyonel genel kayıt) -------- */
router.post("/register", async (req, res) => {
  try {
    const {
      firstName, lastName, tcNo, password,
      email, phone, address, birthDate, department, personelType, role,
      username // gelse de sanitize edeceğiz
    } = req.body || {};

    if (!firstName || !lastName || !tcNo || !password) {
      return res.status(400).json({ message: "firstName, lastName, tcNo, password zorunludur" });
    }
    if (!/^\d{11}$/.test(String(tcNo))) {
      return res.status(400).json({ message: "TC No 11 haneli olmalı" });
    }

    // username: frontend gönderirse türkçeyi ASCII yap; yoksa ad+soyad+tcSon3
    const hint = username ? toAsciiTR(username).toLowerCase() : "";
    const base = makeUsername({ firstName, lastName, tcNo, hint });

    let uname = base, i = 0;
    while (await User.findOne({ username: uname }).collation({ locale: "en", strength: 2 })) {
      i++; if (i > 999) return res.status(409).json({ message: "Uygun kullanıcı adı üretilemedi" });
      uname = (base + String(i).padStart(3, "0")).slice(0, 32);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName, lastName, tcNo,
      username: uname, passwordHash,
      email, phone, address,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      department, personelType, role
    });

    res.status(201).json({
      message: "Kullanıcı başarıyla kaydedildi",
      user: { id: user._id, username: user.username, firstName, lastName, role: user.role }
    });
  } catch (e) {
    console.error("register error:", e);
    res.status(500).json({ message: "Kayıt sırasında hata", error: e.message });
  }
});

/* -------- Login -------- */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "Kullanıcı adı ve şifre gerekli" });

    const user = await User.findOne({ username: String(username).toLowerCase(), isActive: true })
      .collation({ locale: "en", strength: 2 });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Hatalı şifre" });

    const token = signUser(user);
    res.json({ token });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ message: "Giriş sırasında hata", error: e.message });
  }
});

/* -------- Ben Kimim -------- */
router.get("/me", auth, async (req, res) => {
  const me = await User.findById(req.user.id).select("-passwordHash").lean();
  if (!me) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  res.json(me);
});

/* -------- Şifre Değiştir -------- */
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword ve newPassword gerekli" });
    if (String(newPassword).length < 6) return res.status(400).json({ message: "Yeni parola en az 6 karakter olmalı" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Mevcut şifre yanlış" });

    const same = await bcrypt.compare(newPassword, user.passwordHash);
    if (same) return res.status(400).json({ message: "Yeni parola eskisiyle aynı olamaz" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Şifre başarıyla güncellendi" });
  } catch (e) {
    console.error("change-password error:", e);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;
