export function SimpleBarChart({
  title,
  data
}: {
  title: string;
  data: { label: string; total: number }[];
}) {
  const max = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <div className="mt-6 space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="capitalize text-ink/70">{item.label}</span>
              <span className="font-semibold text-ink">{item.total}</span>
            </div>
            <div className="h-3 rounded-full bg-ink/5">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-brand-400 to-brand-700"
                style={{ width: `${(item.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
