import type { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Roof Pitch Calculator — Pitch Ratio, Angle & Rafter Length",
  description:
    "Free roof pitch calculator. Convert rise/run to pitch ratio, degrees, and percent slope. Calculate rafter length with overhang. Imperial and metric.",
  keywords: [
    "roof pitch calculator",
    "roof slope calculator",
    "rafter length calculator",
    "roof angle calculator",
    "pitch ratio calculator",
    "rise over run calculator",
    "roof pitch in degrees",
    "roof pitch percentage",
    "how to calculate roof pitch",
  ],
  openGraph: {
    title: "Roof Pitch Calculator — Pitch Ratio, Angle & Rafter Length",
    description:
      "Free roof pitch calculator. Convert rise/run to pitch ratio, degrees, and percent slope. Calculate rafter length with overhang.",
    type: "website",
    url: "https://freeconstructiontools.com/roof-pitch-calculator",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Roof Pitch Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roof Pitch Calculator — Pitch Ratio, Angle & Rafter Length",
    description:
      "Free roof pitch calculator. Convert rise/run to pitch ratio, degrees, and percent slope. Calculate rafter length with overhang.",
    images: [getOGImageUrl("default")],
  },
  alternates: { canonical: "https://freeconstructiontools.com/roof-pitch-calculator" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
