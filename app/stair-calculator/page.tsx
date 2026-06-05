"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Hammer, ChevronDown, Download, CheckCircle, XCircle } from "lucide-react";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";

/* ─────────────────────── types ─────────────────────── */
type Unit = "imperial" | "metric";

/* ─────────────────────── helpers ─────────────────────── */
function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtFrac(inches: number): string {
  const whole = Math.floor(inches);
  const frac = inches - whole;
  const fracs: [number, string][] = [[1 / 2, "½"], [1 / 4, "¼"], [3 / 4, "¾"], [1 / 8, "⅛"], [3 / 8, "⅜"], [5 / 8, "⅝"], [7 / 8, "⅞"]];
  let closest = fracs[0], minDiff = Math.abs(frac - fracs[0][0]);
  for (const f of fracs) { const d = Math.abs(frac - f[0]); if (d < minDiff) { minDiff = d; closest = f; } }
  if (minDiff < 0.04) return whole > 0 ? `${whole} ${closest[1]}"` : `${closest[1]}"`;
  return `${fmt(inches, 3)}"`;
}

/* ─────────────────────── IRC code limits ─────────────────────── */
const IRC = {
  maxRiserIn: 7.75,      // max riser height inches
  minRiserIn: 4,         // min riser height inches
  minTreadIn: 10,        // min tread depth inches (nose-to-nose)
  minHeadroomIn: 80,     // min headroom inches (6'-8")
  maxRiserMm: 197,
  minRiserMm: 102,
  minTreadMm: 254,
  minHeadroomMm: 2032,
};

/* ─────────────────────── calculation ─────────────────────── */
interface StairResult {
  numRisers: number;
  riserHeight: number;         // actual per riser
  treadDepth: number;          // nose-to-nose
  stringerLength: number;      // diagonal
  totalRun: number;
  stairwellOpening: number;    // horizontal opening needed
  // code
  riserOk: boolean;
  treadOk: boolean;
  headroomOk: boolean;
  // materials
  stringerCount: number;
  stringerBoardFt: number;
  treadBoardFt: number;
  riserBoardFt: number;
  totalBoardFt: number;
  lumberCost: number;
}

function calcStairs(
  unit: Unit,
  totalRise: number,
  totalRun: number,
  useCustomRun: boolean,
  treadDepthIn: number,
  headroom: number,
  stringerCount: number,
  treadThickness: number,
  riserThickness: number,
  pricePerBF: number,
  includeRisers: boolean,
): StairResult {
  const isImp = unit === "imperial";

  // Number of risers = ceil(totalRise / idealRiserHeight)
  // ideal riser ≈ 7" imperial, 178mm metric
  const idealRiser = isImp ? 7 : 178;
  const numRisers = Math.max(1, Math.round(totalRise / idealRiser));
  const riserHeight = totalRise / numRisers;

  // Tread depth
  const tread = useCustomRun
    ? treadDepthIn
    : isImp ? 10.5 : 267; // default code-comfortable

  // Total run from tread × (risers - 1)  [last riser lands on floor]
  const calcRun = tread * (numRisers - 1);
  const effectiveRun = useCustomRun ? calcRun : totalRun;
  const effectiveTread = useCustomRun ? tread : (numRisers > 1 ? effectiveRun / (numRisers - 1) : tread);

  // Stringer length = √(rise² + run²)
  const stringerLength = Math.sqrt(totalRise * totalRise + effectiveRun * effectiveRun);

  // Stairwell opening (horizontal length of opening needed for headroom)
  // opening = stringer_run - (headroom / tan(angle))
  const angle = Math.atan2(totalRise, effectiveRun);
  const stairwellOpening = effectiveRun - (headroom / Math.tan(angle));

  // Code checks
  const riserOk = isImp
    ? riserHeight >= IRC.minRiserIn && riserHeight <= IRC.maxRiserIn
    : riserHeight >= IRC.minRiserMm && riserHeight <= IRC.maxRiserMm;
  const treadOk = isImp
    ? effectiveTread >= IRC.minTreadIn
    : effectiveTread >= IRC.minTreadMm;
  const headroomOk = isImp
    ? headroom >= IRC.minHeadroomIn
    : headroom >= IRC.minHeadroomMm;

  // Materials (board feet: L×W×T / 144 for imperial inches)
  const treadCount = numRisers - 1; // treads = risers - 1
  // Stringer: 2×12 nominal (1.5" × 11.25" actual) — calc as full length × width × thickness
  const stringerBF = isImp
    ? (stringerLength * 11.25 * 1.5 / 144) * stringerCount
    : (stringerLength / 1000) * (0.286) * (0.038) * 35.315 * stringerCount; // m³ → BF approx
  // Tread: typical 2×12 × tread length (assume 36" / 900mm wide stair)
  const stairWidth = isImp ? 36 : 900;
  const treadBF = isImp
    ? (stairWidth * effectiveTread * treadThickness / 144) * treadCount
    : (stairWidth / 1000) * (effectiveTread / 1000) * (treadThickness / 1000) * 35.315 * treadCount;
  const riserBF = includeRisers
    ? isImp
      ? (stairWidth * riserHeight * riserThickness / 144) * numRisers
      : (stairWidth / 1000) * (riserHeight / 1000) * (riserThickness / 1000) * 35.315 * numRisers
    : 0;
  const totalBF = stringerBF + treadBF + riserBF;
  const lumberCost = totalBF * pricePerBF;

  return {
    numRisers, riserHeight, treadDepth: effectiveTread, stringerLength,
    totalRun: effectiveRun, stairwellOpening,
    riserOk, treadOk, headroomOk,
    stringerCount, stringerBoardFt: stringerBF, treadBoardFt: treadBF,
    riserBoardFt: riserBF, totalBoardFt: totalBF, lumberCost,
  };
}

/* ─────────────────────── landing calculator ─────────────────────── */
interface LandingResult {
  minWidth: number;
  minDepth: number;
  area: number;
  requiresGuard: boolean;
}
function calcLanding(
  stairWidth: number, totalRise: number, unit: Unit
): LandingResult {
  const minWidth = stairWidth;
  const minDepth = stairWidth; // IRC: landing depth ≥ stair width, min 36"
  const area = minWidth * minDepth;
  const guardThreshold = unit === "imperial" ? 30 : 762;
  return { minWidth, minDepth, area, requiresGuard: totalRise > guardThreshold };
}

/* ─────────────────────── handrail / baluster calc ─────────────────────── */
interface HandrailResult {
  handrailLength: number;
  postCount: number;
  balusterCount: number;
  balusterSpacing: number;
  guardRequired: boolean;
  handrailHeightMin: number;
  handrailHeightMax: number;
  guardHeight: number;
}
function calcHandrail(
  stringerLength: number, stairWidth: number,
  totalRise: number, unit: Unit
): HandrailResult {
  const isImp = unit === "imperial";
  // Handrail runs stringer length + extensions (IRC: 12" horizontal at top, 1 riser at bottom)
  const ext = isImp ? 24 : 610;
  const handrailLength = stringerLength + ext;
  // Posts every 48" / 1200mm
  const postSpacing = isImp ? 48 : 1200;
  const postCount = Math.ceil(stringerLength / postSpacing) + 1;
  // Balusters: IRC max 4" (102mm) opening, measured on the rake
  const maxOpening = isImp ? 4 : 102;
  const balusterCount = Math.ceil(stringerLength / maxOpening);
  const balusterSpacing = stringerLength / balusterCount;
  // Heights
  const minH = isImp ? 34 : 864;
  const maxH = isImp ? 38 : 965;
  const guardH = isImp ? 36 : 914;
  const guardThreshold = isImp ? 30 : 762;
  return {
    handrailLength, postCount, balusterCount,
    balusterSpacing,
    guardRequired: totalRise > guardThreshold,
    handrailHeightMin: minH, handrailHeightMax: maxH, guardHeight: guardH,
  };
}

/* ─────────────────────── reference table ─────────────────────── */
const STAIR_TYPES = [
  { type: "Interior residential", riser: '6¾"–7¾"', tread: '≥ 10"', headroom: '≥ 6′8"', note: "IRC R311.7 — standard homes" },
  { type: "Exterior deck stairs", riser: '4"–7¾"', tread: '≥ 10"', headroom: "Open", note: "IRC R507.12 — deck/patio" },
  { type: "Commercial (IBC)", riser: '4"–7"', tread: '≥ 11"', headroom: '≥ 7′', note: "IBC 1011 — offices, retail" },
  { type: "Spiral stairs", riser: '≤ 9½"', tread: '≥ 7½" at 12"', headroom: '≥ 6′6"', note: "IRC R311.7.10" },
];

/* ─────────────────────── terminology ─────────────────────── */
const TERMINOLOGY = [
  {
    term: "Run / Tread",
    definition: "The run or tread is the part of the stairway that a person steps on. Its length is measured from the outer edge of the step (including any nosing) to the vertical riser below. When measuring total run, the length of the tread above the last riser is not included. When nosing is present, the total run is not simply the sum of tread lengths — the nosing overhang must be subtracted.",
    code: "Min. tread depth: 10 in (25.4 cm)",
  },
  {
    term: "Rise / Riser",
    definition: "The rise, or height of a step, is measured from the top of one tread to the top of the next tread. It is not the physical height of the riser board itself, because that excludes the thickness of the tread above it. The number of risers — not treads — is used to determine the total number of steps in a staircase.",
    code: "Max. riser height: 7¾ in (19.7 cm)",
  },
  {
    term: "Nosing",
    definition: "The nosing is the protrusion at the edge of a tread that hangs over the riser below. Not all steps have nosing, but when present it is included in the tread length measurement. The main purpose of nosing is safety — it provides extra foot space when descending.",
    code: "Min. 0.75 in (1.9 cm) · Max. 1.25 in (3.2 cm)",
  },
  {
    term: "Headroom",
    definition: "Headroom is the vertical clearance measured from the top of a tread to the ceiling directly above. Building codes require far more than the average person's height to allow for moving furniture and other large objects up and down the stairway.",
    code: "Min. 6 ft 8 in (203.2 cm)",
  },
  {
    term: "Stair Width",
    definition: "Stair width is measured from edge to edge across the tread, perpendicular to its length. Unlike most rectangles where length > width, stair width is usually the longer dimension. Handrails are not included in this measurement.",
    code: "Min. 36 in (91.44 cm)",
  },
  {
    term: "Handrails & Guards",
    definition: "A handrail is a railing running up the stair incline for users to hold while ascending or descending. A guard (guardrail) is a building component near the open side of an elevated surface that prevents falls. Guards can be rails, walls, half-walls, or benches.",
    code: "Guards req. when total rise > 30 in. Handrail height: 34–38 in. Guard height: ≥ 34 in.",
  },
  {
    term: "Stringer",
    definition: "A stair stringer is a structural member that supports the treads and risers. Typically there are three stringers — one on each side and one in the middle. Stringers are not always visible; on open-sided stairs they can be seen clearly. They can be cut to the step shape or left uncut to conceal tread edges.",
    code: "Typically 2×12 lumber; 3 stringers for stairs wider than 36 in",
  },
];

/* ─────────────────────── fraction-decimal table ─────────────────────── */
const FRACTIONS = [
  { sixteenth: "1/16", eighth: "", quarter: "", half: "", decimal: "0.0625" },
  { sixteenth: "2/16", eighth: "1/8", quarter: "", half: "", decimal: "0.125" },
  { sixteenth: "3/16", eighth: "", quarter: "", half: "", decimal: "0.1875" },
  { sixteenth: "4/16", eighth: "2/8", quarter: "1/4", half: "", decimal: "0.25" },
  { sixteenth: "5/16", eighth: "", quarter: "", half: "", decimal: "0.3125" },
  { sixteenth: "6/16", eighth: "3/8", quarter: "", half: "", decimal: "0.375" },
  { sixteenth: "7/16", eighth: "", quarter: "", half: "", decimal: "0.4375" },
  { sixteenth: "8/16", eighth: "4/8", quarter: "2/4", half: "1/2", decimal: "0.5" },
  { sixteenth: "9/16", eighth: "", quarter: "", half: "", decimal: "0.5625" },
  { sixteenth: "10/16", eighth: "5/8", quarter: "", half: "", decimal: "0.625" },
  { sixteenth: "11/16", eighth: "", quarter: "", half: "", decimal: "0.6875" },
  { sixteenth: "12/16", eighth: "6/8", quarter: "3/4", half: "", decimal: "0.75" },
  { sixteenth: "13/16", eighth: "", quarter: "", half: "", decimal: "0.8125" },
  { sixteenth: "14/16", eighth: "7/8", quarter: "", half: "", decimal: "0.875" },
  { sixteenth: "15/16", eighth: "", quarter: "", half: "", decimal: "0.9375" },
  { sixteenth: "16/16", eighth: "8/8", quarter: "4/4", half: "2/2", decimal: "1" },
];

/* ─────────────────────── FAQ ─────────────────────── */
const faqs = [
  {
    q: "How do you calculate the number of stairs?",
    a: "Divide the total rise (floor-to-floor height) by your desired riser height — typically 7 inches. Round to the nearest whole number for your riser count. Treads = risers − 1. For example: 105\" ÷ 7\" = 15 risers, 14 treads.",
  },
  {
    q: "What is the ideal riser height and tread depth?",
    a: "IRC residential code allows risers between 4\" and 7¾\" and treads of at least 10\". The classic comfort formula is: 2 × riser + tread = 24–25\". A 7\" riser pairs well with a 10.5\"–11\" tread for a comfortable, natural stride.",
  },
  {
    q: "How long should a stair stringer be?",
    a: "Stringer length = √(total rise² + total run²) — the Pythagorean theorem applied to the stair triangle. Example: 105\" rise and 140\" run gives √(105² + 140²) = 175\". Always add a few inches for the top plumb cut and bottom seat cut.",
  },
  {
    q: "What is the minimum headroom for stairs?",
    a: "IRC R311.7.2 requires at least 6 ft 8 in (80 inches / 2032 mm) of vertical clearance measured from the stair nosing vertically to the ceiling or soffit above, along the entire stair path.",
  },
  {
    q: "How many stringers do I need?",
    a: "Two stringers are sufficient for stairs 36\" (900 mm) or narrower. Use three stringers for wider stairs. Commercial applications and stairs with open sides may require additional stringers per IBC requirements.",
  },
  {
    q: "What is the 7-11 rule for stairs?",
    a: "The 7-11 rule is a common design guideline: riser height ≤ 7\" and tread depth ≥ 11\". These dimensions provide a comfortable stride for most adults and exceed IRC minimums.",
  },
  {
    q: "Where must doors be placed relative to stairs?",
    a: "The arc of a door swing must be completely on a landing or floor — it cannot swing over steps. The landing must be at least as wide as the door and at least 36 inches deep in the direction of travel.",
  },
  {
    q: "When are handrails and guards required?",
    a: "Guards are required when the total rise is more than 30 inches above the floor below. Handrails are required on at least one side for any stairway with four or more risers. Handrail height must be 34–38 inches measured from the top of the treads.",
  },
];

/* ─────────────────────── sub-components ─────────────────────── */
function NumberField({ label, value, onChange, min = 0, max, step = 1, suffix = "" }: {
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

function CodeBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${ok ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
      {ok
        ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {label}
    </div>
  );
}

/* ─────────────────────── main component ─────────────────────── */
export default function StairCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [includeRisers, setIncludeRisers] = useState(true);
  const [useCustomTread, setUseCustomTread] = useState(false);

  // Primary inputs
  const [totalRise, setTotalRise] = useState<number>(105);      // inches / mm
  const [totalRun, setTotalRun] = useState<number>(140);        // inches / mm
  const [customTread, setCustomTread] = useState<number>(10.5); // inches / mm
  const [headroom, setHeadroom] = useState<number>(80);         // inches / mm
  const [stringerCount, setStringerCount] = useState<number>(3);

  // Material options
  const [treadThick, setTreadThick] = useState<number>(1.5);    // inches / mm
  const [riserThick, setRiserThick] = useState<number>(0.75);
  const [pricePerBF, setPricePerBF] = useState<number>(4.5);

  // Nosing
  const [nosing, setNosing] = useState<number>(0.75);           // inches / mm

  // Stair width (for landing + handrail)
  const [stairWidth, setStairWidth] = useState<number>(36);     // inches / mm

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const u = unit === "imperial";
  const lenUnit = u ? "in" : "mm";
  const longUnit = u ? "ft" : "m";

  const result = useMemo(() => calcStairs(
    unit, totalRise, totalRun, useCustomTread, customTread,
    headroom, stringerCount, treadThick, riserThick, pricePerBF, includeRisers,
  ), [unit, totalRise, totalRun, useCustomTread, customTread,
    headroom, stringerCount, treadThick, riserThick, pricePerBF, includeRisers]);

  // Nosing-adjusted effective tread (face-to-face = tread - nosing)
  const treadFaceToFace = Math.max(0, result.treadDepth - nosing);
  // Nosing-adjusted total run = (treads) × face-to-face + nosing
  const adjustedTotalRun = (result.numRisers - 1) * treadFaceToFace + nosing;

  const landing = useMemo(() => calcLanding(stairWidth, totalRise, unit),
    [stairWidth, totalRise, unit]);

  const handrail = useMemo(() => calcHandrail(result.stringerLength, stairWidth, totalRise, unit),
    [result.stringerLength, stairWidth, totalRise, unit]);

  const displayRiser = u ? fmtFrac(result.riserHeight) : `${fmt(result.riserHeight, 0)} mm`;
  const displayTread = u ? fmtFrac(result.treadDepth) : `${fmt(result.treadDepth, 0)} mm`;
  const displayTreadFace = u ? fmtFrac(treadFaceToFace) : `${fmt(treadFaceToFace, 0)} mm`;
  const displayStringer = u
    ? `${fmt(result.stringerLength / 12, 2)} ft (${fmt(result.stringerLength, 2)}")`
    : `${fmt(result.stringerLength / 1000, 3)} m`;
  const stairAngleDeg = Math.atan2(totalRise, result.totalRun) * (180 / Math.PI);

  /* ─── PDF export ─── */
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
    doc.text("Stair Calculator Report", margin, 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(180, 180, 180);
    doc.text(`freeconstructiontools.com  |  ${ts}`, pageW - margin, 11, { align: "right" });
    y = 28;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
    doc.text(`Units: ${u ? "Imperial" : "Metric"}   |   Stringers: ${stringerCount}   |   Risers: ${includeRisers ? "Yes" : "No"}`, margin, y);
    y += 10; divider();

    section("Inputs");
    row("Total rise", `${totalRise} ${lenUnit}`);
    row("Total run", `${result.totalRun} ${lenUnit}`);
    row("Headroom", `${headroom} ${lenUnit}`);
    y += 2; divider();

    section("Stair Dimensions");
    row("Number of risers", String(result.numRisers));
    row("Number of treads", String(result.numRisers - 1));
    row("Riser height", displayRiser);
    row("Tread depth", displayTread);
    row("Stringer length", displayStringer);
    row("Total run", `${fmt(result.totalRun, u ? 2 : 0)} ${lenUnit}`);
    row("Stairwell opening", `${fmt(Math.max(0, result.stairwellOpening), u ? 2 : 0)} ${lenUnit}`);
    y += 2; divider();

    section("IRC Code Compliance");
    row("Riser height", result.riserOk ? "PASS" : "FAIL");
    row("Tread depth", result.treadOk ? "PASS" : "FAIL");
    row("Headroom", result.headroomOk ? "PASS" : "FAIL");
    y += 2; divider();

    section("Materials Estimate");
    row("Stringers", `${result.stringerCount} × stringer`);
    row("Stringer board feet", `${fmt(result.stringerBoardFt, 2)} BF`);
    row("Treads board feet", `${fmt(result.treadBoardFt, 2)} BF`);
    if (includeRisers) row("Risers board feet", `${fmt(result.riserBoardFt, 2)} BF`);
    row("Total board feet", `${fmt(result.totalBoardFt, 2)} BF`);
    row("Lumber cost est.", `$${fmt(result.lumberCost, 2)}`);
    y += 2; divider();

    section("Landing");
    row("Min. landing width", `${fmt(landing.minWidth, u ? 2 : 0)} ${lenUnit}`);
    row("Min. landing depth", `${fmt(landing.minDepth, u ? 2 : 0)} ${lenUnit}`);
    row("Landing area", `${fmt(landing.area, u ? 1 : 0)} sq ${lenUnit}`);
    row("Guard required", landing.requiresGuard ? "YES — rise > 30 in" : "Not required");
    y += 2; divider();

    section("Handrail & Balusters");
    row("Handrail length", `${fmt(handrail.handrailLength, u ? 2 : 0)} ${lenUnit}`);
    row("Post count", String(handrail.postCount));
    row("Baluster count", String(handrail.balusterCount));
    row("Baluster spacing", `${fmt(handrail.balusterSpacing, u ? 3 : 1)} ${lenUnit}`);
    row("Handrail height", `${handrail.handrailHeightMin}–${handrail.handrailHeightMax} ${lenUnit}`);
    if (handrail.guardRequired) row("Guard height", `≥ ${handrail.guardHeight} ${lenUnit}`);
    y += 6;

    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text(doc.splitTextToSize(
      "Estimates for planning only. Always verify with local building codes. Consult a licensed contractor before construction.",
      pageW - margin * 2
    ), margin, y);
    doc.save(`stair-calculator-${Date.now()}.pdf`);
  }

  /* ─── JSON-LD ─── */
  const softwareSchema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "Stair Calculator",
    description: "Free stair calculator. Riser count, riser height, tread depth, stringer length, headroom clearance, and lumber cost estimate. IRC code-compliant.",
    url: "https://freeconstructiontools.com/stair-calculator",
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
              Stair Calculator
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              The Stair Calculator is an online tool for calculating various parameters involved in the construction of stairs. Enter your total rise and run to instantly get riser count, riser height, tread depth, stringer length, headroom clearance, and a complete lumber materials list — all verified against IRC residential building code.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

            {/* Switchers */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {(["imperial", "metric"] as Unit[]).map((u) => (
                  <button key={u} onClick={() => {
                    setUnit(u);
                    if (u === "imperial") { setTotalRise(105); setTotalRun(140); setHeadroom(80); setCustomTread(10.5); setTreadThick(1.5); setRiserThick(0.75); setNosing(0.75); setStairWidth(36); }
                    else { setTotalRise(2667); setTotalRun(3556); setHeadroom(2032); setCustomTread(267); setTreadThick(38); setRiserThick(19); setNosing(19); setStairWidth(914); }
                  }}
                    className={`px-3 h-8 text-xs font-medium rounded capitalize transition-colors ${unit === u ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                    {u}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                <button onClick={() => setUseCustomTread(false)}
                  className={`px-3 h-8 text-xs font-medium rounded transition-colors ${!useCustomTread ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                  Auto tread
                </button>
                <button onClick={() => setUseCustomTread(true)}
                  className={`px-3 h-8 text-xs font-medium rounded transition-colors ${useCustomTread ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                  Custom tread
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* ── Left: Inputs ── */}
              <div className="lg:col-span-3 space-y-5">

                {/* Primary dimensions */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Stair Dimensions</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Total rise (${lenUnit})`} value={totalRise} onChange={setTotalRise} min={1} step={u ? 0.25 : 1} />
                    <NumberField label={`Total run (${lenUnit})`} value={totalRun} onChange={setTotalRun} min={1} step={u ? 0.25 : 1} />
                  </div>
                  {useCustomTread && (
                    <NumberField label={`Custom tread depth (${lenUnit})`} value={customTread} onChange={setCustomTread} min={u ? 6 : 150} step={u ? 0.25 : 5} />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Headroom (${lenUnit})`} value={headroom} onChange={setHeadroom} min={1} step={u ? 0.5 : 10} />
                    <NumberField label="Stringers" value={stringerCount} onChange={setStringerCount} min={2} max={6} step={1} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Nosing depth (${lenUnit})`} value={nosing} onChange={setNosing} min={0} max={u ? 1.25 : 32} step={u ? 0.125 : 1} />
                    <NumberField label={`Stair width (${lenUnit})`} value={stairWidth} onChange={setStairWidth} min={u ? 36 : 914} step={u ? 1 : 10} />
                  </div>

                  {/* Live stair diagram */}
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4" style={{ height: 200 }}>
                    <svg viewBox="0 0 320 170" className="w-full h-full" fill="none">
                      {/* Ground */}
                      <line x1="10" y1="148" x2="310" y2="148" stroke="#a1a1aa" strokeWidth="1.5" />
                      {/* Steps — 4 representative */}
                      {[0,1,2,3].map((i) => {
                        const tw = 52; const rh = 28;
                        const x0 = 10 + i*tw; const y0 = 148 - i*rh;
                        return (
                          <g key={i}>
                            {/* Tread */}
                            <line x1={x0} y1={y0} x2={x0+tw} y2={y0} stroke="#6366f1" strokeWidth="2" />
                            {/* Nosing overhang indicator */}
                            <line x1={x0} y1={y0} x2={x0+6} y2={y0} stroke="#f59e0b" strokeWidth="3" />
                            {/* Riser */}
                            <line x1={x0+tw} y1={y0} x2={x0+tw} y2={y0-rh} stroke="#6366f1" strokeWidth="2" />
                          </g>
                        );
                      })}
                      {/* Stringer */}
                      <line x1="10" y1="148" x2="218" y2="36" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                      {/* Angle arc */}
                      <path d={`M 46,148 A 36,36 0 0,1 ${46 + 36*Math.cos((90-stairAngleDeg)*Math.PI/180)},${148 - 36*Math.sin((90-stairAngleDeg)*Math.PI/180)}`} stroke="#6366f1" strokeWidth="1" fill="none" />
                      <text x="52" y="138" fontSize="8" fill="#6366f1">{fmt(stairAngleDeg,1)}°</text>
                      {/* Dimension annotations */}
                      <text x="34" y="144" fontSize="7" fill="#6366f1">tread: {displayTread}</text>
                      <text x="220" y="95" fontSize="7" fill="#71717a" transform="rotate(-65,220,95)">stringer</text>
                      {/* Rise label */}
                      <line x1="250" y1="148" x2="250" y2="36" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3 2" />
                      <text x="256" y="95" fontSize="8" fill="#71717a">rise</text>
                      <text x="256" y="105" fontSize="7" fill="#71717a">{displayRiser}/step</text>
                      {/* Run label */}
                      <line x1="10" y1="158" x2="218" y2="158" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3 2" />
                      <text x="110" y="168" fontSize="8" fill="#71717a" textAnchor="middle">run</text>
                      {/* Nosing label */}
                      <text x="12" y="128" fontSize="7" fill="#f59e0b">nosing</text>
                    </svg>
                  </div>
                </div>

                {/* Materials options */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Materials & Cost</p>
                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                      <input type="checkbox" checked={includeRisers} onChange={(e) => setIncludeRisers(e.target.checked)}
                        className="w-3.5 h-3.5 accent-indigo-600" />
                      Include risers
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumberField label={`Tread thickness (${lenUnit})`} value={treadThick} onChange={setTreadThick} min={0.5} step={u ? 0.25 : 5} />
                    {includeRisers && <NumberField label={`Riser thickness (${lenUnit})`} value={riserThick} onChange={setRiserThick} min={0.25} step={u ? 0.125 : 3} />}
                  </div>
                  <NumberField label="Price per board foot ($)" value={pricePerBF} onChange={setPricePerBF} min={0} step={0.25} />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Stair width assumed 36&quot; / 900 mm. Adjust price per BF to match your lumber species and grade.</p>
                </div>
              </div>

              {/* ── Right: Results ── */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 lg:sticky lg:top-24 space-y-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Results</div>

                  {/* Primary result */}
                  <div>
                    <div className="text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums">{result.numRisers}</div>
                    <div className="text-sm text-zinc-500 mt-1">risers &nbsp;/&nbsp; {result.numRisers - 1} treads</div>
                  </div>

                  {/* Stair dimensions */}
                  <dl className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <Row label="Riser height" value={displayRiser} accent />
                    <Row label="Tread depth" value={displayTread} accent />
                    <Row label="Stringer length" value={displayStringer} />
                    <Row label="Total run" value={`${fmt(result.totalRun, u ? 2 : 0)} ${lenUnit}`} />
                    <Row label="Stairwell opening" value={`${fmt(Math.max(0, result.stairwellOpening), u ? 2 : 0)} ${lenUnit}`} />
                  </dl>

                  {/* IRC code compliance */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">IRC Code Check</p>
                    <div className="space-y-2">
                      <CodeBadge ok={result.riserOk} label={`Riser: ${displayRiser} ${result.riserOk ? "✓ within" : "✗ outside"} code range`} />
                      <CodeBadge ok={result.treadOk} label={`Tread: ${displayTread} ${result.treadOk ? "✓ meets" : "✗ below"} minimum`} />
                      <CodeBadge ok={result.headroomOk} label={`Headroom: ${headroom}${lenUnit} ${result.headroomOk ? "✓ meets" : "✗ below"} 6′8″`} />
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Materials</p>
                    <dl className="space-y-2">
                      <Row label="Stringers" value={`${result.stringerCount} pcs`} />
                      <Row label="Stringer lumber" value={`${fmt(result.stringerBoardFt, 2)} BF`} />
                      <Row label="Tread lumber" value={`${fmt(result.treadBoardFt, 2)} BF`} />
                      {includeRisers && <Row label="Riser lumber" value={`${fmt(result.riserBoardFt, 2)} BF`} />}
                      <Row label="Total board feet" value={`${fmt(result.totalBoardFt, 2)} BF`} accent />
                      <Row label="Lumber cost est." value={`$${fmt(result.lumberCost, 2)}`} accent />
                    </dl>
                  </div>

                  {/* Nosing-adjusted run */}
                  {nosing > 0 && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Nosing Adjustments</p>
                      <dl className="space-y-2">
                        <Row label="Tread face-to-face" value={displayTreadFace} />
                        <Row label="Adj. total run" value={`${fmt(adjustedTotalRun, u ? 2 : 0)} ${lenUnit}`} accent />
                        <Row label="Nosing depth" value={u ? fmtFrac(nosing) : `${fmt(nosing, 0)} mm`} />
                      </dl>
                    </div>
                  )}

                  {/* Landing */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Landing</p>
                    <dl className="space-y-2">
                      <Row label="Min. width" value={`${fmt(landing.minWidth, u ? 2 : 0)} ${lenUnit}`} />
                      <Row label="Min. depth" value={`${fmt(landing.minDepth, u ? 2 : 0)} ${lenUnit}`} />
                      <Row label="Area" value={`${fmt(landing.area, u ? 1 : 0)} sq ${lenUnit}`} />
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium mt-1 ${
                        landing.requiresGuard
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                      }`}>
                        {landing.requiresGuard
                          ? <><XCircle className="w-3.5 h-3.5 flex-shrink-0" /> Guard required (rise &gt; {u ? '30"' : '762mm'})</>
                          : <><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Guard not required</>}
                      </div>
                    </dl>
                  </div>

                  {/* Handrail & balusters */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Handrail & Balusters</p>
                    <dl className="space-y-2">
                      <Row label="Handrail length" value={`${fmt(handrail.handrailLength, u ? 2 : 0)} ${lenUnit}`} accent />
                      <Row label="Post count" value={`${handrail.postCount} posts`} />
                      <Row label="Baluster count" value={`${handrail.balusterCount} balusters`} accent />
                      <Row label="Baluster spacing" value={`${fmt(handrail.balusterSpacing, u ? 3 : 1)} ${lenUnit}`} />
                      <Row label="Handrail height" value={`${handrail.handrailHeightMin}–${handrail.handrailHeightMax} ${lenUnit}`} />
                      {handrail.guardRequired && <Row label="Guard height" value={`≥ ${handrail.guardHeight} ${lenUnit}`} />}
                    </dl>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    Estimates for planning only. Verify with local code before building.
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

        {/* Code reference table */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">Reference</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-6">
                Stair code requirements by type
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="text-left px-4 py-3 font-semibold">Stair Type</th>
                      <th className="text-left px-4 py-3 font-semibold">Riser</th>
                      <th className="text-left px-4 py-3 font-semibold">Tread</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Headroom</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {STAIR_TYPES.map((r) => (
                      <tr key={r.type} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">{r.type}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.riser}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.tread}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">{r.headroom}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Terminology */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">Terminology</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-2">
                Stair terminology and building codes
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Stairs come in many forms, and while building a basic staircase may seem straightforward, there are numerous parameters, calculations, and building codes to consider. Building codes can differ at a local level — always refer to the codes specific to your location.
              </p>
              <div className="space-y-4">
                {TERMINOLOGY.map((item) => (
                  <div key={item.term} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-zinc-950 dark:text-white text-sm">{item.term}</h3>
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded px-2 py-0.5 font-medium whitespace-nowrap">{item.code}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.definition}</p>
                  </div>
                ))}
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
                How to calculate stair dimensions
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                <p>
                  This stair calculator helps you design code-compliant stairs for any floor-to-floor height. Enter your total rise (floor-to-floor vertical distance) and total run (horizontal footprint), and the calculator instantly outputs every dimension you need for layout and materials.
                </p>
                <p>
                  For structural framing costs on your stair platform, see our{" "}
                  <Link href="/lumber-calculator" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">Lumber Calculator</Link>.
                  {" "}To check the concrete pad or landing, use the{" "}
                  <Link href="/concrete-calculator" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">Concrete Calculator</Link>.
                  {" "}Browse all{" "}
                  <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">Construction tools</Link>.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 my-6">
                  {[
                    { title: "Step 1 — Measure total rise", body: "Measure the vertical distance from the finished floor at the bottom to the finished floor at the top. This is your total rise." },
                    { title: "Step 2 — Calculate risers", body: 'Divide total rise by 7" (178 mm) and round to the nearest whole number. Divide total rise by that number to get the exact riser height per step.' },
                    { title: "Step 3 — Find tread & stringer", body: "Tread depth = total run ÷ (risers − 1). Stringer length = √(rise² + run²). Check all dimensions against IRC R311.7." },
                  ].map((item) => (
                    <div key={item.title} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                      <h3 className="font-semibold text-zinc-950 dark:text-white text-sm mb-2">{item.title}</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 font-mono text-xs sm:text-sm space-y-1">
                  <div>Risers         = round(total_rise / 7)</div>
                  <div>Riser height   = total_rise / risers</div>
                  <div>Tread depth    = total_run / (risers − 1)</div>
                  <div>Stringer       = √(rise² + run²)</div>
                  <div>Comfort check  = 2 × riser + tread ≈ 24–25"</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fraction to Decimal */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">Reference</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-2">
                Fraction to decimal conversion
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Common fractions used in stair measurements and their decimal equivalents.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="text-left px-4 py-3 font-semibold">16th</th>
                      <th className="text-left px-4 py-3 font-semibold">8th</th>
                      <th className="text-left px-4 py-3 font-semibold">4th</th>
                      <th className="text-left px-4 py-3 font-semibold">2nd</th>
                      <th className="text-left px-4 py-3 font-semibold">Decimal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {FRACTIONS.map((row) => (
                      <tr key={row.sixteenth} className={`bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${row.half ? "font-semibold" : ""}`}>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{row.sixteenth}</td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{row.eighth}</td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{row.quarter}</td>
                        <td className="px-4 py-2.5 text-zinc-950 dark:text-white">{row.half}</td>
                        <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">{row.decimal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <span className="font-medium">Reviewed by: Liam Santos.</span> Liam reviews our construction calculators to confirm accurate dimensional calculations and practical building code defaults.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Last updated: May 2026</p>
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Important disclaimer:</span> These results are based on IRC R311.7 residential stair requirements. Commercial, industrial, and specialty applications follow different codes (IBC, OSHA). Always verify with your local authority having jurisdiction (AHJ) and a licensed contractor before construction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RelatedCategoryTools category="construction" currentSlug="stair-calculator" />

        {/* CTA */}
        <section className="bg-zinc-950 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
              More construction tools coming.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Drywall estimator, tile calculator, paint coverage, flooring calculator, and more are next.
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
