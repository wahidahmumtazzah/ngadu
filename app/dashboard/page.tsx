"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch, getUser } from "@/lib/api";
import { kategoriLaporan, statusLaporan } from "@/lib/constants";

type ReportItem = {
  id: number;
  category: string;
  location: string;
  description: string;
  urgency: string;
  is_anonymous: number;
  status: string;
  created_at: string;
};

type PublicCategoryStat = {
  category: string;
  total: number;
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

function getProgressWidth(status: string) {
  if (status === "selesai") return "100%";
  if (status === "diproses") return "66%";
  return "33%";
}

export default function UserDashboardPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [publicCategories, setPublicCategories] = useState<PublicCategoryStat[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);

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

  async function loadPublicStats() {
    try {
      const data = await apiFetch("/reports/stats/public");
      setPublicCategories(data.byCategory || []);
    } catch {
      setPublicCategories([]);
    }
  }

  useEffect(() => {
    setUser(getUser());
    loadReports();
    loadPublicStats();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => (onlyUrgent ? report.urgency === "tinggi" : true));
  }, [reports, onlyUrgent]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      diproses: reports.filter((report) => report.status === "diproses").length,
      selesai: reports.filter((report) => report.status === "selesai").length,
      terkirim: reports.filter((report) => report.status === "terkirim").length
    };
  }, [reports]);

  const notifications = useMemo(() => {
    const items = reports.slice(0, 3).map((report) => {
      if (report.status === "selesai") {
        return `Laporan "${report.location}" telah selesai ditangani.`;
      }
      if (report.status === "diproses") {
        return `Laporan "${report.location}" sedang diproses admin.`;
      }
      return `Laporan "${report.location}" sudah diterima sistem.`;
    });

    if (items.length === 0) {
      return [
        "Belum ada notifikasi baru untuk akun Anda.",
        "Kirim laporan untuk mulai memantau progres penanganan."
      ];
    }

    return items;
  }, [reports]);

  const trending = useMemo(() => {
    const fallback = [
      { title: "WC lantai 2 rusak", meta: "34 dukungan" },
      { title: "Lampu parkiran mati", meta: "21 dukungan" },
      { title: "Wifi kampus lambat", meta: "18 dukungan" }
    ];

    if (publicCategories.length === 0) return fallback;

    return publicCategories.slice(0, 3).map((item, index) => ({
      title: `${item.category} paling sering dilaporkan`,
      meta: `${item.total + 10 + index * 3} dukungan`
    }));
  }, [publicCategories]);

  return (
    <main className="w-full px-4 pb-14 pt-8 sm:px-6 sm:pt-10 lg:px-8 2xl:px-10">
      <div className="space-y-6">
        <section className="card p-8">
          <span className="badge bg-brand-100 text-brand-700">Dashboard User</span>
          <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-ink">
                Halo {user?.name || "pengguna"}, ada masalah yang ingin dilaporkan hari ini?
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
                Suaramu membantu lingkungan jadi lebih baik. Pantau laporanmu, lihat isu yang
                sedang ramai, dan kirim aduan baru dengan cepat.
              </p>
            </div>

            <Link href="/" className="btn-secondary">
              Kembali
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Laporan Saya", value: stats.total },
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
          <section id="riwayat" className="card p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-ink">Riwayat Laporan</h2>
                <p className="mt-2 text-sm text-ink/70">
                  Lihat status, kategori, urgensi, dan progres penanganan untuk setiap laporan.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  className="input"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    loadReports(event.target.value, status);
                  }}
                >
                  <option value="">Semua kategori</option>
                  {kategoriLaporan.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
                  {statusLaporan.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setOnlyUrgent((current) => !current)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    onlyUrgent ? "bg-red-500 text-white" : "border border-ink/10 bg-white text-ink"
                  }`}
                >
                  {onlyUrgent ? "Urgent Aktif" : "Filter Urgent"}
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="mt-8 grid gap-4">
              {filteredReports.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-ink/10 bg-sand p-10 text-center text-sm text-ink/60">
                  Belum ada laporan yang sesuai filter saat ini.
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="rounded-3xl border border-ink/8 bg-white p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge bg-ink/5 text-ink/70 capitalize">{report.category}</span>
                          <span className={`badge capitalize ${getUrgencyStyle(report.urgency)}`}>
                            {report.urgency}
                          </span>
                          <StatusBadge status={report.status} />
                        </div>

                        <h3 className="mt-4 text-xl font-bold text-ink">{report.location}</h3>
                        <p className="mt-2 text-sm text-ink/55">{formatTanggal(report.created_at)}</p>
                        <p className="mt-3 text-sm leading-6 text-ink/70">{report.description}</p>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                            <span>Terkirim</span>
                            <span>Diproses</span>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section id="trending" className="card p-6">
              <h2 className="text-xl font-black text-ink">Laporan Trending / Populer</h2>
              <div className="mt-5 space-y-3">
                {trending.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white p-4">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-ink/60">{item.meta}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                        Dukung Laporan
                      </button>
                      <button className="rounded-xl bg-ink/5 px-3 py-2 text-xs font-semibold text-ink/70">
                        Saya juga mengalami
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="notifikasi" className="card p-6">
              <h2 className="text-xl font-black text-ink">Notifikasi</h2>
              <div className="mt-5 space-y-3">
                {notifications.map((item) => (
                  <div key={item} className="rounded-2xl bg-sand px-4 py-4 text-sm leading-6 text-ink/70">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section id="darurat" className="card border-red-200 p-6">
              <h2 className="text-xl font-black text-ink">Emergency Button</h2>
              <p className="mt-3 text-sm leading-6 text-ink/70">
                Gunakan untuk bullying berat, kekerasan, atau fasilitas yang membahayakan.
              </p>
              <Link
                href="/lapor?mode=darurat"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-red-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Laporan Darurat
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
