import type { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Gravel Calculator — Free Cubic Yards & Tons Estimator",
  description:
    "Free gravel calculator. Get cubic yards, tons, and cost for pea gravel, crushed stone, river rock, decomposed granite, and more. Supports driveways, pathways, and circular areas.",
  keywords: [
    "gravel calculator",
    "free gravel calculator",
    "cubic yards of gravel",
    "tons of gravel calculator",
    "pea gravel calculator",
    "crushed stone calculator",
    "driveway gravel calculator",
    "gravel cost estimator",
    "river rock calculator",
    "decomposed granite calculator",
  ],
  openGraph: {
    title: "Gravel Calculator — Free Cubic Yards & Tons Estimator",
    description:
      "Free gravel calculator for driveways, pathways, and landscaping. Cubic yards, tons, and cost for pea gravel, crushed stone, river rock, and more.",
    type: "website",
    url: "https://freeconstructiontools.com/gravel-calculator",
    siteName: "Free Construction Tools",
    images: [
      {
        url: getOGImageUrl("default"),
        width: 1200,
        height: 630,
        alt: "Gravel Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gravel Calculator — Free Cubic Yards & Tons Estimator",
    description:
      "Free gravel calculator for driveways, pathways, and landscaping. Cubic yards, tons, and cost.",
    images: [getOGImageUrl("default")],
  },
  alternates: { canonical: "https://freeconstructiontools.com/gravel-calculator" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
