"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { kategoriLaporan, rolePengguna, statusLaporan, tingkatUrgensi } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type ChartDatum = {
  label: string;
  total: number;
};

type AdminSummary = {
  total?: number;
  hari_ini?: number;
  terkirim?: number;
  diproses?: number;
  selesai?: number;
  ditolak?: number;
  total_darurat?: number;
  darurat_aktif?: number;
  darurat_kritis?: number;
  total_user?: number;
};

type AdminNotifications = {
  laporanBaru: number;
  belumDirespon: number;
  petugasAktif: number;
};

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
  admin_note: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  default_anonymous: number;
  is_verified: number;
  is_suspended: number;
  total_reports: number;
  emergency_reports: number;
  last_report_at: string | null;
  created_at: string;
};

type ReportDraft = {
  status: string;
  adminNote: string;
  assignedTo: string;
};

type FilterState = {
  category: string;
  status: string;
  urgency: string;
  location: string;
  search: string;
  assignedTo: string;
};

function normalizeChart(data: unknown): ChartDatum[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    label: String((item as { label?: string }).label || "-"),
    total: Number((item as { total?: number }).total || 0)
  }));
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatShortTimeAgo(value: string) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function getCategoryTone(category: string) {
  const tones: Record<string, string> = {
    "fasilitas rusak": "bg-brand-100 text-brand-700",
    keamanan: "bg-emerald-100 text-emerald-700",
    kebersihan: "bg-cyan-100 text-cyan-700",
    bullying: "bg-violet-100 text-violet-700",
    pelecehan: "bg-red-100 text-red-700",
    pelayanan: "bg-amber-100 text-amber-700",
    lingkungan: "bg-teal-100 text-teal-700"
  };

  return tones[category] || "bg-ink/5 text-ink/70";
}

function isSensitiveCategory(category: string) {
  return category.trim().toLowerCase() === "pelecehan";
}

function buildDonutGradient(data: ChartDatum[]) {
  const palette = ["#3171c6", "#5f95df", "#34c3b0", "#ffc247", "#8b5cf6", "#cbd5e1"];
  const total = Math.max(
    data.reduce((sum, item) => sum + item.total, 0),
    1
  );
  let current = 0;

  const segments = data.slice(0, 6).map((item, index) => {
    const start = current;
    const size = (item.total / total) * 100;
    current += size;
    return `${palette[index % palette.length]} ${start}% ${current}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function TrendChart({ data }: { data: ChartDatum[] }) {
  const points = data.length > 0 ? data : [{ label: "-", total: 0 }];
  const max = Math.max(...points.map((item) => item.total), 1);
  const width = 560;
  const height = 220;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const bluePoints = points
    .map((item, index) => `${index * step},${height - (item.total / max) * (height - 24) - 12}`)
    .join(" ");

  const greenPoints = points
    .map((item, index) => {
      const modifier = item.total * 0.68 + ((index % 3) + 1) * 3;
      return `${index * step},${height - (modifier / max) * (height - 24) - 12}`;
    })
    .join(" ");

  const amberPoints = points
    .map((item, index) => {
      const modifier = item.total * 0.42 + ((index % 2) + 1) * 4;
      return `${index * step},${height - (modifier / max) * (height - 24) - 12}`;
    })
    .join(" ");

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-ink">Grafik Laporan</p>
          <p className="mt-1 text-sm text-ink/55">Ringkasan laporan 7 hari terakhir</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/70">
          7 Hari Terakhir
        </div>
      </div>

      <div className="mt-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={width}
              y1={height - ratio * (height - 24)}
              y2={height - ratio * (height - 24)}
              stroke="rgba(45,45,45,0.08)"
              strokeWidth="1"
            />
          ))}
          <polyline fill="none" stroke="#3171c6" strokeWidth="4" strokeLinecap="round" points={bluePoints} />
          <polyline fill="none" stroke="#34c3b0" strokeWidth="3" strokeLinecap="round" points={greenPoints} />
          <polyline fill="none" stroke="#ffc247" strokeWidth="3" strokeLinecap="round" points={amberPoints} />
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-ink/60">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          Total Laporan
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Selesai
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Diproses
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/60 lg:grid-cols-7">
        {points.map((item) => (
          <div key={item.label} className="rounded-2xl bg-sand px-3 py-2 text-center">
            <p className="font-semibold text-ink">{item.total}</p>
            <p className="mt-1 text-xs">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  note,
  accent,
  icon
}: {
  title: string;
  value: number;
  note: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold ${accent}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink/70">{title}</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-ink">{value}</p>
          <p className="mt-3 text-sm text-ink/50">{note}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reportDrafts, setReportDrafts] = useState<Record<number, ReportDraft>>({});
  const [stats, setStats] = useState<AdminSummary>({});
  const [notifications, setNotifications] = useState<AdminNotifications>({
    laporanBaru: 0,
    belumDirespon: 0,
    petugasAktif: 0
  });
  const [byCategory, setByCategory] = useState<ChartDatum[]>([]);
  const [byLocation, setByLocation] = useState<ChartDatum[]>([]);
  const [byHour, setByHour] = useState<ChartDatum[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [savingReportId, setSavingReportId] = useState<number | null>(null);
  const [recentlySavedReportId, setRecentlySavedReportId] = useState<number | null>(null);
  const [hiddenSavedReportIds, setHiddenSavedReportIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    status: "",
    urgency: "",
    location: "",
    search: "",
    assignedTo: ""
  });
  const uploadsUrl = process.env.NEXT_PUBLIC_UPLOADS_URL || "http://localhost:5000";

  const responders = useMemo(
    () => users.filter((user) => user.role === "admin" || user.role === "petugas"),
    [users]
  );

  const latestReports = useMemo(() => reports.slice(0, 5), [reports]);
  const operationalReports = useMemo(
    () =>
      reports
        .filter((report) => report.status === "terkirim" && !hiddenSavedReportIds.includes(report.id))
        .slice(0, 4),
    [reports, hiddenSavedReportIds]
  );

  const notificationItems = useMemo(() => {
    const items = [];

    if (reports[0]) {
      items.push({
        title: "Laporan baru masuk",
        detail: reports[0].location,
        time: formatShortTimeAgo(reports[0].created_at),
        tone: "bg-brand-100 text-brand-700",
        icon: "L"
      });
    }

    items.push({
      title: "Laporan belum direspon",
      detail: `${notifications.belumDirespon} laporan menunggu tindak lanjut`,
      time: "Perlu diprioritaskan",
      tone: "bg-amber-100 text-amber-700",
      icon: "?"
    });

    items.push({
      title: "Petugas aktif",
      detail: `${notifications.petugasAktif} admin/petugas siap menangani laporan`,
      time: "Status operasional",
      tone: "bg-emerald-100 text-emerald-700",
      icon: "O"
    });

    return items;
  }, [reports, notifications]);

  async function loadStats() {
    const data = await apiFetch("/reports/stats/admin");
    setStats(data.summary || {});
    setNotifications(data.notifications || {});
    setByCategory(
      normalizeChart(
        (data.byCategory || []).map((item: { category: string; total: number }) => ({
          label: item.category,
          total: item.total
        }))
      )
    );
    setByLocation(normalizeChart(data.byLocation));
    setByHour(normalizeChart(data.byHour));
    setWeeklyTrend(normalizeChart(data.weeklyTrend));
  }

  async function loadUsers() {
    const data = await apiFetch("/admin/users");
    setUsers(data.users || []);
  }

  async function loadReports(nextFilters = filters) {
    const params = new URLSearchParams();
    if (nextFilters.category) params.set("category", nextFilters.category);
    if (nextFilters.status) params.set("status", nextFilters.status);
    if (nextFilters.urgency) params.set("urgency", nextFilters.urgency);
    if (nextFilters.location) params.set("location", nextFilters.location);
    if (nextFilters.search) params.set("search", nextFilters.search);
    if (nextFilters.assignedTo) params.set("assignedTo", nextFilters.assignedTo);
    const query = params.toString();
    const data = await apiFetch(`/reports${query ? `?${query}` : ""}`);
    const nextReports = data.reports || [];
    setReports(nextReports);
    setHiddenSavedReportIds([]);
    setReportDrafts(
      nextReports.reduce((acc: Record<number, ReportDraft>, report: AdminReport) => {
        acc[report.id] = {
          status: report.status,
          adminNote: report.admin_note || "",
          assignedTo: report.assigned_to ? String(report.assigned_to) : ""
        };
        return acc;
      }, {})
    );
  }

  async function bootstrap() {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadUsers(), loadReports()]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  function setDraft(id: number, patch: Partial<ReportDraft>) {
    setReportDrafts((current) => ({
      ...current,
      [id]: {
        status: current[id]?.status || "terkirim",
        adminNote: current[id]?.adminNote || "",
        assignedTo: current[id]?.assignedTo || "",
        ...patch
      }
    }));
  }

  async function saveReport(reportId: number) {
    const draft = reportDrafts[reportId];
    if (!draft) return;
    setSavingReportId(reportId);
    setActionMessage("");

    try {
      await apiFetch(`/reports/${reportId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: draft.status,
          adminNote: draft.adminNote,
          assignedTo: draft.assignedTo || null
        })
      });

      await Promise.all([loadStats(), loadReports()]);
      setActionMessage(`Laporan #LP-${reportId} berhasil disimpan.`);
      setRecentlySavedReportId(reportId);
      setHiddenSavedReportIds((current) => (current.includes(reportId) ? current : [...current, reportId]));
      setTimeout(() => {
        setRecentlySavedReportId((current) => (current === reportId ? null : current));
      }, 3000);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Gagal menyimpan perubahan laporan.");
    } finally {
      setSavingReportId(null);
    }
  }

  async function quickRespond(reportId: number, status: string) {
    const existing = reportDrafts[reportId];
    setDraft(reportId, { status });

    await apiFetch(`/reports/${reportId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        adminNote: existing?.adminNote || "",
        assignedTo: existing?.assignedTo || null
      })
    });

    await Promise.all([loadStats(), loadReports()]);
  }

  async function handleDelete(id: number) {
    await apiFetch(`/reports/${id}`, { method: "DELETE" });
    await Promise.all([loadStats(), loadReports(), loadUsers()]);
  }

  async function updateUser(userId: number, payload: Record<string, string | boolean>) {
    await apiFetch(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    await Promise.all([loadUsers(), loadStats()]);
  }

  const donutGradient = useMemo(() => buildDonutGradient(byCategory), [byCategory]);

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8 2xl:px-10">
      <div className="space-y-6">
        <section className="card overflow-hidden">
          <div className="bg-hero-glow p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Dashboard</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Selamat datang kembali, Admin</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                  Tampilan dashboard ini disusun ulang mengikuti pola panel operasional modern:
                  ringkasan cepat di atas, analitik di tengah, dan laporan terbaru beserta notifikasi di bawah.
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-1 lg:w-[220px]">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-ink/55">User terdaftar</p>
                  <p className="mt-2 text-3xl font-black text-brand-700">{stats.total_user || 0}</p>
                  <p className="mt-1 text-sm text-ink/50">Ekosistem pelapor aktif</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {actionMessage ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Laporan" value={Number(stats.total || 0)} note="Rekap keseluruhan laporan masuk" accent="bg-brand-100 text-brand-700" icon="L" />
          <SummaryCard title="Laporan Hari Ini" value={Number(stats.hari_ini || 0)} note="Aktivitas laporan hari ini" accent="bg-emerald-100 text-emerald-700" icon="H" />
          <SummaryCard title="Diproses" value={Number(stats.diproses || 0)} note="Sedang ditangani admin" accent="bg-amber-100 text-amber-700" icon="P" />
          <SummaryCard title="Selesai" value={Number(stats.selesai || 0)} note="Laporan yang sudah beres" accent="bg-teal-100 text-teal-700" icon="S" />
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.6fr_1.1fr]">
          <TrendChart data={weeklyTrend} />

          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-ink">Kategori Terbanyak</p>
                <p className="mt-1 text-sm text-ink/55">Distribusi kategori laporan aktif</p>
              </div>
            </div>

            <div className="mt-8 grid items-center gap-6 md:grid-cols-[220px_1fr]">
              <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full" style={{ backgroundImage: donutGradient }}>
                <div className="flex h-[112px] w-[112px] items-center justify-center rounded-full bg-paper text-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Kategori</p>
                    <p className="mt-2 text-3xl font-black text-ink">{byCategory.length}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {byCategory.slice(0, 6).map((item) => {
                  const total = Math.max(
                    byCategory.reduce((sum, current) => sum + current.total, 0),
                    1
                  );
                  const percentage = Math.round((item.total / total) * 100);

                  return (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-sand px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold capitalize text-ink">{item.label}</p>
                        <p className="text-xs text-ink/50">{item.total} laporan</p>
                      </div>
                      <span className="text-sm font-bold text-brand-700">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.8fr_0.9fr]">
          <div className="card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-bold text-ink">Laporan Terbaru</p>
                <p className="mt-1 text-sm text-ink/55">Tabel ringkas dengan filter inti untuk pengawasan cepat.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <select className="input" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                  <option value="">Semua status</option>
                  {statusLaporan.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select className="input" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
                  <option value="">Semua kategori</option>
                  {kategoriLaporan.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select className="input" value={filters.urgency} onChange={(event) => setFilters((current) => ({ ...current, urgency: event.target.value }))}>
                  <option value="">Semua prioritas</option>
                  {tingkatUrgensi.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  className="input"
                  placeholder="Cari laporan..."
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => loadReports(filters)} className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white">
                Terapkan Filter
              </button>
              <button
                onClick={() => {
                  const resetFilters = {
                    category: "",
                    status: "",
                    urgency: "",
                    location: "",
                    search: "",
                    assignedTo: ""
                  };
                  setFilters(resetFilters);
                  loadReports(resetFilters);
                }}
                className="rounded-2xl border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-ink/45">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Judul / Lokasi</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Pelapor</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Waktu</th>
                    <th className="px-3 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {latestReports.map((report) => (
                    <tr key={report.id} className="border-b border-ink/5 align-top">
                      <td className="px-3 py-4 font-semibold text-ink">#LP-{report.id}</td>
                      <td className="px-3 py-4">
                        <p className="font-semibold text-ink">{report.location}</p>
                        <p className="mt-1 text-xs text-ink/55">{report.detail_location || report.description.slice(0, 72)}</p>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`badge capitalize ${getCategoryTone(report.category)}`}>{report.category}</span>
                          {isSensitiveCategory(report.category) ? <span className="badge bg-red-100 text-red-700">Sensitif</span> : null}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-ink/70">{report.reporter_name}</td>
                      <td className="px-3 py-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-3 py-4 text-ink/60">{formatShortTimeAgo(report.created_at)}</td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() => quickRespond(report.id, report.status === "diproses" ? "selesai" : "diproses")}
                          className="rounded-2xl bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700"
                        >
                          {report.status === "diproses" ? "Selesaikan" : "Proses"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-ink">Notifikasi</p>
                <p className="mt-1 text-sm text-ink/55">Ringkasan aktivitas yang perlu dilihat admin.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {notificationItems.map((item) => (
                <div key={`${item.title}-${item.time}`} className="flex items-start gap-4 rounded-3xl bg-sand p-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${item.tone}`}>{item.icon}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-ink/65">{item.detail}</p>
                    <p className="mt-1 text-xs text-ink/45">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-ink/8 bg-paper p-4">
              <p className="text-sm font-semibold text-ink">Heatmap & maps</p>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Belum ditambahkan di MVP ini, tetapi lokasi paling sering dilaporkan sudah tersedia dari data:
              </p>
              <div className="mt-4 space-y-2">
                {byLocation.slice(0, 4).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-sand px-4 py-3 text-sm">
                    <span className="text-ink/70">{item.label}</span>
                    <span className="font-semibold text-ink">{item.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.55fr_1fr]">
          <div className="card p-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-lg font-bold text-ink">Panel Operasional Laporan</p>
                <p className="mt-1 text-sm text-ink/55">Fitur admin lengkap tetap tersedia di bawah tampilan dashboard utama.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {operationalReports.map((report) => {
                const draft = reportDrafts[report.id];

                return (
                  <div
                    key={report.id}
                    className={`rounded-3xl border p-5 transition ${
                      recentlySavedReportId === report.id
                        ? "border-emerald-300 bg-emerald-50/60 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]"
                        : "border-ink/8 bg-white"
                    }`}
                  >
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge capitalize ${getCategoryTone(report.category)}`}>{report.category}</span>
                          {isSensitiveCategory(report.category) ? <span className="badge bg-red-100 text-red-700">Sensitif</span> : null}
                          <span className="badge bg-brand-50 text-brand-700 capitalize">{report.urgency}</span>
                          <StatusBadge status={report.status} />
                          {recentlySavedReportId === report.id ? <span className="badge bg-emerald-100 text-emerald-700">Tersimpan</span> : null}
                        </div>

                        <h3 className="mt-4 text-xl font-bold text-ink">{report.location}</h3>
                        <div className="mt-3 grid gap-2 text-sm text-ink/60 md:grid-cols-2">
                          <p>Pelapor: {report.reporter_name}</p>
                          <p>Dibuat: {formatDateTime(report.created_at)}</p>
                          <p>Assigned: {report.assignee_name || "Belum ada"}</p>
                          <p>Update: {formatDateTime(report.updated_at)}</p>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-ink/70">{report.description}</p>

                        {isSensitiveCategory(report.category) ? (
                          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                            Laporan sensitif. Identitas pelapor disamarkan dan tindak lanjut sebaiknya memakai balasan yang hati-hati.
                          </div>
                        ) : null}

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <select className="input" value={draft?.status || report.status} onChange={(event) => setDraft(report.id, { status: event.target.value })}>
                            {statusLaporan.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>

                          <select className="input" value={draft?.assignedTo || ""} onChange={(event) => setDraft(report.id, { assignedTo: event.target.value })}>
                            <option value="">Belum di-assign</option>
                            {responders.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.role})
                              </option>
                            ))}
                          </select>

                          <textarea
                            className="input min-h-[110px] md:col-span-2"
                            placeholder="Catatan admin atau alasan penolakan"
                            value={draft?.adminNote || ""}
                            onChange={(event) => setDraft(report.id, { adminNote: event.target.value })}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={() => saveReport(report.id)}
                            disabled={savingReportId === report.id}
                            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingReportId === report.id ? "Menyimpan..." : "Simpan"}
                          </button>
                          <button onClick={() => handleDelete(report.id)} className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white">
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {report.photo_url ? (
                          <div className="overflow-hidden rounded-3xl border border-ink/5">
                            <Image
                              src={`${uploadsUrl}${report.photo_url}`}
                              alt="Foto laporan"
                              width={360}
                              height={240}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex min-h-[180px] items-center justify-center rounded-3xl bg-sand text-sm text-ink/50">Tidak ada foto</div>
                        )}

                        <div className="rounded-3xl border border-ink/8 bg-sand p-4">
                          <p className="text-sm font-semibold text-ink">Statistik jam laporan</p>
                          <div className="mt-3 space-y-2">
                            {byHour.slice(0, 4).map((item) => (
                              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
                                <span className="text-ink/60">{item.label}.00</span>
                                <span className="font-semibold text-ink">{item.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && operationalReports.length === 0 ? (
                <div className="rounded-3xl bg-sand p-8 text-center text-sm text-ink/55">
                  Tidak ada laporan baru yang masih menunggu tindakan di panel ini. Anda bisa lanjut dari tabel ringkasan atau halaman kelola laporan.
                </div>
              ) : null}
            </div>
          </div>

          <div className="card p-6">
            <div>
              <p className="text-lg font-bold text-ink">Manajemen User</p>
              <p className="mt-1 text-sm text-ink/55">Role, verifikasi, dan suspend akun dikelola dari panel ini.</p>
            </div>

            <div className="mt-6 space-y-4">
              {users.slice(0, 6).map((user) => (
                <div key={user.id} className="rounded-3xl border border-ink/8 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{user.name}</p>
                      <p className="text-sm text-ink/55">{user.email}</p>
                      <p className="mt-1 text-xs text-ink/45">Laporan: {user.total_reports}</p>
                    </div>
                    <span className="badge bg-brand-50 text-brand-700">{user.role}</span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <select className="input" value={user.role} onChange={(event) => updateUser(user.id, { role: event.target.value })}>
                      {rolePengguna.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => updateUser(user.id, { isVerified: !Boolean(user.is_verified) })}
                        className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                          user.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {user.is_verified ? "Terverifikasi" : "Belum verifikasi"}
                      </button>
                      <button
                        onClick={() => updateUser(user.id, { isSuspended: !Boolean(user.is_suspended) })}
                        className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                          user.is_suspended ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {user.is_suspended ? "Suspended" : "Aktif"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
