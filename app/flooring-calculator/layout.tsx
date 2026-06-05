import { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Flooring Calculator — Hardwood, Laminate, Tile & Carpet",
  description:
    "Free flooring calculator. Estimate square footage, planks/tiles needed, cost for hardwood, laminate, vinyl, carpet, and tile. Includes waste factor and.",
  keywords: [
    "flooring calculator",
    "floor calculator",
    "hardwood calculator",
    "laminate flooring calculator",
    "tile calculator flooring",
    "carpet calculator",
    "vinyl flooring calculator",
    "sq ft calculator flooring",
    "flooring cost estimator",
    "how much flooring do i need",
    "planks calculator",
    "flooring waste factor",
    "floor area calculator",
    "flooring material estimator",
  ],
  alternates: {
    canonical: "https://freeconstructiontools.com/flooring-calculator",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Flooring Calculator | Estimate Hardwood, Laminate, Tile & Carpet",
    description: "Free flooring calculator for hardwood, laminate, vinyl, carpet, and tile. Calculate square footage, planks/tiles needed, material cost, and waste factor.",
    url: "https://freeconstructiontools.com/flooring-calculator",
    type: "website",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Flooring Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flooring Calculator | Estimate Hardwood, Laminate, Tile & Carpet",
    description: "Free flooring calculator for hardwood, laminate, vinyl, carpet, and tile. Calculate square footage, planks/tiles needed, and cost.",
    images: [getOGImageUrl("default")],
  },
};

export default function FlooringCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
