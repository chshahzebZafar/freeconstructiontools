import { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Roofing Calculator 2026 | Estimate Shingles & Roofing Materials",
  description:
    "Free roofing calculator. Estimate roofing squares, shingles, underlayment, and total material cost for any roof shape. Supports gable, hip, gambrel, and.",
  keywords: [
    "roofing calculator",
    "roof shingle calculator",
    "roofing square calculator",
    "how many shingles do i need",
    "roofing material calculator",
    "roof cost calculator",
    "roofing estimate calculator",
    "shingle estimator",
    "roof underlayment calculator",
    "roofing squares to feet",
    "gable roof calculator",
    "hip roof calculator",
    "roof pitch calculator",
    "roof area calculator",
    "roofing waste factor",
    "asphalt shingle calculator",
    "metal roof calculator",
  ],
  alternates: {
    canonical: "https://freeconstructiontools.com/roofing-calculator",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Roofing Calculator | Estimate Shingles & Roofing Materials",
    description: "Free roofing calculator. Calculate roofing squares, shingles needed, underlayment, and total cost for gable, hip, gambrel, and flat roofs. Includes waste.",
    url: "https://freeconstructiontools.com/roofing-calculator",
    type: "website",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Roofing Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roofing Calculator | Estimate Shingles & Roofing Materials",
    description: "Free roofing calculator. Calculate shingles, underlayment, and total cost for any roof shape.",
    images: [getOGImageUrl("default")],
  },
};

export default function RoofingCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
