import type { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Concrete Calculator — Free Cubic Yards & Bag Estimator",
  description:
    "Free concrete calculator for slabs, footings, and columns. Cubic yards, 60 lb and 80 lb bag counts, and rough cost estimate.",
  keywords: [
    "concrete calculator",
    "free concrete calculator",
    "concrete bag calculator",
    "cubic yards calculator",
    "concrete slab calculator",
    "footing concrete calculator",
    "column concrete calculator",
    "ready mix calculator",
  ],
  openGraph: {
    title: "Concrete Calculator — Free Cubic Yards & Bag Estimator",
    description: "Free concrete calculator for slabs, footings, and columns.",
    type: "website",
    url: "https://freeconstructiontools.com/concrete-calculator",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Concrete Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Concrete Calculator — Free Cubic Yards & Bag Estimator",
    description: "Free concrete calculator for slabs, footings, and columns.",
    images: [getOGImageUrl("default")],
  },
  alternates: { canonical: "https://freeconstructiontools.com/concrete-calculator" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
