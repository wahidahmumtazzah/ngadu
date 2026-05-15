"use client";

import { useEffect, useState } from "react";
import { apiFetch, getUser, saveUser } from "@/lib/api";

type ProfileUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  roleLabel?: string;
  organization?: { name?: string; type?: string } | null;
  defaultAnonymous?: boolean;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [defaultAnonymous, setDefaultAnonymous] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function applyUser(nextUser: ProfileUser | null) {
    setUser(nextUser);
    setName(nextUser?.name || "");
    setDefaultAnonymous(Boolean(nextUser?.defaultAnonymous ?? true));
  }

  async function loadProfile() {
    try {
      const data = await apiFetch("/auth/me");
      applyUser(data.user);
      saveUser(data.user);
    } catch {
      applyUser(getUser());
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setMessage("");

      const data = await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          defaultAnonymous
        })
      });

      applyUser(data.user);
      saveUser(data.user);
      setMessage("Profil berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="w-full px-4 py-14 sm:px-6 lg:px-8 2xl:px-10">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-8">
          <span className="badge bg-brand-100 text-brand-700">Profil User</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Pengaturan akun dan anonimitas</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
            Ubah data profil yang boleh diedit user dan tentukan preferensi anonim default untuk
            laporan baru.
          </p>

          <div className="mt-8 grid gap-5">
            <label className="rounded-3xl border border-ink/8 bg-white p-6">
              <span className="text-xs uppercase tracking-[0.18em] text-ink/45">Nama</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input mt-4"
                placeholder="Nama lengkap"
              />
            </label>

            <label className="rounded-3xl border border-ink/8 bg-white p-6">
              <span className="text-xs uppercase tracking-[0.18em] text-ink/45">Email</span>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="input mt-4"
                placeholder="nama@email.com"
              />
            </label>

            <div className="rounded-3xl border border-ink/8 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Role</p>
              <p className="mt-3 text-xl font-bold capitalize text-ink">{user?.roleLabel || user?.role || "user"}</p>
            </div>

            <div className="rounded-3xl border border-ink/8 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Instansi</p>
              <p className="mt-3 text-xl font-bold text-ink">{user?.organization?.name || "-"}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="card p-8">
            <h2 className="text-2xl font-black text-ink">Anonim Default</h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              Pilih apakah laporan baru secara default akan dikirim sebagai anonim atau tidak.
              Pengaturan ini masih bisa diubah lagi saat mengisi form laporan.
            </p>

            <div className="mt-6 rounded-3xl bg-brand-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-brand-700">Status Saat Ini</p>
                  <p className="mt-2 text-2xl font-black text-ink">
                    {defaultAnonymous ? "Anonim Aktif" : "Anonim Nonaktif"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDefaultAnonymous((current) => !current)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                    defaultAnonymous ? "bg-brand-500" : "bg-ink/20"
                  }`}
                  aria-label="Toggle anonim default"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      defaultAnonymous ? "translate-x-9" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-black text-ink">Simpan Perubahan</h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              Tombol ini akan menyimpan nama dan pengaturan anonim default. Email dikelola oleh Firebase Authentication.
            </p>

            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary mt-6 disabled:opacity-60">
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>

            {message ? <p className="mt-4 text-sm font-medium text-brand-700">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
