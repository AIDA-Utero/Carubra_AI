import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarubaAI | Virtual Assistant PT Utero Kreatif Indonesia",
  description: "CarubaAI - Virtual Assistant berbasis AI untuk PT Utero Kreatif Indonesia. Tanya jawab seputar layanan desain grafis, branding, dan digital marketing.",
  keywords: ["CarubaAI", "Utero", "AI", "Virtual Assistant", "Creative Agency", "Malang", "Desain Grafis", "Branding"],
  authors: [{ name: "PT Utero Kreatif Indonesia" }],
  openGraph: {
    title: "CarubaAI - Virtual Assistant",
    description: "CarubaAI - Virtual Assistant berbasis AI untuk PT Utero Kreatif Indonesia",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport = {
  themeColor: "#991b1b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
