import { kategoriLaporan } from "@/lib/constants";

const descriptions: Record<string, string> = {
  "fasilitas rusak": "Laporkan toilet, lampu, AC, jalan rusak, bangku, meja, dan fasilitas umum lainnya.",
  bullying: "Sampaikan kejadian perundungan secara aman tanpa membuka identitas pelapor.",
  kebersihan: "Lapor sampah, selokan tersumbat, area kotor, dan titik yang perlu penanganan cepat.",
  keamanan: "Laporkan area rawan, kehilangan, vandalisme, atau kondisi yang berpotensi membahayakan.",
  pelayanan: "Berikan masukan terhadap layanan yang lambat, tidak ramah, atau tidak sesuai prosedur.",
  lingkungan: "Sampaikan keluhan taman, parkiran, air, kebisingan, dan kondisi lingkungan sekitar."
};

export function CategoryGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {kategoriLaporan.map((category, index) => (
        <div key={category} className="card group p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              0{index + 1}
            </span>
            <span className="badge bg-ink/5 text-ink/60">Kategori</span>
          </div>
          <h3 className="mt-6 text-xl font-bold capitalize text-ink">{category}</h3>
          <p className="mt-3 text-sm leading-6 text-ink/65">{descriptions[category]}</p>
        </div>
      ))}
    </div>
  );
}
