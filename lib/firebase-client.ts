"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""
};

const requiredEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
] as const;

export function getFirebaseConfigError() {
  const missing = [
    !firebaseConfig.apiKey ? "NEXT_PUBLIC_FIREBASE_API_KEY" : null,
    !firebaseConfig.authDomain ? "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" : null,
    !firebaseConfig.projectId ? "NEXT_PUBLIC_FIREBASE_PROJECT_ID" : null,
    !firebaseConfig.appId ? "NEXT_PUBLIC_FIREBASE_APP_ID" : null
  ].filter(Boolean) as string[];
  if (missing.length === 0) return null;
  return `Firebase belum dikonfigurasi. Isi env berikut: ${missing.join(", ")}`;
}

let cachedAuth: Auth | null = null;

export function getFirebaseAuth() {
  const configError = getFirebaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  if (cachedAuth) return cachedAuth;

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}
