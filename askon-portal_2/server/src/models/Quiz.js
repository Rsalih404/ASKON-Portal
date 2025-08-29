// server/src/models/Quiz.js
import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  text:         { type: String, required: true },
  options:      [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0 }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: "Training" }, // opsiyonel bağ
  questions:  { type: [QuestionSchema], default: [] },
  passScore:  { type: Number, default: 60 }, // %
  status:     { type: String, enum: ["draft","published","archived"], default: "published" },
  audience: {
    stajyer:       { type: Boolean, default: true },
    personelMavi:  { type: Boolean, default: true },
    personelBeyaz: { type: Boolean, default: true },
    everyone:      { type: Boolean, default: true }
  }
}, { timestamps: true });

export const Quiz = mongoose.model("Quiz", QuizSchema);
