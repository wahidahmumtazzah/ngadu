const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ngadu_token") || "";
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ngadu_user");
  return raw ? JSON.parse(raw) : null;
}

export function saveAuth(data: { token: string; user: unknown }) {
  localStorage.setItem("ngadu_token", data.token);
  localStorage.setItem("ngadu_user", JSON.stringify(data.user));
}

export function saveUser(user: unknown) {
  localStorage.setItem("ngadu_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("ngadu_token");
  localStorage.removeItem("ngadu_user");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan.");
  }
  return data;
}
