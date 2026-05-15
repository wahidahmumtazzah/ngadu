"use client";

import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getToken() {
  if (typeof window === "undefined") return "";
  const user = getFirebaseAuth().currentUser;
  if (!user) return "";
  return user.getIdToken();
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ngadu_user");
  return raw ? JSON.parse(raw) : null;
}

export function saveAuth(data: { user: unknown }) {
  localStorage.setItem("ngadu_user", JSON.stringify(data.user));
}

export function saveUser(user: unknown) {
  localStorage.setItem("ngadu_user", JSON.stringify(user));
}

export async function clearAuth() {
  localStorage.removeItem("ngadu_user");

  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth.currentUser) {
    await signOut(firebaseAuth);
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  const existingAuthHeader = headers.get("Authorization");
  const token = existingAuthHeader ? "" : await getToken();

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!existingAuthHeader && token) {
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
