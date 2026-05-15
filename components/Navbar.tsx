"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuth, getUser } from "@/lib/api";
import { useEffect, useState } from "react";
import { getPlatformConfig } from "@/lib/platform-config";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
};

type SessionUser = {
  name: string;
  role: string;
  roleLabel?: string;
  organization?: {
    name?: string;
    type?: string;
  } | null;
};

function getNavItems(pathname: string, user?: SessionUser | null): NavItem[] {
  const config = getPlatformConfig(user?.organization?.type || "custom");

  if (user?.role === "super_admin") {
    return [{ href: "/super-admin", label: "Super Admin" }];
  }

  if (user?.role === "admin") {
    return [
      { href: "/admin", label: config.dashboardLabel },
      { href: "/admin/laporan", label: "Kelola Laporan" }
    ];
  }

  if (user?.role === "user" || user?.role === "petugas") {
    return [
      { href: "/dashboard", label: "Dashboard Saya" },
      { href: "/lapor", label: config.reportLabel },
      { href: "/profil", label: "Profil" }
    ];
  }

  if (pathname.startsWith("/admin")) {
    return [
      { href: "/", label: "Beranda" },
      { href: "/#kategori", label: "Kategori" },
      { href: "/daftar-instansi", label: "Daftar Instansi" },
      { href: "/lapor", label: "Kirim Aduan" }
    ];
  }

  return [
    { href: "/", label: "Beranda" },
    { href: "/#tentang", label: "Tentang" },
    { href: "/daftar-instansi", label: "Daftar Instansi" },
    { href: "/#kategori", label: "Kategori" }
  ];
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const navItems = getNavItems(pathname, user);
  const homeHref =
    user?.role === "super_admin"
      ? "/super-admin"
      : user?.role === "admin"
        ? "/admin"
        : user?.role === "user" || user?.role === "petugas"
          ? "/dashboard"
          : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-sand/80 backdrop-blur">
      <div className="container-app flex items-center justify-between gap-4 py-4">
        <Link href={homeHref} className="text-xl font-black tracking-tight text-ink">
          lapor.in
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== "/" && !item.href.includes("#") && pathname.startsWith(item.href));

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`transition hover:text-brand-600 ${isActive ? "text-ink" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden text-sm text-ink/70 sm:inline">
                {user.organization?.name ? `${user.organization.name} · ` : ""}
                {user.name} · {user.roleLabel || user.role}
              </span>
              <button
                onClick={async () => {
                  await clearAuth();
                  location.href = "/";
                }}
                className="btn-secondary"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/masuk" className="btn-secondary">
                Masuk
              </Link>
              <Link href="/daftar-instansi" className="btn-secondary hidden sm:inline-flex">
                Daftar Instansi
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
