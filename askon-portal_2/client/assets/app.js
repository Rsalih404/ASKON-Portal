// client/assets/app.js
// Tek noktadan token + API çağrısı yönetimi

const KEY = "token";
// Live Server (5500) ile açıyorsan istekler backend 5000'e gider; Express'ten (5000) servis ediyorsan "" kalır.
export const API_BASE = (location.port === "5500") ? "http://localhost:5000" : "";

// ---- Token yardımcıları ----
export function setToken(t) {
  if (!t) return;
  localStorage.setItem(KEY, String(t).trim());
}
export function getToken() {
  return localStorage.getItem(KEY) || "";
}
export function clearToken() {
  localStorage.removeItem(KEY);
}

// ---- Genel API wrapper ----
export async function api(path, options = {}) {
  const headers = options.headers || {};
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const t = getToken();
  if (t) headers["Authorization"] = "Bearer " + t;

  const res = await fetch(API_BASE + path, { ...options, headers });

  let data = {};
  try { data = await res.json(); } catch (_) {}

  if (res.status === 401) {
    clearToken();
    throw new Error(data.message || "Oturum süresi doldu (401)");
  }
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

// ---- Sayfa yardımcıları ----
export async function ensureAuth() {
  if (!getToken()) {
    location.href = "/client/login/login.html";
    return null;
  }
  try {
    const me = await api("/api/auth/me");
    return me;
  } catch {
    location.href = "/client/login/login.html";
    return null;
  }
}

export function logout() {
  clearToken();
  location.href = "/client/login/login.html";
}

export function redirectByRole(role) {
  // Rol bazlı farklı sayfan varsa burada yönlendir.
  location.href = "/client/app/anasayfa.html";
}
