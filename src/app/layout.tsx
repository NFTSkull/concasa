import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { companyInfo, siteMeta } from "@/content/site";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMeta.url),
  title: {
    default: siteMeta.title,
    template: "%s | ConCasa",
  },
  description: siteMeta.description,
  alternates: {
    canonical: siteMeta.url,
  },
  category: "Finance",
  openGraph: {
    title: siteMeta.title,
    description: siteMeta.description,
    url: siteMeta.url,
    type: "website",
    siteName: "ConCasa Soluciones Inmobiliarias",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.title,
    description: siteMeta.description,
  },
  authors: [{ name: companyInfo.name }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
