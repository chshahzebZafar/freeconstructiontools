import { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Tile Calculator 2026 | Estimate Floor & Wall Tile Needs",
  description:
    "Free tile calculator. Calculate tiles needed for floors, walls, and backsplashes. Accounts for grout spacing, pattern layout, waste factor, and cost.",
  keywords: [
    "tile calculator",
    "how many tiles do i need",
    "floor tile calculator",
    "wall tile calculator",
    "backsplash calculator",
    "ceramic tile calculator",
    "porcelain tile calculator",
    "subway tile calculator",
    "mosaic tile calculator",
    "tile coverage calculator",
    "tile estimator",
    "tile sq ft calculator",
    "tile layout calculator",
    "tile waste factor",
    "tile grout calculator",
    "bathroom tile calculator",
    "kitchen tile calculator",
    "shower tile calculator",
  ],
  alternates: {
    canonical: "https://freeconstructiontools.com/tile-calculator",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tile Calculator | Estimate Floor & Wall Tile Needs",
    description: "Free tile calculator for floors, walls, and backsplashes. Calculate tiles needed with grout spacing, pattern layout, waste factor, and cost. Supports all.",
    url: "https://freeconstructiontools.com/tile-calculator",
    type: "website",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Tile Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tile Calculator | Estimate Floor & Wall Tile Needs",
    description: "Free tile calculator for floors, walls, and backsplashes. Calculate tiles, grout, and cost for any tile project.",
    images: [getOGImageUrl("default")],
  },
};

export default function TileCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
