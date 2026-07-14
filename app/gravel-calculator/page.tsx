"use client";

import { useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowLeft, Mountain, ChevronDown } from "lucide-react";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";

type Unit = "feet" | "meters";
type Shape = "rectangle" | "circle" | "pathway";
type Material =
  | "pea-gravel"
  | "crushed-stone"
  | "river-rock"
  | "decomposed-granite"
  | "lava-rock"
  | "road-base";

// Tons per cubic yard (US standard bulk densities)
const DENSITY: Record<Material, number> = {
  "pea-gravel": 1.4,
  "crushed-stone": 1.5,
  "river-rock": 1.35,
  "decomposed-granite": 1.45,
  "lava-rock": 0.7,
  "road-base": 1.55,
};

const MATERIAL_LABELS: Record<Material, string> = {
  "pea-gravel": "Pea Gravel",
  "crushed-stone": "Crushed Stone (#57)",
  "river-rock": "River Rock",
  "decomposed-granite": "Decomposed Granite",
  "lava-rock": "Lava Rock",
  "road-base": "Road Base / Compactable",
};

// Rough 2026 US bulk delivery prices per ton
const DEFAULT_PRICE_PER_TON: Record<Material, number> = {
  "pea-gravel": 45,
  "crushed-stone": 38,
  "river-rock": 65,
  "decomposed-granite": 42,
  "lava-rock": 80,
  "road-base": 30,
};

function fmt(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

interface GravelResult {
  cubicFt: number;
  cubicYards: number;
  cubicMeters: number;
  tons: number;
  cost: number;
}

function calcGravel(
  unit: Unit,
  shape: Shape,
  length: number,
  width: number,
  radius: number,
  depth: number,
  depthInInches: boolean,
  material: Material,
  waste: number,
  pricePerTon: number
): GravelResult {
  const toFt = (v: number) => (unit === "feet" ? v : v * 3.28084);

  // Depth always stored in inches (imperial) or cm (metric)
  const depthFt = depthInInches ? depth / 12 : (depth / 100) * 3.28084;

  let areaSqFt = 0;
  if (shape === "rectangle" || shape === "pathway") {
    areaSqFt = toFt(length) * toFt(width);
  } else if (shape === "circle") {
    const r = toFt(radius);
    areaSqFt = Math.PI * r * r;
  }

  const rawCubicFt = areaSqFt * depthFt;
  const cubicFt = rawCubicFt * (1 + waste / 100);
  const cubicYards = cubicFt / 27;
  const cubicMeters = cubicFt * 0.0283168;
  const tons = cubicYards * DENSITY[material];
  const cost = tons * pricePerTon;

  return { cubicFt, cubicYards, cubicMeters, tons, cost };
}

const faqs = [
  {
    question: "How do I convert cubic yards of gravel to tons?",
    answer:
      "Multiply cubic yards by the material's bulk density. For crushed stone (#57) that's 1.5 tons/yard; pea gravel is about 1.4 tons/yard; river rock is 1.35 tons/yard. Lava rock is much lighter at ~0.7 tons/yard. This calculator applies the right factor automatically when you pick a material.",
  },
  {
    question: "How deep should a gravel driveway be?",
    answer:
      "A standard residential driveway needs 4–6 inches of compactable road base plus a 2–3 inch top layer of finished gravel — 6–9 inches total. For heavy vehicles or poor drainage, go deeper. Use this calculator twice: once for the base layer, once for the top layer.",
  },
  {
    question: "How much gravel do I need for a 10×10 area at 3 inches deep?",
    answer:
      "10 × 10 × (3/12) = 25 cubic feet = 0.93 cubic yards ≈ 1.3 tons of pea gravel. That's the bare minimum — order at least 5–10% extra for waste and settling.",
  },
  {
    question: "What's the difference between cubic yards and tons when ordering?",
    answer:
      "Suppliers sell gravel both ways. Landscaping yards often quote by the cubic yard (volume). Quarries quote by the ton (weight). Always confirm which unit your supplier uses — the price per ton and price per yard look similar but are very different amounts of material.",
  },
  {
    question: "Why add a waste factor for gravel?",
    answer:
      "Gravel shifts, settles by 10–20% after compaction, and you'll lose some on edges and low spots. A 10% waste factor is sensible for most projects; use 15–20% for irregular shapes, sloped ground, or pathway edging.",
  },
  {
    question: "How many bags of gravel is 1 cubic yard?",
    answer:
      "A typical 50 lb bag covers about 0.5 cubic feet. One cubic yard is 27 cubic feet, so you'd need about 54 bags — and they'd cost far more than bulk delivery. Bags are only practical for small patches under ¼ cubic yard.",
  },
];

export default function GravelCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("feet");
  const [shape, setShape] = useState<Shape>("rectangle");
  const [material, setMaterial] = useState<Material>("pea-gravel");

  // Rectangle / pathway dims
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  // Circle dim
  const [radius, setRadius] = useState(5);
  // Depth (inches for imperial, cm for metric)
  const [depth, setDepth] = useState(3);
  const [waste, setWaste] = useState(10);
  const [pricePerTon, setPricePerTon] = useState(DEFAULT_PRICE_PER_TON["pea-gravel"]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const depthInInches = unit === "feet";

  // Sync default price when material changes
  function handleMaterialChange(m: Material) {
    setMaterial(m);
    setPricePerTon(DEFAULT_PRICE_PER_TON[m]);
  }

  const dLength = useDeferredValue(length);
  const dWidth = useDeferredValue(width);
  const dRadius = useDeferredValue(radius);
  const dDepth = useDeferredValue(depth);
  const dWaste = useDeferredValue(waste);
  const dPrice = useDeferredValue(pricePerTon);

  const result = useMemo(
    () =>
      calcGravel(
        unit,
        shape,
        dLength || 0,
        dWidth || 0,
        dRadius || 0,
        dDepth || 0,
        depthInInches,
        material,
        dWaste || 0,
        dPrice || 0
      ),
    [unit, shape, dLength, dWidth, dRadius, dDepth, depthInInches, material, dWaste, dPrice]
  );

  const depthLabel = unit === "feet" ? "Depth (inches)" : "Depth (cm)";
  const dimLabel = unit === "feet" ? "ft" : "m";

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Gravel Calculator",
    description:
      "Free gravel calculator. Cubic yards, tons, and cost for pea gravel, crushed stone, river rock, and more.",
    url: "https://freeconstructiontools.com/gravel-calculator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: { "@type": "Answer", text: qa.answer },
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />

      <main className="flex-1">
        <Breadcrumbs />

        {/* Hero */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all calculators
            </Link>
            <Badge variant="neutral" className="mb-4">
              <Mountain className="w-3 h-3" />
              Construction
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-4 max-w-3xl">
              Gravel Calculator
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Calculate how much gravel you need for driveways, pathways, and landscaping.
              Get cubic yards, tons, and a cost estimate — for pea gravel, crushed stone,
              river rock, and more.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Inputs */}
              <div className="lg:col-span-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8">

                {/* Shape selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    Area shape
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["rectangle", "circle", "pathway"] as Shape[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setShape(s)}
                        className={`h-10 text-sm font-medium rounded-md border transition-colors capitalize ${
                          shape === s
                            ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white"
                            : "bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit toggle */}
                <div className="flex items-center gap-1 mb-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-1 w-fit">
                  {(["feet", "meters"] as Unit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`px-3 h-8 text-xs font-medium rounded transition-colors capitalize ${
                        unit === u
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                {/* Dimensions */}
                <div className="space-y-5">
                  {(shape === "rectangle" || shape === "pathway") && (
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField
                        label={`Length (${dimLabel})`}
                        value={length}
                        onChange={setLength}
                        min={0.1}
                        step={0.5}
                      />
                      <NumberField
                        label={`Width (${dimLabel})`}
                        value={width}
                        onChange={setWidth}
                        min={0.1}
                        step={0.5}
                      />
                    </div>
                  )}
                  {shape === "circle" && (
                    <NumberField
                      label={`Radius (${dimLabel})`}
                      value={radius}
                      onChange={setRadius}
                      min={0.1}
                      step={0.5}
                    />
                  )}

                  <NumberField
                    label={depthLabel}
                    value={depth}
                    onChange={setDepth}
                    min={0.25}
                    step={0.25}
                  />

                  {/* Material */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Material type
                    </label>
                    <select
                      value={material}
                      onChange={(e) => handleMaterialChange(e.target.value as Material)}
                      className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    >
                      {(Object.keys(MATERIAL_LABELS) as Material[]).map((m) => (
                        <option key={m} value={m}>
                          {MATERIAL_LABELS[m]} — {DENSITY[m]} tons/yd³
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <NumberField
                      label="Waste factor (%)"
                      value={waste}
                      onChange={setWaste}
                      min={0}
                      max={50}
                      step={1}
                    />
                    <NumberField
                      label="Price per ton ($)"
                      value={pricePerTon}
                      onChange={setPricePerTon}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 lg:sticky lg:top-24">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-semibold mb-3">
                    You&apos;ll need
                  </div>
                  <div className="text-4xl sm:text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums mb-1">
                    {fmt(result.cubicYards)}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    cubic yards
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    ({fmt(result.cubicFt)} cu ft &nbsp;·&nbsp; {fmt(result.cubicMeters)} m³)
                  </div>

                  <dl className="space-y-3 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-5">
                    <Row label="Tons" value={fmt(result.tons)} />
                    <Row label="Cubic feet" value={fmt(result.cubicFt)} />
                    <Row label="Cubic meters" value={fmt(result.cubicMeters)} />
                  </dl>

                  <dl className="space-y-3 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-5">
                    <Row label="Est. material cost" value={`$${fmt(result.cost, 0)}`} />
                    <Row label="Material density" value={`${DENSITY[material]} tons/yd³`} />
                  </dl>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-4 leading-relaxed">
                    Cost is a rough estimate based on 2026 US bulk delivery averages. Get a
                    local quote before ordering — prices vary significantly by region.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Badge variant="neutral" className="mb-4">How it works</Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-6">
              The gravel formula
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
              <p>
                Volume is area multiplied by depth. The key is converting that volume into
                the unit your supplier uses — cubic yards (US) or tons by weight.
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 font-mono text-xs sm:text-sm space-y-1">
                <div>cubic ft = area (sq ft) × depth (ft)</div>
                <div>cubic yards = cubic ft ÷ 27</div>
                <div>tons = cubic yards × density (tons/yd³)</div>
                <div>cost = tons × price per ton</div>
              </div>
              <p>
                Each material has a different bulk density — crushed stone is heavier than
                lava rock by more than 2×. This calculator uses industry-standard densities
                so your tonnage is accurate for the material you&apos;re actually buying.
              </p>
              <p>
                Always add a waste factor. Gravel settles 10–20% after compaction and you
                lose material at edges. 10% is a safe default for flat areas; go 15% for
                slopes or irregular shapes.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Badge variant="neutral" className="mb-4">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-8">
              Frequently asked questions
            </h2>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="bg-white dark:bg-zinc-950">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      aria-expanded={open}
                    >
                      <span className="font-medium text-zinc-950 dark:text-white">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-200 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 sm:px-6 pb-5">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <RelatedCategoryTools category="construction" currentSlug="gravel-calculator" />

        {/* CTA */}
        <section className="bg-zinc-950 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
              More construction tools, all free.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Concrete, lumber, roofing, drywall, tile, paint, fencing — all the calculators
              you need, no signup required.
            </p>
            <ButtonLink
              href="/"
              variant="primary"
              size="lg"
              className="bg-white text-zinc-950 hover:bg-zinc-200"
            >
              Browse all calculators
            </ButtonLink>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="tabular-nums text-zinc-950 dark:text-white font-medium">{value}</dd>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-base bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 tabular-nums"
      />
    </div>
  );
}
