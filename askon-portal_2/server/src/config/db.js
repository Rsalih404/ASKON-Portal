// server/src/config/db.js
import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/askon_portal";

mongoose.set("strictQuery", true);

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB bağlı:", MONGO_URI);
    return mongoose.connection;
  } catch (err) {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    throw err;
  }
}


export default mongoose;
