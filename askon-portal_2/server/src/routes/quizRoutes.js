// server/src/routes/quizRoutes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/roles.js";
import { Quiz } from "../models/Quiz.js";
import { QuizResult } from "../models/QuizResult.js";

const router = Router();

/* CREATE (admin) */
router.post("/", auth, allow("admin","superadmin"), async (req, res) => {
  const { title, trainingId, questions, passScore, status, audience } = req.body || {};
  if (!title || !Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ message: "Başlık ve en az 1 soru gerekli" });
  }
  const q = await Quiz.create({
    title, trainingId: trainingId || undefined,
    questions, passScore: passScore ?? 60,
    status: status || "published",
    audience: audience || { everyone: true }
  });
  return res.status(201).json({ message: "Quiz oluşturuldu", quiz: q });
});

/* LIST (rol filtresi) */
router.get("/", auth, async (req, res) => {
  const role = req.user.role;
  const query = { status: "published" };
  const or = [{ "audience.everyone": true }];
  if (role === "stajyer")  or.push({ "audience.stajyer": true });
  if (role === "personel") or.push({ "audience.personelMavi": true }, { "audience.personelBeyaz": true });
  query.$or = or;

  const items = await Quiz.find(query).select("title trainingId createdAt").sort({ createdAt: -1 }).lean();
  return res.json({ items });
});

/* GET ONE (sorular ama doğru indeksleri gizle) */
router.get("/:id", auth, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Bulunamadı" });
  const sanitized = {
    _id: quiz._id,
    title: quiz.title,
    trainingId: quiz.trainingId,
    passScore: quiz.passScore,
    questions: quiz.questions.map(({ text, options }) => ({ text, options }))
  };
  return res.json(sanitized);
});

/* SUBMIT */
router.post("/:id/submit", auth, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Bulunamadı" });

  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  let correct = 0;
  quiz.questions.forEach((q, idx) => {
    if (answers[idx] === q.correctIndex) correct++;
  });
  const total = quiz.questions.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  const saved = await QuizResult.create({
    quizId: quiz._id,
    userId: req.user.id,
    answers,
    score,
    correctCount: correct,
    total
  });
  return res.json({ message: "Kaydedildi", result: { id: saved._id, score, correct, total, pass: score >= quiz.passScore } });
});

/* ADMIN: Sonuçlar */
router.get("/:id/results", auth, allow("admin","superadmin"), async (req, res) => {
  const list = await QuizResult.find({ quizId: req.params.id })
    .populate("userId", "firstName lastName username role department")
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ items: list });
});

export default router;
