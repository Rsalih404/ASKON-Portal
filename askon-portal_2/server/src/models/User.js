import mongoose from "mongoose";

export const PERSONEL_TYPES = ["mavi", "beyaz"];
export const ROLES = ["stajyer", "personel", "admin", "superadmin"];

const UserSchema = new mongoose.Schema(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    tcNo:         { type: String, required: true, trim: true, match: /^\d{11}$/ },
    username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    email:        { type: String, trim: true, lowercase: true },
    phone:        { type: String, trim: true },
    address:      { type: String, trim: true },
    birthDate:    { type: Date },
    department:   { type: String, trim: true },

    personelType: { type: String, enum: PERSONEL_TYPES },
    role:         { type: String, enum: ROLES, default: "stajyer", index: true },
    isActive:     { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    about:        { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

// username doğrulama
UserSchema.path("username").validate(
  (v) => /^[a-z0-9]{3,32}$/.test(v),
  "Kullanıcı adı yalnızca a-z0-9 ve 3–32 karakter olmalıdır."
);

// case-insensitive benzersizlik (Mongo 3.4+)
UserSchema.index({ username: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export const User = mongoose.model("User", UserSchema);
