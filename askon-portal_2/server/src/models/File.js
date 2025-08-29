import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalName: { type: String, required: true },
    mimeType:     { type: String, required: true },
    size:         { type: Number, required: true },
    path:         { type: String, required: true }, // disk üzerindeki relatif yol
    url:          { type: String, required: true }  // /uploads/... şeklinde public URL
  },
  { timestamps: true }
);

export const File = mongoose.model("File", FileSchema);
