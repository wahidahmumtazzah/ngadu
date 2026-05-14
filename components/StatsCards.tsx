export function StatsCards({
  stats
}: {
  stats: { total?: number; terkirim?: number; diproses?: number; selesai?: number };
}) {
  const items = [
    { label: "Total Laporan", value: stats.total || 0 },
    { label: "Terkirim", value: stats.terkirim || 0 },
    { label: "Diproses", value: stats.diproses || 0 },
    { label: "Selesai", value: stats.selesai || 0 }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="card p-6">
          <p className="text-sm text-ink/60">{item.label}</p>
          <p className="mt-3 text-3xl font-black text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
