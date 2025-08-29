// server/src/routes/adminUsers.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/roles.js";
import { User } from "../models/User.js";
import { makeUsername, toAsciiTR } from "../utils/username.js";

const router = Router();

/* ---- LISTE ---- */
router.get("/", auth, allow("admin","superadmin"), async (req, res) => {
  const {
    q = "", department = "", role = "", personelType = "",
    limit = 100, skip = 0
  } = req.query;

  const where = {};
  if (department) where.department = department;
  if (role) where.role = role;
  if (personelType) where.personelType = personelType;

  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    where.$or = [{ firstName: rx }, { lastName: rx }, { username: rx }, { department: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(where).select("-passwordHash")
      .collation({ locale: "en", strength: 2 })
      .sort({ createdAt: -1 })
      .skip(Number(skip)).limit(Math.min(Number(limit), 500)).lean(),
    User.countDocuments(where)
  ]);

  res.json({ items, total });
});

/* ---- OLUŞTUR ---- */
router.post("/", auth, allow("admin","superadmin"), async (req, res) => {
  try {
    const { firstName, lastName, tcNo, department, role, personelType, username } = req.body || {};
    if (!firstName || !lastName || !tcNo || !role) {
      return res.status(400).json({ message: "firstName, lastName, tcNo, role zorunlu" });
    }
    if (!/^\d{11}$/.test(String(tcNo))) {
      return res.status(400).json({ message: "TC No 11 haneli olmalı" });
    }

    const hint = username ? toAsciiTR(username).toLowerCase() : "";
    const base = makeUsername({ firstName, lastName, tcNo, hint });

    let uname = base, i = 0;
    while (await User.findOne({ username: uname }).collation({ locale: "en", strength: 2 })) {
      i++; if (i > 999) return res.status(409).json({ message: "username already exists" });
      uname = (base + String(i).padStart(3, "0")).slice(0, 32);
    }

    const initialPassword = "AsKoN!2025!";
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const doc = await User.create({
      firstName, lastName, tcNo,
      username: uname, passwordHash,
      department, role,
      personelType: role === "personel" ? (personelType || undefined) : undefined,
      isActive: true, mustChangePassword: true
    });

    res.status(201).json({
      message: "Kullanıcı oluşturuldu",
      user: { id: doc._id, username: doc.username, firstName, lastName, role }
    });
  } catch (e) {
    console.error("admin/users POST error:", e);
    res.status(500).json({ message: "Kullanıcı oluşturulamadı", error: e.message });
  }
});

/* ---- DETAY ---- */
router.get("/:id", auth, allow("admin","superadmin"), async (req, res) => {
  const u = await User.findById(req.params.id).select("-passwordHash").lean();
  if (!u) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  res.json(u);
});

/* ---- SİL ---- */
router.delete("/:id", auth, allow("admin","superadmin"), async (req, res) => {
  const { deletedCount } = await User.deleteOne({ _id: req.params.id });
  if (!deletedCount) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  res.json({ message: "Silindi" });
});

export default router;
