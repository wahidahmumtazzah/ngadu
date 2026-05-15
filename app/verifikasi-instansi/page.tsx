"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyOrganizationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("Memverifikasi email instansi...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    apiFetch(`/organizations/verify?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setStatus("success");
        setMessage(data.message || "Email instansi berhasil diverifikasi.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Gagal memverifikasi instansi.");
      });
  }, [token]);

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-xl card p-8">
        <span className={`badge ${status === "success" ? "bg-emerald-100 text-emerald-700" : status === "error" ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"}`}>
          Verifikasi Instansi
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">
          {status === "success" ? "Workspace Aktif" : status === "error" ? "Verifikasi Gagal" : "Memproses Verifikasi"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink/70">{message}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/masuk" className="btn-primary">
            Ke Halaman Masuk
          </Link>
          <Link href="/" className="btn-secondary">
            Kembali ke Landing Page
          </Link>
        </div>
      </div>
    </main>
  );
}
