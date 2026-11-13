import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Oraner Technologies | Site oficial",
    template: "%s | Oraner Technologies",
  },
  description: "Site oficial da Oraner Technologies: conheça nossos projetos, acompanhe novidades e veja o que está em desenvolvimento.",
  applicationName: "Oraner Technologies",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Oraner Technologies",
    title: "Oraner Technologies | Site oficial",
    description: "Projetos de tecnologia em desenvolvimento, comunicados oficiais e informações sobre a Oraner.",
  },
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
