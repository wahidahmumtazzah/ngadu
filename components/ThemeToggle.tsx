"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "laporin-theme";

type ThemeMode = "light" | "dark";

function applyTheme(nextTheme: ThemeMode) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  localStorage.setItem(THEME_KEY, nextTheme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const initialTheme: ThemeMode =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      className="inline-flex items-center justify-center rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-400 hover:text-brand-600"
      aria-label={theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={theme === "dark" ? "Tema gelap aktif" : "Tema terang aktif"}
    >
      {theme === "dark" ? "Terang" : "Gelap"}
    </button>
  );
}
