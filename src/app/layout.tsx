import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuperCondominio - Gestión Inteligente de Copropiedades",
  description: "La plataforma definitiva para la administración de condominios. Transparencia financiera, pagos móviles y gestión vecinal eficiente en un solo lugar.",
  keywords: ["administración de condominios", "gestión de edificios", "pagos de condominio", "transparencia financiera", "software admin"],
  authors: [{ name: "SuperCondominio Team" }],
  openGraph: {
    title: "SuperCondominio - Gestión Inteligente",
    description: "Administra tu condominio con total transparencia y eficiencia.",
    url: "https://supercondominio.com", // Ajustar según despliegue real
    siteName: "SuperCondominio",
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SuperCondominio",
    description: "La mejor herramienta para administradores y residentes.",
  },
};

import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <Toaster richColors position="top-center" closeButton />
        {children}
      </body>
    </html>
  );
}
