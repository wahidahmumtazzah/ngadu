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
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var key = "laporin-theme";
                  var stored = localStorage.getItem(key);
                  var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
                  document.documentElement.classList.toggle("dark", dark);
                } catch (error) {}
              })();
            `
          }}
        />
      </head>
      <body className={jakartaSans.variable}>
        <SessionBootstrap />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
