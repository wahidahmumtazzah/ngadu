type StatsCardItem = {
  label: string;
  value: number | string;
  tone?: "default" | "danger" | "success" | "warning";
};

export function StatsCards({
  stats,
  items
}: {
  stats?: { total?: number; terkirim?: number; diproses?: number; selesai?: number };
  items?: StatsCardItem[];
}) {
  const fallbackItems = [
    { label: "Total Laporan", value: stats?.total || 0 },
    { label: "Terkirim", value: stats?.terkirim || 0 },
    { label: "Diproses", value: stats?.diproses || 0 },
    { label: "Selesai", value: stats?.selesai || 0 }
  ];

  const resolvedItems = items || fallbackItems;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {resolvedItems.map((item) => (
        <div
          key={item.label}
          className={`card p-5 ${
            item.tone === "danger"
              ? "border-red-200 bg-red-50"
              : item.tone === "success"
                ? "border-emerald-200 bg-emerald-50"
                : item.tone === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : ""
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">{item.label}</p>
          <p className="mt-3 text-3xl font-black text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
