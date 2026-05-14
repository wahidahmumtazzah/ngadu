"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SectionTitle } from "@/components/SectionTitle";
import { StatsCards } from "@/components/StatsCards";
import { apiFetch } from "@/lib/api";
import { contohFasilitas } from "@/lib/constants";

export default function HomePage() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    apiFetch("/reports/stats/public")
      .then((data) => setStats(data.summary || {}))
      .catch(() => setStats({}));
  }, []);

  return (
    <main>
      <section className="bg-hero-glow">
        <div className="container-app grid min-h-[78vh] items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <span className="badge bg-brand-100 text-brand-700">Pelaporan Aman dan Anonim</span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-ink sm:text-6xl">
              Laporkan masalah tanpa takut identitas Anda diketahui.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
              NgaduAja memudahkan sekolah, kampus, dan lingkungan masyarakat menerima pengaduan
              secara cepat, terdokumentasi, dan tetap menjaga anonimitas pelapor.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/lapor" className="btn-primary">
                Buat Laporan
              </Link>
              <Link href="/masuk" className="btn-secondary">
                Login
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {contohFasilitas.map((item) => (
                <span key={item} className="badge bg-white text-ink/70 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden p-6 sm:p-8">
            <div className="rounded-[2rem] bg-brand-500 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Sistem Anonim</p>
              <h2 className="mt-4 text-3xl font-black">Laporan fokus pada masalah, bukan identitas.</h2>
              <ul className="mt-6 space-y-4 text-sm text-white/80">
                <li>Admin hanya melihat data anonim untuk laporan yang ditandai anonim.</li>
                <li>Status laporan transparan: terkirim, diproses, selesai.</li>
                <li>Unggah foto pendukung untuk mempercepat penanganan.</li>
              </ul>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-brand-50 p-5">
                <p className="text-sm text-brand-700">Responsif</p>
                <p className="mt-2 text-xl font-bold text-ink">Mobile Friendly</p>
              </div>
              <div className="rounded-3xl bg-ink p-5 text-white">
                <p className="text-sm text-white/70">Modern</p>
                <p className="mt-2 text-xl font-bold text-white">Clean Card Layout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="container-app py-16">
        <StatsCards stats={stats as { total?: number; terkirim?: number; diproses?: number; selesai?: number }} />
      </section>

      <section id="kategori" className="container-app py-16">
        <SectionTitle
          label="Tentang Aplikasi"
          title="Dirancang untuk pelaporan yang cepat, aman, dan mudah dipahami."
          description="Aplikasi ini cocok dipakai oleh institusi pendidikan dan komunitas karena proses pelaporan sederhana, status bisa dipantau, dan admin dapat memprioritaskan masalah berdasarkan urgensi."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Anonim Secara Default",
              desc: "Pelapor dapat memilih mode anonim sehingga identitas tidak tampil di panel admin."
            },
            {
              title: "Terlacak dan Terukur",
              desc: "Setiap laporan memiliki kategori, urgensi, status, dan statistik untuk evaluasi layanan."
            },
            {
              title: "Siap untuk Operasional",
              desc: "Backend Express dan MySQL memudahkan pengelolaan data serta integrasi lanjutan."
            }
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="text-xl font-bold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/65">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app py-16">
        <SectionTitle
          label="Kategori Laporan"
          title="Semua jenis pengaduan umum sudah disiapkan dalam sistem."
          description="Kategori membantu admin menyaring isu dan memprioritaskan tindak lanjut berdasarkan konteks laporan."
        />
        <div className="mt-10">
          <CategoryGrid />
        </div>
      </section>
    </main>
  );
}
