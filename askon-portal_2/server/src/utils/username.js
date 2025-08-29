export function toAsciiTR(s = "") {
  const map = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };
  return String(s)
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, ch => map[ch])
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function makeUsername({ firstName, lastName, tcNo, hint }) {
  const base =
    (toAsciiTR(firstName) + toAsciiTR(lastName))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "user";
  const suffix = String(tcNo || "").replace(/\D/g, "").slice(-3) || "000";
  // Eğer frontend bir öneri gönderdiyse onu da temizleyip dikkate al
  const prefer = (hint || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidate = (prefer || (base + suffix)).slice(0, 32);
  return candidate;
}
