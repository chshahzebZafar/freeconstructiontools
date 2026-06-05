"use client";

import { useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowLeft, Hammer, ChevronDown } from "lucide-react";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";

type Unit = "feet" | "meters";
type Shape = "slab" | "footing" | "column";

function fmt(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

interface ConcreteResult {
  volumeCubicYards: number;
  volumeCubicMeters: number;
  bagsAt60lb: number;
  bagsAt80lb: number;
  costLow: number;   // self-mix
  costHigh: number;  // ready-mix delivered
}

function calcConcrete(
  unit: Unit,
  shape: Shape,
  length: number,
  width: number,
  depthOrHeight: number,
  diameter: number,
  wasteFactor: number
): ConcreteResult {
  // Convert all dimensions to feet first
  const toFt = (v: number) => (unit === "feet" ? v : v * 3.28084);
  let volumeCubicFt = 0;

  if (shape === "slab" || shape === "footing") {
    const L = toFt(length);
    const W = toFt(width);
    // Depth is given in inches for slabs, feet for footings — to keep UX simple, treat as the same input unit
    const D = toFt(depthOrHeight);
    volumeCubicFt = L * W * D;
  } else if (shape === "column") {
    // Column: circular based on diameter (in unit), height in unit
    const d = toFt(diameter);
    const h = toFt(depthOrHeight);
    const radius = d / 2;
    volumeCubicFt = Math.PI * radius * radius * h;
  }

  volumeCubicFt *= 1 + wasteFactor / 100;

  const volumeCubicYards = volumeCubicFt / 27;
  const volumeCubicMeters = volumeCubicFt * 0.0283168;
  // 60 lb bag yields ~0.45 cu ft; 80 lb bag yields ~0.6 cu ft
  const bagsAt60lb = Math.ceil(volumeCubicFt / 0.45);
  const bagsAt80lb = Math.ceil(volumeCubicFt / 0.6);
  // Cost estimates (2026 US rough): bag mix ~$6 per 80lb bag; ready-mix ~$140-180/yard
  const costLow = bagsAt80lb * 6;
  const costHigh = volumeCubicYards * 170;

  return {
    volumeCubicYards,
    volumeCubicMeters,
    bagsAt60lb,
    bagsAt80lb,
    costLow,
    costHigh,
  };
}

const faqs = [
  {
    question: "Do I need a waste factor?",
    answer:
      "Yes — even careful pours have spillage, over-excavation, and form irregularities. 10% is a safe default for slabs; 15-20% for complex shapes or rough ground.",
  },
  {
    question: "60 lb bag or 80 lb bag — which should I use?",
    answer:
      "80 lb bags are more efficient cost-per-pound and faster to mix in bulk. 60 lb bags are easier to lift one-handed and good for small repairs. For anything over ~½ cubic yard, consider ready-mix delivery instead.",
  },
  {
    question: "When is ready-mix delivery cheaper than bags?",
    answer:
      "Usually above 1 cubic yard. Ready-mix runs ~$140-180 per cubic yard delivered (varies by region and minimum-load fees). A cubic yard is 60 bags of 80 lb mix at ~$6 each = $360+ just for material, so delivery wins quickly.",
  },
  {
    question: "What depth should my slab be?",
    answer:
      "4 inches for sidewalks, patios, and light foot traffic. 5-6 inches for driveways and garages. 8 inches for heavy vehicle traffic or footings. Always check local code.",
  },
  {
    question: "Does this account for rebar / mesh?",
    answer:
      "No — this only calculates concrete volume. Rebar and welded wire mesh add cost but don't change concrete volume. Plan separately.",
  },
];

export default function ConcreteCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("feet");
  const [shape, setShape] = useState<Shape>("slab");
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [depth, setDepth] = useState(0.33);  // 4 inches in feet
  const [diameter, setDiameter] = useState(1);
  const [waste, setWaste] = useState(10);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Deferred values for non-blocking calculations (better INP)
  const deferredLength = useDeferredValue(length);
  const deferredWidth = useDeferredValue(width);
  const deferredDepth = useDeferredValue(depth);
  const deferredDiameter = useDeferredValue(diameter);
  const deferredWaste = useDeferredValue(waste);

  const result = useMemo(
    () =>
      calcConcrete(
        unit,
        shape,
        deferredLength || 0,
        deferredWidth || 0,
        deferredDepth || 0,
        deferredDiameter || 0,
        deferredWaste || 0
      ),
    [unit, shape, deferredLength, deferredWidth, deferredDepth, deferredDiameter, deferredWaste]
  );

  // Check if calculation is pending (for visual feedback)
  const isCalculating =
    length !== deferredLength ||
    width !== deferredWidth ||
    depth !== deferredDepth ||
    diameter !== deferredDiameter ||
    waste !== deferredWaste;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Concrete Calculator",
    description:
      "Free concrete calculator for slabs, footings, and columns. Cubic yards, bags, and cost.",
    url: "https://freeconstructiontools.com/concrete-calculator",
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

  const unitLabel = unit === "feet" ? "ft" : "m";

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
              <Hammer className="w-3 h-3" />
              Construction
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-4 max-w-3xl">
              Concrete Calculator
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Calculate how much concrete you need for slabs, footings, or columns. Get
              cubic yards, bag counts, and a rough cost range — bags vs. ready-mix.
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
                    Shape
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["slab", "footing", "column"] as Shape[]).map((s) => (
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
                  {shape !== "column" && (
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label={`Length (${unitLabel})`} value={length} onChange={setLength} min={0.1} step={0.5} />
                      <NumberField label={`Width (${unitLabel})`} value={width} onChange={setWidth} min={0.1} step={0.5} />
                    </div>
                  )}
                  {shape === "column" && (
                    <NumberField
                      label={`Diameter (${unitLabel})`}
                      value={diameter}
                      onChange={setDiameter}
                      min={0.1}
                      step={0.1}
                    />
                  )}
                  <NumberField
                    label={shape === "column" ? `Height (${unitLabel})` : `Depth (${unitLabel})`}
                    value={depth}
                    onChange={setDepth}
                    min={0.01}
                    step={shape === "slab" ? 0.01 : 0.1}
                  />
                  <NumberField label="Waste factor (%)" value={waste} onChange={setWaste} min={0} max={50} step={1} />
                </div>
              </div>

              {/* Result */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 lg:sticky lg:top-24">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-semibold mb-3">
                    You&apos;ll need
                  </div>
                  <div className="text-4xl sm:text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums mb-1">
                    {fmt(result.volumeCubicYards)}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                    cubic yards
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    ({fmt(result.volumeCubicMeters)} m³)
                  </div>
                  <dl className="space-y-3 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-5">
                    <Row label="60 lb bags" value={`${result.bagsAt60lb.toLocaleString()}`} />
                    <Row label="80 lb bags" value={`${result.bagsAt80lb.toLocaleString()}`} />
                  </dl>
                  <dl className="space-y-3 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-5">
                    <Row label="Est. cost (bags)" value={`$${fmt(result.costLow, 0)}`} />
                    <Row label="Est. cost (ready-mix)" value={`$${fmt(result.costHigh, 0)}`} />
                  </dl>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-4 leading-relaxed">
                    Cost is rough estimate based on 2026 US averages. Get a local quote
                    before ordering.
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
              The concrete formula
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
              <p>
                Volume is just length × width × depth (for slabs and footings) or π × r² ×
                height (for columns). The trick is converting to the unit your supplier
                uses: cubic yards in the US, cubic meters in metric markets.
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 font-mono text-xs sm:text-sm space-y-1">
                <div>cubic ft = L × W × D (or π × r² × H for columns)</div>
                <div>cubic yards = cubic ft ÷ 27</div>
                <div>cubic meters = cubic ft × 0.0283168</div>
              </div>
              <p>
                Bag yields are standard: an 80 lb bag of pre-mix yields about 0.6 cubic
                feet, a 60 lb bag about 0.45 cubic feet.
              </p>
              <p>
                Always add a waste factor (10% default). Real pours have spillage,
                over-excavation, and last-minute fixes. Better to have 5% extra than to
                run out mid-pour.
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
                      <span className="font-medium text-zinc-950 dark:text-white">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                    </button>
                    {/* Grid animation for CLS-free expand/collapse */}
                    <div
                      className="grid transition-all duration-200 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 sm:px-6 pb-5">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <RelatedCategoryTools category="construction" currentSlug="concrete-calculator" />

        {/* CTA */}
        <section className="bg-zinc-950 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
              More construction tools coming.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Lumber estimator, roof pitch, stair calculator, drywall, and paint coverage are next.
            </p>
            <ButtonLink href="/" variant="primary" size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200">
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
