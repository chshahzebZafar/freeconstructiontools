import { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Mulch Calculator 2026 | How Many Cubic Yards of Mulch Do I Need?",
  description:
    "Free mulch calculator. Calculate cubic yards or cubic feet of mulch needed for any garden bed, landscape area, or yard. Supports multiple beds, depth.",
  keywords: [
    "mulch calculator",
    "how much mulch do i need",
    "cubic yards of mulch calculator",
    "mulch coverage calculator",
    "mulch cost estimator",
    "how many bags of mulch",
    "landscape mulch calculator",
    "garden mulch calculator",
    "cubic feet of mulch",
    "mulch depth calculator",
    "bulk mulch calculator",
    "mulch per square foot",
    "bagged mulch calculator",
    "how many yards of mulch",
    "mulch estimator",
    "2 inch mulch calculator",
    "3 inch mulch calculator",
  ],
  alternates: {
    canonical: "https://freeconstructiontools.com/mulch-calculator",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Mulch Calculator | How Many Cubic Yards of Mulch Do I Need?",
    description: "Free mulch calculator. Enter your bed dimensions and desired depth to get cubic yards, cubic feet, and bag count for any mulching project. Includes cost.",
    url: "https://freeconstructiontools.com/mulch-calculator",
    type: "website",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Mulch Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mulch Calculator | How Many Cubic Yards of Mulch Do I Need?",
    description: "Free mulch calculator. Calculate cubic yards and bags needed for any garden bed at any depth.",
    images: [getOGImageUrl("default")],
  },
};

export default function MulchCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
