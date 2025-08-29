// server/src/seed.js
import "dotenv/config";             // .env'i kesin yükle
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";

async function run() {
  const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/askon_portal";

  // küçük bir görünürlük (credential maskeleme)
  const shown = URI.replace(/\/\/([^@]+)@/, "//***@");
  console.log("[seed] Connecting to:", shown);

  await connectDB(URI);

  // Aynı kullanıcı varsa yeniden oluşturma
  const username = "silaakkus101";
  const exists = await User.findOne({ username }).collation({ locale: "en", strength: 2 });
  if (exists) {
    console.log("[seed] user already exists:", exists.username);
  } else {
    const passwordHash = await bcrypt.hash("Admin!123", 10);
    const doc = await User.create({
      firstName: "Sıla",
      lastName: "Akkuş",
      tcNo: "10101010101",
      username,
      passwordHash,
      department: "İş Güvenliği",
      role: "superadmin",
      isActive: true,
      mustChangePassword: true
    });
    console.log("[seed] created:", doc.username);
  }

  await mongoose.disconnect();
  console.log("[seed] done.");
}

run().catch(err => {
  console.error("[seed] error:", err);
  process.exit(1);
});
