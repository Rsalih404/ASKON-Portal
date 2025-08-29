// server/src/models/QuizResult.js
import mongoose from "mongoose";

const QuizResultSchema = new mongoose.Schema({
  quizId:       { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers:      [{ type: Number }], // işaretlenen seçenek indeksleri
  score:        { type: Number, required: true },   // %
  correctCount: { type: Number, required: true },
  total:        { type: Number, required: true },
  submittedAt:  { type: Date, default: Date.now }
}, { timestamps: true });

QuizResultSchema.index({ quizId: 1, userId: 1 });

export const QuizResult = mongoose.model("QuizResult", QuizResultSchema);
