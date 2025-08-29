// server/src/middleware/roles.js
export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Yetkisiz" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Erişim reddedildi" });
    }
    next();
  };
}
