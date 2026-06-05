import type { Metadata } from "next";
import { getOGImageUrl } from "@/lib/og-image-generator";

export const metadata: Metadata = {
  title: "Drywall Estimator — Sheets, Screws, Mud & Tape Calculator",
  description:
    "Free drywall estimator. Calculate drywall sheets, screws, joint compound, tape, and total cost for any room. Supports multiple rooms, door/window.",
  keywords: [
    "drywall estimator",
    "drywall calculator",
    "how many drywall sheets",
    "sheetrock calculator",
    "drywall mud calculator",
    "drywall tape calculator",
    "drywall screw calculator",
    "drywall cost estimator",
    "room drywall calculator",
  ],
  openGraph: {
    title: "Drywall Estimator — Sheets, Screws, Mud & Tape Calculator",
    description:
      "Free drywall estimator. Sheets, screws, joint compound, tape, and cost for any room with deductions and waste factor.",
    type: "website",
    url: "https://freeconstructiontools.com/drywall-estimator",
    siteName: "Free Construction Tools",
    images: [{ url: getOGImageUrl("default"), width: 1200, height: 630, alt: "Drywall Estimator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Drywall Estimator — Sheets, Screws, Mud & Tape Calculator",
    description:
      "Free drywall estimator. Sheets, screws, joint compound, tape, and cost for any room with deductions and waste factor.",
    images: [getOGImageUrl("default")],
  },
  alternates: { canonical: "https://freeconstructiontools.com/drywall-estimator" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
