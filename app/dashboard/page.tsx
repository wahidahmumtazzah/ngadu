"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch, getUser } from "@/lib/api";
import { getPlatformConfig, isSensitiveCategoryForType } from "@/lib/platform-config";

type ReportItem = {
  id: number;
  category: string;
  title: string | null;
  location: string;
  description: string;
  urgency: string;
  status: string;
  created_at: string;
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  is_read: number;
};

function formatTanggal(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getUrgencyStyle(urgency: string) {
  if (urgency === "tinggi") return "bg-red-100 text-red-700";
  if (urgency === "sedang") return "bg-amber-100 text-amber-700";
  return "bg-brand-50 text-brand-700";
}

function isSensitiveReportCategory(organizationType: string, category: string) {
  return isSensitiveCategoryForType(organizationType, category);
}

function getProgressWidth(status: string) {
  if (status === "selesai") return "100%";
  if (status === "menunggu_korban") return "82%";
  if (status === "diproses") return "66%";
  return "33%";
}

export default function UserDashboardPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  const platformConfig = useMemo(() => getPlatformConfig(user?.organization?.type || "custom"), [user]);

  async function loadReports(nextCategory = category, nextStatus = status) {
    try {
      const params = new URLSearchParams();
      if (nextCategory) params.set("category", nextCategory);
      if (nextStatus) params.set("status", nextStatus);

      const data = await apiFetch(`/reports/my?${params.toString()}`);
      setReports(data.reports || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    }
  }

  async function loadNotifications() {
    try {
      const data = await apiFetch("/auth/notifications");
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    loadReports();
    loadNotifications();
  }, []);

  const stats = useMemo(
    () => ({
      total: reports.length,
      diproses: reports.filter((report) => report.status === "diproses").length,
      menungguKorban: reports.filter((report) => report.status === "menunggu_korban").length,
      selesai: reports.filter((report) => report.status === "selesai").length,
      terkirim: reports.filter((report) => report.status === "terkirim").length
    }),
    [reports]
  );

  return (
    <main className="w-full px-4 pb-14 pt-8 sm:px-6 sm:pt-10 lg:px-8 2xl:px-10">
      <div className="space-y-6">
        <section className="card p-8">
          <span className="badge bg-brand-100 text-brand-700">{platformConfig.dashboardLabel}</span>
          <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-ink">
                Halo {user?.name || platformConfig.userLabel}, selamat datang di {user?.organization?.name || platformConfig.label}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
                Pantau laporan Anda, lihat notifikasi terbaru, dan kirim aduan baru sesuai kategori {platformConfig.label.toLowerCase()}.
              </p>
            </div>

            <Link href="/" className="btn-secondary">
              Kembali
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: `Total ${platformConfig.reportLabel}`, value: stats.total },
            { label: "Sedang Diproses", value: stats.diproses },
            { label: "Selesai", value: stats.selesai },
            { label: "Terkirim", value: stats.terkirim }
          ].map((item) => (
            <div key={item.label} className="card p-6">
              <p className="text-sm text-ink/60">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-ink">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
          <section className="card p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-ink">Riwayat Laporan</h2>
                <p className="mt-2 text-sm text-ink/70">Semua laporan akan otomatis terfilter sesuai organisasi Anda.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="input"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    loadReports(event.target.value, status);
                  }}
                >
                  <option value="">Semua kategori</option>
                  {platformConfig.categories.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <select
                  className="input"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    loadReports(category, event.target.value);
                  }}
                >
                  <option value="">Semua status</option>
                  {["terkirim", "diproses", "menunggu_korban", "selesai", "ditolak"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="mt-8 grid gap-4">
              {reports.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-ink/10 bg-sand p-10 text-center text-sm text-ink/60">
                  Belum ada laporan yang sesuai filter saat ini.
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="rounded-3xl border border-ink/8 bg-white p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-ink/5 text-ink/70 capitalize">{report.category}</span>
                      {isSensitiveReportCategory(user?.organization?.type || "custom", report.category) ? (
                        <span className="badge bg-red-100 text-red-700">Sensitif</span>
                      ) : null}
                      <span className={`badge capitalize ${getUrgencyStyle(report.urgency)}`}>{report.urgency}</span>
                      <StatusBadge status={report.status} />
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-ink">{report.title || report.location}</h3>
                    <p className="mt-1 text-sm text-ink/55">{report.location}</p>
                    <p className="mt-2 text-sm text-ink/55">{formatTanggal(report.created_at)}</p>
                    <p className="mt-3 text-sm leading-6 text-ink/70">{report.description}</p>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                        <span>Terkirim</span>
                        <span>Diproses</span>
                        <span>Menunggu</span>
                        <span>Selesai</span>
                      </div>
                      <div className="h-2 rounded-full bg-ink/8">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-zinc-400 via-amber-400 to-emerald-500"
                          style={{ width: getProgressWidth(report.status) }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="card p-6">
              <h2 className="text-xl font-black text-ink">Kategori Aktif</h2>
              <div className="mt-5 space-y-3">
                {platformConfig.categories.map((item) => (
                  <div key={item.name} className="rounded-2xl bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink capitalize">{item.name}</p>
                      {item.sensitive ? <span className="badge bg-red-100 text-red-700">Sensitif</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-ink/60">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="text-xl font-black text-ink">Notifikasi</h2>
              <div className="mt-5 space-y-3">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl bg-sand px-4 py-4 text-sm leading-6 text-ink/70">Belum ada notifikasi untuk akun Anda.</div>
                ) : (
                  notifications.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl bg-sand px-4 py-4 text-sm leading-6 text-ink/70">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-1">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card border-red-200 p-6">
              <h2 className="text-xl font-black text-ink">Emergency Report</h2>
              <p className="mt-3 text-sm leading-6 text-ink/70">
                Gunakan tombol ini untuk kejadian mendesak. Form akan dipersingkat agar pelapor bisa mengirim inti laporan secepat mungkin.
              </p>
              <Link
                href="/lapor?mode=darurat"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-red-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {platformConfig.emergencyLabel}
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
