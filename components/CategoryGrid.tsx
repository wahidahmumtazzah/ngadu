import { getPlatformConfig } from "@/lib/platform-config";

export function CategoryGrid({ organizationType = "custom" }: { organizationType?: string }) {
  const categories = getPlatformConfig(organizationType).categories || [];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category, index) => (
        <div key={category.name} className="card group p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              0{index + 1}
            </span>
            <div className="flex items-center gap-2">
              {category.sensitive ? <span className="badge bg-red-100 text-red-700">Sensitif</span> : null}
              <span className="badge bg-ink/5 text-ink/60">{category.icon || "Kategori"}</span>
            </div>
          </div>
          <h3 className="mt-6 text-xl font-bold capitalize text-ink">{category.name}</h3>
          <p className="mt-3 text-sm leading-6 text-ink/65">{category.description}</p>
        </div>
      ))}
    </div>
  );
}
