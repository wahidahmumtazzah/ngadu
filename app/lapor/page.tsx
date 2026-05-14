"use client";

import { apiFetch, getUser } from "@/lib/api";
import { kategoriDarurat, kategoriLaporan, tingkatUrgensi } from "@/lib/constants";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type LocalUser = {
  defaultAnonymous?: boolean;
};

type FollowupState = {
  reportId: number;
  editToken: string;
};

const allEmergencyTypes = kategoriDarurat.flatMap((group) =>
  group.items.map((item) => ({
    label: `${group.title} - ${item}`,
    value: item
  }))
);

export default function ReportFormPage() {
  const searchParams = useSearchParams();
  const emergencyMode = searchParams.get("mode") === "darurat";
  const [loading, setLoading] = useState(false);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isEmergency, setIsEmergency] = useState(emergencyMode);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [followup, setFollowup] = useState<FollowupState | null>(null);
  const [showFollowupPhoto, setShowFollowupPhoto] = useState(false);
  const [showFollowupDetail, setShowFollowupDetail] = useState(false);
  const [followupMessage, setFollowupMessage] = useState("");

  useEffect(() => {
    const user = getUser() as LocalUser | null;
    setIsAnonymous(Boolean(user?.defaultAnonymous ?? true));
  }, []);

  useEffect(() => {
    setIsEmergency(emergencyMode);
  }, [emergencyMode]);

  const photoHint = useMemo(() => {
    if (isEmergency) {
      return "Foto bersifat opsional. Jika situasi aman, tambahkan bukti cepat agar penanganan lebih akurat.";
    }

    if (selectedCategory === "bullying") {
      return "Foto tidak wajib untuk laporan sensitif seperti bullying. Utamakan keamanan pelapor.";
    }

    return "Tambahkan foto agar laporan lebih mudah diproses.";
  }, [isEmergency, selectedCategory]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setFollowup(null);
    setFollowupMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("isAnonymous", String(isAnonymous));
    formData.set("isEmergency", String(isEmergency));

    try {
      const data = await apiFetch("/reports", {
        method: "POST",
        body: formData
      });

      setMessage(data.message || "Laporan berhasil dikirim.");
      if (data.followup) {
        setFollowup(data.followup);
      }
      form.reset();
      const user = getUser() as LocalUser | null;
      setIsAnonymous(Boolean(user?.defaultAnonymous ?? true));
      setIsEmergency(emergencyMode);
      setSelectedCategory("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim laporan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!followup) return;

    setFollowupLoading(true);
    setFollowupMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("editToken", followup.editToken);

    try {
      const data = await apiFetch(`/reports/${followup.reportId}/followup`, {
        method: "PATCH",
        body: formData
      });
      setFollowupMessage(data.message || "Tambahan laporan darurat berhasil disimpan.");
      form.reset();
      setShowFollowupPhoto(false);
      setShowFollowupDetail(false);
    } catch (error) {
      setFollowupMessage(error instanceof Error ? error.message : "Gagal menyimpan tambahan laporan.");
    } finally {
      setFollowupLoading(false);
    }
  }

  return (
    <main className="container-app py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className={`card p-8 ${isEmergency ? "border-red-200" : ""}`}>
          <span className={`badge ${isEmergency ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"}`}>
            {isEmergency ? "Laporan Darurat" : "Form Pengaduan"}
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">
            {isEmergency ? "Laporkan kondisi darurat sekarang" : "Buat laporan baru"}
          </h1>
          <p className="mt-4 text-base leading-7 text-ink/70">
            {isEmergency
              ? "Untuk laporan darurat, cukup isi inti kejadian dulu. Foto dan detail tambahan bisa dikirim setelah laporan masuk."
              : "Isi laporan dengan jelas agar pihak pengelola dapat menindaklanjuti lebih cepat. Foto bersifat opsional, tetapi sangat membantu proses verifikasi."}
          </p>

          {isEmergency ? (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">Disclaimer</p>
              <p className="mt-3 text-sm leading-6 text-red-700/90">
                Gunakan fitur darurat hanya untuk kondisi mendesak. Penyalahgunaan fitur ini dapat
                mengganggu penanganan kasus prioritas.
              </p>
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {(isEmergency
              ? [
                  "Wajib isi jenis darurat dan lokasi kejadian terlebih dahulu",
                  "Tambahan foto dan detail bisa dikirim setelah laporan berhasil masuk",
                  "Admin akan melihat badge URGENT dan memproses laporan ini lebih dulu"
                ]
              : [
                  "Pilih kategori yang paling sesuai",
                  "Tuliskan lokasi kejadian secara spesifik",
                  "Tambahkan foto agar laporan lebih mudah diproses",
                  "Tentukan urgensi agar prioritas lebih jelas"
                ]
            ).map((item) => (
              <div key={item} className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink/70">
                {item}
              </div>
            ))}
          </div>

          {isEmergency ? (
            <div className="mt-8 space-y-4">
              {kategoriDarurat.map((group) => (
                <div key={group.title} className="rounded-3xl bg-white p-5">
                  <h2 className="text-lg font-bold text-ink">{group.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span key={item} className="badge bg-red-50 text-red-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className={`card p-8 ${isEmergency ? "border-red-200" : ""}`}>
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEmergency(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  !isEmergency ? "bg-brand-500 text-white" : "border border-ink/10 bg-white text-ink"
                }`}
              >
                Laporan Biasa
              </button>
              <button
                type="button"
                onClick={() => setIsEmergency(true)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isEmergency ? "bg-red-500 text-white" : "border border-ink/10 bg-white text-ink"
                }`}
              >
                Sirine - Laporan Darurat
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {isEmergency ? (
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-ink">Jenis darurat</span>
                  <select name="emergencyType" required className="input">
                    <option value="">Pilih jenis darurat</option>
                    {allEmergencyTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
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
                    {kategoriLaporan.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">Lokasi kejadian</span>
                <input
                  name="location"
                  required
                  className="input"
                  placeholder="Contoh: Gedung B lantai 2, dekat toilet"
                />
              </label>

              {isEmergency ? null : (
                <>
                  <label>
                    <span className="mb-2 block text-sm font-semibold text-ink">Upload foto</span>
                    <input
                      name="photo"
                      type="file"
                      accept="image/*"
                      className="input file:mr-4 file:rounded-xl file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
                    />
                    <p className="mt-2 text-xs text-ink/55">{photoHint}</p>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-semibold text-ink">Tingkat urgensi</span>
                    <select name="urgency" required className="input">
                      <option value="">Pilih urgensi</option>
                      {tingkatUrgensi.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-ink">
                  {isEmergency ? "Deskripsi tambahan (opsional)" : "Deskripsi"}
                </span>
                <textarea
                  name="description"
                  required={!isEmergency}
                  rows={6}
                  className="input resize-none"
                  placeholder={
                    isEmergency
                      ? "Opsional. Tambahkan detail jika situasi memungkinkan."
                      : "Jelaskan masalah yang terjadi secara singkat dan jelas"
                  }
                />
              </label>

              <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl bg-sand px-4 py-4">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  className="size-4 rounded border-ink/20"
                />
                <span className="text-sm text-ink/70">Kirim sebagai anonim</span>
              </label>
            </div>

            {message ? <p className="mt-5 text-sm font-medium text-brand-700">{message}</p> : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                disabled={loading}
                className={`${
                  isEmergency
                    ? "rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                    : "btn-primary"
                } disabled:opacity-60`}
              >
                {loading ? "Mengirim..." : isEmergency ? "Kirim Laporan Darurat" : "Kirim Laporan"}
              </button>
            </div>
          </form>

          {followup ? (
            <div className="card border-red-200 p-8">
              <span className="badge bg-red-100 text-red-700">Laporan Darurat Terkirim</span>
              <h2 className="mt-4 text-2xl font-black text-ink">Tambahkan informasi lanjutan bila tersedia</h2>
              <p className="mt-3 text-sm leading-6 text-ink/70">
                Inti laporan sudah masuk. Sekarang Anda bisa menambahkan foto atau detail tambahan
                tanpa mengulang pengiriman dari awal.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowFollowupPhoto((current) => !current)}
                  className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  Tambahkan foto
                </button>
                <button
                  type="button"
                  onClick={() => setShowFollowupDetail((current) => !current)}
                  className="rounded-2xl bg-ink/5 px-4 py-3 text-sm font-semibold text-ink"
                >
                  Tambahkan detail
                </button>
              </div>

              {showFollowupPhoto || showFollowupDetail ? (
                <form onSubmit={handleFollowupSubmit} className="mt-6 space-y-4">
                  {showFollowupPhoto ? (
                    <label>
                      <span className="mb-2 block text-sm font-semibold text-ink">Foto tambahan</span>
                      <input
                        name="photo"
                        type="file"
                        accept="image/*"
                        className="input file:mr-4 file:rounded-xl file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
                      />
                    </label>
                  ) : null}

                  {showFollowupDetail ? (
                    <>
                      <label>
                        <span className="mb-2 block text-sm font-semibold text-ink">Detail tambahan</span>
                        <textarea
                          name="description"
                          rows={4}
                          className="input resize-none"
                          placeholder="Tambahkan detail penting yang belum sempat Anda isi"
                        />
                      </label>

                      <label>
                        <span className="mb-2 block text-sm font-semibold text-ink">Lokasi detail</span>
                        <input
                          name="detailLocation"
                          className="input"
                          placeholder="Contoh: samping ruang 12, dekat tangga timur"
                        />
                      </label>
                    </>
                  ) : null}

                  <button disabled={followupLoading} className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">
                    {followupLoading ? "Menyimpan..." : "Simpan Tambahan"}
                  </button>
                </form>
              ) : null}

              {followupMessage ? <p className="mt-4 text-sm font-medium text-brand-700">{followupMessage}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
