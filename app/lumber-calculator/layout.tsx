import type { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Lumber Calculator — Board Feet, Framing & Sheet Goods",
  description:
    "Free lumber calculator for framing studs, boards & trim, and plywood/OSB sheet goods. Get piece counts, board feet or m³, waste allowance, and cost.",
  keywords: [
    "lumber calculator",
    "board foot calculator",
    "framing lumber calculator",
    "stud calculator",
    "sheet goods calculator",
    "plywood calculator",
    "OSB calculator",
    "board feet calculator",
    "lumber estimator",
    "framing estimator",
    "lumber cost calculator",
    "2x4 calculator",
  ],
  openGraph: {
    title: "Lumber Calculator — Free Board Feet, Framing & Sheet Goods Estimator",
    description:
      "Free lumber calculator for studs, boards, trim, plywood, and OSB. Imperial and metric with waste allowance and cost estimate.",
    type: "website",
    url: "https://freeconstructiontools.com/lumber-calculator",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Lumber Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumber Calculator — Free Board Feet & Framing Estimator",
    description: "Free lumber calculator for framing, boards, and sheet goods.",
    images: [getOGImageUrl("default")],
  },
  alternates: { canonical: "https://freeconstructiontools.com/lumber-calculator" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
