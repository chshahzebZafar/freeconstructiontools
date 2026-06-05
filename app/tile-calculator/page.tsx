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
} from "lucide-react";

/* ─── Types ─── */
type Unit = "imperial" | "metric";
type TileType = "ceramic" | "porcelain" | "subway" | "mosaic" | "large_format";
type Pattern = "straight" | "diagonal" | "brick" | "herringbone";
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

interface TileSpecs {
  name: string;
  tileWidth: number;
  tileHeight: number;
  coveragePerBox: number;
  tilesPerBox: number;
  costPerSqFt: number;
  wasteFactor: number;
}

interface RoomResult {
  area: number;
  effectiveArea: number;
  tilesNeeded: number;
  boxesNeeded: number;
  roomCost: number;
}

interface TotalResult {
  rooms: RoomResult[];
  totalArea: number;
  totalTiles: number;
  totalBoxes: number;
  materialCost: number;
  totalCost: number;
}

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const genId = () => Math.random().toString(36).slice(2, 9);

const tileTypes: Record<TileType, TileSpecs> = {
  ceramic: {
    name: "Ceramic Tile",
    tileWidth: 12,
    tileHeight: 12,
    coveragePerBox: 16,
    tilesPerBox: 16,
    costPerSqFt: 3.5,
    wasteFactor: 10,
  },
  porcelain: {
    name: "Porcelain Tile",
    tileWidth: 12,
    tileHeight: 24,
    coveragePerBox: 16,
    tilesPerBox: 8,
    costPerSqFt: 5.5,
    wasteFactor: 10,
  },
  subway: {
    name: "Subway Tile",
    tileWidth: 3,
    tileHeight: 6,
    coveragePerBox: 10,
    tilesPerBox: 80,
    costPerSqFt: 8,
    wasteFactor: 15,
  },
  mosaic: {
    name: "Mosaic Tile",
    tileWidth: 12,
    tileHeight: 12,
    coveragePerBox: 10,
    tilesPerBox: 10,
    costPerSqFt: 12,
    wasteFactor: 15,
  },
  large_format: {
    name: "Large Format",
    tileWidth: 24,
    tileHeight: 24,
    coveragePerBox: 16,
    tilesPerBox: 4,
    costPerSqFt: 7,
    wasteFactor: 15,
  },
};

const patterns: Record<Pattern, { name: string; wasteMultiplier: number }> = {
  straight: { name: "Straight Lay", wasteMultiplier: 1.0 },
  diagonal: { name: "Diagonal (45°)", wasteMultiplier: 1.15 },
  brick: { name: "Running Bond", wasteMultiplier: 1.05 },
  herringbone: { name: "Herringbone", wasteMultiplier: 1.2 },
};

const defaultRoom: Room = {
  id: genId(),
  name: "Room 1",
  shape: "rectangular",
  length: 8,
  width: 6,
  length2: 4,
  width2: 3,
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
export default function TileCalculator() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [tileType, setTileType] = useState<TileType>("ceramic");
  const [pattern, setPattern] = useState<Pattern>("straight");
  const [groutWidth, setGroutWidth] = useState(0.125);
  const [rooms, setRooms] = useState<Room[]>([defaultRoom]);
  
  // Custom specs override
  const [customTileWidth, setCustomTileWidth] = useState(0);
  const [customTileHeight, setCustomTileHeight] = useState(0);
  const [customCoverage, setCustomCoverage] = useState(0);
  const [customTilesPerBox, setCustomTilesPerBox] = useState(0);
  const [customCost, setCustomCost] = useState(0);
  const [customWaste, setCustomWaste] = useState(0);
  const [useCustomSpecs, setUseCustomSpecs] = useState(false);

  const specs = useMemo(() => {
    const base = tileTypes[tileType];
    if (!useCustomSpecs) return base;
    return {
      ...base,
      tileWidth: customTileWidth || base.tileWidth,
      tileHeight: customTileHeight || base.tileHeight,
      coveragePerBox: customCoverage || base.coveragePerBox,
      tilesPerBox: customTilesPerBox || base.tilesPerBox,
      costPerSqFt: customCost || base.costPerSqFt,
      wasteFactor: customWaste || base.wasteFactor,
    };
  }, [tileType, useCustomSpecs, customTileWidth, customTileHeight, customCoverage, customTilesPerBox, customCost, customWaste]);

  const isImp = unit === "imperial";
  const lenUnit = isImp ? "ft" : "m";
  const areaUnit = isImp ? "sq ft" : "m²";

  // Calculate room area
  const calcRoomArea = (room: Room): number => {
    if (room.shape === "rectangular") {
      return room.length * room.width;
    }
    const mainArea = room.length * room.width;
    const wingArea = room.length2 * room.width2;
    const overlap = Math.min(room.width, room.width2) * Math.min(room.length, room.length2);
    return mainArea + wingArea - overlap;
  };

  // Calculate results
  const totals: TotalResult = useMemo(() => {
    const patternMultiplier = patterns[pattern].wasteMultiplier;
    
    const roomsResults = rooms.map((room) => {
      const area = calcRoomArea(room);
      const wasteMultiplier = 1 + specs.wasteFactor / 100;
      const effectiveArea = area * wasteMultiplier * patternMultiplier;
      
      // Calculate tile area including grout (in sq ft)
      const groutFt = groutWidth / 12;
      const tileAreaWithGrout = ((specs.tileWidth / 12) + groutFt) * ((specs.tileHeight / 12) + groutFt);
      const tilesNeeded = Math.ceil(effectiveArea / tileAreaWithGrout);
      
      // Calculate boxes needed
      const boxesNeeded = Math.ceil(tilesNeeded / specs.tilesPerBox);
      
      // Cost
      const roomCost = effectiveArea * specs.costPerSqFt;

      return {
        area,
        effectiveArea,
        tilesNeeded,
        boxesNeeded,
        roomCost,
      };
    });

    const totalArea = roomsResults.reduce((sum, r) => sum + r.area, 0);
    const totalTiles = roomsResults.reduce((sum, r) => sum + r.tilesNeeded, 0);
    const totalBoxes = roomsResults.reduce((sum, r) => sum + r.boxesNeeded, 0);
    const materialCost = roomsResults.reduce((sum, r) => sum + r.roomCost, 0);

    return {
      rooms: roomsResults,
      totalArea,
      totalTiles,
      totalBoxes,
      materialCost,
      totalCost: materialCost,
    };
  }, [rooms, specs, pattern, groutWidth]);

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
    setPattern("straight");
    setGroutWidth(0.125);
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
    doc.text("Tile Calculator Report", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    // Project Settings
    section("Project Settings");
    row("Tile Type", specs.name);
    row("Pattern", patterns[pattern].name);
    row("Tile Size", `${specs.tileWidth}" × ${specs.tileHeight}"`);
    row("Grout Width", `${fmt(groutWidth, 3)}"`);
    row("Coverage Per Box", `${specs.coveragePerBox} ${areaUnit}`);
    row("Tiles Per Box", String(specs.tilesPerBox));
    row("Waste Factor", `${specs.wasteFactor}%`);
    row("Cost Per Sq Ft", `$${fmt(specs.costPerSqFt, 2)}`);
    row("Number of Rooms", String(rooms.length));
    y += 2;

    // Summary
    section("Material Summary");
    row("Total Tiled Area", `${fmt(totals.totalArea, 1)} ${areaUnit}`);
    row("Individual Tiles Needed", String(totals.totalTiles));
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
      
      doc.text(`Tile Area: ${fmt(rr.area, 1)} ${areaUnit}`, margin + 3, y);
      y += 5;
      doc.text(`With Waste: ${fmt(rr.effectiveArea, 1)} ${areaUnit}`, margin + 3, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`Tiles: ${rr.tilesNeeded} (${rr.boxesNeeded} boxes)`, margin + 3, y);
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
        "Estimates are for planning purposes only. Always measure your space carefully and order 10-15% extra for cuts, pattern matching, and future repairs.",
        pageW - margin * 2
      ),
      margin,
      y
    );

    doc.save(`tile-calculator-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Tile Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Estimate tiles needed for floors, walls, backsplashes, and showers. 
            Accounts for grout spacing, pattern layout, waste factor, and material cost.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tile Type Selection */}
            <Card>
              <SectionTitle icon={Grid3X3} title="Select Tile Type" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(Object.keys(tileTypes) as TileType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTileType(type)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      tileType === type
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    <div className="text-sm font-medium">{tileTypes[type].name}</div>
                    <div className="text-xs text-zinc-500 mt-1">{tileTypes[type].tileWidth}"×{tileTypes[type].tileHeight}"</div>
                  </button>
                ))}
              </div>

              {/* Pattern Selection */}
              <div className="mt-6">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Installation Pattern</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(patterns) as Pattern[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPattern(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        pattern === p
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                      }`}
                    >
                      {patterns[p].name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Pattern adds {(patterns[pattern].wasteMultiplier - 1) * 100}% extra for cuts
                </p>
              </div>

              {/* Grout Width */}
              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Grout Width</label>
                <div className="flex flex-wrap gap-2">
                  {[0.0625, 0.125, 0.25, 0.375, 0.5].map((width) => (
                    <button
                      key={width}
                      onClick={() => setGroutWidth(width)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        groutWidth === width
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                      }`}
                    >
                      {width === 0.0625 ? "1/16" : width === 0.125 ? "1/8" : width === 0.25 ? "1/4" : width === 0.375 ? "3/8" : "1/2"}&quot;
                    </button>
                  ))}
                </div>
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
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Customize tile specifications</span>
                </label>

                {useCustomSpecs && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <NumberField
                      label="Tile Width"
                      value={customTileWidth}
                      onChange={setCustomTileWidth}
                      unit='"'
                      note={`Default: ${specs.tileWidth}"`}
                    />
                    <NumberField
                      label="Tile Height"
                      value={customTileHeight}
                      onChange={setCustomTileHeight}
                      unit='"'
                      note={`Default: ${specs.tileHeight}"`}
                    />
                    <NumberField
                      label="Coverage Per Box"
                      value={customCoverage}
                      onChange={setCustomCoverage}
                      unit={areaUnit}
                      note={`Default: ${specs.coveragePerBox}`}
                    />
                    <NumberField
                      label="Tiles Per Box"
                      value={customTilesPerBox}
                      onChange={setCustomTilesPerBox}
                      note={`Default: ${specs.tilesPerBox}`}
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
                        <div className="text-xs text-zinc-500">Tiles</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{rr.tilesNeeded}</div>
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
              <SectionTitle icon={Calculator} title="Tile Estimate" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Tile Area</span>
                  <span className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {fmt(totals.totalArea, 1)} {areaUnit}
                  </span>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Individual Tiles</span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {totals.totalTiles}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">{specs.tileWidth}" × {specs.tileHeight}" each</p>
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
                  <p className="text-xs text-zinc-500 text-right">{specs.tilesPerBox} tiles per box</p>
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
                  <p className="text-xs text-zinc-500 text-right">${specs.costPerSqFt}/sq ft + waste</p>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Tile Installation Tips</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Buy 10-15% extra for cuts and pattern matching
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Diagonal and herringbone patterns need 15-20% more
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Mix tiles from multiple boxes for consistent color
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Keep extra tiles for future repairs
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

        {/* SEO Content Section */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white mb-6">
              How Many Tiles Do I Need?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Calculating tile quantities accurately is essential for any tiling project, whether you&apos;re 
              updating a bathroom, installing a kitchen backsplash, or tiling an entire floor. Our tile 
              calculator helps you determine exactly how many tiles you need, accounting for grout spacing, 
              pattern layout, and waste factor.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  How to Calculate Tile Quantity
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Measure the Area</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Measure the length and width of your surface in feet. For walls, measure height × width. 
                        For floors, measure length × width. For L-shaped areas, divide into rectangles and add together.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Calculate Square Footage</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Multiply length × width to get square footage. This is your base area before accounting 
                        for cuts, grout, or pattern waste.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">3</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Account for Pattern</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Different patterns require different amounts of extra material. Straight lay needs 10% extra, 
                        diagonal needs 15%, and herringbone needs 20% extra for cuts and alignment.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center shrink-0">4</div>
                    <div>
                      <h4 className="font-medium text-zinc-950 dark:text-white">Determine Boxes Needed</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Divide your total tile count by tiles per box. Always round up and keep at least one 
                        unopened box for future repairs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Tile Pattern Waste Guide
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Pattern</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Extra Material</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Best For</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-400">
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Straight Lay</td>
                        <td className="py-2">10%</td>
                        <td className="py-2">Simple, modern look</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Running Bond / Brick</td>
                        <td className="py-2">10-12%</td>
                        <td className="py-2">Subway tile, classic look</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Diagonal (45°)</td>
                        <td className="py-2">15%</td>
                        <td className="py-2">Visual interest, spacious feel</td>
                      </tr>
                      <tr>
                        <td className="py-2">Herringbone</td>
                        <td className="py-2">15-20%</td>
                        <td className="py-2">Elegant, sophisticated pattern</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Common Tile Sizes</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Standard ceramic tiles are 12&quot; × 12&quot;. Subway tiles are typically 3&quot; × 6&quot;. 
                    Large format tiles range from 12&quot; × 24&quot; to 24&quot; × 48". Mosaic sheets are usually 12&quot; × 12".
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Grout Considerations</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Standard grout lines are 1/8&quot; for walls and 1/4&quot; for floors. Larger tiles typically 
                    need wider grout lines. Grout spacing affects total tile count slightly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How many tiles do I need for 100 square feet?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "For 100 square feet with 12x12 inch tiles, you need approximately 100 tiles plus 10% waste = 110 tiles. For smaller subway tiles (3x6), you need about 800 tiles. Use our calculator for precise counts based on your tile size.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much extra tile should I buy?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Buy 10% extra for straight patterns, 15% for diagonal layouts, and 15-20% for herringbone patterns. Always keep at least one extra box for future repairs in case tiles are discontinued.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I calculate tile for a backsplash?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Measure the wall area (height × width) to get square footage. Subtract areas occupied by cabinets or windows. Add 10-15% waste factor. Subway tiles are popular for backsplashes and typically measure 3x6 inches.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is the standard grout width for tile?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Standard grout lines are 1/16 to 1/8 inch for walls, 1/8 to 1/4 inch for floors. Larger format tiles (12x24 or larger) typically use 1/4 inch grout lines. Mosaic tiles usually have minimal grout spacing.",
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
                Enter room dimensions for floors, walls, or backsplashes. Use L-shape option for complex layouts.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Grid3X3 className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Select Tile & Pattern</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose from ceramic, porcelain, subway, mosaic, or large format tiles. Select your installation pattern.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Get Your Estimate</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Receive tile count, boxes needed, and material cost with waste factor included.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Not sure of your floor area?{" "}
            <Link href="/square-footage-calculator" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Find your room&apos;s square footage
            </Link>
            {" "}before calculating tile.
          </p>
        </div>

        {/* Related Tools */}
        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="tile-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
