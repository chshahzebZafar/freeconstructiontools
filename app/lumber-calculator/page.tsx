"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Hammer, ChevronDown, Download, Plus, Trash2, Save } from "lucide-react";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";

/* ─────────────────────────── types ─────────────────────────── */
type Unit = "imperial" | "metric";
type Mode = "framing" | "boards" | "sheets";

interface Opening { id: number; type: "door" | "window"; width: number; }
interface Wall { id: number; length: number; height: number; }
interface BoardRow { id: number; nomKey: string; stockLen: number; linearRun: number; waste: number; pricePerPiece: number; }
interface SavedEstimate { id: number; label: string; mode: Mode; unit: Unit; summary: string; cost: string; ts: string; }

/* ─────────────────────────── helpers ─────────────────────────── */
function fmt(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

// Actual dimensions (inches) for common nominal sizes
const NOMINAL_SIZES: Record<string, { t: number; w: number; label: string }> = {
  "2x2": { t: 1.5, w: 1.5, label: "2×2 (1.5″×1.5″)" },
  "2x3": { t: 1.5, w: 2.5, label: "2×3 (1.5″×2.5″)" },
  "2x4": { t: 1.5, w: 3.5, label: "2×4 (1.5″×3.5″)" },
  "2x6": { t: 1.5, w: 5.5, label: "2×6 (1.5″×5.5″)" },
  "2x8": { t: 1.5, w: 7.25, label: "2×8 (1.5″×7.25″)" },
  "2x10": { t: 1.5, w: 9.25, label: "2×10 (1.5″×9.25″)" },
  "2x12": { t: 1.5, w: 11.25, label: "2×12 (1.5″×11.25″)" },
  "4x4": { t: 3.5, w: 3.5, label: "4×4 (3.5″×3.5″)" },
  "1x4": { t: 0.75, w: 3.5, label: "1×4 (0.75″×3.5″)" },
  "1x6": { t: 0.75, w: 5.5, label: "1×6 (0.75″×5.5″)" },
  "1x8": { t: 0.75, w: 7.25, label: "1×8 (0.75″×7.25″)" },
};

const METRIC_SIZES: Record<string, { t: number; w: number; label: string }> = {
  "90x45": { t: 45, w: 90, label: "90×45 mm" },
  "90x35": { t: 35, w: 90, label: "90×35 mm" },
  "140x45": { t: 45, w: 140, label: "140×45 mm" },
  "190x45": { t: 45, w: 190, label: "190×45 mm" },
  "240x45": { t: 45, w: 240, label: "240×45 mm" },
  "70x35": { t: 35, w: 70, label: "70×35 mm" },
  "42x19": { t: 19, w: 42, label: "42×19 mm" },
};

const STOCK_LENGTHS_IMP = [8, 10, 12, 14, 16, 20];   // feet
const STOCK_LENGTHS_MET = [2.4, 3.0, 3.6, 4.2, 4.8, 6.0]; // meters

const SHEET_SIZES_IMP = [
  { label: "4×8 ft (standard)", w: 4, h: 8 },
  { label: "4×10 ft", w: 4, h: 10 },
  { label: "4×12 ft", w: 4, h: 12 },
];
const SHEET_SIZES_MET = [
  { label: "1220×2440 mm (standard)", w: 1.22, h: 2.44 },
  { label: "1220×3050 mm", w: 1.22, h: 3.05 },
  { label: "1200×2400 mm", w: 1.2, h: 2.4 },
];

/* ─────────────────────── calc: framing ─────────────────────── */
interface FramingWallResult {
  wallId: number;
  length: number;
  height: number;
  studCount: number;
  jackStuds: number;
  crippleStuds: number;
  platePieces: number;
}
interface FramingResult {
  walls: FramingWallResult[];
  totalStuds: number;
  totalPlates: number;
  totalJack: number;
  totalCripple: number;
  totalBF: number;
  totalM3: number;
  offcutFt: number;
  costByPiece: number;
  costByVolume: number;
}

function calcFramingWall(
  unit: Unit,
  wall: Wall,
  spacingRaw: number,
  nomKey: string,
  stockLen: number,
  doublePlate: boolean,
  openings: Opening[]
): FramingWallResult {
  const spacing = unit === "imperial" ? spacingRaw / 12 : spacingRaw / 1000;
  const baseStuds = Math.ceil(wall.length / spacing) + 1 + 2; // +1 end stud +2 corners

  // Openings: each door needs 2 jack + 1 header; each window needs 2 jack + 2 cripple
  let removedStuds = 0;
  let jackStuds = 0;
  let crippleStuds = 0;
  for (const o of openings) {
    const openingStuds = Math.floor(o.width / (unit === "imperial" ? spacingRaw / 12 : spacingRaw / 1000));
    removedStuds += Math.max(0, openingStuds - 1);
    jackStuds += 2;
    if (o.type === "window") crippleStuds += 4; // sill + header cripples
    else crippleStuds += 2; // header cripples only
  }

  const studCount = Math.max(1, baseStuds - removedStuds);
  const plateRuns = doublePlate ? 3 : 2;
  const platePieces = Math.ceil((wall.length * plateRuns) / stockLen);

  return { wallId: wall.id, length: wall.length, height: wall.height, studCount, jackStuds, crippleStuds, platePieces };
}

function calcFraming(
  unit: Unit,
  walls: Wall[],
  spacingRaw: number,
  nomKey: string,
  stockLengthRaw: number,
  doublePlate: boolean,
  waste: number,
  pricePerPiece: number,
  pricePerBF: number,
  openings: Opening[]
): FramingResult {
  const sizes = unit === "imperial" ? NOMINAL_SIZES : METRIC_SIZES;
  const dim = sizes[nomKey] ?? Object.values(sizes)[0];
  const stockLen = stockLengthRaw;

  const wallResults = walls.map((w) => calcFramingWall(unit, w, spacingRaw, nomKey, stockLen, doublePlate, openings));

  const totalStuds = wallResults.reduce((s, w) => s + w.studCount, 0);
  const totalJack = wallResults.reduce((s, w) => s + w.jackStuds, 0);
  const totalCripple = wallResults.reduce((s, w) => s + w.crippleStuds, 0);
  const totalPlates = wallResults.reduce((s, w) => s + w.platePieces, 0);
  const totalPieces = totalStuds + totalJack + totalCripple + totalPlates;

  let totalBF = 0;
  let totalM3 = 0;

  if (unit === "imperial") {
    wallResults.forEach((w) => {
      const studBF = dim.t * dim.w * w.height / 12;
      const plateBF = dim.t * dim.w * stockLen / 12;
      totalBF += (w.studCount + w.jackStuds + w.crippleStuds) * studBF + w.platePieces * plateBF;
    });
    totalBF *= (1 + waste / 100);
  } else {
    wallResults.forEach((w) => {
      const studM3 = (dim.t / 1000) * (dim.w / 1000) * w.height;
      const plateM3 = (dim.t / 1000) * (dim.w / 1000) * stockLen;
      totalM3 += (w.studCount + w.jackStuds + w.crippleStuds) * studM3 + w.platePieces * plateM3;
    });
    totalM3 *= (1 + waste / 100);
  }

  const totalWallLength = walls.reduce((s, w) => s + w.length, 0);
  const plateRuns = doublePlate ? 3 : 2;
  const offcutFt = Math.max(0, totalPlates * stockLen - totalWallLength * plateRuns);
  const costByPiece = totalPieces * pricePerPiece * (1 + waste / 100);
  const costByVolume = unit === "imperial" ? totalBF * pricePerBF : totalM3 * pricePerBF;

  return { walls: wallResults, totalStuds, totalPlates, totalJack, totalCripple, totalBF, totalM3, offcutFt, costByPiece, costByVolume };
}

/* ─────────────────────── calc: boards ─────────────────────── */
interface BoardRowResult {
  id: number;
  nomKey: string;
  stockLen: number;
  linearRun: number;
  piecesNeeded: number;
  totalBF: number;
  totalM3: number;
  offcutLength: number;
  costEstimate: number;
}
interface BoardResult {
  rows: BoardRowResult[];
  totalPieces: number;
  totalBF: number;
  totalM3: number;
  totalCost: number;
}

function calcBoards(unit: Unit, rows: BoardRow[]): BoardResult {
  const sizes = unit === "imperial" ? NOMINAL_SIZES : METRIC_SIZES;
  const rowResults: BoardRowResult[] = rows.map((r) => {
    const dim = sizes[r.nomKey] ?? Object.values(sizes)[0];
    const runWithWaste = r.linearRun * (1 + r.waste / 100);
    const piecesNeeded = Math.ceil(runWithWaste / r.stockLen);
    const totalLength = piecesNeeded * r.stockLen;
    const offcutLength = Math.max(0, totalLength - runWithWaste);
    let totalBF = 0, totalM3 = 0;
    if (unit === "imperial") totalBF = dim.t * dim.w * totalLength / 12;
    else totalM3 = (dim.t / 1000) * (dim.w / 1000) * totalLength;
    return { id: r.id, nomKey: r.nomKey, stockLen: r.stockLen, linearRun: r.linearRun, piecesNeeded, totalBF, totalM3, offcutLength, costEstimate: piecesNeeded * r.pricePerPiece };
  });
  return {
    rows: rowResults,
    totalPieces: rowResults.reduce((s, r) => s + r.piecesNeeded, 0),
    totalBF: rowResults.reduce((s, r) => s + r.totalBF, 0),
    totalM3: rowResults.reduce((s, r) => s + r.totalM3, 0),
    totalCost: rowResults.reduce((s, r) => s + r.costEstimate, 0),
  };
}

/* ─────────────────────── calc: sheets ─────────────────────── */
interface SheetResult {
  sheetsNeeded: number;
  rawArea: number;
  areaCoverage: number;
  wasteArea: number;
  wastePercent: number;
  costEstimate: number;
}

function calcSheets(
  areaW: number,
  areaH: number,
  sheetW: number,
  sheetH: number,
  waste: number,
  pricePerSheet: number
): SheetResult {
  const rawArea = areaW * areaH;
  const totalArea = rawArea * (1 + waste / 100);
  const sheetArea = sheetW * sheetH;
  const sheetsNeeded = Math.ceil(totalArea / sheetArea);
  const areaCoverage = sheetsNeeded * sheetArea;
  const wasteArea = areaCoverage - rawArea;
  const wastePercent = rawArea > 0 ? (wasteArea / (areaCoverage)) * 100 : 0;
  return { sheetsNeeded, rawArea, areaCoverage, wasteArea, wastePercent, costEstimate: sheetsNeeded * pricePerSheet };
}

/* ─────────────────────── sub-components ─────────────────────── */
function NumberField({ label, value, onChange, min = 0, max, step = 1, unit: unitSuffix = "" }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
        />
        {unitSuffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">{unitSuffix}</span>
        )}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-semibold text-zinc-950 dark:text-white tabular-nums">{value}</dd>
    </div>
  );
}

/* ─────────────────────── FAQ data ─────────────────────── */
const faqs = [
  {
    question: "What's the difference between nominal and actual lumber size?",
    answer: "Nominal sizes (like 2×4) refer to the rough-sawn dimensions before drying and planing. A finished 2×4 actually measures 1.5″ × 3.5″. This calculator uses actual finished dimensions for volume and board-foot calculations.",
  },
  {
    question: "How much waste should I allow?",
    answer: "5–10% for clean cuts on straight runs. 10–15% for framing with openings, corners, and blocking. Up to 20% for complex layouts, diagonal cuts, or lower-grade lumber with more defects. When in doubt, go 10%.",
  },
  {
    question: "Can I price by board foot or by m³?",
    answer: "Yes. The calculator shows board feet (imperial) or cubic meters (metric). Enter a price per piece for a per-piece estimate, or use the BF/m³ figures with your supplier's rate for a volume-based cost.",
  },
  {
    question: "What is a board foot?",
    answer: "A board foot (BF) is a unit of volume equal to 1 inch thick × 12 inches wide × 12 inches long (144 cubic inches). Formula: Thickness(in) × Width(in) × Length(ft) ÷ 12 = BF.",
  },
  {
    question: "How are stud counts calculated?",
    answer: "Studs = ceil(wall length ÷ spacing) + 1 king stud + 2 corner studs. Plate pieces are based on stock length vs wall length, with 2 runs (single top plate + bottom) or 3 runs (double top plate + bottom).",
  },
];

/* ─────────────────────── main component ─────────────────────── */
let _id = 0;
const uid = () => ++_id;

export default function LumberCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [mode, setMode] = useState<Mode>("framing");

  // ── Framing state ──
  const [walls, setWalls] = useState<Wall[]>([{ id: uid(), length: 20, height: 8 }]);
  const [studSpacing, setStudSpacing] = useState(16);
  const [framingNom, setFramingNom] = useState("2x4");
  const [framingStock, setFramingStock] = useState(8);
  const [doublePlate, setDoublePlate] = useState(true);
  const [framingWaste, setFramingWaste] = useState(10);
  const [framingPrice, setFramingPrice] = useState(5.5);
  const [framingPriceBF, setFramingPriceBF] = useState(0);
  const [openings, setOpenings] = useState<Opening[]>([]);

  // ── Boards state ──
  const [boardRows, setBoardRows] = useState<BoardRow[]>([{ id: uid(), nomKey: "1x6", stockLen: 8, linearRun: 50, waste: 10, pricePerPiece: 8 }]);

  // ── Sheets state ──
  const [areaW, setAreaW] = useState(20);
  const [areaH, setAreaH] = useState(12);
  const [sheetSizeIdx, setSheetSizeIdx] = useState(0);
  const [customSheet, setCustomSheet] = useState(false);
  const [customSheetW, setCustomSheetW] = useState(4);
  const [customSheetH, setCustomSheetH] = useState(8);
  const [sheetWaste, setSheetWaste] = useState(10);
  const [sheetPrice, setSheetPrice] = useState(55);

  // ── UI state ──
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lumber-estimates");
      if (stored) setSavedEstimates(JSON.parse(stored));
    } catch {}
  }, []);

  const nomSizes = unit === "imperial" ? NOMINAL_SIZES : METRIC_SIZES;
  const stockLengths = unit === "imperial" ? STOCK_LENGTHS_IMP : STOCK_LENGTHS_MET;
  const sheetSizes = unit === "imperial" ? SHEET_SIZES_IMP : SHEET_SIZES_MET;
  const lenUnit = unit === "imperial" ? "ft" : "m";
  const spacingUnit = unit === "imperial" ? "in" : "mm";

  const framingResult = useMemo(() => calcFraming(
    unit, walls, studSpacing, framingNom, framingStock, doublePlate, framingWaste, framingPrice, framingPriceBF, openings
  ), [unit, walls, studSpacing, framingNom, framingStock, doublePlate, framingWaste, framingPrice, framingPriceBF, openings]);

  const boardResult = useMemo(() => calcBoards(unit, boardRows), [unit, boardRows]);

  const sheetResult = useMemo(() => {
    const s = customSheet ? { w: customSheetW, h: customSheetH } : sheetSizes[sheetSizeIdx];
    return calcSheets(areaW, areaH, s.w, s.h, sheetWaste, sheetPrice);
  }, [areaW, areaH, sheetSizeIdx, sheetWaste, sheetPrice, sheetSizes, customSheet, customSheetW, customSheetH]);

  // ── Wall helpers ──
  function addWall() { setWalls((w) => [...w, { id: uid(), length: 10, height: 8 }]); }
  function removeWall(id: number) { setWalls((w) => w.filter((x) => x.id !== id)); }
  function updateWall(id: number, field: "length" | "height", val: number) {
    setWalls((w) => w.map((x) => x.id === id ? { ...x, [field]: val } : x));
  }

  // ── Opening helpers ──
  function addOpening(type: "door" | "window") { setOpenings((o) => [...o, { id: uid(), type, width: type === "door" ? (unit === "imperial" ? 3 : 0.9) : (unit === "imperial" ? 2 : 0.6) }]); }
  function removeOpening(id: number) { setOpenings((o) => o.filter((x) => x.id !== id)); }
  function updateOpening(id: number, width: number) { setOpenings((o) => o.map((x) => x.id === id ? { ...x, width } : x)); }

  // ── Board row helpers ──
  function addBoardRow() {
    setBoardRows((r) => [...r, { id: uid(), nomKey: unit === "imperial" ? "1x6" : "90x45", stockLen: unit === "imperial" ? 8 : 2.4, linearRun: 20, waste: 10, pricePerPiece: 8 }]);
  }
  function removeBoardRow(id: number) { setBoardRows((r) => r.filter((x) => x.id !== id)); }
  function updateBoardRow<K extends keyof BoardRow>(id: number, field: K, val: BoardRow[K]) {
    setBoardRows((r) => r.map((x) => x.id === id ? { ...x, [field]: val } : x));
  }

  // ── Save estimate ──
  function saveEstimate() {
    let summary = "", cost = "";
    if (mode === "framing") {
      summary = `${framingResult.totalStuds + framingResult.totalPlates} pcs, ${walls.length} wall(s)`;
      cost = `$${fmt(framingResult.costByPiece > 0 ? framingResult.costByPiece : framingResult.costByVolume, 2)}`;
    } else if (mode === "boards") {
      summary = `${boardResult.totalPieces} pcs, ${boardRows.length} row(s)`;
      cost = `$${fmt(boardResult.totalCost, 2)}`;
    } else {
      summary = `${sheetResult.sheetsNeeded} sheets`;
      cost = `$${fmt(sheetResult.costEstimate, 2)}`;
    }
    const newList = [...savedEstimates, {
      id: uid(), label: saveLabel || `Estimate ${savedEstimates.length + 1}`,
      mode, unit, summary, cost, ts: new Date().toLocaleDateString()
    }];
    setSavedEstimates(newList);
    setSaveLabel("");
    try { localStorage.setItem("lumber-estimates", JSON.stringify(newList)); } catch {}
  }
  function deleteEstimate(id: number) {
    const newList = savedEstimates.filter((e) => e.id !== id);
    setSavedEstimates(newList);
    try { localStorage.setItem("lumber-estimates", JSON.stringify(newList)); } catch {}
  }

  // ── PDF export using jsPDF ──
  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const col2 = 115;
    let y = 20;

    const section = (title: string) => {
      y += 4;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 11;
    };
    const row = (label: string, value: string) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
      doc.text(value, col2, y);
      y += 7;
    };
    const divider = () => { doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 5; };

    doc.setFillColor(20, 20, 20); doc.rect(0, 0, pageW, 16, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
    doc.text("Lumber Calculator Report", margin, 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(180, 180, 180);
    doc.text(`freeconstructiontools.com  |  ${ts}`, pageW - margin, 11, { align: "right" });
    y = 28;

    const modeLabel = mode === "framing" ? "Framing Lumber" : mode === "boards" ? "Boards & Trim" : "Sheet Goods";
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
    doc.text(`Mode: ${modeLabel}   |   Units: ${unit === "imperial" ? "Imperial" : "Metric"}`, margin, y);
    y += 10; divider();

    section("Inputs");
    if (mode === "framing") {
      walls.forEach((w, i) => row(`Wall ${i + 1}`, `${w.length} ${lenUnit} × ${w.height} ${lenUnit} H`));
      row("Stud spacing", `${studSpacing} ${spacingUnit}`);
      row("Lumber size", nomSizes[framingNom]?.label ?? framingNom);
      row("Stock length", `${framingStock} ${lenUnit}`);
      row("Top plate", doublePlate ? "Double" : "Single");
      row("Openings", openings.length > 0 ? openings.map((o) => `${o.type} ${o.width}${lenUnit}`).join(", ") : "None");
      row("Waste", `${framingWaste}%`);
      row("Price/piece", `$${framingPrice}`);
      if (framingPriceBF > 0) row(`Price/BF or m\u00B3`, `$${framingPriceBF}`);
    } else if (mode === "boards") {
      boardRows.forEach((r, i) => {
        row(`Row ${i + 1} — ${nomSizes[r.nomKey]?.label ?? r.nomKey}`, `${r.linearRun} ${lenUnit} run @ $${r.pricePerPiece}/pc`);
      });
    } else {
      const s = customSheet ? { label: `${customSheetW}×${customSheetH} ${lenUnit} (custom)` } : sheetSizes[sheetSizeIdx];
      row("Area", `${areaW} × ${areaH} ${lenUnit}`);
      row("Sheet size", s.label);
      row("Waste", `${sheetWaste}%`);
      row("Price/sheet", `$${sheetPrice}`);
    }
    y += 2; divider();

    section("Results");
    if (mode === "framing") {
      row("Regular studs", String(framingResult.totalStuds));
      row("Jack studs (openings)", String(framingResult.totalJack));
      row("Cripple studs", String(framingResult.totalCripple));
      row("Plate pieces", String(framingResult.totalPlates));
      if (unit === "imperial") row("Total board feet", `${fmt(framingResult.totalBF)} BF`);
      else row("Total volume", `${fmt(framingResult.totalM3, 4)} m\u00B3`);
      row("Est. offcut", `${fmt(framingResult.offcutFt, 1)} ${lenUnit}`);
      if (framingPrice > 0) row("Cost (by piece)", `$${fmt(framingResult.costByPiece, 2)}`);
      if (framingPriceBF > 0) row("Cost (by volume)", `$${fmt(framingResult.costByVolume, 2)}`);
    } else if (mode === "boards") {
      boardResult.rows.forEach((r, i) => {
        row(`Row ${i + 1} pieces`, `${r.piecesNeeded} pcs  |  offcut ${fmt(r.offcutLength, 2)} ${lenUnit}  |  $${fmt(r.costEstimate, 2)}`);
      });
      row("Total pieces", String(boardResult.totalPieces));
      if (unit === "imperial") row("Total board feet", `${fmt(boardResult.totalBF)} BF`);
      else row("Total volume", `${fmt(boardResult.totalM3, 4)} m\u00B3`);
      row("Total cost", `$${fmt(boardResult.totalCost, 2)}`);
    } else {
      row("Sheets needed", String(sheetResult.sheetsNeeded));
      row("Coverage", `${fmt(sheetResult.areaCoverage)} ${lenUnit}\u00B2`);
      row("Waste area", `${fmt(sheetResult.wasteArea)} ${lenUnit}\u00B2 (${fmt(sheetResult.wastePercent, 1)}%)`);
      row("Est. cost", `$${fmt(sheetResult.costEstimate, 2)}`);
    }
    y += 4; divider();

    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    const disclaimer = "These estimates are for general planning purposes only. Actual quantities depend on material grade, building code compliance, and on-site conditions. Always verify with your supplier before ordering.";
    doc.text(doc.splitTextToSize(disclaimer, pageW - margin * 2), margin, y);
    doc.save(`lumber-calculator-${Date.now()}.pdf`);
  }

  /* ── JSON-LD ── */
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Lumber Calculator",
    description: "Free lumber calculator for framing studs, boards & trim, and sheet goods (plywood/OSB). Board feet, m³, waste, and cost.",
    url: "https://freeconstructiontools.com/lumber-calculator",
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
              Lumber Calculator
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Fast, simple estimates for framing, boards & trim, and sheet goods — with waste & pricing. Imperial and metric.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

            {/* Unit + Mode switchers */}
            <div className="flex flex-wrap gap-3 mb-8">
              {/* Unit */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {(["imperial", "metric"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => {
                      setUnit(u);
                      setStudSpacing(u === "imperial" ? 16 : 400);
                      setFramingNom(u === "imperial" ? "2x4" : "90x45");
                      setFramingStock(u === "imperial" ? 8 : 2.4);
                    }}
                    className={`px-3 h-8 text-xs font-medium rounded capitalize transition-colors ${
                      unit === u
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              {/* Mode */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                {([
                  { key: "framing", label: "Framing" },
                  { key: "boards", label: "Boards & Trim" },
                  { key: "sheets", label: "Sheet Goods" },
                ] as { key: Mode; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`px-3 h-8 text-xs font-medium rounded transition-colors ${
                      mode === key
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* ── Inputs ── */}
              <div className="lg:col-span-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 space-y-5">

                {/* ── FRAMING ── */}
                {mode === "framing" && (
                  <>
                    {/* Walls */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Walls</span>
                        <button onClick={addWall} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                          <Plus className="w-3 h-3" /> Add wall
                        </button>
                      </div>
                      <div className="space-y-2">
                        {walls.map((w, i) => (
                          <div key={w.id} className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 w-14 flex-shrink-0">Wall {i + 1}</span>
                            <input type="number" min={1} step={0.5} value={w.length} onChange={(e) => updateWall(w.id, "length", parseFloat(e.target.value) || 1)}
                              className="flex-1 h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" placeholder={`L (${lenUnit})`} />
                            <input type="number" min={1} step={0.5} value={w.height} onChange={(e) => updateWall(w.id, "height", parseFloat(e.target.value) || 1)}
                              className="flex-1 h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" placeholder={`H (${lenUnit})`} />
                            {walls.length > 1 && (
                              <button onClick={() => removeWall(w.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <NumberField label={`Stud spacing (${spacingUnit})`} value={studSpacing} onChange={setStudSpacing} min={1} step={unit === "imperial" ? 1 : 10} />
                    <SelectField label="Lumber size (nominal)" value={framingNom} onChange={setFramingNom}
                      options={Object.entries(nomSizes).map(([k, v]) => ({ value: k, label: v.label }))} />
                    <SelectField label={`Stock length (${lenUnit})`} value={String(framingStock)}
                      onChange={(v) => setFramingStock(parseFloat(v))}
                      options={stockLengths.map((l) => ({ value: String(l), label: `${l} ${lenUnit}` }))} />
                    <div className="flex items-center gap-3">
                      <input id="double-plate" type="checkbox" checked={doublePlate} onChange={(e) => setDoublePlate(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 accent-indigo-600" />
                      <label htmlFor="double-plate" className="text-sm text-zinc-700 dark:text-zinc-300 select-none">Double top plate</label>
                    </div>

                    {/* Openings */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Openings (doors & windows)</span>
                        <div className="flex gap-2">
                          <button onClick={() => addOpening("door")} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"><Plus className="w-3 h-3" />Door</button>
                          <button onClick={() => addOpening("window")} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"><Plus className="w-3 h-3" />Window</button>
                        </div>
                      </div>
                      {openings.length === 0 && <p className="text-xs text-zinc-400">No openings — studs will not be deducted.</p>}
                      <div className="space-y-2">
                        {openings.map((o) => (
                          <div key={o.id} className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 w-14 flex-shrink-0 capitalize">{o.type}</span>
                            <input type="number" min={0.1} step={0.1} value={o.width} onChange={(e) => updateOpening(o.id, parseFloat(e.target.value) || 0.1)}
                              className="flex-1 h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" placeholder={`Width (${lenUnit})`} />
                            <button onClick={() => removeOpening(o.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label="Waste (%)" value={framingWaste} onChange={setFramingWaste} min={0} max={50} step={1} />
                      <NumberField label="Price/piece ($)" value={framingPrice} onChange={setFramingPrice} min={0} step={0.5} />
                    </div>
                    <NumberField label={`Price per BF${unit === "metric" ? "/m³" : ""} ($) — optional`} value={framingPriceBF} onChange={setFramingPriceBF} min={0} step={0.1} />
                  </>
                )}

                {/* ── BOARDS ── */}
                {mode === "boards" && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Board rows</span>
                        <button onClick={addBoardRow} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                          <Plus className="w-3 h-3" /> Add row
                        </button>
                      </div>
                      <div className="space-y-4">
                        {boardRows.map((r, i) => (
                          <div key={r.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-3 bg-white dark:bg-zinc-950">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Row {i + 1}</span>
                              {boardRows.length > 1 && <button onClick={() => removeBoardRow(r.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1">Size</label>
                                <select value={r.nomKey} onChange={(e) => updateBoardRow(r.id, "nomKey", e.target.value)}
                                  className="w-full h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                                  {Object.entries(nomSizes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1">Stock length</label>
                                <select value={String(r.stockLen)} onChange={(e) => updateBoardRow(r.id, "stockLen", parseFloat(e.target.value))}
                                  className="w-full h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                                  {stockLengths.map((l) => <option key={l} value={l}>{l} {lenUnit}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1">Linear run ({lenUnit})</label>
                                <input type="number" min={1} step={1} value={r.linearRun} onChange={(e) => updateBoardRow(r.id, "linearRun", parseFloat(e.target.value) || 0)}
                                  className="w-full h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1">Price/pc ($)</label>
                                <input type="number" min={0} step={0.5} value={r.pricePerPiece} onChange={(e) => updateBoardRow(r.id, "pricePerPiece", parseFloat(e.target.value) || 0)}
                                  className="w-full h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1">Waste (%)</label>
                              <input type="number" min={0} max={50} step={1} value={r.waste} onChange={(e) => updateBoardRow(r.id, "waste", parseFloat(e.target.value) || 0)}
                                className="w-full h-9 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── SHEETS ── */}
                {mode === "sheets" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label={`Area width (${lenUnit})`} value={areaW} onChange={setAreaW} min={0.1} step={0.5} />
                      <NumberField label={`Area height (${lenUnit})`} value={areaH} onChange={setAreaH} min={0.1} step={0.5} />
                    </div>
                    <div className="flex items-center gap-3">
                      <input id="custom-sheet" type="checkbox" checked={customSheet} onChange={(e) => setCustomSheet(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 accent-indigo-600" />
                      <label htmlFor="custom-sheet" className="text-sm text-zinc-700 dark:text-zinc-300 select-none">Custom sheet size</label>
                    </div>
                    {!customSheet ? (
                      <SelectField label="Sheet size" value={String(sheetSizeIdx)} onChange={(v) => setSheetSizeIdx(parseInt(v))}
                        options={sheetSizes.map((s, i) => ({ value: String(i), label: s.label }))} />
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <NumberField label={`Sheet width (${lenUnit})`} value={customSheetW} onChange={setCustomSheetW} min={0.1} step={0.1} />
                        <NumberField label={`Sheet height (${lenUnit})`} value={customSheetH} onChange={setCustomSheetH} min={0.1} step={0.1} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label="Waste (%)" value={sheetWaste} onChange={setSheetWaste} min={0} max={50} step={1} />
                      <NumberField label="Price per sheet ($)" value={sheetPrice} onChange={setSheetPrice} min={0} step={1} />
                    </div>
                  </>
                )}
              </div>

              {/* ── Results ── */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 lg:sticky lg:top-24 space-y-4">
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    {mode === "framing" ? "Framing estimate" : mode === "boards" ? "Board estimate" : "Sheet estimate"}
                  </div>

                  {/* Framing results */}
                  {mode === "framing" && (
                    <>
                      <div className="text-4xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums">
                        {framingResult.totalStuds + framingResult.totalJack + framingResult.totalCripple + framingResult.totalPlates}
                      </div>
                      <div className="text-sm text-zinc-500">total pieces</div>
                      <dl className="space-y-2 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <Row label="Regular studs" value={String(framingResult.totalStuds)} />
                        <Row label="Jack studs" value={String(framingResult.totalJack)} />
                        <Row label="Cripple studs" value={String(framingResult.totalCripple)} />
                        <Row label="Plate pieces" value={String(framingResult.totalPlates)} />
                        {unit === "imperial"
                          ? <Row label="Board feet" value={`${fmt(framingResult.totalBF)} BF`} />
                          : <Row label="Volume" value={`${fmt(framingResult.totalM3, 4)} m³`} />}
                        <Row label="Est. offcut" value={`${fmt(framingResult.offcutFt, 1)} ${lenUnit}`} />
                      </dl>
                      <dl className="space-y-2 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        {framingPrice > 0 && <Row label="Cost (by piece)" value={`$${fmt(framingResult.costByPiece, 2)}`} />}
                        {framingPriceBF > 0 && <Row label="Cost (by volume)" value={`$${fmt(framingResult.costByVolume, 2)}`} />}
                      </dl>
                      {/* Per-wall breakdown */}
                      {walls.length > 1 && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                          <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Per wall</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-zinc-400">
                                  <th className="text-left pb-1">Wall</th>
                                  <th className="text-right pb-1">Studs</th>
                                  <th className="text-right pb-1">Jacks</th>
                                  <th className="text-right pb-1">Plates</th>
                                </tr>
                              </thead>
                              <tbody>
                                {framingResult.walls.map((w, i) => (
                                  <tr key={w.wallId} className="border-t border-zinc-100 dark:border-zinc-800">
                                    <td className="py-1 text-zinc-600 dark:text-zinc-400">{i + 1} ({w.length}{lenUnit})</td>
                                    <td className="py-1 text-right font-medium text-zinc-950 dark:text-white">{w.studCount}</td>
                                    <td className="py-1 text-right font-medium text-zinc-950 dark:text-white">{w.jackStuds}</td>
                                    <td className="py-1 text-right font-medium text-zinc-950 dark:text-white">{w.platePieces}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Boards results */}
                  {mode === "boards" && (
                    <>
                      <div className="text-4xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums">
                        {boardResult.totalPieces}
                      </div>
                      <div className="text-sm text-zinc-500">total pieces</div>
                      <dl className="space-y-2 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        {unit === "imperial"
                          ? <Row label="Total board feet" value={`${fmt(boardResult.totalBF)} BF`} />
                          : <Row label="Total volume" value={`${fmt(boardResult.totalM3, 4)} m³`} />}
                        <Row label="Total cost" value={`$${fmt(boardResult.totalCost, 2)}`} />
                      </dl>
                      {/* Per-row breakdown table */}
                      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Materials breakdown</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-zinc-400">
                                <th className="text-left pb-1">Size</th>
                                <th className="text-right pb-1">Pcs</th>
                                <th className="text-right pb-1">Offcut</th>
                                <th className="text-right pb-1">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boardResult.rows.map((r, i) => (
                                <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                                  <td className="py-1 text-zinc-600 dark:text-zinc-400">{nomSizes[r.nomKey]?.label ?? r.nomKey}</td>
                                  <td className="py-1 text-right font-medium text-zinc-950 dark:text-white">{r.piecesNeeded}</td>
                                  <td className="py-1 text-right text-zinc-500">{fmt(r.offcutLength, 1)}{lenUnit}</td>
                                  <td className="py-1 text-right font-medium text-zinc-950 dark:text-white">${fmt(r.costEstimate, 2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Sheets results */}
                  {mode === "sheets" && (
                    <>
                      <div className="text-4xl font-semibold text-zinc-950 dark:text-white tracking-tight tabular-nums">
                        {sheetResult.sheetsNeeded}
                      </div>
                      <div className="text-sm text-zinc-500">sheets needed</div>
                      <dl className="space-y-2 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <Row label="Raw area" value={`${fmt(sheetResult.rawArea)} ${lenUnit}²`} />
                        <Row label="Coverage" value={`${fmt(sheetResult.areaCoverage)} ${lenUnit}²`} />
                        <Row label="Waste area" value={`${fmt(sheetResult.wasteArea)} ${lenUnit}² (${fmt(sheetResult.wastePercent, 1)}%)`} />
                      </dl>
                      <dl className="space-y-2 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <Row label="Est. cost" value={`$${fmt(sheetResult.costEstimate, 2)}`} />
                      </dl>
                    </>
                  )}

                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Estimates for planning only. Verify with your supplier before ordering.
                  </p>

                  <div className="flex gap-2">
                    <button onClick={handleDownloadPDF}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={() => setShowSaved((s) => !s)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>

                  {showSaved && (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-3">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Save this estimate</p>
                      <div className="flex gap-2">
                        <input type="text" value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)}
                          placeholder="Label (optional)"
                          className="flex-1 h-8 px-2 border border-zinc-200 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" />
                        <button onClick={saveEstimate}
                          className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors">Save</button>
                      </div>
                      {savedEstimates.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 pt-1">Saved estimates</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {savedEstimates.map((e) => (
                              <div key={e.id} className="flex items-center justify-between gap-2 text-xs py-1 border-t border-zinc-100 dark:border-zinc-800">
                                <div>
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{e.label}</span>
                                  <span className="text-zinc-400 ml-1">{e.summary} · {e.cost} · {e.ts}</span>
                                </div>
                                <button onClick={() => deleteEstimate(e.id)} className="text-zinc-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
              Lumber Calculator – Fast, Accurate Material Estimates
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
              <p>
                Use this free lumber calculator to size materials for common projects. Whether you're framing a room, running
                skirting or fascia boards, or laying down sheets of plywood/OSB, this tool gives you quick piece counts,
                board feet (BF) or cubic meters (m³), estimated offcuts, and optional cost. It supports both metric and
                imperial units and uses real-world defaults with editable waste.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 my-6">
                {[
                  { title: "Nominal vs actual", body: "You pick the nominal size (e.g., 2×4 or 90×45). The calculator uses the actual finished dimensions to compute volume precisely." },
                  { title: "Board feet / m³", body: "Imperial projects use board feet (BF), calculated from thickness × width × length ÷ 12. Metric projects use cubic meters (m³)." },
                  { title: "Waste allowance", body: "Add 5–15% to cover trim cuts, knots/defects, and handling losses. You control the percentage — 10% is a safe default." },
                ].map((item) => (
                  <div key={item.title} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <h3 className="font-semibold text-zinc-950 dark:text-white text-sm mb-2">{item.title}</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mt-6">Framing Lumber: Studs & Plates</h3>
              <p>
                For stud walls, counts are driven by wall length, stud spacing (e.g., 400 mm / 16 in), and wall height.
                Corner studs and simple opening rules are included, plus single or double top plates. You'll see the number
                of studs, plate pieces by stock length, and overall volume for ordering.
              </p>

              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mt-6">Boards & Trim: From Linear Run to Pieces</h3>
              <p>
                Enter a total linear run and select the sizes and stock lengths you plan to purchase. The tool converts to
                pieces, estimates offcuts, and reports board feet/m³. Ideal for skirting, fascia, picture rails, handrails,
                and general trim.
              </p>

              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mt-6">Sheet Goods: Plywood & OSB</h3>
              <p>
                Provide the area length and width and pick a standard sheet size (e.g., 1220×2440 mm or 4×8 ft). The
                calculator returns sheet counts and total coverage with your waste allowance — perfect for floors, walls,
                and roofs.
              </p>

              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 font-mono text-xs sm:text-sm space-y-1 mt-4">
                <div>Board feet (BF) = Thickness(in) × Width(in) × Length(ft) ÷ 12</div>
                <div>Studs = ⌈Wall length ÷ spacing⌉ + 1 + 2 corner studs</div>
                <div>Sheets = ⌈(Area × waste factor) ÷ sheet area⌉</div>
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
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <span className="font-medium text-zinc-950 dark:text-white text-sm sm:text-base">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="px-5 sm:px-6 pb-5 -mt-1">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </section>

        {/* Accuracy & Review */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="max-w-5xl">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h2 className="font-semibold text-zinc-950 dark:text-white mb-3">Accuracy & Review</h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                <span className="font-medium">Reviewed by: Liam Santos.</span> Liam reviews our decking, lumber, and board
                foot calculators to confirm accurate framing takeoffs, dimensional lumber calculations, and waste
                assumptions. He focuses on ensuring estimates reflect practical framing layouts and real-world material usage.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">Last updated: Feb 12, 2026</p>
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Important disclaimer:</span> These
                  estimates are for general planning purposes only and should not be used as structural design guidance.
                  Actual lumber quantities depend on span limits, load requirements, material grade, and building code
                  compliance. Structural framing components should be verified against current code requirements before
                  construction.
                </p>
              </div>
            </div>
            </div>
          </div>
        </section>

        <RelatedCategoryTools category="construction" currentSlug="lumber-calculator" />

        {/* CTA */}
        <section className="bg-zinc-950 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
              More construction tools coming.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Roof pitch, stair calculator, drywall, paint coverage, and more are next.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-zinc-950 hover:bg-zinc-200 rounded-md text-base font-medium transition-colors"
            >
              Browse all calculators
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
