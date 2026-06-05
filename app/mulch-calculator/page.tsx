"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";
import { Button } from "@/components/ui/Button";
import {
  Calculator,
  FileDown,
  Info,
  Check,
  Plus,
  Trash2,
  Layers,
  DollarSign,
  Leaf,
} from "lucide-react";

/* ─── Types ─── */
type BedShape = "rectangle" | "circle" | "triangle";
type AreaUnit = "ft" | "m" | "yd";
type DepthUnit = "in" | "cm";
type MulchType = "shredded-hardwood" | "pine-bark" | "cedar" | "rubber" | "straw" | "compost";

interface Bed {
  id: string;
  name: string;
  shape: BedShape;
  unit: AreaUnit;
  // rectangle
  length: number;
  width: number;
  // circle
  radius: number;
  // triangle
  base: number;
  height: number;
}

interface Config {
  depth: number;
  depthUnit: DepthUnit;
  mulchType: MulchType;
  bagSize: number; // cubic feet per bag
  bulkCostPerYard: number;
  bagCost: number;
  wasteFactor: number;
}

interface BedResult {
  areaSqFt: number;
  cubicFt: number;
  cubicYards: number;
}

/* ─── Constants ─── */
const mulchTypes: Record<MulchType, string> = {
  "shredded-hardwood": "Shredded Hardwood",
  "pine-bark": "Pine Bark",
  cedar: "Cedar",
  rubber: "Rubber Mulch",
  straw: "Straw / Hay",
  compost: "Compost",
};

const areaUnitLabels: Record<AreaUnit, string> = { ft: "ft", m: "m", yd: "yd" };
const depthUnitLabels: Record<DepthUnit, string> = { in: "in", cm: "cm" };

// Convert area unit to feet factor
const areaToFt: Record<AreaUnit, number> = { ft: 1, m: 3.28084, yd: 3 };
// Convert depth to inches factor
const depthToIn: Record<DepthUnit, number> = { in: 1, cm: 0.393701 };

const genId = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const defaultBed: Bed = {
  id: genId(),
  name: "Bed 1",
  shape: "rectangle",
  unit: "ft",
  length: 12,
  width: 4,
  radius: 5,
  base: 10,
  height: 6,
};

const defaultConfig: Config = {
  depth: 3,
  depthUnit: "in",
  mulchType: "shredded-hardwood",
  bagSize: 2,
  bulkCostPerYard: 45,
  bagCost: 6.5,
  wasteFactor: 10,
};

/* ─── Helper Components ─── */
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 0.5,
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

/* ─── Calculation Logic ─── */
function calcBed(bed: Bed, config: Config): BedResult {
  const f = areaToFt[bed.unit];
  let areaSqFt = 0;

  if (bed.shape === "rectangle") {
    areaSqFt = bed.length * f * (bed.width * f);
  } else if (bed.shape === "circle") {
    areaSqFt = Math.PI * Math.pow(bed.radius * f, 2);
  } else {
    areaSqFt = 0.5 * (bed.base * f) * (bed.height * f);
  }

  const depthIn = config.depth * depthToIn[config.depthUnit];
  const depthFt = depthIn / 12;
  const wasteMultiplier = 1 + config.wasteFactor / 100;
  const cubicFt = areaSqFt * depthFt * wasteMultiplier;
  const cubicYards = cubicFt / 27;

  return { areaSqFt, cubicFt, cubicYards };
}

/* ─── Main Page ─── */
export default function MulchCalculator() {
  const [beds, setBeds] = useState<Bed[]>([defaultBed]);
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [showCosts, setShowCosts] = useState(false);

  const bedResults = useMemo(() => beds.map((b) => calcBed(b, config)), [beds, config]);

  const totals = useMemo(() => {
    const totalCubicFt = bedResults.reduce((s, r) => s + r.cubicFt, 0);
    const totalCubicYards = bedResults.reduce((s, r) => s + r.cubicYards, 0);
    const totalAreaSqFt = bedResults.reduce((s, r) => s + r.areaSqFt, 0);
    const bagsNeeded = Math.ceil(totalCubicFt / config.bagSize);
    const bulkCost = totalCubicYards * config.bulkCostPerYard;
    const bagCostTotal = bagsNeeded * config.bagCost;

    return { totalCubicFt, totalCubicYards, totalAreaSqFt, bagsNeeded, bulkCost, bagCostTotal };
  }, [bedResults, config]);

  const addBed = () => setBeds([...beds, { ...defaultBed, id: genId(), name: `Bed ${beds.length + 1}` }]);
  const removeBed = (id: string) => { if (beds.length > 1) setBeds(beds.filter((b) => b.id !== id)); };
  const updateBed = (id: string, updates: Partial<Bed>) => setBeds(beds.map((b) => b.id === id ? { ...b, ...updates } : b));

  const reset = () => { setBeds([defaultBed]); setConfig(defaultConfig); };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    let y = 20;

    const checkPage = () => { if (y > 268) { doc.addPage(); y = 18; } };
    const sec = (title: string) => {
      checkPage(); y += 3;
      doc.setFillColor(30, 30, 30); doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), margin + 3, y + 5); y += 11;
    };
    const row = (label: string, value: string) => {
      checkPage();
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
      doc.text(value, pageW - margin, y, { align: "right" }); y += 6.5;
    };
    const totalLine = (label: string, value: string) => {
      checkPage();
      doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4;
      doc.setFillColor(240, 240, 255); doc.rect(margin, y - 1, pageW - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(60, 60, 200);
      doc.text(label, margin, y + 4); doc.text(value, pageW - margin, y + 4, { align: "right" }); y += 11;
    };

    // Header
    doc.setFillColor(15, 15, 15); doc.rect(0, 0, pageW, 18, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
    doc.text("Mulch Estimate Report", margin, 12);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    sec("Project Settings");
    row("Mulch Type", mulchTypes[config.mulchType]);
    row("Mulch Depth", `${config.depth} ${depthUnitLabels[config.depthUnit]}`);
    row("Waste Factor", `${config.wasteFactor}%`);
    row("Bag Size", `${config.bagSize} cu ft`);
    y += 2;

    sec("Total Requirements");
    row("Total Area", `${fmt(totals.totalAreaSqFt, 0)} sq ft`);
    row("Cubic Feet", `${fmt(totals.totalCubicFt, 1)} cu ft`);
    row("Cubic Yards (Bulk)", `${fmt(totals.totalCubicYards, 2)} cu yd`);
    row("Bags Needed", `${totals.bagsNeeded} bags (${config.bagSize} cu ft each)`);
    totalLine("Bulk Cost Estimate", `$${fmt(totals.bulkCost, 2)}`);
    totalLine("Bagged Cost Estimate", `$${fmt(totals.bagCostTotal, 2)}`);

    sec("Bed Details");
    beds.forEach((bed, i) => {
      const r = bedResults[i];
      checkPage(); y += 2;
      doc.setFillColor(240, 240, 240); doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      doc.text(`${bed.name}  (${bed.shape})`, margin + 3, y + 4.2); y += 9;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      if (bed.shape === "rectangle") {
        doc.text(`Dimensions: ${bed.length} × ${bed.width} ${areaUnitLabels[bed.unit]}`, margin + 3, y); y += 5;
      } else if (bed.shape === "circle") {
        doc.text(`Radius: ${bed.radius} ${areaUnitLabels[bed.unit]}`, margin + 3, y); y += 5;
      } else {
        doc.text(`Base: ${bed.base} ${areaUnitLabels[bed.unit]}  |  Height: ${bed.height} ${areaUnitLabels[bed.unit]}`, margin + 3, y); y += 5;
      }
      doc.text(`Area: ${fmt(r.areaSqFt, 0)} sq ft  |  Mulch: ${fmt(r.cubicYards, 2)} cu yd`, margin + 3, y); y += 8;
    });

    doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 6;
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(130, 130, 130);
    doc.text(doc.splitTextToSize("Estimates include the selected waste factor. Actual requirements may vary based on settling, uneven terrain, and irregular bed shapes.", pageW - margin * 2), margin, y);

    doc.save(`mulch-estimate-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Mulch Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Calculate exactly how many cubic yards or bags of mulch you need for any garden bed or
            landscape area. Supports multiple beds, shapes, and depths — with bulk vs. bag cost comparison.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Inputs */}
          <div className="lg:col-span-2 space-y-6">

            {/* Global Settings */}
            <Card>
              <SectionTitle icon={Layers} title="Mulch Settings" />
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Mulch Type */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mulch Type</label>
                  <select
                    value={config.mulchType}
                    onChange={(e) => setConfig({ ...config, mulchType: e.target.value as MulchType })}
                    className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {(Object.entries(mulchTypes) as [MulchType, string][]).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Depth */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Desired Depth</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={config.depth}
                      onChange={(e) => setConfig({ ...config, depth: parseFloat(e.target.value) || 0 })}
                      className="flex-1 h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      {(["in", "cm"] as DepthUnit[]).map((u) => (
                        <button
                          key={u}
                          onClick={() => setConfig({ ...config, depthUnit: u })}
                          className={`px-3 text-xs font-medium transition-colors ${
                            config.depthUnit === u
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Recommended: 2–3 in for existing beds, 4 in for new beds</p>
                </div>
              </div>

              {/* Waste Factor */}
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Waste Factor</label>
                  <span className="text-sm font-semibold text-zinc-950 dark:text-white">{config.wasteFactor}%</span>
                </div>
                <input
                  type="range" min={0} max={20} value={config.wasteFactor}
                  onChange={(e) => setConfig({ ...config, wasteFactor: parseInt(e.target.value) })}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-zinc-500 mt-1">Extra for irregular edges, settling, and overlapping</p>
              </div>
            </Card>

            {/* Bed Sections */}
            {beds.map((bed, i) => {
              const r = bedResults[i];
              return (
                <Card key={bed.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <input
                        type="text"
                        value={bed.name}
                        onChange={(e) => updateBed(bed.id, { name: e.target.value })}
                        className="font-semibold text-zinc-950 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </div>
                    {beds.length > 1 && (
                      <button onClick={() => removeBed(bed.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Shape Selector */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Shape</label>
                    <div className="flex gap-2">
                      {(["rectangle", "circle", "triangle"] as BedShape[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateBed(bed.id, { shape: s })}
                          className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors capitalize ${
                            bed.shape === s
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Unit toggle */}
                  <div className="flex gap-2 mb-4">
                    <span className="text-sm text-zinc-500 self-center mr-1">Unit:</span>
                    {(Object.keys(areaUnitLabels) as AreaUnit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => updateBed(bed.id, { unit: u })}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          bed.unit === u
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>

                  {/* Shape-specific inputs */}
                  {bed.shape === "rectangle" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <NumberField label="Length" value={bed.length} onChange={(v) => updateBed(bed.id, { length: v })} unit={areaUnitLabels[bed.unit]} />
                      <NumberField label="Width" value={bed.width} onChange={(v) => updateBed(bed.id, { width: v })} unit={areaUnitLabels[bed.unit]} />
                    </div>
                  )}
                  {bed.shape === "circle" && (
                    <NumberField label="Radius" value={bed.radius} onChange={(v) => updateBed(bed.id, { radius: v })} unit={areaUnitLabels[bed.unit]} note="Half the diameter of your circular bed" />
                  )}
                  {bed.shape === "triangle" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <NumberField label="Base" value={bed.base} onChange={(v) => updateBed(bed.id, { base: v })} unit={areaUnitLabels[bed.unit]} />
                      <NumberField label="Height" value={bed.height} onChange={(v) => updateBed(bed.id, { height: v })} unit={areaUnitLabels[bed.unit]} />
                    </div>
                  )}

                  {/* Bed Summary */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-zinc-500">Area</div>
                      <div className="font-semibold text-zinc-950 dark:text-white">{fmt(r.areaSqFt, 0)} sq ft</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Cubic Feet</div>
                      <div className="font-semibold text-zinc-950 dark:text-white">{fmt(r.cubicFt, 1)} ft³</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Cubic Yards</div>
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(r.cubicYards, 2)} yd³</div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add Bed */}
            <button
              onClick={addBed}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Bed / Area
            </button>

            {/* Costs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle icon={DollarSign} title="Pricing" />
                <button onClick={() => setShowCosts(!showCosts)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  {showCosts ? "Hide" : "Edit Costs"}
                </button>
              </div>
              {showCosts ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <NumberField label="Bulk Mulch (per cu yd)" value={config.bulkCostPerYard} onChange={(v) => setConfig({ ...config, bulkCostPerYard: v })} unit="$/yd³" step={0.5} />
                  <NumberField label="Bag Cost" value={config.bagCost} onChange={(v) => setConfig({ ...config, bagCost: v })} unit="$/bag" step={0.25} />
                  <NumberField label="Bag Size" value={config.bagSize} onChange={(v) => setConfig({ ...config, bagSize: Math.max(0.5, v) })} unit="cu ft" step={0.5} note="Most bags are 1.5 or 2 cu ft" />
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Default pricing: $45/yd³ bulk, $6.50/bag (2 cu ft). Click &quot;Edit Costs&quot; to match your local supplier.
                </p>
              )}
            </Card>
          </div>

          {/* Right — Results */}
          <div className="space-y-6">
            <Card className="bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20">
              <SectionTitle icon={Calculator} title="Mulch Estimate" />

              <div className="space-y-4">
                <div className="border-b border-indigo-200 dark:border-indigo-500/20 pb-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {fmt(totals.totalCubicYards, 2)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">cubic yards (bulk)</div>
                  <div className="text-xs text-zinc-500 mt-1">{fmt(totals.totalCubicFt, 1)} cubic feet</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Total Area</span>
                    <span className="font-semibold text-zinc-950 dark:text-white">{fmt(totals.totalAreaSqFt, 0)} sq ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Bags Needed ({config.bagSize} cu ft)</span>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.bagsNeeded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Mulch Depth</span>
                    <span className="font-semibold text-zinc-950 dark:text-white">{config.depth} {depthUnitLabels[config.depthUnit]}</span>
                  </div>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Bulk Cost</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${fmt(totals.bulkCost, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Bagged Cost</span>
                    </div>
                    <span className="text-lg font-semibold text-zinc-950 dark:text-white">${fmt(totals.bagCostTotal, 0)}</span>
                  </div>
                  <p className="text-xs text-zinc-500">Bulk delivery is usually cheaper above 3 yards</p>
                </div>
              </div>
            </Card>

            {/* Depth Reference */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Depth Guidelines</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      <span><strong>2 in</strong> — top-up refresh</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      <span><strong>3 in</strong> — standard weed control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      <span><strong>4 in</strong> — new beds, max weed block</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      <span>Don&apos;t pile mulch against tree trunks</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

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

        {/* ── SEO Content ── */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white mb-4">
              How to Calculate How Much Mulch You Need
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Mulch is sold by the cubic yard (bulk delivery) or by the bag (typically 1.5–2 cubic feet each).
              Getting the right amount saves money and prevents under-mulching — which lets weeds through —
              or over-mulching, which can suffocate plants and rot root systems.
            </p>

            <div className="space-y-8">
              {/* Formula */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-3">The Mulch Formula</h3>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Step 1 — Area</p>
                    <code className="text-sm text-indigo-600 dark:text-indigo-400">Area (sq ft) = Length × Width</code>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Step 2 — Cubic Feet</p>
                    <code className="text-sm text-indigo-600 dark:text-indigo-400">Cubic Feet = Area × (Depth in inches ÷ 12)</code>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Step 3 — Cubic Yards</p>
                    <code className="text-sm text-indigo-600 dark:text-indigo-400">Cubic Yards = Cubic Feet ÷ 27</code>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Step 4 — Bags</p>
                    <code className="text-sm text-indigo-600 dark:text-indigo-400">Bags = Cubic Feet ÷ Bag Size (usually 2 cu ft)</code>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  <strong>Example:</strong> A 10 × 20 ft bed at 3 in depth = 200 sq ft × 0.25 ft = 50 cu ft = 1.85 cu yd ≈ 25 bags (2 cu ft each).
                  Not sure of your bed&apos;s square footage? Use our{" "}
                  <Link href="/square-footage-calculator" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    square footage calculator
                  </Link>{" "}
                  first.
                </p>
              </div>

              {/* Depth Table */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-3">Recommended Mulch Depth by Purpose</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <thead className="bg-zinc-100 dark:bg-zinc-800">
                      <tr>
                        <th className="text-left px-4 py-3 text-zinc-700 dark:text-zinc-300">Purpose</th>
                        <th className="text-left px-4 py-3 text-zinc-700 dark:text-zinc-300">Depth</th>
                        <th className="text-left px-4 py-3 text-zinc-700 dark:text-zinc-300">Coverage (per yd³)</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-400">
                      {[
                        ["Top-up / refresh", "1–2 in", "162–324 sq ft"],
                        ["Standard weed suppression", "3 in", "108 sq ft"],
                        ["New bed / max weed block", "4 in", "81 sq ft"],
                        ["Playground safety", "6–9 in", "36–54 sq ft"],
                        ["Pathway / trail", "4–6 in", "54–81 sq ft"],
                      ].map(([p, d, c]) => (
                        <tr key={p} className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className="px-4 py-2.5">{p}</td>
                          <td className="px-4 py-2.5 font-medium">{d}</td>
                          <td className="px-4 py-2.5">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mulch Types */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-3">Choosing the Right Mulch</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: "Shredded Hardwood", pros: "Affordable, long-lasting, great weed suppression", best: "Flower beds, trees, shrubs" },
                    { name: "Pine Bark", pros: "Slow to decompose, good drainage, acidifies soil", best: "Acid-loving plants (azalea, blueberry)" },
                    { name: "Cedar", pros: "Natural insect repellent, aromatic, slow to break down", best: "Areas near patios, vegetable gardens" },
                    { name: "Rubber Mulch", pros: "Extremely durable, doesn't decompose, stays in place", best: "Playgrounds, high-traffic paths" },
                    { name: "Straw / Hay", pros: "Cheap, lightweight, great for vegetable gardens", best: "Vegetable beds, erosion control" },
                    { name: "Compost", pros: "Feeds soil, improves structure, sustainable", best: "All garden beds (best for soil health)" },
                  ].map(({ name, pros, best }) => (
                    <div key={name} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                      <h4 className="font-semibold text-zinc-950 dark:text-white mb-1">{name}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{pros}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400"><strong>Best for:</strong> {best}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bulk vs Bagged */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-3">Bulk vs. Bagged Mulch</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-zinc-950 dark:text-white mb-2">Bulk Delivery</h4>
                    <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                      <li>✅ Cheaper for large projects (&gt;3 yd³)</li>
                      <li>✅ Delivered by truck or dump trailer</li>
                      <li>✅ Typical cost: $30–$65 per cubic yard</li>
                      <li>❌ Minimum order (usually 1–2 yards)</li>
                      <li>❌ Requires wheelbarrow for spreading</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-950 dark:text-white mb-2">Bagged Mulch</h4>
                    <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                      <li>✅ No minimum, easy to store</li>
                      <li>✅ Convenient for small areas</li>
                      <li>✅ Typical cost: $4–$8 per 2 cu ft bag</li>
                      <li>❌ More expensive per cubic yard</li>
                      <li>❌ Heavy lifting, more trips from store</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-sm text-zinc-700 dark:text-zinc-300">
                  💡 <strong>Tip:</strong> Break-even point is roughly 2–3 cubic yards. Below that, bags may be more convenient. Above that, bulk delivery almost always saves money.
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
                  name: "How many cubic yards of mulch do I need?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "To calculate cubic yards: multiply your bed's length × width to get square footage, then multiply by your desired depth in feet (depth in inches ÷ 12), then divide by 27. For example, a 200 sq ft bed at 3 inches deep needs 200 × 0.25 ÷ 27 = 1.85 cubic yards.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How many bags of mulch do I need?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Divide your total cubic feet by the bag size (most bags are 1.5 or 2 cubic feet). For 50 cubic feet using 2 cu ft bags, you need 25 bags. Always round up to the nearest whole bag.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How deep should mulch be?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Apply 2–3 inches of mulch for established garden beds as a weed-suppressing refresh. New beds benefit from 3–4 inches. Never apply more than 4 inches around plants or pile mulch against tree trunks, as this can rot bark and suffocate roots.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much does a cubic yard of mulch cover?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "One cubic yard of mulch covers approximately 108 square feet at 3 inches deep, 162 square feet at 2 inches deep, or 81 square feet at 4 inches deep.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is bulk mulch cheaper than bagged mulch?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, bulk mulch is typically 40–60% cheaper per cubic yard than buying bags. At $45 per cubic yard bulk vs $6.50 per 2 cu ft bag ($87.75/yd³ bagged), bulk saves nearly half the cost. Bulk delivery becomes cost-effective above about 2–3 cubic yards.",
                  },
                },
              ],
            }),
          }}
        />

        {/* How It Works */}
        <div className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white mb-6">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Leaf className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Add Your Beds</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Enter each garden bed or landscape area. Supports rectangular, circular, and triangular shapes.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Set Depth & Type</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose mulch type and desired depth. Calculator applies waste factor automatically.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Calculator className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Get Yards & Bags</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Instantly get cubic yards for bulk delivery or bag count, plus a bulk vs. bagged cost comparison.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="mulch-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
