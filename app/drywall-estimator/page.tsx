"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Hammer, ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";

/* ─────────────────────── types ─────────────────────── */
type Unit = "imperial" | "metric";

interface Opening {
  id: number;
  label: string;
  width: number;
  height: number;
}

type CeilingType = "flat" | "vaulted";
type RoomShape = "rectangular" | "l-shape";

interface Room {
  id: number;
  name: string;
  shape: RoomShape;
  length: number;
  width: number;
  // L-shape second section
  length2: number;
  width2: number;
  ceilingHeight: number;
  ceilingType: CeilingType;
  vaultedPeakHeight: number; // peak height for vaulted
  includeCeiling: boolean;
  openings: Opening[];
}

/* ─────────────────────── helpers ─────────────────────── */
let _uid = 1;
function uid() { return _uid++; }
function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ─────────────────────── sheet sizes ─────────────────────── */
const SHEET_SIZES_IMP = [
  { label: '4×8 ft (32 sq ft)', w: 4, h: 8, sqft: 32 },
  { label: '4×9 ft (36 sq ft)', w: 4, h: 9, sqft: 36 },
  { label: '4×10 ft (40 sq ft)', w: 4, h: 10, sqft: 40 },
  { label: '4×12 ft (48 sq ft)', w: 4, h: 12, sqft: 48 },
];
const SHEET_SIZES_MET = [
  { label: '1200×2400 mm (2.88 m²)', w: 1.2, h: 2.4, sqft: 2.88 },
  { label: '1200×2700 mm (3.24 m²)', w: 1.2, h: 2.7, sqft: 3.24 },
  { label: '1200×3000 mm (3.60 m²)', w: 1.2, h: 3.0, sqft: 3.6 },
];

/* ─────────────────────── calculation ─────────────────────── */
interface RoomResult {
  wallArea: number;
  ceilingArea: number;
  openingArea: number;
  netArea: number;
  sheets: number;
  screws: number;
  tapeRolls: number;
  mudBuckets: number;
  cornerBeadLf: number;   // linear feet of corner bead
  primerGal: number;      // gallons of drywall primer
  paintGal: number;       // gallons of finish paint (2 coats)
}

interface TotalResult {
  totalNetArea: number;
  totalSheets: number;
  totalScrews: number;
  totalTapeRolls: number;
  totalMudBuckets: number;
  totalCornerBeadLf: number;
  totalPrimerGal: number;
  totalPaintGal: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  timelineDays: number;
  rooms: RoomResult[];
}

function calcRoom(
  unit: Unit,
  room: Room,
  sheetSqft: number,
  waste: number,
): RoomResult {
  const isImp = unit === "imperial";
  const L = room.length;
  const W = room.width;
  const H = room.ceilingHeight;

  // Wall area — L-shape adds second section walls minus shared wall
  let wallArea = 2 * (L + W) * H;
  let floorArea = L * W;
  if (room.shape === "l-shape") {
    const L2 = room.length2;
    const W2 = room.width2;
    // Add perimeter of second section (subtract shared edge — approximate)
    wallArea += 2 * (L2 + W2) * H - 2 * Math.min(W, W2) * H;
    floorArea += L2 * W2;
  }

  // Ceiling area — vaulted adds triangle gable area above flat height
  let ceilingArea = 0;
  if (room.includeCeiling) {
    if (room.ceilingType === "vaulted") {
      const peakAddition = room.vaultedPeakHeight - H;
      // Sloped ceiling area = floor_area * correction factor
      const slopeLen = Math.sqrt((L / 2) ** 2 + peakAddition ** 2);
      const flatHalf = L / 2;
      const factor = slopeLen / flatHalf;
      ceilingArea = floorArea * factor;
    } else {
      ceilingArea = floorArea;
    }
  }

  const openingArea = room.openings.reduce((sum, o) => sum + o.width * o.height, 0);
  const grossArea = wallArea + ceilingArea;
  const netArea = Math.max(0, grossArea - openingArea) * (1 + waste / 100);

  const sheets = Math.ceil(netArea / sheetSqft);
  const screws = sheets * 34;
  const tapeRolls = Math.ceil(sheets / 2);
  const mudBuckets = Math.ceil(netArea / (isImp ? 150 : 14));

  // Corner bead: 1 LF per each vertical corner (perimeter corners + openings)
  // Approx: number of inside/outside corners ≈ perimeter / avg room length * 2
  const numCorners = room.shape === "l-shape" ? 8 : 4;
  const cornerBeadLf = numCorners * H + room.openings.length * (room.openings[0]?.height ?? H) * 2;

  // Primer: 1 gal covers 300–400 sqft; use 350
  const primerGal = Math.ceil(netArea / (isImp ? 350 : 32.5));
  // Paint: 1 gal covers 350 sqft per coat; 2 coats
  const paintGal = Math.ceil((netArea / (isImp ? 350 : 32.5)) * 2);

  return { wallArea, ceilingArea, openingArea, netArea, sheets, screws, tapeRolls, mudBuckets, cornerBeadLf, primerGal, paintGal };
}

function calcTotal(
  unit: Unit,
  rooms: Room[],
  sheetSqft: number,
  waste: number,
  pricePerSheet: number,
  pricePerScrew100: number,
  pricePerTape: number,
  pricePerMud: number,
  pricePerCornerBead: number,
  pricePerPrimerGal: number,
  pricePerPaintGal: number,
  laborHangPerSheet: number,
  laborMudPerSheet: number,
  laborSandPrimePerSheet: number,
  crewSize: number,
): TotalResult {
  const roomResults = rooms.map((r) => calcRoom(unit, r, sheetSqft, waste));
  const totalNetArea = roomResults.reduce((s, r) => s + r.netArea, 0);
  const totalSheets = roomResults.reduce((s, r) => s + r.sheets, 0);
  const totalScrews = roomResults.reduce((s, r) => s + r.screws, 0);
  const totalTapeRolls = roomResults.reduce((s, r) => s + r.tapeRolls, 0);
  const totalMudBuckets = roomResults.reduce((s, r) => s + r.mudBuckets, 0);
  const totalCornerBeadLf = roomResults.reduce((s, r) => s + r.cornerBeadLf, 0);
  const totalPrimerGal = roomResults.reduce((s, r) => s + r.primerGal, 0);
  const totalPaintGal = roomResults.reduce((s, r) => s + r.paintGal, 0);

  const materialCost =
    totalSheets * pricePerSheet +
    (totalScrews / 100) * pricePerScrew100 +
    totalTapeRolls * pricePerTape +
    totalMudBuckets * pricePerMud +
    totalCornerBeadLf * pricePerCornerBead +
    totalPrimerGal * pricePerPrimerGal +
    totalPaintGal * pricePerPaintGal;

  // Labor cost
  const laborCost = totalSheets * (laborHangPerSheet + laborMudPerSheet + laborSandPrimePerSheet);

  const totalCost = materialCost + laborCost;

  // Timeline: sheets per person per day = ~12 hang, then mud/tape = 50% more time, sand/prime = 25%
  // Total person-hours = sheets * (hang + mud + sand) hrs, divided by crew
  const hoursPerSheet = 0.5 + 0.75 + 0.25; // 1.5 hrs/sheet total across phases
  const totalHours = totalSheets * hoursPerSheet;
  const hoursPerDay = 8;
  const timelineDays = Math.ceil(totalHours / (crewSize * hoursPerDay));

  return { totalNetArea, totalSheets, totalScrews, totalTapeRolls, totalMudBuckets, totalCornerBeadLf, totalPrimerGal, totalPaintGal, materialCost, laborCost, totalCost, timelineDays, rooms: roomResults };
}

/* ─────────────────────── drywall tips ─────────────────────── */
const TIPS = [
  { term: "Sheet orientation", body: "Hang drywall horizontally (perpendicular to studs) on walls whenever possible. This reduces the number of butt joints and creates a stronger wall." },
  { term: "Butt vs. tapered joints", body: "Tapered edges (factory edges) require less compound. Butt joints (cut ends meeting) need extra feathering — add 6\" each side. Plan cuts to minimize butt joints." },
  { term: "Screw spacing", body: "On walls: 16\" o.c. in the field, 8\" o.c. on edges. On ceilings: 12\" o.c. in the field. Use 1¼\" type-W screws for ½\" drywall into wood studs." },
  { term: "Joint compound coats", body: "Apply 3 coats: tape coat, filler coat, finish coat. Let each coat dry fully (24 hrs). Sand lightly between coats with 120-grit." },
  { term: "Waste factor", body: "10% waste is typical for simple rectangular rooms. Allow 15% for rooms with many corners, arches, or complex cuts. Never use less than 5%." },
  { term: "Ceiling vs. wall thickness", body: "Use ⅝\" type-X for ceilings to resist sag. ½\" is standard for walls. Fire-rated assemblies may require specific thickness and type." },
];

/* ─────────────────────── FAQ ─────────────────────── */
const faqs = [
  {
    q: "How do I calculate how many sheets of drywall I need?",
    a: "Calculate the total wall area (perimeter × ceiling height) plus ceiling area if applicable. Subtract openings (doors, windows). Divide by sheet size (e.g. 32 sq ft for 4×8). Add 10% waste. Round up to a whole number.",
  },
  {
    q: "How many screws do I need per sheet of drywall?",
    a: "Approximately 32–36 screws per 4×8 sheet. Walls use 34 screws on average (16\" o.c. in the field, 8\" o.c. on edges). Ceilings use slightly more at 12\" o.c. Buy screws in boxes of 1 lb (~200 screws).",
  },
  {
    q: "How much joint compound do I need?",
    a: "A standard 4.5-gallon bucket covers approximately 100–150 sq ft of finished drywall (3 coats). For a typical room, plan 1 bucket per 150 sq ft of net drywall area.",
  },
  {
    q: "How much drywall tape do I need?",
    a: "A 500 ft roll of paper tape covers approximately 500 linear feet of joints. As a rule of thumb, 1 roll covers roughly 2 sheets of drywall (accounting for all seams). Fiberglass mesh tape is sold by linear feet and used at the same rate.",
  },
  {
    q: "Should I use ½\" or ⅝\" drywall?",
    a: "½\" drywall is standard for interior walls and ceilings on 16\" o.c. studs. Use ⅝\" Type X for fire-rated assemblies, ceilings with 24\" o.c. framing (to resist sag), garages, and around furnaces.",
  },
  {
    q: "What is the waste factor for drywall?",
    a: "A 10% waste factor is standard for simple rectangular rooms. Use 15% for rooms with many angles, arches, or vaulted ceilings. Never plan with less than 5% — even perfect cuts produce offcuts.",
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

/* ─────────────────────── main component ─────────────────────── */
export default function DrywallEstimatorPage() {
  const [unit, setUnit] = useState<Unit>("imperial");

  const sheetSizesImp = SHEET_SIZES_IMP;
  const sheetSizesMet = SHEET_SIZES_MET;

  const [sheetIdx, setSheetIdx] = useState(0);
  const [waste, setWaste] = useState(10);
  const [pricePerSheet, setPricePerSheet] = useState(14);
  const [pricePerScrew100, setPricePerScrew100] = useState(3.5);
  const [pricePerTape, setPricePerTape] = useState(8);
  const [pricePerMud, setPricePerMud] = useState(18);
  const [pricePerCornerBead, setPricePerCornerBead] = useState(0.5);  // per LF
  const [pricePerPrimerGal, setPricePerPrimerGal] = useState(22);
  const [pricePerPaintGal, setPricePerPaintGal] = useState(38);
  // Labor rates ($ per sheet)
  const [laborHang, setLaborHang] = useState(12);       // hang & screw
  const [laborMud, setLaborMud] = useState(8);          // tape & mud
  const [laborSandPrime, setLaborSandPrime] = useState(5); // sand + prime
  const [crewSize, setCrewSize] = useState(2);

  const defaultRoomImp: Room = {
    id: 0, name: "Living Room",
    shape: "rectangular", length: 16, width: 14,
    length2: 8, width2: 8,
    ceilingHeight: 9, ceilingType: "flat", vaultedPeakHeight: 12,
    includeCeiling: true,
    openings: [
      { id: 0, label: "Door", width: 3, height: 7 },
      { id: 0, label: "Window", width: 4, height: 3 },
    ],
  };
  const defaultRoomMet: Room = {
    id: 0, name: "Living Room",
    shape: "rectangular", length: 4.9, width: 4.3,
    length2: 2.4, width2: 2.4,
    ceilingHeight: 2.7, ceilingType: "flat", vaultedPeakHeight: 3.6,
    includeCeiling: true,
    openings: [
      { id: 0, label: "Door", width: 0.9, height: 2.1 },
      { id: 0, label: "Window", width: 1.2, height: 0.9 },
    ],
  };

  const [rooms, setRooms] = useState<Room[]>([{
    ...defaultRoomImp,
    id: uid(),
    openings: defaultRoomImp.openings.map((o) => ({ ...o, id: uid() })),
  }]);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const u = unit === "imperial";
  const lenUnit = u ? "ft" : "m";
  const areaUnit = u ? "sq ft" : "m²";
  const sheetSizes = u ? sheetSizesImp : sheetSizesMet;
  const safeSheetIdx = Math.min(sheetIdx, sheetSizes.length - 1);
  const sheetSqft = sheetSizes[safeSheetIdx].sqft;

  /* ─── room helpers ─── */
  function addRoom() {
    setRooms((r) => [...r, {
      id: uid(), name: `Room ${r.length + 1}`,
      shape: "rectangular" as RoomShape,
      length: u ? 12 : 3.6, width: u ? 10 : 3,
      length2: u ? 8 : 2.4, width2: u ? 8 : 2.4,
      ceilingHeight: u ? 9 : 2.7,
      ceilingType: "flat" as CeilingType,
      vaultedPeakHeight: u ? 12 : 3.6,
      includeCeiling: false,
      openings: [],
    }]);
  }
  function removeRoom(id: number) { setRooms((r) => r.filter((x) => x.id !== id)); }
  function updateRoom<K extends keyof Room>(id: number, field: K, val: Room[K]) {
    setRooms((r) => r.map((x) => x.id === id ? { ...x, [field]: val } : x));
  }
  function addOpening(roomId: number) {
    setRooms((r) => r.map((x) => x.id === roomId
      ? { ...x, openings: [...x.openings, { id: uid(), label: "Opening", width: u ? 3 : 0.9, height: u ? 7 : 2.1 }] }
      : x));
  }
  function removeOpening(roomId: number, openingId: number) {
    setRooms((r) => r.map((x) => x.id === roomId
      ? { ...x, openings: x.openings.filter((o) => o.id !== openingId) }
      : x));
  }
  function updateOpening<K extends keyof Opening>(roomId: number, openingId: number, field: K, val: Opening[K]) {
    setRooms((r) => r.map((x) => x.id === roomId
      ? { ...x, openings: x.openings.map((o) => o.id === openingId ? { ...o, [field]: val } : o) }
      : x));
  }

  const totals = useMemo(() => calcTotal(
    unit, rooms, sheetSqft, waste,
    pricePerSheet, pricePerScrew100, pricePerTape, pricePerMud,
    pricePerCornerBead, pricePerPrimerGal, pricePerPaintGal,
    laborHang, laborMud, laborSandPrime, crewSize,
  ), [unit, rooms, sheetSqft, waste, pricePerSheet, pricePerScrew100, pricePerTape, pricePerMud,
    pricePerCornerBead, pricePerPrimerGal, pricePerPaintGal,
    laborHang, laborMud, laborSandPrime, crewSize]);

  /* ─── PDF export ─── */
  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const colLabel = margin;
    const colQty = 100;
    const colUnit = 128;
    const colUnitPrice = 152;
    let y = 20;

    /* ── helpers ── */
    const checkPage = () => { if (y > 268) { doc.addPage(); y = 18; } };

    const section = (title: string) => {
      checkPage();
      y += 3;
      doc.setFillColor(30, 30, 30); doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), margin + 3, y + 5); y += 11;
    };

    const subSection = (title: string) => {
      checkPage();
      y += 2;
      doc.setFillColor(240, 240, 240); doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
      doc.text(title, margin + 3, y + 4.2); y += 9;
    };

    // Simple label + value row (right-aligned value)
    const row = (label: string, value: string, bold = false) => {
      checkPage();
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9.5); doc.setTextColor(60, 60, 60);
      doc.text(label, colLabel, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
      doc.text(value, pageW - margin, y, { align: "right" }); y += 6.5;
    };

    // Cost table row: label | qty | unit | unit price | total
    const costRow = (label: string, qty: string, unit: string, unitPrice: string, total: string, accent = false) => {
      checkPage();
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      doc.text(label, colLabel, y);
      doc.setTextColor(80, 80, 80);
      doc.text(qty, colQty, y, { align: "right" });
      doc.text(unit, colUnit, y);
      doc.text(unitPrice, colUnitPrice, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accent ? 79 : 20, accent ? 70 : 20, accent ? 187 : 20);
      doc.text(total, pageW - margin, y, { align: "right" }); y += 6.5;
    };

    // Cost table header
    const costHeader = () => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(130, 130, 130);
      doc.text("ITEM", colLabel, y);
      doc.text("QTY", colQty, y, { align: "right" });
      doc.text("UNIT", colUnit, y);
      doc.text("UNIT PRICE", colUnitPrice, y, { align: "right" });
      doc.text("COST", pageW - margin, y, { align: "right" });
      y += 4;
      doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
    };

    const totalLine = (label: string, value: string, highlight = false) => {
      checkPage();
      doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
      if (highlight) {
        doc.setFillColor(240, 240, 255); doc.rect(margin, y - 1, pageW - margin * 2, 8, "F");
      }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.setTextColor(highlight ? 60 : 20, highlight ? 60 : 20, highlight ? 200 : 20);
      doc.text(label, colLabel, y + 4);
      doc.text(value, pageW - margin, y + 4, { align: "right" }); y += 11;
    };

    const divider = () => {
      checkPage();
      doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 5;
    };

    /* ── Header ── */
    doc.setFillColor(15, 15, 15); doc.rect(0, 0, pageW, 18, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
    doc.text("Drywall Estimator Report", margin, 12);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    /* ── Project settings ── */
    section("Project Settings");
    row("Units", u ? "Imperial" : "Metric");
    row("Sheet size", sheetSizes[safeSheetIdx].label);
    row("Waste factor", `${waste}%`);
    row("Crew size", `${crewSize} person${crewSize !== 1 ? "s" : ""}`);
    row("Number of rooms", String(rooms.length));
    y += 2; divider();

    /* ── Material quantities ── */
    section("Material Quantities");
    row("Total net area (inc. waste)", `${fmt(totals.totalNetArea, 1)} ${areaUnit}`);
    row("Drywall sheets", `${totals.totalSheets} sheets`);
    row("Drywall screws", `${totals.totalScrews.toLocaleString()} screws`);
    row("Joint tape rolls (500 ft)", `${totals.totalTapeRolls} rolls`);
    row("Joint compound buckets", `${totals.totalMudBuckets} buckets (4.5 gal ea.)`);
    row("Corner bead", `${fmt(totals.totalCornerBeadLf, 1)} LF`);
    row("Drywall primer", `${totals.totalPrimerGal} gal`);
    row("Finish paint (2 coats)", `${totals.totalPaintGal} gal`);
    y += 2; divider();

    /* ── Materials cost breakdown ── */
    section("Materials Cost Breakdown");
    costHeader();
    costRow("Drywall sheets", String(totals.totalSheets), "sheets", `$${fmt(pricePerSheet, 2)}/sheet`, `$${fmt(totals.totalSheets * pricePerSheet, 2)}`);
    costRow("Screws", `${totals.totalScrews}`, "screws", `$${fmt(pricePerScrew100, 2)}/100`, `$${fmt((totals.totalScrews / 100) * pricePerScrew100, 2)}`);
    costRow("Joint tape", String(totals.totalTapeRolls), "rolls", `$${fmt(pricePerTape, 2)}/roll`, `$${fmt(totals.totalTapeRolls * pricePerTape, 2)}`);
    costRow("Joint compound", String(totals.totalMudBuckets), "buckets", `$${fmt(pricePerMud, 2)}/bucket`, `$${fmt(totals.totalMudBuckets * pricePerMud, 2)}`);
    costRow("Corner bead", `${fmt(totals.totalCornerBeadLf, 1)}`, "LF", `$${fmt(pricePerCornerBead, 2)}/LF`, `$${fmt(totals.totalCornerBeadLf * pricePerCornerBead, 2)}`);
    costRow("Primer", String(totals.totalPrimerGal), "gal", `$${fmt(pricePerPrimerGal, 2)}/gal`, `$${fmt(totals.totalPrimerGal * pricePerPrimerGal, 2)}`);
    costRow("Finish paint (2 coats)", String(totals.totalPaintGal), "gal", `$${fmt(pricePerPaintGal, 2)}/gal`, `$${fmt(totals.totalPaintGal * pricePerPaintGal, 2)}`);
    totalLine("Materials Subtotal", `$${fmt(totals.materialCost, 2)}`);

    /* ── Labor cost breakdown ── */
    section("Labor Cost Breakdown");
    costHeader();
    costRow("Hang & screw", String(totals.totalSheets), "sheets", `$${fmt(laborHang, 2)}/sheet`, `$${fmt(totals.totalSheets * laborHang, 2)}`);
    costRow("Tape & mud (3 coats)", String(totals.totalSheets), "sheets", `$${fmt(laborMud, 2)}/sheet`, `$${fmt(totals.totalSheets * laborMud, 2)}`);
    costRow("Sand, prime & touch-up", String(totals.totalSheets), "sheets", `$${fmt(laborSandPrime, 2)}/sheet`, `$${fmt(totals.totalSheets * laborSandPrime, 2)}`);
    totalLine("Labor Subtotal", `$${fmt(totals.laborCost, 2)}`);

    /* ── Grand total ── */
    totalLine("TOTAL PROJECT ESTIMATE", `$${fmt(totals.totalCost, 2)}`, true);
    y += 2; divider();

    /* ── Project timeline ── */
    section("Project Timeline");
    row("Total sheets to install", String(totals.totalSheets));
    row("Crew size", `${crewSize} person${crewSize !== 1 ? "s" : ""}`);
    row("Hang & screw phase", `${Math.ceil(totals.totalSheets * 0.5 / (crewSize * 8))} day(s)`);
    row("Tape & mud phase (3 coats)", `${Math.ceil(totals.totalSheets * 0.75 / (crewSize * 8))} day(s)`);
    row("Sand, prime & touch-up phase", `${Math.ceil(totals.totalSheets * 0.25 / (crewSize * 8))} day(s)`);
    row("TOTAL ESTIMATED TIMELINE", `${totals.timelineDays} working day${totals.timelineDays !== 1 ? "s" : ""}`, true);
    y += 2; divider();

    /* ── Per-room detail ── */
    section("Per-Room Detail");
    rooms.forEach((room, i) => {
      const rr = totals.rooms[i];
      subSection(`${room.name}  (${room.shape === "l-shape" ? "L-shape" : "Rectangular"}${room.ceilingType === "vaulted" ? ", vaulted ceiling" : ""})`);
      row(`  Dimensions (L × W × H)`, `${room.length} × ${room.width} × ${room.ceilingHeight} ${lenUnit}`);
      if (room.shape === "l-shape") row(`  Wing dimensions`, `${room.length2} × ${room.width2} ${lenUnit}`);
      if (room.ceilingType === "vaulted") row(`  Vaulted peak height`, `${room.vaultedPeakHeight} ${lenUnit}`);
      row(`  Wall area`, `${fmt(rr.wallArea, 1)} ${areaUnit}`);
      if (room.includeCeiling) row(`  Ceiling area`, `${fmt(rr.ceilingArea, 1)} ${areaUnit}`);
      if (room.openings.length > 0) {
        room.openings.forEach((op) => {
          row(`  Opening: ${op.label}`, `${op.width} × ${op.height} ${lenUnit}  (−${fmt(op.width * op.height, 1)} ${areaUnit})`);
        });
      }
      row(`  Net area (w/ ${waste}% waste)`, `${fmt(rr.netArea, 1)} ${areaUnit}`);
      row(`  Sheets needed`, String(rr.sheets));
      row(`  Screws`, `${rr.screws}`);
      row(`  Joint compound`, `${rr.mudBuckets} bucket${rr.mudBuckets !== 1 ? "s" : ""}`);
      row(`  Tape rolls`, String(rr.tapeRolls));
      row(`  Corner bead`, `${fmt(rr.cornerBeadLf, 1)} LF`);
      row(`  Primer`, `${rr.primerGal} gal`);
      row(`  Paint (2 coats)`, `${rr.paintGal} gal`);
      y += 3;
    });

    divider();
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(130, 130, 130);
    doc.text(doc.splitTextToSize(
      "Estimates for planning only. Actual quantities may vary based on room geometry, cut patterns, installer technique, and on-site conditions. Always verify with a licensed contractor before purchasing materials.",
      pageW - margin * 2
    ), margin, y);
    doc.save(`drywall-estimator-${Date.now()}.pdf`);
  }

  /* ─── JSON-LD ─── */
  const softwareSchema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "Drywall Estimator",
    description: "Free drywall estimator. Calculate sheets, screws, joint compound, tape, and cost for any room. Multiple rooms, deductions, waste factor.",
    url: "https://freeconstructiontools.com/drywall-estimator",
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
              Drywall Estimator
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Calculate exactly how many drywall sheets, screws, rolls of tape, and buckets of joint compound you need for any room or whole house — with door and window deductions, waste factor, and a full cost estimate.
            </p>
          </div>
        </section>

        {/* Estimator */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

            {/* Global settings row */}
            <div className="flex flex-wrap gap-3 mb-8">
              {/* Unit */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {(["imperial", "metric"] as Unit[]).map((v) => (
                  <button key={v} onClick={() => {
                    setUnit(v);
                    setSheetIdx(0);
                    const base = v === "imperial" ? defaultRoomImp : defaultRoomMet;
                    setRooms([{ ...base, id: uid(), openings: base.openings.map((o) => ({ ...o, id: uid() })) }]);
                  }}
                    className={`px-3 h-8 text-xs font-medium rounded capitalize transition-colors ${unit === v ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                    {v}
                  </button>
                ))}
              </div>
              {/* Sheet size */}
              <select value={safeSheetIdx} onChange={(e) => setSheetIdx(Number(e.target.value))}
                className="h-9 px-3 text-xs border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500">
                {sheetSizes.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* ── Left: rooms ── */}
              <div className="lg:col-span-3 space-y-5">

                {/* Global options */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Material Prices</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <NumberField label="Waste (%)" value={waste} onChange={setWaste} min={0} max={50} step={1} />
                    <NumberField label="$/sheet" value={pricePerSheet} onChange={setPricePerSheet} min={0} step={0.5} />
                    <NumberField label="$/100 screws" value={pricePerScrew100} onChange={setPricePerScrew100} min={0} step={0.5} />
                    <NumberField label="$/tape roll" value={pricePerTape} onChange={setPricePerTape} min={0} step={0.5} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <NumberField label="$/mud bucket" value={pricePerMud} onChange={setPricePerMud} min={0} step={0.5} />
                    <NumberField label="$/corner bead LF" value={pricePerCornerBead} onChange={setPricePerCornerBead} min={0} step={0.1} />
                    <NumberField label="$/primer gal" value={pricePerPrimerGal} onChange={setPricePerPrimerGal} min={0} step={1} />
                    <NumberField label="$/paint gal" value={pricePerPaintGal} onChange={setPricePerPaintGal} min={0} step={1} />
                  </div>
                </div>

                {/* Labor options */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Labor Rates</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <NumberField label="$/sheet — hang" value={laborHang} onChange={setLaborHang} min={0} step={1} />
                    <NumberField label="$/sheet — tape/mud" value={laborMud} onChange={setLaborMud} min={0} step={1} />
                    <NumberField label="$/sheet — sand/prime" value={laborSandPrime} onChange={setLaborSandPrime} min={0} step={1} />
                    <NumberField label="Crew size" value={crewSize} onChange={setCrewSize} min={1} max={20} step={1} />
                  </div>
                  <p className="text-xs text-zinc-500">Labor rates are per sheet. Set all to 0 to show materials only.</p>
                </div>

                {/* Room cards */}
                {rooms.map((room, ri) => {
                  const rr = totals.rooms[ri];
                  return (
                    <div key={room.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
                      {/* Room header */}
                      <div className="flex items-center justify-between gap-2">
                        <input value={room.name} onChange={(e) => updateRoom(room.id, "name", e.target.value)}
                          className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 outline-none text-zinc-950 dark:text-white w-full max-w-[200px] py-0.5 transition-colors" />
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-zinc-500 tabular-nums">{rr ? `${rr.sheets} sheets` : ""}</span>
                          {rooms.length > 1 && (
                            <button onClick={() => removeRoom(room.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Shape selector */}
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1 self-start">
                        {(["rectangular", "l-shape"] as RoomShape[]).map((s) => (
                          <button key={s} onClick={() => updateRoom(room.id, "shape", s)}
                            className={`px-3 h-7 text-xs font-medium rounded capitalize transition-colors ${room.shape === s ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                            {s === "l-shape" ? "L-shape" : "Rectangular"}
                          </button>
                        ))}
                      </div>

                      {/* Dimensions */}
                      <div className="grid grid-cols-3 gap-3">
                        <NumberField label={`Length (${lenUnit})`} value={room.length} onChange={(v) => updateRoom(room.id, "length", v)} min={0.1} step={u ? 0.5 : 0.1} />
                        <NumberField label={`Width (${lenUnit})`} value={room.width} onChange={(v) => updateRoom(room.id, "width", v)} min={0.1} step={u ? 0.5 : 0.1} />
                        <NumberField label={`Height (${lenUnit})`} value={room.ceilingHeight} onChange={(v) => updateRoom(room.id, "ceilingHeight", v)} min={0.1} step={u ? 0.5 : 0.1} />
                      </div>

                      {/* L-shape second section */}
                      {room.shape === "l-shape" && (
                        <div className="grid grid-cols-2 gap-3">
                          <NumberField label={`Wing length (${lenUnit})`} value={room.length2} onChange={(v) => updateRoom(room.id, "length2", v)} min={0.1} step={u ? 0.5 : 0.1} />
                          <NumberField label={`Wing width (${lenUnit})`} value={room.width2} onChange={(v) => updateRoom(room.id, "width2", v)} min={0.1} step={u ? 0.5 : 0.1} />
                        </div>
                      )}

                      {/* Ceiling toggle + type */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                          <input type="checkbox" checked={room.includeCeiling}
                            onChange={(e) => updateRoom(room.id, "includeCeiling", e.target.checked)}
                            className="w-3.5 h-3.5 accent-indigo-600" />
                          Include ceiling
                          {room.includeCeiling && rr && (
                            <span className="ml-1 text-zinc-400">— adds {fmt(rr.ceilingArea, 1)} {areaUnit}</span>
                          )}
                        </label>
                        {room.includeCeiling && (
                          <div className="flex items-center gap-3 pl-5">
                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1">
                              {(["flat", "vaulted"] as CeilingType[]).map((ct) => (
                                <button key={ct} onClick={() => updateRoom(room.id, "ceilingType", ct)}
                                  className={`px-3 h-7 text-xs font-medium rounded capitalize transition-colors ${room.ceilingType === ct ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"}`}>
                                  {ct}
                                </button>
                              ))}
                            </div>
                            {room.ceilingType === "vaulted" && (
                              <NumberField label={`Peak height (${lenUnit})`} value={room.vaultedPeakHeight} onChange={(v) => updateRoom(room.id, "vaultedPeakHeight", v)} min={room.ceilingHeight} step={u ? 0.5 : 0.1} />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Openings */}
                      {room.openings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-zinc-500">Openings (deducted)</p>
                          {room.openings.map((op) => (
                            <div key={op.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1">Label</label>
                                <input value={op.label} onChange={(e) => updateOpening(room.id, op.id, "label", e.target.value)}
                                  className="w-full h-9 px-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none" />
                              </div>
                              <NumberField label={`W (${lenUnit})`} value={op.width} onChange={(v) => updateOpening(room.id, op.id, "width", v)} min={0.1} step={u ? 0.5 : 0.1} />
                              <NumberField label={`H (${lenUnit})`} value={op.height} onChange={(v) => updateOpening(room.id, op.id, "height", v)} min={0.1} step={u ? 0.5 : 0.1} />
                              <button onClick={() => removeOpening(room.id, op.id)} className="h-10 text-zinc-400 hover:text-red-500 transition-colors flex items-center">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => addOpening(room.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add door / window
                      </button>

                      {/* Mini result bar */}
                      {rr && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          {[
                            { label: "Net area", val: `${fmt(rr.netArea, 1)} ${areaUnit}` },
                            { label: "Sheets", val: String(rr.sheets) },
                            { label: "Screws", val: String(rr.screws) },
                            { label: "Mud", val: `${rr.mudBuckets} bucket${rr.mudBuckets !== 1 ? "s" : ""}` },
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-white dark:bg-zinc-950 rounded-md p-2 border border-zinc-100 dark:border-zinc-800">
                              <div className="text-xs text-zinc-500">{label}</div>
                              <div className="text-sm font-semibold text-zinc-950 dark:text-white tabular-nums">{val}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button onClick={addRoom}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 transition-colors">
                  <Plus className="w-4 h-4" /> Add another room
                </button>
              </div>

              {/* ── Right: totals ── */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 lg:sticky lg:top-24 space-y-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Total Estimate</div>

                  <div>
                    <div className="text-5xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums">{totals.totalSheets}</div>
                    <div className="text-sm text-zinc-500 mt-1">sheets of drywall</div>
                  </div>

                  <dl className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <Row label="Net area" value={`${fmt(totals.totalNetArea, 1)} ${areaUnit}`} />
                    <Row label="Sheet size" value={sheetSizes[safeSheetIdx].label} />
                    <Row label="Sheets needed" value={String(totals.totalSheets)} accent />
                    <Row label="Screws" value={totals.totalScrews.toLocaleString()} />
                    <Row label="Tape rolls (500 ft)" value={String(totals.totalTapeRolls)} />
                    <Row label="Joint compound" value={`${totals.totalMudBuckets} bucket${totals.totalMudBuckets !== 1 ? "s" : ""}`} />
                  </dl>


                  {/* Finish materials */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Finish Materials</p>
                    <dl className="space-y-2">
                      <Row label="Corner bead" value={`${fmt(totals.totalCornerBeadLf, 1)} LF`} />
                      <Row label="Primer" value={`${totals.totalPrimerGal} gal`} />
                      <Row label="Paint (2 coats)" value={`${totals.totalPaintGal} gal`} accent />
                    </dl>
                  </div>

                  {/* Cost breakdown */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Cost Breakdown</p>
                    <dl className="space-y-2">
                      <Row label="Sheets" value={`$${fmt(totals.totalSheets * pricePerSheet, 2)}`} />
                      <Row label="Screws" value={`$${fmt((totals.totalScrews / 100) * pricePerScrew100, 2)}`} />
                      <Row label="Tape" value={`$${fmt(totals.totalTapeRolls * pricePerTape, 2)}`} />
                      <Row label="Joint compound" value={`$${fmt(totals.totalMudBuckets * pricePerMud, 2)}`} />
                      <Row label="Corner bead" value={`$${fmt(totals.totalCornerBeadLf * pricePerCornerBead, 2)}`} />
                      <Row label="Primer" value={`$${fmt(totals.totalPrimerGal * pricePerPrimerGal, 2)}`} />
                      <Row label="Paint" value={`$${fmt(totals.totalPaintGal * pricePerPaintGal, 2)}`} />
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <dt className="text-xs text-zinc-500">Materials subtotal</dt>
                        <dd className="text-sm font-semibold tabular-nums text-zinc-950 dark:text-white">${fmt(totals.materialCost, 2)}</dd>
                      </div>
                      <Row label="Labor" value={`$${fmt(totals.laborCost, 2)}`} />
                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <dt className="text-sm font-semibold text-zinc-950 dark:text-white">Total estimate</dt>
                        <dd className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">${fmt(totals.totalCost, 2)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Project timeline */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Project Timeline</p>
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-3 text-center">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{totals.timelineDays}</div>
                      <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">est. working {totals.timelineDays === 1 ? "day" : "days"} · crew of {crewSize}</div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-zinc-500">
                      <div className="flex justify-between"><span>Hang &amp; screw</span><span className="tabular-nums">{Math.ceil(totals.totalSheets * 0.5 / (crewSize * 8))} day(s)</span></div>
                      <div className="flex justify-between"><span>Tape &amp; mud (3 coats)</span><span className="tabular-nums">{Math.ceil(totals.totalSheets * 0.75 / (crewSize * 8))} day(s)</span></div>
                      <div className="flex justify-between"><span>Sand, prime &amp; touch-up</span><span className="tabular-nums">{Math.ceil(totals.totalSheets * 0.25 / (crewSize * 8))} day(s)</span></div>
                    </div>
                  </div>

                  {/* Per-room summary */}
                  {rooms.length > 1 && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Per Room</p>
                      <dl className="space-y-1.5">
                        {rooms.map((room, i) => (
                          <div key={room.id} className="flex items-center justify-between gap-4">
                            <dt className="text-xs text-zinc-500 truncate">{room.name}</dt>
                            <dd className="text-xs font-semibold text-zinc-950 dark:text-white tabular-nums whitespace-nowrap">{totals.rooms[i]?.sheets ?? 0} sheets</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    Includes materials and labour. Adjust labor rates or set to 0 for materials-only estimate.
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

        {/* Tips */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-5xl">
              <Badge variant="neutral" className="mb-4">Tips</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-6">
                Drywall installation tips
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {TIPS.map((tip) => (
                  <div key={tip.term} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                    <h3 className="font-semibold text-zinc-950 dark:text-white text-sm mb-2">{tip.term}</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{tip.body}</p>
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
                How to estimate drywall
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                <p>
                  Add each room with its length, width, and ceiling height. Toggle ceiling inclusion and add any doors or windows — their area is automatically deducted from the total. Adjust the sheet size, waste percentage, and unit prices to match your local market.
                </p>
                <p>
                  For the framing behind the drywall, see our{" "}
                  <Link href="/lumber-calculator" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">Lumber Calculator</Link>.
                  {" "}To estimate the concrete slab or floor, use the{" "}
                  <Link href="/concrete-calculator" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">Concrete Calculator</Link>.
                  {" "}Browse all{" "}
                  <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700">Construction tools</Link>.
                </p>
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 font-mono text-xs sm:text-sm space-y-1">
                  <div>Wall area       = 2 × (L + W) × H  [L-shape adds wing walls]</div>
                  <div>Vaulted ceil.   = floor_area × (slope_length ÷ half_span)</div>
                  <div>Net area        = (wall + ceiling − openings) × (1 + waste%)</div>
                  <div>Sheets          = ⌈ net_area ÷ sheet_size ⌉</div>
                  <div>Corner bead     = corners × height + opening_jambs</div>
                  <div>Primer          = ⌈ net_area ÷ 350 sq ft/gal ⌉</div>
                  <div>Paint (2 coats) = ⌈ net_area ÷ 175 sq ft/gal ⌉</div>
                  <div>Labor cost      = sheets × (hang + mud + sand rates)</div>
                  <div>Timeline        = ⌈ sheets × 1.5 hrs ÷ (crew × 8 hrs) ⌉</div>
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
                  <span className="font-medium">Reviewed by: Liam Santos.</span> Liam reviews our construction calculators to confirm accurate material quantities and practical defaults for real-world projects.
                </p>
                <p className="text-xs text-zinc-500">Last updated: May 2026</p>
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Important disclaimer:</span> Estimates are for material planning only. Actual quantities depend on room geometry, cut patterns, and installer technique. Labour, corner bead, primer, and accessory costs are not included. Always consult a licensed contractor before purchasing materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RelatedCategoryTools category="construction" currentSlug="drywall-estimator" />

        {/* CTA */}
        <section className="bg-zinc-950 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
              More construction tools coming.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Paint coverage, tile calculator, flooring estimator, fence calculator, and more are next.
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
