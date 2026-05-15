export const organizationTypeOptions = [
  { value: "school", label: "Sekolah" },
  { value: "campus", label: "Kampus" },
  { value: "community", label: "Masyarakat / Perumahan" },
  { value: "boarding_house", label: "Kost" },
  { value: "office", label: "Kantor" },
  { value: "custom", label: "Custom" }
];

const genericEmergencyGroups = [
  {
    title: "Kekerasan / Konflik",
    items: ["perkelahian", "ancaman", "pelecehan", "intimidasi"]
  },
  {
    title: "Fasilitas Berbahaya",
    items: ["kabel listrik terbuka", "lantai licin", "kebocoran besar", "bangunan retak"]
  },
  {
    title: "Keamanan Mendesak",
    items: ["orang mencurigakan", "pencurian", "akses rusak", "vandalisme"]
  },
  {
    title: "Kondisi Darurat",
    items: ["kebakaran kecil", "banjir", "mati listrik", "air mati total"]
  }
];

export const platformConfigs = {
  school: {
    label: "Sekolah",
    icon: "School",
    landingBadge: "Platform Sekolah",
    reportLabel: "Aduan Siswa",
    userLabel: "Siswa",
    dashboardLabel: "Dashboard Sekolah",
    sidebarTitle: "Operasional Sekolah",
    emergencyLabel: "SOS Sekolah",
    menu: ["Laporan Bullying", "Fasilitas Rusak", "Kehilangan Barang", "Pelanggaran Siswa"],
    stats: ["Bullying Aktif", "Fasilitas Rusak", "Kasus Belum Ditangani", "Laporan Siswa"],
    roleOptions: [
      { systemRole: "user", label: "Siswa" },
      { systemRole: "petugas", label: "Guru" },
      { systemRole: "petugas", label: "BK" },
      { systemRole: "admin", label: "Admin" }
    ],
    categories: [
      { name: "bullying", icon: "ShieldAlert", description: "Laporan perundungan, ancaman, atau kekerasan di lingkungan sekolah." },
      { name: "fasilitas rusak", icon: "Wrench", description: "Kursi, kelas, toilet, listrik, dan fasilitas sekolah yang rusak." },
      { name: "kehilangan barang", icon: "Search", description: "Tas, buku, dompet, atau barang siswa yang hilang." },
      { name: "pelanggaran siswa", icon: "ClipboardList", description: "Pelanggaran tata tertib atau perilaku siswa yang perlu ditindaklanjuti." }
    ],
    exampleLocations: ["Kelas 9A", "Ruang BK", "Toilet lantai 2", "Gerbang sekolah"],
    emergencyGroups: genericEmergencyGroups
  },
  campus: {
    label: "Kampus",
    icon: "GraduationCap",
    landingBadge: "Platform Kampus",
    reportLabel: "Aduan Kampus",
    userLabel: "Mahasiswa",
    dashboardLabel: "Dashboard Kampus",
    sidebarTitle: "Operasional Kampus",
    emergencyLabel: "SOS Kampus",
    menu: ["Laporan Fasilitas", "Keluhan Akademik", "Organisasi", "Keamanan Kampus"],
    stats: ["Keluhan Akademik", "Fasilitas Kampus", "Isu Organisasi", "Kasus Keamanan"],
    roleOptions: [
      { systemRole: "user", label: "Mahasiswa" },
      { systemRole: "petugas", label: "Dosen" },
      { systemRole: "admin", label: "Admin" }
    ],
    categories: [
      { name: "fasilitas", icon: "Building2", description: "Kerusakan ruang kelas, laboratorium, wifi, parkir, atau fasilitas kampus." },
      { name: "keluhan akademik", icon: "BookOpen", description: "Jadwal, nilai, dosen, layanan akademik, atau administrasi perkuliahan." },
      { name: "organisasi", icon: "Users", description: "Kegiatan UKM, ormawa, atau persoalan koordinasi antar organisasi." },
      { name: "keamanan kampus", icon: "ShieldCheck", description: "Keamanan area kampus, kehilangan, atau gangguan ketertiban." }
    ],
    exampleLocations: ["Gedung rektorat", "Lab komputer", "Area parkir", "Lobby fakultas"],
    emergencyGroups: genericEmergencyGroups
  },
  community: {
    label: "Masyarakat / Perumahan",
    icon: "House",
    landingBadge: "Platform Warga",
    reportLabel: "Aduan Warga",
    userLabel: "Warga",
    dashboardLabel: "Dashboard Lingkungan",
    sidebarTitle: "Operasional Warga",
    emergencyLabel: "SOS Lingkungan",
    menu: ["Jalan Rusak", "Sampah", "Lampu Mati", "Keamanan Lingkungan"],
    stats: ["Aduan Jalan", "Sampah Menumpuk", "Lampu Mati", "Laporan Warga"],
    roleOptions: [
      { systemRole: "user", label: "Warga" },
      { systemRole: "petugas", label: "RT/RW" },
      { systemRole: "admin", label: "Admin" }
    ],
    categories: [
      { name: "jalan rusak", icon: "Construction", description: "Jalan berlubang, paving rusak, atau akses lingkungan yang membahayakan." },
      { name: "sampah", icon: "Trash2", description: "Sampah menumpuk, pengangkutan terlambat, atau area kotor." },
      { name: "lampu mati", icon: "Lightbulb", description: "Lampu jalan mati, penerangan kurang, atau panel listrik bermasalah." },
      { name: "keamanan lingkungan", icon: "Shield", description: "Kejadian mencurigakan, kehilangan, atau konflik warga." }
    ],
    exampleLocations: ["Blok C", "Pos ronda", "Jalan utama", "Depan balai warga"],
    emergencyGroups: genericEmergencyGroups
  },
  boarding_house: {
    label: "Kost",
    icon: "BedDouble",
    landingBadge: "Platform Kost",
    reportLabel: "Aduan Penghuni",
    userLabel: "Penghuni",
    dashboardLabel: "Dashboard Kost",
    sidebarTitle: "Operasional Kost",
    emergencyLabel: "SOS Kost",
    menu: ["Kerusakan Kamar", "Keluhan Wifi", "Air Mati", "Keamanan Kost"],
    stats: ["Kerusakan Kamar", "Gangguan Wifi", "Gangguan Air", "Laporan Penghuni"],
    roleOptions: [
      { systemRole: "user", label: "Penghuni" },
      { systemRole: "petugas", label: "Penjaga" },
      { systemRole: "admin", label: "Admin" }
    ],
    categories: [
      { name: "kerusakan kamar", icon: "DoorClosed", description: "Kasur, pintu, jendela, kamar mandi, atau inventaris kamar rusak." },
      { name: "keluhan wifi", icon: "Wifi", description: "Wifi lambat, mati total, atau jaringan tidak stabil." },
      { name: "air mati", icon: "Droplets", description: "Air mati, pompa bermasalah, atau saluran bocor." },
      { name: "keamanan", icon: "Lock", description: "Akses kost, tamu mencurigakan, atau keamanan penghuni." }
    ],
    exampleLocations: ["Kamar 12", "Lorong lantai 3", "Area dapur", "Gerbang kost"],
    emergencyGroups: genericEmergencyGroups
  },
  office: {
    label: "Kantor",
    icon: "BriefcaseBusiness",
    landingBadge: "Platform Kantor",
    reportLabel: "Aduan Karyawan",
    userLabel: "Karyawan",
    dashboardLabel: "Dashboard Kantor",
    sidebarTitle: "Operasional Kantor",
    emergencyLabel: "SOS Kantor",
    menu: ["Fasilitas Kantor", "IT & Sistem", "HR / Etika", "Keamanan Kantor"],
    stats: ["Fasilitas Kantor", "Gangguan IT", "Isu HR", "Keamanan Area"],
    roleOptions: [
      { systemRole: "user", label: "Karyawan" },
      { systemRole: "petugas", label: "Supervisor" },
      { systemRole: "admin", label: "Admin" }
    ],
    categories: [
      { name: "fasilitas kantor", icon: "Building", description: "Meja, AC, ruang meeting, listrik, atau fasilitas kantor rusak." },
      { name: "it & sistem", icon: "MonitorCog", description: "Akun, aplikasi internal, laptop, printer, atau jaringan kantor." },
      { name: "hr / etika", icon: "UsersRound", description: "Keluhan interpersonal, etika kerja, atau persoalan SDM." },
      { name: "keamanan kantor", icon: "ShieldCheck", description: "Akses gedung, visitor, atau insiden keamanan kantor." }
    ],
    exampleLocations: ["Ruang meeting 2", "Lantai 5", "Server room", "Lobby kantor"],
    emergencyGroups: genericEmergencyGroups
  },
  custom: {
    label: "Custom",
    icon: "Sparkles",
    landingBadge: "Platform Custom",
    reportLabel: "Aduan Umum",
    userLabel: "Pengguna",
    dashboardLabel: "Dashboard Custom",
    sidebarTitle: "Operasional Umum",
    emergencyLabel: "SOS Cepat",
    menu: ["Fasilitas", "Layanan", "Keamanan", "Keluhan Umum"],
    stats: ["Laporan Masuk", "Perlu Tindak Lanjut", "Selesai", "Pengguna Aktif"],
    roleOptions: [
      { systemRole: "user", label: "Pengguna" },
      { systemRole: "petugas", label: "Petugas" },
      { systemRole: "admin", label: "Admin" }
    ],
    categories: [
      { name: "fasilitas", icon: "Boxes", description: "Kerusakan atau kebutuhan perbaikan fasilitas." },
      { name: "layanan", icon: "MessageSquare", description: "Keluhan kualitas layanan atau proses operasional." },
      { name: "keamanan", icon: "Shield", description: "Laporan keamanan, kehilangan, atau situasi berisiko." },
      { name: "keluhan umum", icon: "CircleAlert", description: "Aduan lain yang tidak masuk kategori khusus." }
    ],
    exampleLocations: ["Area utama", "Gedung A", "Pintu masuk", "Lantai 2"],
    emergencyGroups: genericEmergencyGroups
  }
};

export function getPlatformConfig(type) {
  return platformConfigs[type] || platformConfigs.custom;
}

export function getRoleOptions(type) {
  return getPlatformConfig(type).roleOptions;
}

export function getRoleLabel(type, systemRole, fallbackLabel = null) {
  const match = getRoleOptions(type).find((item) => item.systemRole === systemRole && item.label === fallbackLabel);
  if (match) return match.label;
  const firstMatch = getRoleOptions(type).find((item) => item.systemRole === systemRole);
  return firstMatch?.label || fallbackLabel || systemRole;
}

export function resolveRoleOption(type, roleLabel) {
  const options = getRoleOptions(type);
  const normalized = String(roleLabel || "").trim().toLowerCase();
  return (
    options.find((item) => item.label.toLowerCase() === normalized) ||
    options.find((item) => item.systemRole === normalized) ||
    options[0]
  );
}
