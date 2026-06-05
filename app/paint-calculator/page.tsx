"use client";

import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";
import { Button } from "@/components/ui/Button";
import {
  PaintBucket,
  Calculator,
  FileDown,
  Plus,
  Trash2,
  Info,
  AlertCircle,
  Check,
  Home,
  Square,
  DoorOpen,
  Paintbrush,
  DollarSign,
  Layers,
} from "lucide-react";

/* ─── Types ─── */
type Unit = "imperial" | "metric";

interface Opening {
  id: string;
  width: number;
  height: number;
  label: string;
}

interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
  ceilingHeight: number;
  includeCeiling: boolean;
  openings: Opening[];
  coats: number;
}

interface RoomResult {
  wallArea: number;
  ceilingArea: number;
  openingArea: number;
  netWallArea: number;
  totalArea: number;
  paintGallons: number;
  primerGallons: number;
}

interface TotalResult {
  rooms: RoomResult[];
  totalArea: number;
  totalPaintGallons: number;
  totalPrimerGallons: number;
  paintCost: number;
  primerCost: number;
  totalCost: number;
}

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const genId = () => Math.random().toString(36).slice(2, 9);

const defaultRoom: Room = {
  id: genId(),
  name: "Room 1",
  length: 12,
  width: 10,
  ceilingHeight: 8,
  includeCeiling: true,
  openings: [],
  coats: 2,
};

const standardOpenings = {
  door: { width: 3, height: 7, label: "Standard Door" },
  window: { width: 4, height: 3, label: "Standard Window" },
  "double-door": { width: 6, height: 7, label: "Double Door" },
  "large-window": { width: 6, height: 4, label: "Large Window" },
};

/* ─── Components ─── */
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  unit,
  note,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  unit?: string;
  note?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            {unit}
          </span>
        )}
      </div>
      {note && <p className="text-xs text-zinc-500">{note}</p>}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
        {title}
      </h2>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PaintCalculator() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [rooms, setRooms] = useState<Room[]>([defaultRoom]);
  
  // Paint settings
  const [paintCoverage, setPaintCoverage] = useState(350); // sq ft per gallon
  const [primerCoverage, setPrimerCoverage] = useState(400); // sq ft per gallon
  const [paintCostPerGallon, setPaintCostPerGallon] = useState(35);
  const [primerCostPerGallon, setPrimerCostPerGallon] = useState(25);
  const [includePrimer, setIncludePrimer] = useState(true);
  const [wasteFactor, setWasteFactor] = useState(10);

  const isImp = unit === "imperial";
  const lenUnit = isImp ? "ft" : "m";
  const areaUnit = isImp ? "sq ft" : "m²";

  // Calculate room results
  const calcRoom = (room: Room): RoomResult => {
    const L = room.length;
    const W = room.width;
    const H = room.ceilingHeight;

    // Wall area (perimeter × height)
    const wallArea = 2 * (L + W) * H;

    // Ceiling area
    const ceilingArea = room.includeCeiling ? L * W : 0;

    // Opening area to subtract
    const openingArea = room.openings.reduce(
      (sum, o) => sum + o.width * o.height,
      0
    );

    // Net wall area (walls minus openings)
    const netWallArea = Math.max(0, wallArea - openingArea);

    // Total area to paint
    const totalArea = netWallArea + ceilingArea;

    // Apply coats and waste
    const effectiveArea = totalArea * room.coats * (1 + wasteFactor / 100);

    // Gallons needed (round up)
    const paintGallons = Math.ceil(effectiveArea / paintCoverage);
    const primerGallons = includePrimer
      ? Math.ceil(totalArea / primerCoverage)
      : 0;

    return {
      wallArea,
      ceilingArea,
      openingArea,
      netWallArea,
      totalArea,
      paintGallons,
      primerGallons,
    };
  };

  // Calculate totals
  const totals: TotalResult = useMemo(() => {
    const roomsResults = rooms.map(calcRoom);
    const totalArea = roomsResults.reduce((sum, r) => sum + r.totalArea, 0);
    const totalPaintGallons = roomsResults.reduce(
      (sum, r) => sum + r.paintGallons,
      0
    );
    const totalPrimerGallons = roomsResults.reduce(
      (sum, r) => sum + r.primerGallons,
      0
    );

    const paintCost = totalPaintGallons * paintCostPerGallon;
    const primerCost = totalPrimerGallons * primerCostPerGallon;

    return {
      rooms: roomsResults,
      totalArea,
      totalPaintGallons,
      totalPrimerGallons,
      paintCost,
      primerCost,
      totalCost: paintCost + primerCost,
    };
  }, [rooms, paintCoverage, primerCoverage, includePrimer, wasteFactor]);

  // Room management
  const addRoom = () => {
    setRooms([
      ...rooms,
      { ...defaultRoom, id: genId(), name: `Room ${rooms.length + 1}` },
    ]);
  };

  const removeRoom = (id: string) => {
    if (rooms.length <= 1) return;
    setRooms(rooms.filter((r) => r.id !== id));
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const addOpening = (roomId: string, type: keyof typeof standardOpenings) => {
    const template = standardOpenings[type];
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              openings: [
                ...r.openings,
                { id: genId(), ...template },
              ],
            }
          : r
      )
    );
  };

  const removeOpening = (roomId: string, openingId: string) => {
    setRooms(
      rooms.map((r) =>
        r.id === roomId
          ? { ...r, openings: r.openings.filter((o) => o.id !== openingId) }
          : r
      )
    );
  };

  // Reset
  const reset = () => {
    setRooms([defaultRoom]);
    setWasteFactor(10);
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const colLabel = margin;
    const colQty = 95;
    const colUnit = 120;
    const colUnitPrice = 150;
    let y = 20;

    /* ── helpers ── */
    const checkPage = () => { if (y > 268) { doc.addPage(); y = 18; } };

    const section = (title: string) => {
      checkPage();
      y += 3;
      doc.setFillColor(30, 30, 30);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 11;
    };

    const row = (label: string, value: string, bold = false) => {
      checkPage();
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      doc.text(label, colLabel, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(value, pageW - margin, y, { align: "right" });
      y += 6.5;
    };

    const costRow = (label: string, qty: string, unit: string, unitPrice: string, total: string) => {
      checkPage();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(label, colLabel, y);
      doc.setTextColor(80, 80, 80);
      doc.text(qty, colQty, y, { align: "right" });
      doc.text(unit, colUnit, y);
      doc.text(unitPrice, colUnitPrice, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(total, pageW - margin, y, { align: "right" });
      y += 6.5;
    };

    const costHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text("ITEM", colLabel, y);
      doc.text("QTY", colQty, y, { align: "right" });
      doc.text("UNIT", colUnit, y);
      doc.text("UNIT PRICE", colUnitPrice, y, { align: "right" });
      doc.text("COST", pageW - margin, y, { align: "right" });
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    };

    const totalLine = (label: string, value: string, highlight = false) => {
      checkPage();
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      if (highlight) {
        doc.setFillColor(240, 240, 255);
        doc.rect(margin, y - 1, pageW - margin * 2, 8, "F");
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(highlight ? 60 : 20, highlight ? 60 : 20, highlight ? 200 : 20);
      doc.text(label, colLabel, y + 4);
      doc.text(value, pageW - margin, y + 4, { align: "right" });
      y += 11;
    };

    const divider = () => {
      checkPage();
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
    };

    /* ── Header ── */
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("Paint Calculator Report", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    /* ── Project Settings ── */
    section("Project Settings");
    row("Units", isImp ? "Imperial" : "Metric");
    row("Paint Coverage", `${paintCoverage} ${areaUnit}/gal`);
    row("Waste Factor", `${wasteFactor}%`);
    row("Number of Rooms", String(rooms.length));
    if (includePrimer) {
      row("Primer Coverage", `${primerCoverage} ${areaUnit}/gal`);
    }
    y += 2;
    divider();

    /* ── Material Quantities ── */
    section("Material Quantities");
    row("Total Area to Paint", `${fmt(totals.totalArea, 1)} ${areaUnit}`);
    row("Total Paint Required", `${totals.totalPaintGallons} gallon${totals.totalPaintGallons !== 1 ? "s" : ""}`);
    if (includePrimer) {
      row("Total Primer Required", `${totals.totalPrimerGallons} gallon${totals.totalPrimerGallons !== 1 ? "s" : ""}`);
    }
    y += 2;
    divider();

    /* ── Cost Breakdown ── */
    section("Cost Breakdown");
    costHeader();
    costRow(
      "Paint",
      String(totals.totalPaintGallons),
      "gal",
      `$${fmt(paintCostPerGallon, 2)}/gal`,
      `$${fmt(totals.paintCost, 2)}`
    );
    if (includePrimer) {
      costRow(
        "Primer",
        String(totals.totalPrimerGallons),
        "gal",
        `$${fmt(primerCostPerGallon, 2)}/gal`,
        `$${fmt(totals.primerCost, 2)}`
      );
    }
    totalLine("Total Material Cost", `$${fmt(totals.totalCost, 2)}`, true);

    /* ── Per-Room Detail ── */
    section("Per-Room Details");
    rooms.forEach((room, i) => {
      const rr = totals.rooms[i];
      checkPage();

      // Room header
      y += 2;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${room.name}  (${room.coats} coat${room.coats !== 1 ? "s" : ""})`, margin + 3, y + 4.2);
      y += 9;

      // Room specs
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Dimensions: ${room.length} × ${room.width} × ${room.ceilingHeight} ${lenUnit}`, margin + 3, y);
      y += 5;
      doc.text(`Wall Area: ${fmt(rr.wallArea, 1)} ${areaUnit}`, margin + 3, y);
      y += 5;
      if (room.includeCeiling) {
        doc.text(`Ceiling Area: ${fmt(rr.ceilingArea, 1)} ${areaUnit}`, margin + 3, y);
        y += 5;
      }

      // Openings list
      if (room.openings.length > 0) {
        doc.text(`Openings (deducted):`, margin + 3, y);
        y += 5;
        room.openings.forEach((op) => {
          doc.text(`  • ${op.label}: ${op.width} × ${op.height} ${lenUnit} = ${fmt(op.width * op.height, 1)} ${areaUnit}`, margin + 6, y);
          y += 4.5;
        });
        doc.text(`Total Openings Area: ${fmt(rr.openingArea, 1)} ${areaUnit}`, margin + 3, y);
        y += 5;
      }

      // Room totals
      doc.text(`Net Wall Area: ${fmt(rr.netWallArea, 1)} ${areaUnit}`, margin + 3, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`Paint Needed: ${rr.paintGallons} gallon${rr.paintGallons !== 1 ? "s" : ""}`, margin + 3, y);
      y += 8;
    });

    /* ── Disclaimer ── */
    divider();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      doc.splitTextToSize(
        "Estimates are for planning purposes only. Actual paint needs may vary based on surface texture, color change, application method, and paint quality. Always consult manufacturer guidelines and purchase slightly more than calculated for touch-ups.",
        pageW - margin * 2
      ),
      margin,
      y
    );

    doc.save(`paint-calculator-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Paint Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Estimate paint and primer for walls and ceilings. Accounts for doors, 
            windows, multiple coats, and waste factor.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Settings */}
            <Card>
              <SectionTitle icon={PaintBucket} title="Paint Settings" />
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <NumberField
                  label="Paint Coverage"
                  value={paintCoverage}
                  onChange={setPaintCoverage}
                  unit={`${areaUnit}/gal`}
                  note="Typically 350-400 sq ft/gal"
                />
                <NumberField
                  label="Paint Cost"
                  value={paintCostPerGallon}
                  onChange={setPaintCostPerGallon}
                  unit="$/gal"
                />
                {includePrimer && (
                  <>
                    <NumberField
                      label="Primer Coverage"
                      value={primerCoverage}
                      onChange={setPrimerCoverage}
                      unit={`${areaUnit}/gal`}
                      note="Typically 400 sq ft/gal"
                    />
                    <NumberField
                      label="Primer Cost"
                      value={primerCostPerGallon}
                      onChange={setPrimerCostPerGallon}
                      unit="$/gal"
                    />
                  </>
                )}
                <NumberField
                  label="Waste Factor"
                  value={wasteFactor}
                  onChange={setWasteFactor}
                  unit="%"
                  note="Touch-ups, spills, overage"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePrimer}
                    onChange={(e) => setIncludePrimer(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Include primer calculation
                  </span>
                </label>
              </div>
            </Card>

            {/* Rooms */}
            {rooms.map((room, i) => {
              const rr = totals.rooms[i];
              return (
                <Card key={room.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) =>
                          updateRoom(room.id, { name: e.target.value })
                        }
                        className="font-semibold text-zinc-950 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </div>
                    {rooms.length > 1 && (
                      <button
                        onClick={() => removeRoom(room.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <NumberField
                      label="Length"
                      value={room.length}
                      onChange={(v) => updateRoom(room.id, { length: v })}
                      unit={lenUnit}
                    />
                    <NumberField
                      label="Width"
                      value={room.width}
                      onChange={(v) => updateRoom(room.id, { width: v })}
                      unit={lenUnit}
                    />
                    <NumberField
                      label="Ceiling Height"
                      value={room.ceilingHeight}
                      onChange={(v) => updateRoom(room.id, { ceilingHeight: v })}
                      unit={lenUnit}
                    />
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={room.includeCeiling}
                        onChange={(e) =>
                          updateRoom(room.id, { includeCeiling: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        Paint ceiling
                      </span>
                    </label>
                    <NumberField
                      label="Number of Coats"
                      value={room.coats}
                      onChange={(v) => updateRoom(room.id, { coats: Math.min(5, Math.max(1, v)) })}
                      min={1}
                      step={1}
                    />
                  </div>

                  {/* Openings */}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DoorOpen className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Openings to Subtract
                      </span>
                      <span className="text-xs text-zinc-500">
                        ({room.openings.length} added, {fmt(rr?.openingArea || 0, 1)} {areaUnit} total)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(standardOpenings).map(([key, template]) => (
                        <button
                          key={key}
                          onClick={() => addOpening(room.id, key as keyof typeof standardOpenings)}
                          className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          + {template.label}
                        </button>
                      ))}
                    </div>

                    {room.openings.length > 0 && (
                      <div className="space-y-2">
                        {room.openings.map((opening) => (
                          <div
                            key={opening.id}
                            className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2"
                          >
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {opening.label}: {opening.width} × {opening.height} {lenUnit}
                            </span>
                            <button
                              onClick={() => removeOpening(room.id, opening.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {/* Add Room Button */}
            <button
              onClick={addRoom}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Room
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Card className="bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20">
              <SectionTitle icon={Calculator} title="Paint Estimate" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Area</span>
                  <span className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {fmt(totals.totalArea, 1)} {areaUnit}
                  </span>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PaintBucket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Paint</span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {totals.totalPaintGallons}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">gallons needed</p>
                </div>

                {includePrimer && (
                  <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Primer</span>
                      </div>
                      <span className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                        {totals.totalPrimerGallons}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 text-right">gallons needed</p>
                  </div>
                )}

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Total Cost</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${fmt(totals.totalCost, 0)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 text-right space-y-0.5">
                    <p>Paint: ${fmt(totals.paintCost, 0)}</p>
                    {includePrimer && <p>Primer: ${fmt(totals.primerCost, 0)}</p>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Painting Tips</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Always prime bare drywall or dark color changes
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Buy all paint at once for color consistency
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Add 10% extra for touch-ups later
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Coverage varies by surface texture
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={handleDownloadPDF} className="w-full">
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
              <Button variant="secondary" onClick={reset} className="w-full">
                Reset Calculator
              </Button>
            </div>
          </div>
        </div>

        {/* SEO Content Section — How Much Paint Do I Need */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white mb-6">
              How Much Paint Do I Need?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Whether you are planning to repaint your bedroom or are going to paint all the rooms in your brand-new house, 
              this interior paint calculator is here to help you determine how much paint you need. You will be able to 
              find the paint estimation based on the number of openings or the number of coats of paint. 
              You can also calculate the final cost of paint required!
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  What You Need to Input
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  You will have to input some raw data into the paint calculator. It includes:
                </p>
                <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center shrink-0">1</span>
                    <span><strong>Room dimensions</strong> — You need to type in the length, width, and height of the room you plan to paint. If your room has a different shape than a rectangular cuboid, you can also input the total room wall area directly into the paint estimator. The calculated value only takes into account the walls as if there are no doors or windows.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center shrink-0">2</span>
                    <span><strong>Doors</strong> — You can use the default dimensions of a door entered in our calculator or customize them to fit your needs. Make sure to type in the number of doors in the room so the paint calculator will find their total area. Enter 0 if the room to be painted has no doors on the wall.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center shrink-0">3</span>
                    <span><strong>Windows</strong> — Again, you can utilize the default dimensions provided or type in custom ones. Then, enter the number of windows of the same dimensions. Don&apos;t forget to input the number of windows, whether 0 or more. If you have windows of different sizes in your room, it&apos;s better to calculate the total area manually and input this value into the appropriate box.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center shrink-0">4</span>
                    <span><strong>Number of coats</strong> — By default, our calculator finds the amount of paint required for one layer, but you can input the number of coats you plan to use yourself. Most projects require 2 coats for best results.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center shrink-0">5</span>
                    <span><strong>Paint efficiency</strong> — This number should be written on the paint can, expressed in m²/l or ft²/l. Most standard paints cover 350-400 square feet per gallon.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center shrink-0">6</span>
                    <span><strong>Cost per unit volume</strong> — Optionally, you can input the cost of a unit of paint (cost per liter or per gallon). The paint calculator will automatically find the total cost of paint.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Is the Paint Estimation Accurate?
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Obviously, it won&apos;t be a hundred percent accurate. Several factors can affect the actual amount of paint needed:
                </p>
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>If the surface is <strong>porous or rough</strong>, it will require additional paint — up to 20%.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>Similarly, <strong>complicated fittings</strong> require extra paint.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>You also need to add some paint — up to 30% — if you are <strong>painting a surface for the very first time</strong>, as you need to prepare the wall with primer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Dark color changes</strong> (like painting over deep red with white) may require additional coats and primer.</span>
                  </li>
                </ul>
                <p className="text-zinc-600 dark:text-zinc-400 mt-4">
                  Our interior paint calculator includes a waste factor adjustment to help account for these variables.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  What About the Ceiling?
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Our calculator includes an option to paint the ceiling! Simply check the &quot;Paint ceiling&quot; box in any room, 
                  and we&apos;ll automatically calculate the ceiling area (length × width) and add it to your total. 
                  Ceiling paint typically requires less paint per square foot than walls due to smoother surfaces.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Tips for Accurate Paint Estimation
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <h4 className="font-medium text-zinc-950 dark:text-white mb-2">Buy All Paint at Once</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      For color consistency, purchase all your paint in one batch. If you need to buy more later, the color may vary slightly between batches.
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <h4 className="font-medium text-zinc-950 dark:text-white mb-2">Round Up, Not Down</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Always round up to the next whole gallon. It&apos;s better to have a little extra for touch-ups than to run short mid-project.
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <h4 className="font-medium text-zinc-950 dark:text-white mb-2">Don&apos;t Forget Primer</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      New drywall, bare wood, or drastic color changes need primer. Use our primer calculator to estimate primer needs separately.
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <h4 className="font-medium text-zinc-950 dark:text-white mb-2">Check the Paint Can</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Coverage rates vary by brand and paint type. High-quality paints often cover more area per gallon than budget options.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How much paint do I need for a 12x12 room?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "For a 12x12 room with 8-foot ceilings, you'll need approximately 1-2 gallons of paint for the walls (depending on number of coats) and about 1 gallon for the ceiling. Our paint calculator accounts for doors and windows to give you a precise estimate.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How many square feet does a gallon of paint cover?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Most standard interior paints cover approximately 350-400 square feet per gallon for one coat. However, this varies by paint quality, surface texture, and color. High-quality paints may cover up to 400-450 sq ft/gal, while lower-quality paints might only cover 300 sq ft/gal.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I need to prime before painting?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You should prime when: painting over bare drywall or wood, making drastic color changes (especially light over dark), covering stains or repairs, or painting over glossy surfaces. Primer ensures better paint adhesion and can reduce the number of top coats needed.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I calculate paint for multiple rooms?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Use our paint calculator's 'Add Another Room' feature to calculate paint for multiple rooms separately. This accounts for each room's unique dimensions, openings, and whether you're painting ceilings. The calculator then sums everything for a total project estimate.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a paint waste factor?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "The waste factor accounts for paint lost to spills, touch-ups, the paint that remains in the can, and the roller/brush. A standard waste factor is 10%, but you might want 15-20% for complicated rooms with lots of trim, or if you're inexperienced at painting.",
                  },
                },
              ],
            }),
          }}
        />

        {/* How it Works */}
        <div className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white mb-6">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Square className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Calculate Area</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Wall area = perimeter × height. Ceiling = length × width. 
                Subtract doors and windows.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Apply Coats & Waste</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Multiply by number of coats. Add waste factor (typically 10%) 
                for touch-ups and spills.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Paintbrush className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Estimate Gallons</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Divide total area by coverage rate (350-400 sq ft/gallon). 
                Round up to whole gallons.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Need to measure your wall area first?{" "}
            <Link href="/square-footage-calculator" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Calculate your room&apos;s square footage
            </Link>
            {" "}before estimating paint.
          </p>
        </div>

        {/* Related Tools */}
        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="paint-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
