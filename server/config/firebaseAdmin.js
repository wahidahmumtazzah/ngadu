import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY || "";
  const normalized = raw.trim().replace(/,$/, "");
  const unquoted =
    normalized.startsWith('"') && normalized.endsWith('"')
      ? normalized.slice(1, -1)
      : normalized.startsWith("'") && normalized.endsWith("'")
        ? normalized.slice(1, -1)
        : normalized.startsWith('"')
          ? normalized.slice(1)
          : normalized.startsWith("'")
            ? normalized.slice(1)
            : normalized;
  return unquoted.replace(/\\n/g, "\n").trim();
}

function hasFirebaseAdminConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

export function getFirebaseAdminAuth() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error("Firebase Admin belum dikonfigurasi.");
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey()
      })
    });
  }

  return getAuth();
}
