export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    terkirim: "bg-zinc-100 text-zinc-700",
    diproses: "bg-amber-100 text-amber-700",
    menunggu_korban: "bg-sky-100 text-sky-700",
    selesai: "bg-emerald-100 text-emerald-700",
    ditolak: "bg-rose-100 text-rose-700"
  };

  return <span className={`badge ${styles[status] || "bg-ink/5 text-ink/60"}`}>{status}</span>;
}
