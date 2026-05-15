"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { apiFetch, getUser, saveUser } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebase-client";

export function SessionBootstrap() {
  useEffect(() => {
    let firebaseAuth;

    try {
      firebaseAuth = getFirebaseAuth();
    } catch {
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem("ngadu_user");
        return;
      }

      try {
        const currentUser = getUser();
        if (!currentUser || currentUser.email !== firebaseUser.email) {
          const data = await apiFetch("/auth/me");
          saveUser(data.user);
        }
      } catch {
        localStorage.removeItem("ngadu_user");
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
