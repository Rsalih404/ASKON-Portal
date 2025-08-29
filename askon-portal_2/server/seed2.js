// server/src/seed.js
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User.js";
import { CMSPage } from "./models/CMSPage.js";
import { Training } from "./models/Training.js";
import { Document } from "./models/Document.js";
import { Quiz } from "./models/Quiz.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // 1) Örnek admin + stajyer
  const adminPass = await bcrypt.hash("Admin!123", 10);
  const stjPass   = await bcrypt.hash("Ask0n!123", 10);

  const admin = await User.findOneAndUpdate(
    { username: "admin" },
    { firstName: "Sistem", lastName: "Yöneticisi", tcNo: "00000000000", username: "admin", passwordHash: adminPass, role: "admin" },
    { upsert: true, new: true }
  );
  const stj = await User.findOneAndUpdate(
    { username: "mehmetyildiz123" },
    { firstName: "Mehmet", lastName: "Yildiz", tcNo: "00000000123", username: "mehmetyildiz123", passwordHash: stjPass, role: "stajyer" },
    { upsert: true, new: true }
  );

  // 2) Oryantasyon - Genel Bilgiler sayfası
  await CMSPage.findOneAndUpdate(
    { slug: "oryantasyon-genel-bilgiler" },
    {
      title: "Oryantasyon - Genel Bilgiler",
      html: `
        <h2>Hoş Geldin!</h2>
        <p>Bu portal, ASKON'daki staj sürecinde ihtiyaç duyacağın tüm bilgi ve araçları tek yerde toplar.</p>
        <ul>
          <li><b>Çalışma Düzeni:</b> Mesai ve mola saatlerine uyman beklenir. Geç kalma/izin durumlarını ilgili birimine bildir.</li>
          <li><b>Güvenlik:</b> İSG kurallarına tam uyum zorunludur. Kişisel koruyucu donanımları (KKD) gerektiğinde kullan.</li>
          <li><b>İletişim:</b> Takım liderin ve mentorun ilk başvuru noktandır. Sorularını çekinmeden ilet.</li>
          <li><b>Gizlilik:</b> Şirket içi veriler dışarıyla paylaşılmaz.</li>
          <li><b>Hedefler:</b> Haftalık hedeflerini mentorunla konuş, ilerlemeni düzenli paylaş.</li>
        </ul>
        <p>Başarılar! 🎯</p>
      `
    },
    { upsert: true }
  );

  // 3) Örnek Eğitim
  const training = await Training.create({
    title: "İSG Temel Bilgilendirme",
    description: "İş sağlığı ve güvenliği temel eğitim videosu ve el kitabı.",
    category: "İSG",
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    files: [
      { originalName: "ISG-El-Kitabi.pdf", url: "/uploads/isg-el-kitabi.pdf", size: 123456, mimeType: "application/pdf" }
    ],
    status: "published",
    mandatoryFor: { stajyer: true, everyone: false }
  });

  // 4) Örnek Belge
  await Document.create({
    title: "Haftalık Yemek Listesi",
    description: "Bu haftanın yemek menüsü.",
    category: "Duyurular",
    tags: ["yemek","haftalık"],
    visibleFor: { stajyer: true, personelMavi: true, personelBeyaz: true, admin: true, superadmin: true },
    file: { originalName: "yemek-listesi.pdf", url: "/uploads/yemek-listesi.pdf", size: 23456, mimeType: "application/pdf" }
  });

  // 5) Örnek Quiz (eğitime bağlı)
  await Quiz.create({
    title: "İSG Hızlı Test",
    trainingId: training._id,
    passScore: 60,
    questions: [
      { text: "KKD nedir?", options: ["Kişisel Koruyucu Donanım", "Kamu Kurumsal Dökümanı", "Kontrol Kalite Dosyası"], correctIndex: 0 },
      { text: "Acil çıkışlar nereden öğrenilir?", options: ["Bina planından", "Tahmin edilir", "Yoktur"], correctIndex: 0 }
    ],
    audience: { stajyer: true, everyone: false }
  });

  console.log("✔ Seed tamam");
  await mongoose.disconnect();
}
run();
