"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Hammer, ChevronDown, Download } from "lucide-react";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";

type Unit = "imperial" | "metric";
type InputMode = "rise-run" | "angle" | "pitch-ratio";
type RoofType = "gable" | "hip";

function fmt(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function toDeg(r: number) { return r * (180 / Math.PI); }
function toRad(d: number) { return d * (Math.PI / 180); }

/* ── core pitch result ── */
interface RoofResult {
  pitchRatio: string;
  angleDeg: number;
  slopePercent: number;
  rafterLength: number;
  rafterWithOverhang: number;
  roofMultiplier: number;
  rise: number;
  run: number;
}

function calcRoof(
  unit: Unit, mode: InputMode,
  rise: number, run: number,
  angleDeg: number, pitchNum: number,
  spanHalf: number, overhang: number
): RoofResult {
  let r = 0, ru = 0;
  if (mode === "rise-run") { r = rise; ru = run; }
  else if (mode === "angle") { ru = spanHalf; r = ru * Math.tan(toRad(angleDeg)); }
  else { const base = unit === "imperial" ? 12 : 10; ru = spanHalf; r = (pitchNum / base) * ru; }

  const pitch = ru > 0 ? r / ru : 0;
  const base = unit === "imperial" ? 12 : 10;
  const pitchRatio = `${fmt(pitch * base, 1)}:${base}`;
  const ang = toDeg(Math.atan(pitch));
  const rafter = Math.sqrt(r * r + ru * ru);
  return {
    pitchRatio, angleDeg: ang, slopePercent: pitch * 100,
    rafterLength: rafter, rafterWithOverhang: rafter + overhang,
    roofMultiplier: ru > 0 ? rafter / ru : 1,
    rise: r, run: ru,
  };
}

/* ── rafter schedule ── */
interface RafterSchedule {
  rafterCount: number;
  totalLinearFt: number;
  ridgeLength: number;
  fasciaLength: number;
  lumberCost: number;
  hipRafterLength: number;
  valleyRafterLength: number;
}

function calcRafterSchedule(
  result: RoofResult, buildingLength: number,
  rafterSpacing: number, pricePerFt: number,
  roofType: RoofType, unit: Unit
): RafterSchedule {
  const spacingFt = unit === "imperial" ? rafterSpacing / 12 : rafterSpacing / 1000;
  const rafterCount = Math.ceil(buildingLength / spacingFt) * 2 + 2; // both sides + ends
  const totalLinearFt = rafterCount * result.rafterWithOverhang;
  const ridgeLength = buildingLength;
  const fasciaLength = (buildingLength + result.run * 2) * 2;
  const lumberCost = totalLinearFt * pricePerFt;

  // Hip rafter: diagonal from corner, run = √(run² + (buildingLength/2)²)
  const hipRun = Math.sqrt(result.run * result.run + (buildingLength / 2) * (buildingLength / 2));
  const hipRafterLength = roofType === "hip" ? Math.sqrt(result.rise * result.rise + hipRun * hipRun) : 0;
  const valleyRafterLength = hipRafterLength; // valley same formula as hip

  return { rafterCount, totalLinearFt, ridgeLength, fasciaLength, lumberCost, hipRafterLength, valleyRafterLength };
}

/* ── birdsmouth cut ── */
interface BirdsmouthResult {
  seatCutDepth: number;
  plumbCutHeight: number;
  seatCutLength: number;
}

function calcBirdsmouth(
  result: RoofResult, rafterDepth: number, plateWidth: number
): BirdsmouthResult {
  const anglRad = toRad(result.angleDeg);
  const seatCutDepth = plateWidth * Math.sin(anglRad);
  const seatCutLength = plateWidth * Math.cos(anglRad);
  const plumbCutHeight = rafterDepth - seatCutDepth;
  return { seatCutDepth, plumbCutHeight, seatCutLength };
}

/* ── roofing materials ── */
interface MaterialsResult {
  roofArea: number;
  roofingSquares: number;
  shingleBundles: number;
  underlaymentRolls: number;
  iceShieldRolls: number;
  ridgeCaps: number;
  materialCost: number;
}

function calcMaterials(
  result: RoofResult, buildingLength: number,
  waste: number, pricePerSquare: number
): MaterialsResult {
  const flatArea = result.run * 2 * buildingLength;
  const roofArea = flatArea * result.roofMultiplier * (1 + waste / 100);
  const roofingSquares = roofArea / 100; // 1 square = 100 sq ft
  const shingleBundles = Math.ceil(roofingSquares * 3); // 3 bundles/square
  const underlaymentRolls = Math.ceil(roofArea / 400); // 1 roll covers ~400 sq ft
  const iceShieldRolls = Math.ceil((result.run * 2 * 3) / 75); // 3ft up from eave, ~75 sqft/roll
  const ridgeCaps = Math.ceil(buildingLength / 35); // ~35 lin ft per bundle
  const materialCost = roofingSquares * pricePerSquare;
  return { roofArea, roofingSquares, shingleBundles, underlaymentRolls, iceShieldRolls, ridgeCaps, materialCost };
}

const PITCH_TABLE = [
  { pitch: "2:12", deg: "9.5°",  pct: "16.7%", note: "Low slope — requires special membrane" },
  { pitch: "3:12", deg: "14.0°", pct: "25.0%", note: "Min. for asphalt shingles with ice barrier" },
  { pitch: "4:12", deg: "18.4°", pct: "33.3%", note: "Common — standard shingles, good drainage" },
  { pitch: "5:12", deg: "22.6°", pct: "41.7%", note: "Common — steeper drainage, architectural look" },
  { pitch: "6:12", deg: "26.6°", pct: "50.0%", note: "Classic residential pitch, walkable" },
  { pitch: "7:12", deg: "30.3°", pct: "58.3%", note: "Moderate — needs roof brackets" },
  { pitch: "8:12", deg: "33.7°", pct: "66.7%", note: "Steep — good attic space" },
  { pitch: "9:12", deg: "36.9°", pct: "75.0%", note: "Steep — safety harness required" },
  { pitch: "12:12", deg: "45.0°", pct: "100%", note: "Very steep — 45° angle" },
];

const faqs = [
  {
    q: "What is roof pitch?",
    a: "Roof pitch is the ratio of vertical rise to horizontal run, expressed as X:12 (imperial) or X:10 (metric). A 6:12 pitch means the roof rises 6 inches for every 12 inches of horizontal run. It determines drainage, snow load capacity, material suitability, and attic space.",
  },
  {
    q: "How do I measure roof pitch?",
    a: "Place a level horizontally on the roof with one end touching the surface. Measure 12 inches along the level from the contact point, then measure straight down to the roof — that measurement in inches is your pitch number (e.g. 6 inches = 6:12 pitch).",
  },
  {
    q: "What pitch is best for my climate?",
    a: "In heavy snow regions use 6:12 or steeper so snow slides off. In high-wind areas, lower pitches (3:12–4:12) offer less wind resistance. For heavy rain, 4:12 or steeper provides good drainage. Low-slope roofs (under 3:12) require special membranes.",
  },
  {
    q: "What is the minimum pitch for asphalt shingles?",
    a: "Most manufacturers require a minimum 2:12 pitch with double underlayment and ice barrier, and 3:12 for standard installation. Below 2:12 requires a fully adhered waterproof membrane.",
  },
  {
    q: "How does pitch affect rafter length?",
    a: "Rafter length is calculated using the Pythagorean theorem: √(rise² + run²). A steeper pitch means a longer rafter for the same building width — increasing material cost and labor. The roof area multiplier shows how much more roofing material you need versus a flat surface.",
  },
  {
    q: "What is the difference between pitch, slope, and angle?",
    a: "Pitch is the ratio (X:12). Slope is pitch as a percentage (rise ÷ run × 100). Angle is in degrees (arctan of rise/run). All describe the same inclination — this calculator converts between all three automatically.",
  },
];

function NumberField({ label, value, onChange, min = 0, max, step = 0.1, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
      <div className="relative">
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors" />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={`text-sm font-semibold tabular-nums ${accent ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-950 dark:text-white"}`}>{value}</dd>
    </div>
  );
}

export default function RoofPitchCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [inputMode, setInputMode] = useState<InputMode>("rise-run");
  const [roofType, setRoofType] = useState<RoofType>("gable");

  // Pitch inputs
  const [rise, setRise] = useState(6);
  const [run, setRun] = useState(12);
  const [angleInput, setAngleInput] = useState(26.6);
  const [pitchNum, setPitchNum] = useState(6);
  const [spanHalf, setSpanHalf] = useState(12);
  const [overhang, setOverhang] = useState(1);

  // Rafter schedule
  const [buildingLength, setBuildingLength] = useState(30);
  const [rafterSpacing, setRafterSpacing] = useState(16);
  const [pricePerFt, setPricePerFt] = useState(1.2);

  // Birdsmouth
  const [rafterDepth, setRafterDepth] = useState(7.25); // 2×8 actual
  const [plateWidth, setPlateWidth] = useState(3.5);    // 2×4 actual

  // Materials
  const [matWaste, setMatWaste] = useState(10);
  const [pricePerSquare, setPricePerSquare] = useState(120);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const lenUnit = unit === "imperial" ? "ft" : "m";
  const smallUnit = unit === "imperial" ? "in" : "cm";
  const pitchBase = unit === "imperial" ? "12" : "10";
  const spacingUnit = unit === "imperial" ? "in" : "mm";

  const result = useMemo(
    () => calcRoof(unit, inputMode, rise, run, angleInput, pitchNum, spanHalf, overhang),
    [unit, inputMode, rise, run, angleInput, pitchNum, spanHalf, overhang]
  );

  const schedule = useMemo(
    () => calcRafterSchedule(result, buildingLength, rafterSpacing, pricePerFt, roofType, unit),
    [result, buildingLength, rafterSpacing, pricePerFt, roofType, unit]
  );

  const birdsmouth = useMemo(
    () => calcBirdsmouth(result, rafterDepth, plateWidth),
    [result, rafterDepth, plateWidth]
  );

  const materials = useMemo(
    () => calcMaterials(result, buildingLength, matWaste, pricePerSquare),
    [result, buildingLength, matWaste, pricePerSquare]
  );

  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const section = (title: string) => {
      y += 4;
      doc.setFillColor(245, 245, 245); doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text(title.toUpperCase(), margin + 3, y + 5); y += 11;
    };
    const row = (label: string, value: string) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
      doc.text(value, 120, y); y += 7;
    };
    const divider = () => { doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 5; };

    doc.setFillColor(20, 20, 20); doc.rect(0, 0, pageW, 16, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
    doc.text("Roof Pitch Calculator Report", margin, 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(180, 180, 180);
    doc.text(`freeconstructiontools.com  |  ${ts}`, pageW - margin, 11, { align: "right" });
    y = 28;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
    doc.text(`Units: ${unit === "imperial" ? "Imperial" : "Metric"}   |   Roof type: ${roofType}`, margin, y);
    y += 10; divider();

    section("Pitch Results");
    row("Pitch ratio", result.pitchRatio);
    row("Angle", `${fmt(result.angleDeg, 2)}°`);
    row("Slope", `${fmt(result.slopePercent, 1)}%`);
    row("Common rafter", `${fmt(result.rafterLength, 2)} ${lenUnit}`);
    row("Rafter + overhang", `${fmt(result.rafterWithOverhang, 2)} ${lenUnit}`);
    row("Roof area multiplier", `×${fmt(result.roofMultiplier, 4)}`);
    y += 2; divider();

    section("Rafter Schedule");
    row("Building length", `${buildingLength} ${lenUnit}`);
    row("Rafter spacing", `${rafterSpacing} ${spacingUnit}`);
    row("Rafter count", String(schedule.rafterCount));
    row("Total linear footage", `${fmt(schedule.totalLinearFt, 1)} ${lenUnit}`);
    row("Ridge board length", `${fmt(schedule.ridgeLength, 2)} ${lenUnit}`);
    row("Fascia board length", `${fmt(schedule.fasciaLength, 2)} ${lenUnit}`);
    if (roofType === "hip") {
      row("Hip rafter length", `${fmt(schedule.hipRafterLength, 2)} ${lenUnit}`);
      row("Valley rafter length", `${fmt(schedule.valleyRafterLength, 2)} ${lenUnit}`);
    }
    row("Lumber cost est.", `$${fmt(schedule.lumberCost, 2)}`);
    y += 2; divider();

    section("Birdsmouth Cut");
    row("Seat cut depth", `${fmt(birdsmouth.seatCutDepth, 3)} ${smallUnit}`);
    row("Seat cut length", `${fmt(birdsmouth.seatCutLength, 3)} ${smallUnit}`);
    row("Plumb cut height", `${fmt(birdsmouth.plumbCutHeight, 3)} ${smallUnit}`);
    y += 2; divider();

    section("Roofing Materials");
    row("Roof area", `${fmt(materials.roofArea, 1)} sq ${lenUnit}`);
    row("Roofing squares", fmt(materials.roofingSquares, 2));
    row("Shingle bundles", String(materials.shingleBundles));
    row("Underlayment rolls", String(materials.underlaymentRolls));
    row("Ice & water shield rolls", String(materials.iceShieldRolls));
    row("Ridge cap bundles", String(materials.ridgeCaps));
    row("Material cost est.", `$${fmt(materials.materialCost, 2)}`);
    y += 6;

    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text(doc.splitTextToSize("Estimates for general planning only. Verify all measurements on-site before cutting. Consult a licensed contractor before construction.", pageW - margin * 2), margin, y);
    doc.save(`roof-pitch-calculator-${Date.now()}.pdf`);
  }

  const softwareSchema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "Roof Pitch Calculator",
    description: "Free roof pitch calculator. Convert rise/run to pitch ratio, angle in degrees, and percent slope. Calculate rafter length with overhang.",
    url: "https://freeconstructiontools.com/roof-pitch-calculator",
    applicationCategory: "BusinessApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const faqSchema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <main className="flex-1">
        <Breadcrumbs />

        {/* Hero */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to all calculators
            </Link>
            <Badge variant="neutral" className="mb-4"><Hammer className="w-3 h-3" /> Construction</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-4 max-w-3xl">
              Roof Pitch Calculator
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              This roof pitch calculator will help you quickly assess the pitch of your roof and calculate the rafter length you need for your construction works. Convert pitch ratios, degrees, and percent slope — imperial and metric.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

            {/* Switchers */}
            <div className="flex flex-wrap gap-3 mb-8">
              {/* Unit */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {(["imperial", "metric"] as Unit[]).map((u) => (
                  <button key={u} onClick={() => setUnit(u)}
                    className={`px-3 h-8 text-xs font-medium rounded capitalize transition-colors ${unit === u ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                    {u}
                  </button>
                ))}
              </div>
              {/* Input mode */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {([
                  { key: "rise-run", label: "Rise / Run" },
                  { key: "angle", label: "Angle (°)" },
                  { key: "pitch-ratio", label: `Pitch X:${pitchBase}` },
                ] as { key: InputMode; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => setInputMode(key)}
                    className={`px-3 h-8 text-xs font-medium rounded transition-colors ${inputMode === key ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Roof type */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {(["gable", "hip"] as RoofType[]).map((t) => (
                  <button key={t} onClick={() => setRoofType(t)}
                    className={`px-3 h-8 text-xs font-medium rounded capitalize transition-colors ${roofType === t ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                    {t} roof
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* ── Left: Inputs ── */}
              <div className="lg:col-span-3 space-y-5">

                {/* Pitch inputs */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pitch</p>

                  {inputMode === "rise-run" && (
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label={`Rise (${smallUnit})`} value={rise} onChange={setRise} min={0} step={0.5} />
                      <NumberField label={`Run (${smallUnit})`} value={run} onChange={setRun} min={0.1} step={0.5} />
                    </div>
                  )}
                  {inputMode === "angle" && (
                    <NumberField label="Angle (degrees)" value={angleInput} onChange={setAngleInput} min={0} max={89} step={0.1} suffix="°" />
                  )}
                  {inputMode === "pitch-ratio" && (
                    <NumberField label={`Pitch numerator (X in X:${pitchBase})`} value={pitchNum} onChange={setPitchNum} min={0} step={0.5} suffix={`:${pitchBase}`} />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Half-span / run (${lenUnit})`} value={spanHalf} onChange={setSpanHalf} min={0.1} step={0.5} />
                    <NumberField label={`Eave overhang (${lenUnit})`} value={overhang} onChange={setOverhang} min={0} step={0.1} />
                  </div>

                  {/* Pitch diagram */}
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex items-center justify-center overflow-hidden" style={{ height: 140 }}>
                    <svg viewBox="0 0 240 120" className="w-full max-w-xs" fill="none">
                      <line x1="20" y1="100" x2="220" y2="100" stroke="#a1a1aa" strokeWidth="1.5" />
                      <line x1="120" y1="100" x2="120" y2="20" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="4 3" />
                      <line x1="20" y1="100" x2="120" y2="20" stroke="#6366f1" strokeWidth="2" />
                      <text x="70" y="115" fontSize="10" fill="#71717a" textAnchor="middle">run</text>
                      <text x="134" y="65" fontSize="10" fill="#71717a">rise</text>
                      <path d="M 44,100 A 24,24 0 0,1 33,79" stroke="#6366f1" strokeWidth="1.5" fill="none" />
                      <text x="50" y="90" fontSize="9" fill="#6366f1">{fmt(result.angleDeg, 1)}°</text>
                      <text x="55" y="52" fontSize="10" fill="#6366f1" transform="rotate(-38,55,60)">rafter</text>
                    </svg>
                  </div>
                </div>

                {/* Rafter schedule inputs */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Rafter Schedule & Lumber Cost</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Building length (${lenUnit})`} value={buildingLength} onChange={setBuildingLength} min={1} step={1} />
                    <NumberField label={`Rafter spacing (${spacingUnit})`} value={rafterSpacing} onChange={setRafterSpacing} min={1} step={unit === "imperial" ? 1 : 50} />
                  </div>
                  <NumberField label="Price per linear ft/m ($)" value={pricePerFt} onChange={setPricePerFt} min={0} step={0.1} />
                </div>

                {/* Birdsmouth inputs */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Birdsmouth Cut</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter actual (not nominal) dimensions of your rafter lumber and wall plate.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Rafter depth (${smallUnit})`} value={rafterDepth} onChange={setRafterDepth} min={1} step={0.25} />
                    <NumberField label={`Plate width (${smallUnit})`} value={plateWidth} onChange={setPlateWidth} min={1} step={0.25} />
                  </div>
                </div>

                {/* Materials inputs */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Roofing Materials (Shingles)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label="Waste (%)" value={matWaste} onChange={setMatWaste} min={0} max={50} step={1} />
                    <NumberField label="Price per square ($)" value={pricePerSquare} onChange={setPricePerSquare} min={0} step={5} />
                  </div>
                </div>
              </div>

              {/* ── Right: Results ── */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 lg:sticky lg:top-24 space-y-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Results</div>

                  {/* Pitch */}
                  <div>
                    <div className="text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums">{result.pitchRatio}</div>
                    <div className="text-sm text-zinc-500 mt-1">pitch ratio</div>
                  </div>
                  <dl className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <Row label="Angle" value={`${fmt(result.angleDeg, 2)}°`} accent />
                    <Row label="Slope" value={`${fmt(result.slopePercent, 1)}%`} />
                    <Row label="Rafter length" value={`${fmt(result.rafterLength, 2)} ${lenUnit}`} />
                    <Row label="Rafter + overhang" value={`${fmt(result.rafterWithOverhang, 2)} ${lenUnit}`} accent />
                    <Row label="Roof area multiplier" value={`×${fmt(result.roofMultiplier, 4)}`} />
                  </dl>

                  {/* Rafter schedule */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Rafter Schedule</p>
                    <dl className="space-y-2">
                      <Row label="Rafter count" value={String(schedule.rafterCount)} />
                      <Row label="Total linear footage" value={`${fmt(schedule.totalLinearFt, 1)} ${lenUnit}`} />
                      <Row label="Ridge board" value={`${fmt(schedule.ridgeLength, 2)} ${lenUnit}`} />
                      <Row label="Fascia boards" value={`${fmt(schedule.fasciaLength, 2)} ${lenUnit}`} />
                      {roofType === "hip" && <>
                        <Row label="Hip rafter" value={`${fmt(schedule.hipRafterLength, 2)} ${lenUnit}`} accent />
                        <Row label="Valley rafter" value={`${fmt(schedule.valleyRafterLength, 2)} ${lenUnit}`} accent />
                      </>}
                      <Row label="Lumber cost est." value={`$${fmt(schedule.lumberCost, 2)}`} accent />
                    </dl>
                  </div>

                  {/* Birdsmouth */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Birdsmouth Cut</p>
                    <dl className="space-y-2">
                      <Row label="Seat cut depth" value={`${fmt(birdsmouth.seatCutDepth, 3)} ${smallUnit}`} />
                      <Row label="Seat cut length" value={`${fmt(birdsmouth.seatCutLength, 3)} ${smallUnit}`} />
                      <Row label="Plumb cut height" value={`${fmt(birdsmouth.plumbCutHeight, 3)} ${smallUnit}`} />
                    </dl>
                  </div>

                  {/* Materials */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Roofing Materials</p>
                    <dl className="space-y-2">
                      <Row label="Roof area" value={`${fmt(materials.roofArea, 0)} sq ${lenUnit}`} />
                      <Row label="Roofing squares" value={fmt(materials.roofingSquares, 2)} />
                      <Row label="Shingle bundles" value={String(materials.shingleBundles)} accent />
                      <Row label="Underlayment rolls" value={String(materials.underlaymentRolls)} />
                      <Row label="Ice & water shield" value={`${materials.iceShieldRolls} rolls`} />
                      <Row label="Ridge cap bundles" value={String(materials.ridgeCaps)} />
                      <Row label="Material cost est." value={`$${fmt(materials.materialCost, 2)}`} accent />
                    </dl>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    Estimates for planning only. Verify on-site before cutting.
                  </p>

                  <button onClick={handleDownloadPDF}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                    <Download className="w-4 h-4" /> Export PDF Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pitch reference table */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">Reference</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-6">
                Common roof pitch chart
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="text-left px-4 py-3 font-semibold">Pitch (X:12)</th>
                      <th className="text-left px-4 py-3 font-semibold">Angle</th>
                      <th className="text-left px-4 py-3 font-semibold">Slope %</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {PITCH_TABLE.map((row) => (
                      <tr key={row.pitch} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">{row.pitch}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.deg}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.pct}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">How it works</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-6">
                How to determine roof pitch
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                <p>
                  This roof pitch calculator is a handy tool that helps you quickly assess the pitch of your roof and what length rafters you need for your construction works. You can also use it as a roof slope calculator to convert pitch from degrees to percent.
                </p>
                <p>
                  To estimate the total roofing material cost, you may want to use our{" "}
                  <Link href="/concrete-calculator" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">
                    Concrete Calculator
                  </Link>{" "}
                  or our{" "}
                  <Link href="/lumber-calculator" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">
                    Lumber Calculator
                  </Link>{" "}
                  for structural framing costs. We also have a full suite of{" "}
                  <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">
                    Construction tools
                  </Link>{" "}
                  for your planning needs.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 my-6">
                  {[
                    { title: "Step 1 — Measure rise & run", body: "The rise is the vertical height of the roof. The run is the horizontal distance from the wall to directly below the ridge. Measure both in the same unit." },
                    { title: "Step 2 — Calculate pitch ratio", body: `Divide rise by run to get the pitch decimal. Multiply by 12 (imperial) or 10 (metric) for the pitch ratio — e.g. 0.5 × 12 = 6, so the pitch is 6:12.` },
                    { title: "Step 3 — Find rafter length", body: "Use the Pythagorean theorem: rafter = √(rise² + run²). Add your eave overhang for the full cut length. Multiply by your roof area multiplier for total material." },
                  ].map((item) => (
                    <div key={item.title} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                      <h3 className="font-semibold text-zinc-950 dark:text-white text-sm mb-2">{item.title}</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 font-mono text-xs sm:text-sm space-y-1">
                  <div>Pitch ratio  = (rise ÷ run) × 12   &nbsp;[imperial]</div>
                  <div>Slope %      = (rise ÷ run) × 100</div>
                  <div>Angle        = arctan(rise ÷ run)</div>
                  <div>Rafter       = √(rise² + run²)</div>
                  <div>Area mult.   = rafter ÷ run</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">FAQ</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-8">
                Frequently asked questions
              </h2>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                {faqs.map((faq, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={i} className="bg-white dark:bg-zinc-950">
                      <button onClick={() => setOpenFaq(open ? null : i)}
                        className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <span className="font-medium text-zinc-950 dark:text-white text-sm sm:text-base">{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      {open && (
                        <div className="px-5 sm:px-6 pb-5 -mt-1">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Accuracy */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="max-w-5xl">
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <h2 className="font-semibold text-zinc-950 dark:text-white mb-3">Accuracy & Review</h2>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                  <span className="font-medium">Reviewed by: Liam Santos.</span> Liam reviews our roofing and framing calculators to confirm accurate pitch conversions, rafter calculations, and practical construction defaults.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Last updated: May 2026</p>
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Important disclaimer:</span> These estimates are for general planning purposes only. Actual rafter lengths depend on lumber species, crown direction, birdsmouth cut depth, and local building code requirements. Always verify measurements and consult a licensed contractor before cutting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RelatedCategoryTools category="construction" currentSlug="roof-pitch-calculator" />

        {/* CTA */}
        <section className="bg-zinc-950 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
              More construction tools coming.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Stair calculator, drywall estimator, paint coverage, tile calculator, and more are next.
            </p>
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-zinc-950 hover:bg-zinc-200 rounded-md text-base font-medium transition-colors">
              Browse all calculators
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
