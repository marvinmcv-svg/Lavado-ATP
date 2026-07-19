import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lavadoatp — Lavado a presión profesional en Santa Cruz",
  description:
    "Lavado a presión profesional en Santa Cruz de la Sierra, Bolivia. Driveways, fachadas, techos, flotas comerciales. Cotización gratis por WhatsApp.",
  keywords: ["lavado a presión", "pressure washing", "lavado de driveway", "Santa Cruz Bolivia", "lavadoatp"],
  authors: [{ name: "lavadoatp" }],
  icons: {
    icon: "/uploads/lavadoatp-logo.jpg",
    apple: "/uploads/lavadoatp-logo.jpg",
  },
  openGraph: {
    title: "lavadoatp — Lavado a presión profesional",
    description: "Recupera el brillo de tu propiedad. Lavado a presión profesional en Santa Cruz, Bolivia.",
    type: "website",
    locale: "es_BO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
