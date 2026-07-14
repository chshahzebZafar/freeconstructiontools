/**
 * The construction calculators offered on freeconstructiontools.com.
 *
 * Adding a new tool:
 *   1. Append an entry here (path must be "/{slug}" — flat at the domain root).
 *   2. Create the page at `app/{slug}/page.tsx`.
 *   3. It is automatically picked up by the homepage, sitemap, and related-tools.
 */

import type { LucideIcon } from "lucide-react";
import {
  Hammer,
  Ruler,
  Home,
  Layers,
  Footprints,
  PaintBucket,
  Grid3X3,
  Fence,
  Calculator,
  Mountain,
} from "lucide-react";

export interface CategoryTool {
  slug: string;
  /** Always "construction" on this site */
  category: string;
  name: string;
  /** Short tagline shown on cards */
  tagline: string;
  /** Longer description for SEO */
  description: string;
  /** Full path — must match the file path, flat at the root */
  path: string;
  icon: LucideIcon;
  isNew?: boolean;
}

export const categoryTools: CategoryTool[] = [
  {
    slug: "concrete-calculator",
    category: "construction",
    name: "Concrete Calculator",
    tagline: "Cubic yards, bags, and cost for slabs, footings, and columns.",
    description:
      "Free concrete calculator for slabs, footings, and columns. Outputs cubic yards, 60/80 lb bag counts, and cost estimate.",
    path: "/concrete-calculator",
    icon: Hammer,
    isNew: true,
  },
  {
    slug: "lumber-calculator",
    category: "construction",
    name: "Lumber Calculator",
    tagline: "Board feet, framing studs, and sheet goods with waste & cost.",
    description:
      "Free lumber calculator for framing studs, boards & trim, and plywood/OSB sheet goods. Board feet, m³, waste allowance, and cost estimate. Imperial and metric.",
    path: "/lumber-calculator",
    icon: Ruler,
    isNew: true,
  },
  {
    slug: "roof-pitch-calculator",
    category: "construction",
    name: "Roof Pitch Calculator",
    tagline: "Convert pitch ratios, calculate rafter length, slope angle, and rise.",
    description:
      "Free roof pitch calculator. Convert rise/run to pitch ratio, degrees, and percent slope. Calculate rafter length with overhang. Imperial and metric.",
    path: "/roof-pitch-calculator",
    icon: Home,
    isNew: true,
  },
  {
    slug: "drywall-estimator",
    category: "construction",
    name: "Drywall Estimator",
    tagline: "Sheets, screws, mud, and tape for any room with deductions and waste.",
    description:
      "Free drywall estimator. Calculate sheets, screws, joint compound, and tape for any room. Multiple rooms, door/window deductions, waste factor, cost estimate, and PDF export. Imperial and metric.",
    path: "/drywall-estimator",
    icon: Layers,
    isNew: true,
  },
  {
    slug: "stair-calculator",
    category: "construction",
    name: "Stair Calculator",
    tagline: "Riser count, tread depth, stringer length, and IRC code check.",
    description:
      "Free stair calculator. Enter total rise and run to get riser count, riser height, tread depth, stringer length, headroom clearance, and lumber cost. IRC code-compliant. Imperial and metric.",
    path: "/stair-calculator",
    icon: Footprints,
    isNew: true,
  },
  {
    slug: "paint-calculator",
    category: "construction",
    name: "Paint Calculator",
    tagline: "Estimate gallons, primer, and cost for walls and ceilings.",
    description:
      "Free paint calculator. Calculate gallons needed for walls and ceilings. Accounts for doors, windows, multiple coats, waste factor, primer, and cost. Multiple rooms, PDF export. Imperial and metric.",
    path: "/paint-calculator",
    icon: PaintBucket,
    isNew: true,
  },
  {
    slug: "flooring-calculator",
    category: "construction",
    name: "Flooring Calculator",
    tagline: "Estimate hardwood, laminate, vinyl, carpet, and tile materials and cost.",
    description:
      "Free flooring calculator. Calculate square footage, planks/tiles needed, boxes to purchase, and material cost for hardwood, laminate, vinyl, carpet, and tile. L-shape rooms, custom specs, PDF export. Imperial and metric.",
    path: "/flooring-calculator",
    icon: Grid3X3,
    isNew: true,
  },
  {
    slug: "tile-calculator",
    category: "construction",
    name: "Tile Calculator",
    tagline: "Tiles needed for floors, walls, and backsplashes with grout and waste.",
    description:
      "Free tile calculator. Calculate tiles needed for floors, walls, and backsplashes. Accounts for grout spacing, pattern layout (straight, diagonal, herringbone), waste factor, and material cost. Multiple rooms, PDF export. Ceramic, porcelain, subway, mosaic, and large format tiles.",
    path: "/tile-calculator",
    icon: Grid3X3,
    isNew: true,
  },
  {
    slug: "square-footage-calculator",
    category: "construction",
    name: "Square Footage Calculator",
    tagline: "Calculate area for rooms, yards, and irregular shapes in sq ft or meters.",
    description:
      "Free square footage calculator. Calculate area for rooms, houses, yards, and irregular shapes. Supports rectangles, L-shapes, triangles, and circles. Converts between feet, inches, meters, and yards. Cost estimation and PDF export. Perfect for flooring, paint, and real estate.",
    path: "/square-footage-calculator",
    icon: Calculator,
    isNew: true,
  },
  {
    slug: "roofing-calculator",
    category: "construction",
    name: "Roofing Calculator",
    tagline: "Roofing squares, shingles, underlayment, and material cost for any roof shape.",
    description:
      "Free roofing calculator. Estimate roofing squares, shingle bundles, underlayment, ice & water shield, drip edge, ridge vent, and total material cost. Supports gable, hip, gambrel, and flat roofs. Multiple sections, waste factor, slope calculations, and PDF export.",
    path: "/roofing-calculator",
    icon: Home,
    isNew: true,
  },
  {
    slug: "fence-calculator",
    category: "construction",
    name: "Fence Calculator",
    tagline: "Posts, rails, panels, and concrete for any fence length and style.",
    description:
      "Free fence calculator. Estimate fence posts, rails, panels, concrete bags, and total material cost for wood, vinyl, chain-link, split-rail, and aluminum fences. Supports multiple sections, gate openings, post spacing, waste factor, and PDF export.",
    path: "/fence-calculator",
    icon: Fence,
    isNew: true,
  },
  {
    slug: "mulch-calculator",
    category: "construction",
    name: "Mulch Calculator",
    tagline: "Cubic yards and bags of mulch for any garden bed or landscape area.",
    description:
      "Free mulch calculator. Calculate cubic yards and bags of mulch needed for any garden bed or landscape area. Supports rectangular, circular, and triangular beds, multiple areas, depth settings, bulk vs. bagged cost comparison, and PDF export.",
    path: "/mulch-calculator",
    icon: Layers,
    isNew: true,
  },
  {
    slug: "gravel-calculator",
    category: "construction",
    name: "Gravel Calculator",
    tagline: "Cubic yards, tons, and cost for driveways, paths, and landscaping.",
    description:
      "Free gravel calculator. Calculate cubic yards, cubic feet, and tons of gravel for driveways, pathways, and landscaping. Supports pea gravel, crushed stone, river rock, decomposed granite, lava rock, and road base. Rectangle, circle, and pathway shapes with waste factor and cost estimate.",
    path: "/gravel-calculator",
    icon: Mountain,
    isNew: true,
  },
];

export function getCategoryToolsBy(category: string): CategoryTool[] {
  return categoryTools.filter((t) => t.category === category);
}

export function getCategoryToolBySlug(slug: string): CategoryTool | undefined {
  return categoryTools.find((t) => t.slug === slug);
}
