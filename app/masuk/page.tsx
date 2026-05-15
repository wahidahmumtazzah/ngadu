"use client";

import { apiFetch, saveAuth } from "@/lib/api";
import { getRoleOptions } from "@/lib/platform-config";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type OrganizationOption = {
  id: number;
  name: string;
  type: string;
  custom_type_label?: string | null;
};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState("");
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    apiFetch("/organizations")
      .then((data) => {
        setOrganizations(data.organizations || []);
        if (data.organizations?.[0]) {
          setOrganizationId(String(data.organizations[0].id));
        }
      })
      .catch(() => {
        setOrganizations([]);
      });
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((item) => String(item.id) === organizationId) || null,
    [organizations, organizationId]
  );

  const roleOptions = useMemo(
    () => getRoleOptions(selectedOrganization?.type || "custom").filter((item) => item.systemRole !== "admin"),
    [selectedOrganization]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setVerificationUrl("");

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
        setVerificationUrl(data.verification?.verifyUrl || "");
        setMode("login");
        form.reset();
      } else {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        saveAuth(data);
        location.href = data.user.role === "super_admin" ? "/super-admin" : data.user.role === "admin" ? "/admin" : "/dashboard";
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value?.trim() || "";
    if (!email) {
      setMessage("Isi email instansi/admin terlebih dahulu untuk kirim ulang verifikasi.");
      return;
    }

    try {
      setResending(true);
      const data = await apiFetch("/organizations/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage(data.message || "Email verifikasi baru sudah dikirim.");
      setVerificationUrl(data.verification?.verifyUrl || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim ulang verifikasi.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-2xl card p-8">
        <span className="badge bg-brand-100 text-brand-700">Autentikasi Multi Instansi</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">
          {mode === "login" ? "Masuk ke workspace" : "Daftar akun ke instansi"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          Semua instansi memakai satu sistem login. Saat mendaftar, pilih instansi dan peran tampilan
          Anda agar dashboard dan kategori laporan sesuai konteks lingkungan tersebut.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
          {mode === "register" ? (
            <>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Nama</span>
                <input name="name" required className="input" placeholder="Nama lengkap" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-ink">Instansi</span>
                <select
                  name="organizationId"
                  required
                  className="input"
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                >
                  <option value="">Pilih instansi</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-ink">Peran tampilan</span>
                <select name="roleLabel" required className="input">
                  <option value="">Pilih peran</option>
                  {roleOptions.map((role) => (
                    <option key={`${role.systemRole}-${role.label}`} value={role.label}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          <label className={mode === "login" ? "sm:col-span-2" : ""}>
            <span className="mb-2 block text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" required className="input" placeholder="nama@email.com" />
          </label>

          <label className={mode === "login" ? "sm:col-span-2" : ""}>
            <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
            <input name="password" type="password" required className="input" placeholder="Minimal 6 karakter" />
          </label>

          {message ? (
            <div className="sm:col-span-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <p className="font-medium">{message}</p>
              {verificationUrl ? (
                <a href={verificationUrl} className="mt-2 inline-block font-semibold underline">
                  Buka link verifikasi
                </a>
              ) : null}
            </div>
          ) : null}

          <button disabled={loading} className="btn-primary w-full disabled:opacity-60 sm:col-span-2">
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
          <div className="flex items-center gap-4">
            {mode === "login" ? (
              <button onClick={handleResendVerification} disabled={resending} className="font-semibold text-brand-700 disabled:opacity-60">
                {resending ? "Mengirim ulang..." : "Kirim ulang verifikasi"}
              </button>
            ) : null}
            <Link href="/daftar-instansi" className="font-semibold text-ink">
              Buat instansi
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
