"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { kategoriLaporan, statusLaporan, tingkatUrgensi } from "@/lib/constants";
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
  admin_note: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
};

type AdminUser = {
  id: number;
  name: string;
  role: string;
};

type ReportDraft = {
  status: string;
  adminNote: string;
  assignedTo: string;
};

type ActivityItem = {
  id: string;
  type: "status" | "reply" | "comment";
  created_at: string;
  actor_name: string;
  actor_role?: string | null;
  content?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  is_internal?: number | boolean;
};

type FilterState = {
  category: string;
  status: string;
  urgency: string;
  location: string;
  search: string;
  assignedTo: string;
};

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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reportDrafts, setReportDrafts] = useState<Record<number, ReportDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [savingReportId, setSavingReportId] = useState<number | null>(null);
  const [recentlySavedReportId, setRecentlySavedReportId] = useState<number | null>(null);
  const [hiddenSavedReportIds, setHiddenSavedReportIds] = useState<number[]>([]);
  const [activityByReport, setActivityByReport] = useState<Record<number, ActivityItem[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [loadingActivityId, setLoadingActivityId] = useState<number | null>(null);
  const [sendingReplyId, setSendingReplyId] = useState<number | null>(null);
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

  const operationalReports = useMemo(
    () => reports.filter((report) => report.status === "terkirim" && !hiddenSavedReportIds.includes(report.id)),
    [reports, hiddenSavedReportIds]
  );

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
      await Promise.all([loadUsers(), loadReports()]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat halaman laporan admin.");
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

  async function loadActivity(reportId: number) {
    try {
      setLoadingActivityId(reportId);
      const data = await apiFetch(`/reports/${reportId}/activity`);
      setActivityByReport((current) => ({
        ...current,
        [reportId]: data.timeline || []
      }));
    } finally {
      setLoadingActivityId(null);
    }
  }

  async function sendReply(reportId: number) {
    const message = (replyDrafts[reportId] || "").trim();
    if (!message) return;

    try {
      setSendingReplyId(reportId);
      setActionMessage("");
      await apiFetch(`/reports/${reportId}/replies`, {
        method: "POST",
        body: JSON.stringify({ message })
      });
      setReplyDrafts((current) => ({ ...current, [reportId]: "" }));
      await loadActivity(reportId);
      setActionMessage(`Balasan untuk laporan #LP-${reportId} berhasil dikirim.`);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setSendingReplyId(null);
    }
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

      await loadReports(filters);
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

    await loadReports(filters);
  }

  async function handleDelete(id: number) {
    await apiFetch(`/reports/${id}`, { method: "DELETE" });
    await loadReports(filters);
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8 2xl:px-10">
      <div className="space-y-6">
        <section className="card overflow-hidden">
          <div className="bg-hero-glow p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Admin</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Kelola Laporan</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                  Halaman ini menampilkan seluruh laporan yang masuk, termasuk filter, status penanganan, assign petugas, dan balasan admin.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-ink/55">Total laporan</p>
                  <p className="mt-2 text-3xl font-black text-brand-700">{reports.length}</p>
                  <p className="mt-1 text-sm text-ink/50">Sesuai filter aktif</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-ink/55">Petugas tersedia</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{responders.length}</p>
                  <p className="mt-1 text-sm text-ink/50">Bisa di-assign</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {actionMessage ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</div> : null}

        <section className="card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-bold text-ink">Filter Laporan</p>
              <p className="mt-1 text-sm text-ink/55">Saring laporan berdasarkan status, kategori, prioritas, dan kata kunci.</p>
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
                className="input md:col-span-2 xl:col-span-2"
                placeholder="Cari lokasi, pelapor, atau isi laporan..."
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
        </section>

        <section className="grid gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-ink">Semua Laporan</p>
                <p className="mt-1 text-sm text-ink/55">Tampilan tabel untuk seluruh laporan yang cocok dengan filter saat ini.</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/60">{reports.length} laporan</div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-ink/45">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">Laporan</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Pelapor</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Update</th>
                    <th className="px-3 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-ink/5 align-top">
                      <td className="px-3 py-4 font-semibold text-ink">#LP-{report.id}</td>
                      <td className="px-3 py-4">
                        <p className="font-semibold text-ink">{report.location}</p>
                        <p className="mt-1 text-xs text-ink/55">{report.detail_location || report.description.slice(0, 96)}</p>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`badge capitalize ${getCategoryTone(report.category)}`}>{report.category}</span>
                          {isSensitiveCategory(report.category) ? (
                            <span className="badge bg-red-100 text-red-700">Sensitif</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-ink/70">{report.reporter_name}</td>
                      <td className="px-3 py-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-3 py-4 text-ink/60">{formatShortTimeAgo(report.updated_at)}</td>
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

            {!loading && reports.length === 0 ? (
              <div className="mt-6 rounded-3xl bg-sand p-8 text-center text-sm text-ink/55">Belum ada laporan yang cocok dengan filter ini.</div>
            ) : null}
          </div>

        </section>

        <section className="card p-6">
          <div>
            <p className="text-lg font-bold text-ink">Panel Operasional Semua Laporan</p>
            <p className="mt-1 text-sm text-ink/55">Edit status, assign petugas, beri catatan admin, dan hapus laporan bila diperlukan.</p>
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
                          {isSensitiveCategory(report.category) ? (
                            <span className="badge bg-red-100 text-red-700">Sensitif</span>
                          ) : null}
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

                      <div className="mt-5 rounded-3xl border border-ink/8 bg-sand p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">Balasan Admin</p>
                            <p className="mt-1 text-xs text-ink/55">Gunakan untuk minta bukti tambahan, mengarahkan korban, atau memberi update.</p>
                          </div>
                          <button
                            onClick={() => loadActivity(report.id)}
                            className="rounded-2xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink"
                          >
                            {loadingActivityId === report.id ? "Memuat..." : "Lihat Aktivitas"}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3">
                          <textarea
                            className="input min-h-[100px]"
                            placeholder="Contoh: Silakan datang ke ruang BK besok jam 09.00 atau kirim bukti tambahan melalui admin."
                            value={replyDrafts[report.id] || ""}
                            onChange={(event) =>
                              setReplyDrafts((current) => ({
                                ...current,
                                [report.id]: event.target.value
                              }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => sendReply(report.id)}
                              disabled={sendingReplyId === report.id}
                              className="rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {sendingReplyId === report.id ? "Mengirim..." : "Kirim Balasan"}
                            </button>
                            <button
                              onClick={() =>
                                setReplyDrafts((current) => ({
                                  ...current,
                                  [report.id]: "Silakan kirim bukti tambahan agar laporan bisa kami lanjutkan."
                                }))
                              }
                              className="rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
                            >
                              Minta Bukti
                            </button>
                            <button
                              onClick={() =>
                                setReplyDrafts((current) => ({
                                  ...current,
                                  [report.id]: "Kami sudah memproses laporan ini. Jika memungkinkan, silakan datang untuk tindak lanjut lanjutan."
                                }))
                              }
                              className="rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
                            >
                              Template Tindak Lanjut
                            </button>
                          </div>
                        </div>

                        {activityByReport[report.id]?.length ? (
                          <div className="mt-4 space-y-3">
                            {activityByReport[report.id].slice(0, 6).map((item) => (
                              <div key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-semibold text-ink">
                                    {item.type === "status"
                                      ? `${item.actor_name} mengubah status`
                                      : item.type === "reply"
                                        ? `${item.actor_name} membalas`
                                        : `${item.actor_name} memberi catatan`}
                                  </span>
                                  <span className="text-xs text-ink/45">{formatDateTime(item.created_at)}</span>
                                </div>
                                <p className="mt-2 text-ink/65">
                                  {item.type === "status"
                                    ? `${item.from_status || "baru"} -> ${item.to_status || "-"}`
                                    : item.content || "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
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
                        <p className="text-sm font-semibold text-ink">Detail laporan</p>
                        <div className="mt-3 space-y-2 text-sm text-ink/65">
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
                            <span>Prioritas</span>
                            <span className="font-semibold capitalize text-ink">{report.urgency}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
                            <span>Lokasi detail</span>
                            <span className="font-semibold text-right text-ink">{report.detail_location || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && operationalReports.length === 0 ? (
              <div className="rounded-3xl bg-sand p-8 text-center text-sm text-ink/55">
                Tidak ada laporan baru yang masih menunggu tindakan di panel operasional ini. Hasil yang sudah diproses tetap bisa dilihat dari tabel di atas.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
