// src/models/CMSPage.js
import mongoose from "mongoose";

const CMSPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title:{ type: String, required: true, trim: true },
    html: { type: String, default: "" },
    visibleFor: {
      stajyer: { type: Boolean, default: true },
      personelMavi: { type: Boolean, default: true },
      personelBeyaz: { type: Boolean, default: true },
      admin: { type: Boolean, default: true },
      superadmin: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const CMSPage = mongoose.model("CMSPage", CMSPageSchema);
