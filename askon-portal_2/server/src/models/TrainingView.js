// server/src/models/TrainingView.js
import mongoose from "mongoose";

const TrainingViewSchema = new mongoose.Schema({
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
  viewedAt:   { type: Date, default: Date.now }
}, { timestamps: true });

// Bir kullanıcı bir eğitimi en az bir kez görüntülemiş olsun yeter:
TrainingViewSchema.index({ trainingId: 1, userId: 1 }, { unique: true });

export const TrainingView = mongoose.model("TrainingView", TrainingViewSchema);
