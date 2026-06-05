import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getOGImageUrl } from "@/lib/og-image-generator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Free Construction Calculators & Estimators — No Signup",
    template: "%s",
  },
  description:
    "Free construction calculators for concrete, lumber, roofing, drywall, flooring, paint, tile, fencing, stairs, and more. Browser-based, no signup, no tracking.",
  keywords: [
    "construction calculator",
    "free construction calculators",
    "concrete calculator",
    "lumber calculator",
    "roofing calculator",
    "material estimator",
    "contractor calculator",
    "diy construction calculator",
  ],
  authors: [{ name: "Shahzeb Zafar" }],
  creator: "Shahzeb Zafar",
  publisher: "Shahzeb Zafar",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://freeconstructiontools.com",
    siteName: "Free Construction Tools",
    title: "Free Construction Calculators & Estimators — No Signup",
    description:
      "Free construction calculators for concrete, lumber, roofing, flooring, paint, tile, fencing, and more. Browser-based, no signup.",
    images: [
      {
        url: getOGImageUrl("home"),
        width: 1200,
        height: 630,
        alt: "Free Construction Tools — calculators and estimators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Construction Calculators & Estimators — No Signup",
    description:
      "Free construction calculators for concrete, lumber, roofing, flooring, paint, tile, fencing, and more. No signup.",
    images: [getOGImageUrl("home")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://freeconstructiontools.com",
  },
  metadataBase: new URL("https://freeconstructiontools.com"),
  other: {
    "theme-color": "#09090b",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
