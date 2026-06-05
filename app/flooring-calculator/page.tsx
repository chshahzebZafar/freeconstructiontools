"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";
import { Button } from "@/components/ui/Button";
import {
  Grid3X3,
  Calculator,
  FileDown,
  Plus,
  Trash2,
  Info,
  Check,
  Home,
  Square,
  Ruler,
  DollarSign,
  Layers,
  ChevronDown,
} from "lucide-react";

/* ─── Types ─── */
type Unit = "imperial" | "metric";
type FlooringType = "hardwood" | "laminate" | "vinyl" | "carpet" | "tile";
type RoomShape = "rectangular" | "l-shape";

interface Room {
  id: string;
  name: string;
  shape: RoomShape;
  length: number;
  width: number;
  length2: number;
  width2: number;
}

interface FlooringSpecs {
  name: string;
  plankWidth: number;
  plankLength: number;
  coveragePerBox: number;
  costPerSqFt: number;
  wasteFactor: number;
}

interface RoomResult {
  area: number;
  effectiveArea: number;
  planksNeeded: number;
  boxesNeeded: number;
  roomCost: number;
}

interface TotalResult {
  rooms: RoomResult[];
  totalArea: number;
  totalPlanks: number;
  totalBoxes: number;
  materialCost: number;
  totalCost: number;
}

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const genId = () => Math.random().toString(36).slice(2, 9);

const flooringTypes: Record<FlooringType, FlooringSpecs> = {
  hardwood: {
    name: "Hardwood",
    plankWidth: 3.5,
    plankLength: 48,
    coveragePerBox: 20,
    costPerSqFt: 8,
    wasteFactor: 10,
  },
  laminate: {
    name: "Laminate",
    plankWidth: 7.5,
    plankLength: 47,
    coveragePerBox: 25,
    costPerSqFt: 3.5,
    wasteFactor: 10,
  },
  vinyl: {
    name: "Vinyl Plank",
    plankWidth: 6,
    plankLength: 48,
    coveragePerBox: 30,
    costPerSqFt: 4,
    wasteFactor: 10,
  },
  carpet: {
    name: "Carpet",
    plankWidth: 12,
    plankLength: 12,
    coveragePerBox: 12,
    costPerSqFt: 4.5,
    wasteFactor: 15,
  },
  tile: {
    name: "Ceramic Tile",
    plankWidth: 12,
    plankLength: 12,
    coveragePerBox: 15,
    costPerSqFt: 6,
    wasteFactor: 15,
  },
};

const defaultRoom: Room = {
  id: genId(),
  name: "Room 1",
  shape: "rectangular",
  length: 12,
  width: 10,
  length2: 8,
  width2: 6,
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
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{unit}</span>}
      </div>
      {note && <p className="text-xs text-zinc-500">{note}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h2>
    </div>
  );
}

/* ─── Main Page ─── */
export default function FlooringCalculator() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [flooringType, setFlooringType] = useState<FlooringType>("laminate");
  const [rooms, setRooms] = useState<Room[]>([defaultRoom]);
  
  // Custom specs override
  const [customPlankWidth, setCustomPlankWidth] = useState(0);
  const [customPlankLength, setCustomPlankLength] = useState(0);
  const [customCoverage, setCustomCoverage] = useState(0);
  const [customCost, setCustomCost] = useState(0);
  const [customWaste, setCustomWaste] = useState(0);
  const [useCustomSpecs, setUseCustomSpecs] = useState(false);

  const specs = useMemo(() => {
    const base = flooringTypes[flooringType];
    if (!useCustomSpecs) return base;
    return {
      ...base,
      plankWidth: customPlankWidth || base.plankWidth,
      plankLength: customPlankLength || base.plankLength,
      coveragePerBox: customCoverage || base.coveragePerBox,
      costPerSqFt: customCost || base.costPerSqFt,
      wasteFactor: customWaste || base.wasteFactor,
    };
  }, [flooringType, useCustomSpecs, customPlankWidth, customPlankLength, customCoverage, customCost, customWaste]);

  const isImp = unit === "imperial";
  const lenUnit = isImp ? "ft" : "m";
  const areaUnit = isImp ? "sq ft" : "m²";

  // Calculate room area
  const calcRoomArea = (room: Room): number => {
    if (room.shape === "rectangular") {
      return room.length * room.width;
    }
    // L-shape: main rectangle + wing minus overlap
    const mainArea = room.length * room.width;
    const wingArea = room.length2 * room.width2;
    const overlap = Math.min(room.width, room.width2) * Math.min(room.length, room.length2);
    return mainArea + wingArea - overlap;
  };

  // Calculate results
  const totals: TotalResult = useMemo(() => {
    const roomsResults = rooms.map((room) => {
      const area = calcRoomArea(room);
      const wasteMultiplier = 1 + specs.wasteFactor / 100;
      const effectiveArea = area * wasteMultiplier;
      
      // Calculate planks needed
      const plankArea = (specs.plankWidth / 12) * (specs.plankLength / 12); // in sq ft
      const planksNeeded = Math.ceil(effectiveArea / plankArea);
      
      // Calculate boxes needed
      const planksPerBox = Math.floor(specs.coveragePerBox / plankArea);
      const boxesNeeded = Math.ceil(planksNeeded / Math.max(planksPerBox, 1));
      
      // Cost
      const roomCost = effectiveArea * specs.costPerSqFt;

      return {
        area,
        effectiveArea,
        planksNeeded,
        boxesNeeded,
        roomCost,
      };
    });

    const totalArea = roomsResults.reduce((sum, r) => sum + r.area, 0);
    const totalPlanks = roomsResults.reduce((sum, r) => sum + r.planksNeeded, 0);
    const totalBoxes = roomsResults.reduce((sum, r) => sum + r.boxesNeeded, 0);
    const materialCost = roomsResults.reduce((sum, r) => sum + r.roomCost, 0);

    return {
      rooms: roomsResults,
      totalArea,
      totalPlanks,
      totalBoxes,
      materialCost,
      totalCost: materialCost,
    };
  }, [rooms, specs]);

  // Room management
  const addRoom = () => {
    setRooms([...rooms, { ...defaultRoom, id: genId(), name: `Room ${rooms.length + 1}` }]);
  };

  const removeRoom = (id: string) => {
    if (rooms.length <= 1) return;
    setRooms(rooms.filter((r) => r.id !== id));
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  // Reset
  const reset = () => {
    setRooms([defaultRoom]);
    setUseCustomSpecs(false);
  };

  // PDF Export
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    let y = 20;

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

    const row = (label: string, value: string) => {
      checkPage();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(value, pageW - margin, y, { align: "right" });
      y += 6.5;
    };

    const totalLine = (label: string, value: string) => {
      checkPage();
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      doc.setFillColor(240, 240, 255);
      doc.rect(margin, y - 1, pageW - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 200);
      doc.text(label, margin, y + 4);
      doc.text(value, pageW - margin, y + 4, { align: "right" });
      y += 11;
    };

    // Header
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("Flooring Calculator Report", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    // Project Settings
    section("Project Settings");
    row("Flooring Type", specs.name);
    row("Units", isImp ? "Imperial" : "Metric");
    row("Plank/Tile Size", `${specs.plankWidth}" × ${specs.plankLength}"`);
    row("Coverage Per Box", `${specs.coveragePerBox} ${areaUnit}`);
    row("Waste Factor", `${specs.wasteFactor}%`);
    row("Cost Per Sq Ft", `$${fmt(specs.costPerSqFt, 2)}`);
    row("Number of Rooms", String(rooms.length));
    y += 2;

    // Summary
    section("Material Summary");
    row("Total Floor Area", `${fmt(totals.totalArea, 1)} ${areaUnit}`);
    row("Planks/Tiles Needed", String(totals.totalPlanks));
    row("Boxes to Purchase", String(totals.totalBoxes));
    totalLine("Total Material Cost", `$${fmt(totals.totalCost, 2)}`);

    // Per-room details
    section("Per-Room Details");
    rooms.forEach((room, i) => {
      const rr = totals.rooms[i];
      checkPage();

      y += 2;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${room.name}  (${room.shape === "l-shape" ? "L-shape" : "Rectangle"})`, margin + 3, y + 4.2);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      if (room.shape === "rectangular") {
        doc.text(`Dimensions: ${room.length} × ${room.width} ${lenUnit}`, margin + 3, y);
        y += 5;
      } else {
        doc.text(`Main Area: ${room.length} × ${room.width} ${lenUnit}`, margin + 3, y);
        y += 5;
        doc.text(`Wing: ${room.length2} × ${room.width2} ${lenUnit}`, margin + 3, y);
        y += 5;
      }
      
      doc.text(`Floor Area: ${fmt(rr.area, 1)} ${areaUnit}`, margin + 3, y);
      y += 5;
      doc.text(`With Waste: ${fmt(rr.effectiveArea, 1)} ${areaUnit}`, margin + 3, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`Boxes Needed: ${rr.boxesNeeded}`, margin + 3, y);
      y += 8;
    });

    // Disclaimer
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      doc.splitTextToSize(
        "Estimates are for planning purposes only. Always measure your space carefully and consult flooring manufacturer guidelines. Purchase extra material for future repairs.",
        pageW - margin * 2
      ),
      margin,
      y
    );

    doc.save(`flooring-calculator-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Flooring Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Estimate flooring materials for hardwood, laminate, vinyl, carpet, and tile. 
            Calculate square footage, planks needed, boxes to buy, and total cost.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flooring Type Selection */}
            <Card>
              <SectionTitle icon={Grid3X3} title="Select Flooring Type" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(Object.keys(flooringTypes) as FlooringType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFlooringType(type)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      flooringType === type
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    <div className="text-sm font-medium">{flooringTypes[type].name}</div>
                    <div className="text-xs text-zinc-500 mt-1">${flooringTypes[type].costPerSqFt}/sq ft</div>
                  </button>
                ))}
              </div>

              {/* Custom Specs Toggle */}
              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomSpecs}
                    onChange={(e) => setUseCustomSpecs(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Customize product specifications</span>
                </label>

                {useCustomSpecs && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <NumberField
                      label="Plank Width"
                      value={customPlankWidth}
                      onChange={setCustomPlankWidth}
                      unit='"'
                      note={`Default: ${specs.plankWidth}"`}
                    />
                    <NumberField
                      label="Plank Length"
                      value={customPlankLength}
                      onChange={setCustomPlankLength}
                      unit='"'
                      note={`Default: ${specs.plankLength}"`}
                    />
                    <NumberField
                      label="Coverage Per Box"
                      value={customCoverage}
                      onChange={setCustomCoverage}
                      unit={areaUnit}
                      note={`Default: ${specs.coveragePerBox}`}
                    />
                    <NumberField
                      label="Cost Per Sq Ft"
                      value={customCost}
                      onChange={setCustomCost}
                      unit="$"
                      step={0.1}
                      note={`Default: $${specs.costPerSqFt}`}
                    />
                    <NumberField
                      label="Waste Factor"
                      value={customWaste}
                      onChange={setCustomWaste}
                      unit="%"
                      note={`Default: ${specs.wasteFactor}%`}
                    />
                  </div>
                )}
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
                        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
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

                  {/* Shape Selector */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => updateRoom(room.id, { shape: "rectangular" })}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        room.shape === "rectangular"
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                      }`}
                    >
                      Rectangle
                    </button>
                    <button
                      onClick={() => updateRoom(room.id, { shape: "l-shape" })}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        room.shape === "l-shape"
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                      }`}
                    >
                      L-Shape
                    </button>
                  </div>

                  {/* Dimensions */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <NumberField
                      label={room.shape === "l-shape" ? "Main Length" : "Length"}
                      value={room.length}
                      onChange={(v) => updateRoom(room.id, { length: v })}
                      unit={lenUnit}
                    />
                    <NumberField
                      label={room.shape === "l-shape" ? "Main Width" : "Width"}
                      value={room.width}
                      onChange={(v) => updateRoom(room.id, { width: v })}
                      unit={lenUnit}
                    />
                    {room.shape === "l-shape" && (
                      <>
                        <NumberField
                          label="Wing Length"
                          value={room.length2}
                          onChange={(v) => updateRoom(room.id, { length2: v })}
                          unit={lenUnit}
                        />
                        <NumberField
                          label="Wing Width"
                          value={room.width2}
                          onChange={(v) => updateRoom(room.id, { width2: v })}
                          unit={lenUnit}
                        />
                      </>
                    )}
                  </div>

                  {/* Room Summary */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-zinc-500">Area</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(rr.area, 1)} {areaUnit}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Planks</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{rr.planksNeeded}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Boxes</div>
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400">{rr.boxesNeeded}</div>
                      </div>
                    </div>
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
              <SectionTitle icon={Calculator} title="Flooring Estimate" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Floor Area</span>
                  <span className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {fmt(totals.totalArea, 1)} {areaUnit}
                  </span>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Planks/Tiles</span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {totals.totalPlanks}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">individual pieces</p>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Boxes to Buy</span>
                    </div>
                    <span className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                      {totals.totalBoxes}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">{specs.coveragePerBox} {areaUnit} per box</p>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Material Cost</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${fmt(totals.totalCost, 0)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">${specs.costPerSqFt}/sq ft + {specs.wasteFactor}% waste</p>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Flooring Tips</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Always buy 10-15% extra for cuts and future repairs
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Acclimate hardwood flooring 3-5 days before install
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Check manufacturer warranty requirements
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Keep extra boxes for future patch repairs
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

        {/* SEO Content Section — How Much Flooring Do I Need */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white mb-6">
              How Much Flooring Do I Need?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Planning a flooring project starts with one essential question: how much flooring do I need? 
              Whether you&apos;re installing hardwood in your living room, laminate in a rental property, or 
              vinyl plank throughout your home, getting the right amount of material is crucial for both 
              budget and project success. Our free flooring calculator takes the guesswork out of the equation.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Step-by-Step: Calculating Your Flooring Needs
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Measure Your Room</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Measure the length and width of your room at the widest points. For L-shaped rooms, 
                        divide the space into two rectangles and measure each separately. Always measure in 
                        inches first for precision, then convert to feet. Use a laser measure or tape measure 
                        for best results.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Calculate Square Footage</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Multiply length × width to get the square footage. For L-shapes, calculate each section 
                        separately and add them together. For example, a 12&apos; × 15&apos; room = 180 square feet. 
                        Our calculator handles both rectangular and L-shaped rooms automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">3</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Add the Waste Factor</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Add 10% extra for standard installations, or 15% for complex layouts with lots of cuts 
                        or diagonal patterns. This accounts for cutting waste, damaged pieces, and future repairs. 
                        Never skip the waste factor — you&apos;ll need those extra planks later.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">4</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Determine Boxes Needed</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Flooring is sold by the box, not by the square foot. Divide your total square footage 
                        (including waste) by the coverage per box. Always round up — you can&apos;t buy partial boxes. 
                        Keep unopened boxes for future repairs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Flooring Waste Factor Guide
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Installation Type</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Waste Factor</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">When to Use</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-400">
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Standard (Straight Lay)</td>
                        <td className="py-2">5-10%</td>
                        <td className="py-2">Simple rectangular rooms</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Diagonal Pattern</td>
                        <td className="py-2">15%</td>
                        <td className="py-2">45-degree angle installation</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Herringbone/Chevron</td>
                        <td className="py-2">15-20%</td>
                        <td className="py-2">Complex parquet patterns</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Irregular Room Shape</td>
                        <td className="py-2">15%</td>
                        <td className="py-2">Lots of corners, alcoves, angles</td>
                      </tr>
                      <tr>
                        <td className="py-2">Large Format Tile</td>
                        <td className="py-2">10-15%</td>
                        <td className="py-2">Tiles 12&quot; × 24&quot; or larger</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Hardwood Flooring</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Solid and engineered hardwood typically comes in planks 3&quot;-7&quot; wide and requires 
                    10% extra material. Buy all your flooring at once to ensure color consistency between batches.
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Laminate Flooring</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Laminate planks are typically 7-8&quot; wide and 47-48&quot; long. Most boxes cover 20-25 sq ft. 
                    Add 10% waste for standard installations.
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Vinyl Plank (LVP/LVT)</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Luxury vinyl plank is waterproof and great for kitchens and bathrooms. Boxes typically 
                    cover 30-40 sq ft. 10% waste factor recommended.
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Carpet & Tile</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Carpet is sold by the square yard (9 sq ft = 1 sq yd). Tile varies by size — 12&quot; × 12&quot; 
                    tiles need 15% waste for pattern matching and cuts.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Why You Should Always Buy Extra Flooring
                </h3>
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span><strong>Future repairs:</strong> Keep 1-2 unopened boxes for patching damaged areas later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span><strong>Discontinuation risk:</strong> Flooring styles and colors get discontinued; extra material ensures you can match later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span><strong>Cutting mistakes:</strong> Even experienced installers make wrong cuts — extra material saves trips to the store</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span><strong>Pattern matching:</strong> Some flooring requires specific pattern alignment, using more material</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span><strong>Color variations:</strong> Mixing planks from different boxes ensures consistent color distribution</span>
                  </li>
                </ul>
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
                  name: "How much flooring do I need for a 12x12 room?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A 12×12 room is 144 square feet. With a 10% waste factor, you need 159 square feet of flooring. Depending on your flooring type, this equals approximately 6-8 boxes (most boxes cover 20-30 sq ft).",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much extra flooring should I buy?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Buy 10% extra for standard installations, 15% for diagonal patterns or complex room shapes, and 15-20% for herringbone or parquet patterns. Always keep at least one unopened box for future repairs.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a flooring waste factor?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "The waste factor accounts for material lost to cutting, damaged pieces, and pattern alignment. It also provides extra material for future repairs. Standard waste factors are 5-10% for simple rooms and up to 20% for complex patterns.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How many square feet are in a box of flooring?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Coverage varies by flooring type: Hardwood typically covers 20 sq ft per box, laminate 20-25 sq ft, vinyl plank 30-40 sq ft, and tile 10-15 sq ft. Always check the box label as coverage varies by brand and plank size.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I calculate flooring for an L-shaped room?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Divide the L-shape into two rectangles. Calculate the square footage of each rectangle (length × width), then add them together. Our calculator has a built-in L-shape option that does this automatically for you.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Should I buy all my flooring at once?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, always buy all flooring at the same time. Different manufacturing batches can have slight color variations. Purchasing everything together ensures color consistency throughout your project and prevents issues if the product is discontinued later.",
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
                <Ruler className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Measure Your Space</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Enter room dimensions in feet or meters. Use L-shape option for complex rooms 
                with alcoves or wings.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Grid3X3 className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Select Flooring</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose from hardwood, laminate, vinyl, carpet, or tile. 
                Customize plank sizes and costs for your specific product.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Calculate Materials</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Get plank/tile counts, boxes needed, and total cost. 
                Includes waste factor for cuts and future repairs.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Not sure of your room size?{" "}
            <Link href="/square-footage-calculator" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Calculate your room&apos;s square footage first
            </Link>
            .
          </p>
        </div>

        {/* Related Tools */}
        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="flooring-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
