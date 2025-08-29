import jwt from "jsonwebtoken";
const { JWT_SECRET = "dev_secret", JWT_EXPIRES_IN = "7d" } = process.env;

export function signUser(userDoc) {
  const payload = {
    id: userDoc._id?.toString?.() || userDoc.id,
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    username: userDoc.username,
    role: userDoc.role,
    department: userDoc.department
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
