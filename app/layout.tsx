import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SessionBootstrap } from "@/components/SessionBootstrap";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta-sans"
});

export const metadata: Metadata = {
  title: "lapor.in - Sistem Pengaduan Anonim",
  description: "Aplikasi pelaporan anonim untuk sekolah, kampus, dan masyarakat."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={jakartaSans.variable}>
        <SessionBootstrap />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
