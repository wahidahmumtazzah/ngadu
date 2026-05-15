"use client";

import { apiFetch, getUser } from "@/lib/api";
import { getFirebaseAuth, getFirebaseConfigError } from "@/lib/firebase-client";
import { organizationTypeOptions } from "@/lib/platform-config";
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification, signOut } from "firebase/auth";
import { FormEvent, useEffect, useMemo, useState } from "react";

type OrganizationItem = {
  id: number;
  name: string;
  type: string;
  custom_type_label?: string | null;
  address?: string | null;
};

export default function RegisterOrganizationPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizationType, setOrganizationType] = useState("school");
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [reportingOrganizationId, setReportingOrganizationId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reporting, setReporting] = useState(false);

  async function loadOrganizations() {
    try {
      const data = await apiFetch("/organizations");
      setOrganizations(data.organizations || []);
    } catch {
      setOrganizations([]);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  const currentUser = useMemo(() => getUser(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const adminEmail = String(formData.get("adminEmail") || "").trim();
    const adminPassword = String(formData.get("adminPassword") || "");

    try {
      const configError = getFirebaseConfigError();
      if (configError) {
        throw new Error(configError);
      }

      const firebaseAuth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(firebaseAuth, adminEmail, adminPassword);
      await sendEmailVerification(credential.user);
      const idToken = await credential.user.getIdToken(true);

      try {
        const data = await apiFetch("/organizations/register", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        setMessage('Cek email, di spam "laporin", lalu klik link tersebut.');
        await signOut(firebaseAuth);
      } catch (error) {
        await deleteUser(credential.user);
        throw error;
      }

      form.reset();
      setOrganizationType("school");
      await loadOrganizations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat instansi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReportOrganization(organizationId: number) {
    if (!reportReason.trim()) {
      setReportMessage("Alasan pelaporan wajib diisi.");
      return;
    }

    try {
      setReporting(true);
      setReportMessage("");
      const data = await apiFetch(`/organizations/${organizationId}/report-abuse`, {
        method: "POST",
        body: JSON.stringify({
          reason: reportReason,
          reporterEmail: currentUser?.email || ""
        })
      });
      setReportMessage(data.message || "Laporan instansi berhasil dikirim.");
      setReportReason("");
      setReportingOrganizationId(null);
      await loadOrganizations();
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : "Gagal melaporkan instansi.");
    } finally {
      setReporting(false);
    }
  }

  return (
    <main className="container-app py-14">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card p-8">
          <span className="badge bg-brand-100 text-brand-700">Register Workspace</span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">Daftar Instansi Baru</h1>
          <p className="mt-4 text-sm leading-6 text-ink/70">
            Buat workspace instansi terlebih dahulu. Sistem akan otomatis menyesuaikan kategori
            laporan, role label, dashboard, dan menu berdasarkan jenis platform yang Anda pilih.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-ink">Nama instansi</span>
              <input name="organizationName" required className="input" placeholder="Contoh: SMP Harapan Bangsa" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Jenis instansi</span>
              <select
                name="organizationType"
                className="input"
                value={organizationType}
                onChange={(event) => setOrganizationType(event.target.value)}
              >
                {organizationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Logo instansi</span>
              <input
                name="logo"
                type="file"
                accept="image/*"
                className="input file:mr-4 file:rounded-xl file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
              />
            </label>

            {organizationType === "custom" ? (
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Label platform custom</span>
                <input name="customTypeLabel" className="input" placeholder="Contoh: Rumah Ibadah / Klinik / Komunitas" />
              </label>
            ) : null}

            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-ink">Alamat instansi</span>
              <textarea name="address" className="input min-h-[110px]" placeholder="Alamat lengkap instansi" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Nomor HP</span>
              <input name="phone" className="input" placeholder="08xxxxxxxxxx" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Nama admin</span>
              <input name="adminName" required className="input" placeholder="Nama penanggung jawab" />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Email admin</span>
              <input name="adminEmail" type="email" required className="input" placeholder="admin@instansi.com" />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-ink">Password admin</span>
              <input name="adminPassword" type="password" required className="input" placeholder="Minimal 6 karakter" />
            </label>

            {message ? (
              <div className="sm:col-span-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                <p className="font-medium">{message}</p>
              </div>
            ) : null}

            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? "Membuat workspace..." : "Buat Instansi"}
              </button>
            </div>
          </form>
        </div>

        <div className="card p-8">
          <span className="badge bg-ink/5 text-ink/70">Directory</span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-ink">Instansi Aktif</h2>
          <p className="mt-4 text-sm leading-6 text-ink/70">
            Daftar ini hanya menampilkan workspace yang sudah aktif. Jika ada instansi yang terlihat palsu atau mencurigakan,
            Anda bisa melaporkannya di sini.
          </p>

          {reportMessage ? <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{reportMessage}</div> : null}

          <div className="mt-6 space-y-4">
            {organizations.map((organization) => (
              <div key={organization.id} className="rounded-3xl border border-ink/8 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-ink">{organization.name}</p>
                    <p className="mt-1 text-sm text-ink/55">
                      {organizationTypeOptions.find((item) => item.value === organization.type)?.label || organization.type}
                    </p>
                    {organization.address ? <p className="mt-2 text-sm text-ink/65">{organization.address}</p> : null}
                  </div>
                  <button
                    onClick={() => {
                      setReportingOrganizationId((current) => (current === organization.id ? null : organization.id));
                      setReportMessage("");
                    }}
                    className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                  >
                    Laporkan Instansi
                  </button>
                </div>

                {reportingOrganizationId === organization.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      className="input min-h-[110px]"
                      placeholder="Jelaskan alasan kenapa instansi ini perlu ditinjau."
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleReportOrganization(organization.id)}
                        disabled={reporting}
                        className="rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {reporting ? "Mengirim..." : "Kirim Laporan"}
                      </button>
                      <button
                        onClick={() => {
                          setReportingOrganizationId(null);
                          setReportReason("");
                        }}
                        className="rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {organizations.length === 0 ? (
              <div className="rounded-3xl bg-sand p-8 text-center text-sm text-ink/55">Belum ada instansi aktif yang tampil saat ini.</div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
