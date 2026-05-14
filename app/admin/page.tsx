"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { StatsCards } from "@/components/StatsCards";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { kategoriLaporan, statusLaporan } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type AdminReport = {
  id: number;
  category: string;
  location: string;
  detail_location: string | null;
  description: string;
  photo_url: string | null;
  urgency: string;
  is_emergency: number;
  emergency_type: string | null;
  danger_level: string | null;
  needs_immediate_help: number;
  status: string;
  reporter_name: string;
  created_at: string;
};

function getDangerBadge(level: string | null) {
  if (level === "kritis") return "bg-red-100 text-red-700";
  if (level === "tinggi") return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700";
}

function formatElapsedMinutes(value: string) {
  const createdAt = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  return `${diffMinutes} menit`;
}

export default function AdminPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState<any>({});
  const [chart, setChart] = useState<{ label: string; total: number }[]>([]);
  const [emergencyFeed, setEmergencyFeed] = useState<AdminReport[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [emergencyFilter, setEmergencyFilter] = useState("semua");
  const [error, setError] = useState("");
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(true);
  const uploadsUrl = process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:5000";

  async function loadStats() {
    try {
      const data = await apiFetch("/reports/stats/admin");
      setStats(data.summary || {});
      setChart((data.byCategory || []).map((item: any) => ({ label: item.category, total: item.total })));
      setEmergencyFeed(data.emergencyFeed || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat statistik admin.");
    }
  }

  async function loadReports(nextCategory = category, nextStatus = status, nextEmergency = emergencyFilter) {
    try {
      const params = new URLSearchParams();
      if (nextCategory) params.set("category", nextCategory);
      if (nextStatus) params.set("status", nextStatus);
      if (nextEmergency === "darurat") params.set("emergency", "1");
      if (nextEmergency === "normal") params.set("emergency", "0");
      const data = await apiFetch(`/reports?${params.toString()}`);
      setReports(data.reports || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data laporan.");
    }
  }

  useEffect(() => {
    loadStats();
    loadReports();
  }, []);

  async function handleStatusChange(id: number, nextStatus: string) {
    await apiFetch(`/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    await Promise.all([loadReports(), loadStats()]);
  }

  async function handleDelete(id: number) {
    await apiFetch(`/reports/${id}`, { method: "DELETE" });
    await Promise.all([loadReports(), loadStats()]);
  }

  const activeEmergencyReports = useMemo(
    () => reports.filter((report) => report.is_emergency === 1 && report.status !== "selesai"),
    [reports]
  );

  return (
    <main className="container-app py-14">
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <AdminSidebar />

        <div className="space-y-6">
          {showEmergencyPopup && activeEmergencyReports.length > 0 ? (
            <div className="card border-red-200 bg-red-50 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">Notifikasi Darurat</p>
                  <h2 className="mt-3 text-2xl font-black text-ink">
                    Ada {activeEmergencyReports.length} laporan darurat yang belum selesai.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-700/90">
                    Laporan darurat otomatis diprioritaskan nomor 1 dan muncul paling atas.
                  </p>
                </div>
                <button
                  onClick={() => setShowEmergencyPopup(false)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-red-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : null}

          <div className="card p-8">
            <span className="badge bg-brand-100 text-brand-700">Dashboard Admin</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Kontrol pusat pengaduan</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
              Pantau semua laporan, ubah status penanganan, hapus data yang tidak valid, dan lihat
              tren kategori laporan terbanyak.
            </p>
          </div>

          <StatsCards stats={stats} />

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="card border-red-200 p-6">
              <p className="text-sm text-red-700">Laporan Darurat</p>
              <p className="mt-3 text-3xl font-black text-ink">{stats.total_darurat || 0}</p>
            </div>
            <div className="card border-red-200 p-6">
              <p className="text-sm text-red-700">Darurat Aktif</p>
              <p className="mt-3 text-3xl font-black text-ink">{stats.darurat_aktif || 0}</p>
            </div>
            <div className="card border-red-200 p-6">
              <p className="text-sm text-red-700">Darurat Kritis</p>
              <p className="mt-3 text-3xl font-black text-ink">{stats.darurat_kritis || 0}</p>
            </div>
          </div>

          <SimpleBarChart title="Grafik Laporan Terbanyak" data={chart} />

          {emergencyFeed.length > 0 ? (
            <div className="card border-red-200 p-8">
              <h2 className="text-2xl font-black text-ink">Prioritas Darurat</h2>
              <div className="mt-6 grid gap-4">
                {emergencyFeed.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-red-50 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-red-500 text-white">URGENT</span>
                      <span className={`badge ${getDangerBadge(item.danger_level)}`}>{item.danger_level || "sedang"}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-ink">{item.location}</h3>
                    <p className="mt-2 text-sm text-red-700/90">
                      SLA berjalan: belum ditangani selama {formatElapsedMinutes(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-ink">Daftar semua laporan</h2>
                <p className="mt-2 text-sm text-ink/70">
                  Identitas pelapor disamarkan otomatis untuk laporan anonim. Laporan darurat selalu diprioritaskan.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  className="input"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    loadReports(event.target.value, status, emergencyFilter);
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
                    loadReports(category, event.target.value, emergencyFilter);
                  }}
                >
                  <option value="">Semua status</option>
                  {statusLaporan.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  className="input"
                  value={emergencyFilter}
                  onChange={(event) => {
                    setEmergencyFilter(event.target.value);
                    loadReports(category, status, event.target.value);
                  }}
                >
                  <option value="semua">Semua laporan</option>
                  <option value="darurat">Laporan darurat</option>
                  <option value="normal">Laporan normal</option>
                </select>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="mt-8 grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`rounded-3xl border bg-white p-6 ${report.is_emergency ? "border-red-200" : "border-ink/8"}`}
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_220px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {report.is_emergency ? <span className="badge bg-red-500 text-white">URGENT</span> : null}
                        <span className="badge bg-ink/5 text-ink/70 capitalize">{report.category}</span>
                        <span className="badge bg-brand-50 text-brand-700 capitalize">{report.urgency}</span>
                        {report.is_emergency ? (
                          <span className={`badge capitalize ${getDangerBadge(report.danger_level)}`}>
                            {report.danger_level || "sedang"}
                          </span>
                        ) : null}
                        <StatusBadge status={report.status} />
                      </div>

                      <h3 className="mt-4 text-xl font-bold text-ink">{report.location}</h3>
                      <p className="mt-3 text-sm text-ink/60">Pelapor: {report.reporter_name}</p>
                      {report.detail_location ? (
                        <p className="mt-2 text-sm text-ink/60">Lokasi detail: {report.detail_location}</p>
                      ) : null}
                      {report.is_emergency ? (
                        <div className="mt-3 space-y-1 text-sm text-red-700">
                          <p>Jenis darurat: {report.emergency_type || "-"}</p>
                          <p>Butuh bantuan segera: {report.needs_immediate_help ? "Ya" : "Tidak"}</p>
                          <p>SLA: belum ditangani selama {formatElapsedMinutes(report.created_at)}</p>
                        </div>
                      ) : null}
                      <p className="mt-3 text-sm leading-6 text-ink/70">{report.description}</p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <select
                          className="input max-w-[220px]"
                          value={report.status}
                          onChange={(event) => handleStatusChange(report.id, event.target.value)}
                        >
                          {statusLaporan.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDelete(report.id)}
                          className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    <div>
                      {report.photo_url ? (
                        <div className="overflow-hidden rounded-3xl border border-ink/5">
                          <Image
                            src={`${uploadsUrl}${report.photo_url}`}
                            alt="Foto laporan"
                            width={440}
                            height={320}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[180px] items-center justify-center rounded-3xl bg-sand text-sm text-ink/50">
                          Tidak ada foto
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-ink/10 bg-sand p-10 text-center text-sm text-ink/60">
                  Tidak ada laporan yang cocok dengan filter saat ini.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
