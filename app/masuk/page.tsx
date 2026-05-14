"use client";

import { apiFetch, saveAuth } from "@/lib/api";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (mode === "register") {
        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage(data.message || "Registrasi berhasil. Silakan login.");
        setMode("login");
        form.reset();
      } else {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        saveAuth(data);
        location.href = data.user.role === "admin" ? "/admin" : "/dashboard";
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-lg card p-8">
        <span className="badge bg-brand-100 text-brand-700">Autentikasi Sederhana</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">
          {mode === "login" ? "Masuk ke akun" : "Buat akun baru"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          User dapat memantau laporan sendiri melalui dashboard. Admin menggunakan akun khusus
          untuk mengelola semua laporan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "register" ? (
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Nama</span>
              <input name="name" required className="input" placeholder="Nama lengkap" />
            </label>
          ) : null}

          <label>
            <span className="mb-2 block text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" required className="input" placeholder="nama@email.com" />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
            <input name="password" type="password" required className="input" placeholder="Minimal 6 karakter" />
          </label>

          {message ? <p className="text-sm font-medium text-brand-700">{message}</p> : null}

          <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-ink/70">
          <button
            className="font-semibold text-brand-700"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
          <Link href="/lapor" className="font-semibold text-ink">
            Lapor tanpa login
          </Link>
        </div>
      </div>
    </main>
  );
}
