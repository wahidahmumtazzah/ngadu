"use client";

import { apiFetch, saveAuth } from "@/lib/api";
import { getFirebaseAuth, getFirebaseConfigError } from "@/lib/firebase-client";
import { getRoleOptions } from "@/lib/platform-config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
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

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const configError = getFirebaseConfigError();
      if (configError) {
        throw new Error(configError);
      }

      const firebaseAuth = getFirebaseAuth();

      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          String(payload.email || "").trim(),
          String(payload.password || "")
        );
        await sendEmailVerification(credential.user);
        const idToken = await credential.user.getIdToken(true);

        try {
          const data = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({
              name: payload.name,
              organizationId: payload.organizationId,
              roleLabel: payload.roleLabel
            }),
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          setMessage('Cek email, di spam "laporin", lalu klik link tersebut.');
          await signOut(firebaseAuth);
        } catch (error) {
          await credential.user.delete();
          throw error;
        }

        setMode("login");
        form.reset();
      } else {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          String(payload.email || "").trim(),
          String(payload.password || "")
        );

        if (!credential.user.emailVerified) {
          setMessage('Cek email, di spam "laporin", lalu klik link tersebut.');
          return;
        }

        const idToken = await credential.user.getIdToken(true);
        const data = await apiFetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        saveAuth({ user: data.user });
        location.href = data.user.role === "super_admin" ? "/super-admin" : data.user.role === "admin" ? "/admin" : "/dashboard";
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    const configError = getFirebaseConfigError();
    if (configError) {
      setMessage(configError);
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth.currentUser) {
      setMessage("Login dulu dengan akun yang belum terverifikasi agar email verifikasi bisa dikirim ulang.");
      return;
    }

    try {
      setResending(true);
      await sendEmailVerification(firebaseAuth.currentUser);
      setMessage('Cek email, di spam "laporin", lalu klik link tersebut.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim ulang verifikasi.");
    } finally {
      setResending(false);
    }
  }

  async function handleForgotPassword() {
    const configError = getFirebaseConfigError();
    if (configError) {
      setMessage(configError);
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value?.trim() || "";
    if (!email) {
      setMessage("Isi email terlebih dahulu untuk kirim reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setMessage("Email reset password sudah dikirim dari Firebase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim reset password.");
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
              <>
                <button onClick={handleForgotPassword} className="font-semibold text-brand-700">
                  Lupa password
                </button>
                <button onClick={handleResendVerification} disabled={resending} className="font-semibold text-brand-700 disabled:opacity-60">
                  {resending ? "Mengirim ulang..." : "Kirim ulang verifikasi"}
                </button>
              </>
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
