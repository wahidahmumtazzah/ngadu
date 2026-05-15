"use client";

import { apiFetch, getUser } from "@/lib/api";
import { getPlatformConfig } from "@/lib/platform-config";
import { useEffect, useMemo, useState } from "react";

type Summary = {
  total_organizations: number;
  pending_organizations: number;
  active_organizations: number;
  flagged_organizations: number;
  suspended_organizations: number;
  total_users: number;
  total_super_admins: number;
  total_org_admins: number;
  total_reports: number;
  emergency_reports: number;
  total_abuse_reports: number;
};

type OrganizationRow = {
  id: number;
  name: string;
  type: string;
  custom_type_label?: string | null;
  logo_url?: string | null;
  address?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  status: string;
  email_verified_at?: string | null;
  review_note?: string | null;
  status_updated_at?: string | null;
  created_at: string;
  status_updated_by_name?: string | null;
  total_users: number;
  total_reports: number;
  emergency_reports: number;
  abuse_reports: number;
  last_abuse_at?: string | null;
};

type AbuseReport = {
  id: number;
  reason: string;
  reporter_email?: string | null;
  reporter_name?: string | null;
  source_ip?: string | null;
  created_at: string;
};

type RecentReport = {
  id: number;
  title?: string | null;
  category: string;
  location: string;
  status: string;
  is_emergency: number;
  created_at: string;
};

type OrganizationDetail = {
  organization: OrganizationRow & {
    total_abuse_reports: number;
  };
  abuseReports: AbuseReport[];
  recentReports: RecentReport[];
};

const statusOptions = [
  { value: "", label: "Semua status" },
  { value: "pending_verification", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "flagged", label: "Flagged" },
  { value: "suspended", label: "Suspended" }
];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getStatusTone(status: string) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "flagged") return "bg-amber-100 text-amber-700";
  if (status === "suspended") return "bg-red-100 text-red-700";
  return "bg-brand-100 text-brand-700";
}

function SummaryCard({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-ink/60">{title}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink/50">{note}</p>
    </div>
  );
}

export default function SuperAdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [nextStatus, setNextStatus] = useState("active");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ status: "", search: "" });

  const currentUser = useMemo(() => getUser() as { role?: string } | null, []);

  async function loadOverview() {
    const data = await apiFetch("/super-admin/overview");
    setSummary(data.summary || null);
  }

  async function loadOrganizations(nextFilters = filters) {
    const params = new URLSearchParams();
    if (nextFilters.status) params.set("status", nextFilters.status);
    if (nextFilters.search) params.set("search", nextFilters.search);
    const data = await apiFetch(`/super-admin/organizations${params.toString() ? `?${params}` : ""}`);
    const rows = data.organizations || [];
    setOrganizations(rows);
    setSelectedId((current) => (current && rows.some((item: OrganizationRow) => item.id === current) ? current : rows[0]?.id || null));
  }

  async function loadDetail(id: number) {
    const data = await apiFetch(`/super-admin/organizations/${id}`);
    setDetail(data);
    setReviewNote(data.organization?.review_note || "");
    setNextStatus(data.organization?.status || "active");
  }

  async function bootstrap() {
    try {
      setLoading(true);
      await Promise.all([loadOverview(), loadOrganizations()]);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat panel super admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId).catch((error) => {
        setMessage(error instanceof Error ? error.message : "Gagal memuat detail instansi.");
      });
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  async function handleSaveModeration() {
    if (!selectedId) return;

    try {
      setSaving(true);
      setMessage("");
      await apiFetch(`/super-admin/organizations/${selectedId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          reviewNote
        })
      });
      await Promise.all([loadOverview(), loadOrganizations(), loadDetail(selectedId)]);
      setMessage("Status instansi berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan moderasi.");
    } finally {
      setSaving(false);
    }
  }

  if (currentUser?.role !== "super_admin") {
    return (
      <main className="container-app py-14">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-black text-ink">Akses ditolak</h1>
          <p className="mt-3 text-sm text-ink/60">Halaman ini hanya tersedia untuk super admin platform.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8 2xl:px-10">
      <div className="space-y-6">
        <section className="card overflow-hidden">
          <div className="bg-hero-glow p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Platform Control</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">Super Admin Panel</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
              Review instansi baru, pantau abuse report lintas workspace, dan ubah status organisasi tanpa masuk ke dashboard masing-masing.
            </p>
          </div>
        </section>

        {message ? <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{message}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="Total Instansi" value={Number(summary?.total_organizations || 0)} note="Semua workspace terdaftar" />
          <SummaryCard title="Pending" value={Number(summary?.pending_organizations || 0)} note="Belum aktif penuh" />
          <SummaryCard title="Flagged" value={Number(summary?.flagged_organizations || 0)} note="Perlu review segera" />
          <SummaryCard title="Suspended" value={Number(summary?.suspended_organizations || 0)} note="Akses diblokir" />
          <SummaryCard title="Abuse Reports" value={Number(summary?.total_abuse_reports || 0)} note="Total laporan instansi" />
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.2fr_0.95fr]">
          <div className="card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-lg font-bold text-ink">Daftar Instansi</p>
                <p className="mt-1 text-sm text-ink/55">Prioritas diurutkan dari `flagged`, `pending`, lalu status lain.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="input"
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  {statusOptions.map((item) => (
                    <option key={item.value || "all"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Cari nama / email / alamat"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => loadOrganizations(filters)} className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white">
                Terapkan Filter
              </button>
              <button
                onClick={() => {
                  const next = { status: "", search: "" };
                  setFilters(next);
                  loadOrganizations(next);
                }}
                className="rounded-2xl border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {organizations.map((organization) => {
                const config = getPlatformConfig(organization.type || "custom");
                const isSelected = selectedId === organization.id;

                return (
                  <button
                    key={organization.id}
                    onClick={() => setSelectedId(organization.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      isSelected ? "border-brand-300 bg-brand-50/60" : "border-ink/8 bg-white hover:border-brand-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${getStatusTone(organization.status)}`}>{organization.status}</span>
                      <span className="badge bg-ink/5 text-ink/70">{organization.custom_type_label || config.label}</span>
                      {organization.abuse_reports > 0 ? (
                        <span className="badge bg-red-100 text-red-700">{organization.abuse_reports} abuse</span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-ink">{organization.name}</p>
                        <p className="mt-1 truncate text-sm text-ink/60">{organization.contact_email || "-"}</p>
                        <p className="mt-2 text-sm text-ink/55">{organization.address || "Alamat belum diisi"}</p>
                      </div>
                      <div className="text-right text-sm text-ink/55">
                        <p>{organization.total_users} user</p>
                        <p>{organization.total_reports} laporan</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!loading && organizations.length === 0 ? (
                <div className="rounded-3xl bg-sand p-8 text-center text-sm text-ink/55">Belum ada instansi yang cocok dengan filter saat ini.</div>
              ) : null}
            </div>
          </div>

          <div className="card p-6">
            <div>
              <p className="text-lg font-bold text-ink">Detail Moderasi</p>
              <p className="mt-1 text-sm text-ink/55">Buka satu instansi untuk lihat konteks dan update statusnya.</p>
            </div>

            {detail ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-3xl bg-sand p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${getStatusTone(detail.organization.status)}`}>{detail.organization.status}</span>
                    <span className="badge bg-ink/5 text-ink/70">
                      {detail.organization.custom_type_label || getPlatformConfig(detail.organization.type || "custom").label}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-ink">{detail.organization.name}</h2>
                  <div className="mt-3 grid gap-2 text-sm text-ink/60">
                    <p>Email: {detail.organization.contact_email || "-"}</p>
                    <p>Telepon: {detail.organization.phone || "-"}</p>
                    <p>Verifikasi: {detail.organization.email_verified_at ? formatDateTime(detail.organization.email_verified_at) : "Belum verifikasi"}</p>
                    <p>Terakhir diupdate: {formatDateTime(detail.organization.status_updated_at)}</p>
                    <p>Reviewer: {detail.organization.status_updated_by_name || "-"}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-paper p-4">
                    <p className="text-sm font-semibold text-ink/60">User</p>
                    <p className="mt-2 text-3xl font-black text-ink">{detail.organization.total_users}</p>
                  </div>
                  <div className="rounded-3xl bg-paper p-4">
                    <p className="text-sm font-semibold text-ink/60">Laporan</p>
                    <p className="mt-2 text-3xl font-black text-ink">{detail.organization.total_reports}</p>
                  </div>
                  <div className="rounded-3xl bg-paper p-4">
                    <p className="text-sm font-semibold text-ink/60">Abuse</p>
                    <p className="mt-2 text-3xl font-black text-ink">{detail.organization.total_abuse_reports}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <select className="input" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                    {statusOptions
                      .filter((item) => item.value)
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>
                  <textarea
                    className="input min-h-[110px]"
                    placeholder="Catatan review / alasan perubahan status"
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                  />
                  <button
                    onClick={handleSaveModeration}
                    disabled={saving}
                    className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Simpan Moderasi"}
                  </button>
                </div>

                <div>
                  <p className="text-base font-bold text-ink">Riwayat Abuse Report</p>
                  <div className="mt-3 space-y-3">
                    {detail.abuseReports.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-red-100 bg-red-50/70 p-4">
                        <p className="text-sm font-semibold text-ink">{item.reason}</p>
                        <p className="mt-2 text-xs text-ink/55">
                          {item.reporter_name || item.reporter_email || "Anonim"} · {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    ))}
                    {detail.abuseReports.length === 0 ? (
                      <div className="rounded-3xl bg-sand p-4 text-sm text-ink/55">Belum ada abuse report untuk instansi ini.</div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-base font-bold text-ink">Laporan Terbaru dari Instansi</p>
                  <div className="mt-3 space-y-3">
                    {detail.recentReports.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-ink/8 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.is_emergency ? <span className="badge bg-red-100 text-red-700">Darurat</span> : null}
                          <span className="badge bg-ink/5 text-ink/70">{item.category}</span>
                          <span className={`badge ${getStatusTone(item.status)}`}>{item.status}</span>
                        </div>
                        <p className="mt-3 font-semibold text-ink">{item.title || item.location}</p>
                        <p className="mt-1 text-sm text-ink/60">{item.location}</p>
                      </div>
                    ))}
                    {detail.recentReports.length === 0 ? (
                      <div className="rounded-3xl bg-sand p-4 text-sm text-ink/55">Belum ada laporan dari instansi ini.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl bg-sand p-8 text-center text-sm text-ink/55">
                Pilih satu instansi dari panel kiri untuk melihat detail moderasi.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
