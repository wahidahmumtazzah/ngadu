"use client";

import { apiFetch, getUser } from "@/lib/api";
import { getPlatformConfig, isSensitiveCategoryForType } from "@/lib/platform-config";
import { FormEvent, useEffect, useMemo, useState } from "react";

type LocalUser = {
  organizationId?: number;
  organization?: { id?: number; type?: string; name?: string } | null;
  defaultAnonymous?: boolean;
};

type OrganizationOption = {
  id: number;
  name: string;
  type: string;
};

export default function ReportFormPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedOrganizationType, setSelectedOrganizationType] = useState("custom");

  useEffect(() => {
    const user = getUser() as LocalUser | null;
    setIsAnonymous(Boolean(user?.defaultAnonymous ?? true));

    if (user?.organizationId) {
      setSelectedOrganizationId(String(user.organizationId));
      setSelectedOrganizationType(user.organization?.type || "custom");
      return;
    }

    apiFetch("/organizations")
      .then((data) => {
        setOrganizations(data.organizations || []);
        if (data.organizations?.[0]) {
          setSelectedOrganizationId(String(data.organizations[0].id));
          setSelectedOrganizationType(data.organizations[0].type || "custom");
        }
      })
      .catch(() => setOrganizations([]));
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((item) => String(item.id) === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId]
  );

  useEffect(() => {
    if (selectedOrganization?.type) {
      setSelectedOrganizationType(selectedOrganization.type);
    }
  }, [selectedOrganization]);

  const platformConfig = useMemo(() => getPlatformConfig(selectedOrganizationType), [selectedOrganizationType]);
  const isSensitiveCategory = useMemo(
    () => isSensitiveCategoryForType(selectedOrganizationType, selectedCategory),
    [selectedCategory, selectedOrganizationType]
  );

  useEffect(() => {
    if (isSensitiveCategory) {
      setIsAnonymous(true);
    }
  }, [isSensitiveCategory]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("isAnonymous", String(isAnonymous));
    if (!getUser()) {
      formData.set("organizationId", selectedOrganizationId);
    }

    try {
      const data = await apiFetch("/reports", {
        method: "POST",
        body: formData
      });

      setMessage(data.message || "Laporan berhasil dikirim.");
      form.reset();
      const user = getUser() as LocalUser | null;
      setIsAnonymous(Boolean(user?.defaultAnonymous ?? true));
      setSelectedCategory("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim laporan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-app py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="card p-8">
          <span className="badge bg-brand-100 text-brand-700">{platformConfig.reportLabel}</span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">Buat laporan untuk {platformConfig.label}</h1>
          <p className="mt-4 text-base leading-7 text-ink/70">
            Form laporan akan menyesuaikan kategori {platformConfig.label.toLowerCase()} secara otomatis.
          </p>

          <div className="mt-8 space-y-4">
            {[
              `Kategori khusus ${platformConfig.label.toLowerCase()} otomatis dimuat`,
              "Lokasi dibuat spesifik agar tindak lanjut lebih cepat",
              "Tentukan urgensi agar admin bisa memprioritaskan penanganan",
              "Mode anonim tetap tersedia untuk pelapor"
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink/70">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="card p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              {!getUser() ? (
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-ink">Instansi tujuan</span>
                  <select
                    name="organizationId"
                    required
                    className="input"
                    value={selectedOrganizationId}
                    onChange={(event) => setSelectedOrganizationId(event.target.value)}
                  >
                    <option value="">Pilih instansi</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Kategori laporan</span>
                <select
                  name="category"
                  required
                  className="input"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  <option value="">Pilih kategori</option>
                  {platformConfig.categories.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              {isSensitiveCategory ? (
                <div className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
                  Kategori ini diperlakukan sebagai laporan sensitif. Mode anonim diaktifkan otomatis agar identitas pelapor lebih aman.
                </div>
              ) : null}

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Judul laporan</span>
                <input name="title" className="input" placeholder={`Contoh: ${platformConfig.menu[0]}`} />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Lokasi kejadian</span>
                <input
                  name="location"
                  required
                  className="input"
                  placeholder={platformConfig.exampleLocations[0] || "Tulis lokasi kejadian"}
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-ink">Upload foto</span>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="input file:mr-4 file:rounded-xl file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-ink">Tingkat urgensi</span>
                <select name="urgency" required className="input">
                  <option value="">Pilih urgensi</option>
                  {["rendah", "sedang", "tinggi"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Deskripsi</span>
                <textarea
                  name="description"
                  required
                  rows={6}
                  className="input resize-none"
                  placeholder="Jelaskan masalah secara singkat dan jelas"
                />
              </label>

              <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl bg-sand px-4 py-4">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  disabled={isSensitiveCategory}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  className="size-4 rounded border-ink/20"
                />
                <span className="text-sm text-ink/70">
                  {isSensitiveCategory ? "Anonim wajib untuk kategori sensitif ini" : "Kirim sebagai anonim"}
                </span>
              </label>
            </div>

            {message ? <p className="mt-5 text-sm font-medium text-brand-700">{message}</p> : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
