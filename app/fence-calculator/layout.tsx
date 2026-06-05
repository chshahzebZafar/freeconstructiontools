import { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Fence Calculator 2026 | Estimate Posts, Panels & Fence Material Cost",
  description:
    "Free fence calculator. Estimate fence posts, panels, rails, concrete, and total material cost for any fence length and style. Supports wood, vinyl.",
  keywords: [
    "fence calculator",
    "fence post calculator",
    "how many fence posts do i need",
    "fence material calculator",
    "fence cost estimator",
    "fence panel calculator",
    "privacy fence calculator",
    "chain link fence calculator",
    "wood fence calculator",
    "vinyl fence calculator",
    "fence rail calculator",
    "fence concrete calculator",
    "fence post spacing",
    "how much does a fence cost",
    "fence estimator",
    "backyard fence calculator",
    "6 foot fence calculator",
  ],
  alternates: {
    canonical: "https://freeconstructiontools.com/fence-calculator",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Fence Calculator | Estimate Posts, Panels & Fence Material Cost",
    description: "Free fence calculator. Calculate posts, rails, panels, concrete, and total material cost for wood, vinyl, and chain-link fences. Includes gate options and.",
    url: "https://freeconstructiontools.com/fence-calculator",
    type: "website",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Fence Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fence Calculator | Estimate Posts, Panels & Fence Material Cost",
    description: "Free fence calculator. Calculate posts, rails, panels, concrete, and total cost for any fence project.",
    images: [getOGImageUrl("default")],
  },
};

export default function FenceCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
