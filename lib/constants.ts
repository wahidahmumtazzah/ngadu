import { platformConfigs } from "@/lib/platform-config";

const allCategories = Object.values(platformConfigs).flatMap((config) => config.categories.map((item) => item.name));

export const kategoriLaporan = Array.from(new Set(allCategories));

export const contohFasilitas = [
  "ruang kelas",
  "lab komputer",
  "wifi",
  "jalan rusak",
  "lampu mati",
  "air mati",
  "ruang kerja",
  "keamanan lingkungan"
];

export const statusLaporan = ["terkirim", "diproses", "menunggu_korban", "selesai", "ditolak"];
export const tingkatUrgensi = ["rendah", "sedang", "tinggi"];
export const tingkatBahayaDarurat = ["sedang", "tinggi", "kritis"];
export const rolePengguna = ["admin", "petugas", "user"];

export const kategoriDarurat = platformConfigs.custom.emergencyGroups;
