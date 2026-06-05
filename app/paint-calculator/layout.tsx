import { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Paint Calculator 2026 | Estimate How Much Paint You'll Need",
  description:
    "Free paint calculator for interior rooms. Estimate gallons needed for walls and ceilings. Accounts for doors, windows, multiple coats, and waste.",
  keywords: [
    "paint calculator",
    "how much paint do i need",
    "paint estimator",
    "paint coverage calculator",
    "interior paint calculator",
    "room paint calculator",
    "gallons of paint per room",
    "paint cost estimator",
    "wall paint calculator",
    "ceiling paint calculator",
    "house painting calculator",
    "paint per square foot",
    "paint needed for room",
    "primer calculator",
    "paint waste factor",
    "exterior paint calculator",
  ],
  alternates: {
    canonical: "https://freeconstructiontools.com/paint-calculator",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Paint Calculator | Estimate How Much Paint You'll Need",
    description: "Free paint calculator for interior rooms. Calculate gallons, primer, and cost for any painting project. Accounts for doors, windows, and multiple coats.",
    url: "https://freeconstructiontools.com/paint-calculator",
    type: "website",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Paint Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paint Calculator | Estimate How Much Paint You'll Need",
    description: "Free paint calculator for interior rooms. Calculate gallons, primer, and cost for any painting project.",
    images: [getOGImageUrl("default")],
  },
};

export default function PaintCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
