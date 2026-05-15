"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuth, getUser } from "@/lib/api";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

function getNavItems(pathname: string, role?: string): NavItem[] {
  if (role === "admin") {
    return [
      { href: "/admin", label: "Dashboard Admin" },
      { href: "/admin/laporan", label: "Kelola Laporan" }
    ];
  }

  if (role === "user") {
    return [
      { href: "/dashboard", label: "Dashboard User" },
      { href: "/lapor", label: "Buat Laporan" },
      { href: "/profil", label: "Profil" }
    ];
  }

  if (pathname.startsWith("/admin")) {
    return [
      { href: "/#kategori", label: "Kategori" },
      { href: "/lapor", label: "Kirim Aduan" }
    ];
  }

  return [
    { href: "/#tentang", label: "Tentang" },
    { href: "/#kategori", label: "Kategori" },
    { href: "/lapor", label: "Kirim Aduan" }
  ];
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const navItems = getNavItems(pathname, user?.role);
  const homeHref = user?.role === "admin" ? "/admin" : user?.role === "user" ? "/dashboard" : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-sand/80 backdrop-blur">
      <div className="container-app flex items-center justify-between gap-4 py-4">
        <Link href={homeHref} className="text-xl font-black tracking-tight text-ink">
          NgaduAja
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
          {user ? (
            <>
              <span className="hidden text-sm text-ink/70 sm:inline">
                {user.name} · {user.role}
              </span>
              <button
                onClick={() => {
                  clearAuth();
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
              <Link href="/lapor" className="btn-primary hidden sm:inline-flex">
                Buat Laporan
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
