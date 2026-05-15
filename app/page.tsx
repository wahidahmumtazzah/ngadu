"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SectionTitle } from "@/components/SectionTitle";
import { StatsCards } from "@/components/StatsCards";
import { apiFetch } from "@/lib/api";
import { organizationTypeOptions } from "@/lib/platform-config";

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
            <span className="badge bg-brand-100 text-brand-700">Multi Workspace Reporting Platform</span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-ink sm:text-6xl">
              Satu sistem pengaduan untuk sekolah, kampus, kost, kantor, dan lingkungan warga.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink/70">
              Admin membuat instansi terlebih dahulu, memilih jenis platform, lalu kategori laporan,
              role label, dashboard, dan alur pelaporan otomatis menyesuaikan tanpa perlu codebase terpisah.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/masuk" className="btn-primary">
                Masuk
              </Link>
              <Link href="/daftar-instansi" className="btn-secondary">
                Daftar Instansi
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {organizationTypeOptions.map((item) => (
                <span key={item.value} className="badge bg-white text-ink/70 shadow-sm">
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden p-6 sm:p-8">
            <div className="rounded-[2rem] bg-brand-500 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Konsep Workspace</p>
              <h2 className="mt-4 text-3xl font-black">Jenis instansi menentukan kategori, role, menu, dan statistik.</h2>
              <ul className="mt-6 space-y-4 text-sm text-white/80">
                <li>Sekolah: bullying, fasilitas, kehilangan barang, pelanggaran siswa.</li>
                <li>Kampus: akademik, organisasi, fasilitas, keamanan kampus.</li>
                <li>Kost dan masyarakat: fokus pada operasional lapangan dan respons cepat.</li>
              </ul>
            </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-brand-50 p-5 dark:bg-brand-900/40 dark:ring-1 dark:ring-brand-200/10">
                  <p className="text-sm text-brand-700 dark:text-brand-200">Dynamic UI</p>
                  <p className="mt-2 text-xl font-bold text-ink dark:text-white">Config Driven</p>
                </div>
                <div className="rounded-3xl bg-neutral-900 p-5 text-white dark:bg-neutral-800 dark:ring-1 dark:ring-white/10">
                  <p className="text-sm text-white/70 dark:text-white/75">Workflow Laporan</p>
                  <p className="mt-2 text-xl font-bold text-white">Satu Form, Satu Alur</p>
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
          label="Mode Platform"
          title="Kategori dan alur bisa berganti otomatis sesuai instansi."
          description="Contoh di bawah memakai preset sekolah. Saat user masuk ke instansi lain, kategori, role label, dan copywriting UI akan berubah mengikuti tipenya."
        />
        <div className="mt-10">
          <CategoryGrid organizationType="school" />
        </div>
      </section>
    </main>
  );
}
