import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],

    // Kullanıcıya özel mi, herkese mi?
    isGlobal: { type: Boolean, default: false },

    // Eğer kişiye özelse ilişkilendir
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    visibleFor: {
      stajyer: { type: Boolean, default: true },
      personelMavi: { type: Boolean, default: true },
      personelBeyaz: { type: Boolean, default: true },
      admin: { type: Boolean, default: true },
      superadmin: { type: Boolean, default: true }
    },

    file: {
      originalName: String,
      url: String,
      size: Number,
      mimeType: String
    }
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", DocumentSchema);
