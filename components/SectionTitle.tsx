export function SectionTitle({
  label,
  title,
  description
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="badge bg-brand-100 text-brand-700">{label}</span>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/70">{description}</p>
    </div>
  );
}
