// src/models/Training.js
import mongoose from "mongoose";

const TrainingSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category:    { type: String, trim: true },
    contentHtml: { type: String, trim: true },
    videoLink:   { type: String, trim: true },
    files: [{
      originalName: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    status:      { type: String, enum: ["draft", "published", "archived"], default: "published" },
    publishAt:   { type: Date },
    mandatoryFor: {
      stajyer: { type: Boolean, default: false },
      personelMavi: { type: Boolean, default: false },
      personelBeyaz: { type: Boolean, default: false },
      everyone: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const Training = mongoose.model("Training", TrainingSchema);
