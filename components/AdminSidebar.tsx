import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="card h-fit p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Panel Admin</p>
      <h2 className="mt-3 text-2xl font-black text-ink">Manajemen Laporan</h2>
      <nav className="mt-6 space-y-2 text-sm">
        <Link href="/admin" className="block rounded-2xl bg-brand-50 px-4 py-3 font-semibold text-brand-700">
          Ringkasan
        </Link>
        <Link href="/admin" className="block rounded-2xl px-4 py-3 text-ink/70 transition hover:bg-ink/5">
          Semua Laporan
        </Link>
        <Link href="/lapor" className="block rounded-2xl px-4 py-3 text-ink/70 transition hover:bg-ink/5">
          Buat Laporan
        </Link>
      </nav>
    </aside>
  );
}
