import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Oraner Technologies — Tecnologia em construção",
    template: "%s | Oraner Technologies",
  },
  description: "Conheça os projetos de software e dispositivos em desenvolvimento pela Oraner Technologies.",
  applicationName: "Oraner Technologies",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#110d0a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
