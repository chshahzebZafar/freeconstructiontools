import type { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Stair Calculator — Riser Height, Tread Depth, Stringer Length",
  description:
    "Free stair calculator. Enter total rise and run to get riser count, riser height, tread depth, stringer length, headroom clearance, and materials list.",
  keywords: [
    "stair calculator",
    "staircase calculator",
    "riser height calculator",
    "tread depth calculator",
    "stringer length calculator",
    "how many steps calculator",
    "stair rise and run calculator",
    "IRC stair code",
    "stair headroom calculator",
    "stair materials calculator",
  ],
  openGraph: {
    title: "Stair Calculator — Riser Height, Tread Depth, Stringer Length",
    description:
      "Free stair calculator. Riser count, riser height, tread depth, stringer length, headroom, and material cost. IRC code-compliant.",
    type: "website",
    url: "https://freeconstructiontools.com/stair-calculator",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Stair Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stair Calculator — Riser Height, Tread Depth, Stringer Length",
    description:
      "Free stair calculator. Riser count, riser height, tread depth, stringer length, headroom, and material cost. IRC code-compliant.",
    images: [getOGImageUrl("default")],
  },
  alternates: { canonical: "https://freeconstructiontools.com/stair-calculator" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
