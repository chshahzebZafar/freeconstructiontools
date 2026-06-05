"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";
import { Button } from "@/components/ui/Button";
import {
  Home,
  Calculator,
  FileDown,
  Plus,
  Trash2,
  Info,
  Check,
  Triangle,
  Square,
  Layers,
  Ruler,
  DollarSign,
  Wind,
  Shield,
} from "lucide-react";

/* ─── Types ─── */
type RoofType = "gable" | "hip" | "gambrel" | "flat";
type Unit = "ft" | "m";

interface RoofSection {
  id: string;
  name: string;
  type: RoofType;
  unit: Unit;
  // Common dimensions
  length: number;
  width: number;
  pitch: number; // rise over run (e.g., 6 = 6/12 pitch)
  // Hip roof specific
  hipLength: number;
  // Gambrel specific
  upperPitch: number;
  // Overhang
  overhang: number;
}

interface MaterialCosts {
  shinglesPerBundle: number;
  bundleCost: number;
  underlaymentCost: number; // per square
  iceWaterShieldCost: number; // per square
  dripEdgeCost: number; // per linear ft
  ridgeVentCost: number; // per linear ft
  flashingCost: number; // per linear ft
  nailCost: number; // per square
}

interface SectionResult {
  baseArea: number;
  slopeFactor: number;
  actualArea: number;
  roofingSquares: number;
}

interface TotalResult {
  sections: SectionResult[];
  totalSquares: number;
  bundlesNeeded: number;
  underlaymentSquares: number;
  iceWaterShieldSquares: number;
  dripEdgeLinearFt: number;
  ridgeVentLinearFt: number;
  flashingLinearFt: number;
  materialCost: number;
}

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
const genId = () => Math.random().toString(36).slice(2, 9);

// Conversion to feet
const toFeet: Record<Unit, number> = {
  ft: 1,
  m: 3.28084,
};

const unitLabels: Record<Unit, string> = {
  ft: "ft",
  m: "m",
};

const roofTypeLabels: Record<RoofType, string> = {
  gable: "Gable Roof",
  hip: "Hip Roof",
  gambrel: "Gambrel Roof",
  flat: "Flat/Low Slope",
};

// Slope factor based on pitch (rise/run)
const getSlopeFactor = (pitch: number): number => {
  // slope factor = sqrt(1 + pitch²) where pitch is rise/run
  return Math.sqrt(1 + Math.pow(pitch / 12, 2));
};

const defaultSection: RoofSection = {
  id: genId(),
  name: "Main Roof",
  type: "gable",
  unit: "ft",
  length: 40,
  width: 30,
  pitch: 6,
  hipLength: 20,
  upperPitch: 12,
  overhang: 1,
};

const defaultCosts: MaterialCosts = {
  shinglesPerBundle: 33, // 3 bundles per square (100 sq ft)
  bundleCost: 35,
  underlaymentCost: 25, // per square
  iceWaterShieldCost: 75, // per square
  dripEdgeCost: 2.5, // per linear ft
  ridgeVentCost: 4, // per linear ft
  flashingCost: 5, // per linear ft
  nailCost: 15, // per square
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
export default function RoofingCalculator() {
  const [sections, setSections] = useState<RoofSection[]>([defaultSection]);
  const [wasteFactor, setWasteFactor] = useState(10);
  const [costs, setCosts] = useState<MaterialCosts>(defaultCosts);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate results for each section
  const calcSection = (section: RoofSection): SectionResult => {
    const ftFactor = toFeet[section.unit];
    const lengthFt = section.length * ftFactor;
    const widthFt = section.width * ftFactor;
    const overhangFt = section.overhang * ftFactor;

    // Base area (footprint)
    const baseArea = (lengthFt + 2 * overhangFt) * (widthFt + 2 * overhangFt);

    let actualArea = baseArea;
    let slopeFactor = 1;

    switch (section.type) {
      case "gable":
        slopeFactor = getSlopeFactor(section.pitch);
        actualArea = baseArea * slopeFactor;
        break;
      case "hip":
        slopeFactor = getSlopeFactor(section.pitch);
        // Hip roof has slightly more surface area due to the hip ridges
        actualArea = baseArea * slopeFactor * 1.05;
        break;
      case "gambrel":
        // Gambrel has two different slopes - approximate calculation
        const lowerSlope = getSlopeFactor(section.pitch);
        const upperSlope = getSlopeFactor(section.upperPitch);
        actualArea = baseArea * ((lowerSlope + upperSlope) / 2);
        slopeFactor = (lowerSlope + upperSlope) / 2;
        break;
      case "flat":
        // Flat or low slope - minimal slope factor
        slopeFactor = getSlopeFactor(section.pitch);
        actualArea = baseArea * slopeFactor;
        break;
    }

    return {
      baseArea,
      slopeFactor,
      actualArea,
      roofingSquares: actualArea / 100, // 1 roofing square = 100 sq ft
    };
  };

  // Calculate all totals
  const totals: TotalResult = useMemo(() => {
    const sectionResults = sections.map(calcSection);
    
    const totalRawSquares = sectionResults.reduce((sum, s) => sum + s.roofingSquares, 0);
    const wasteMultiplier = 1 + wasteFactor / 100;
    const totalSquares = totalRawSquares * wasteMultiplier;

    // Bundles needed (3 bundles per square for standard shingles)
    const bundlesPerSquare = 100 / costs.shinglesPerBundle;
    const bundlesNeeded = Math.ceil(totalSquares * bundlesPerSquare);

    // Linear feet calculations
    const totalLengthFt = sections.reduce((sum, s) => {
      const ftFactor = toFeet[s.unit];
      return sum + (s.length * ftFactor + s.width * ftFactor) * 2;
    }, 0);

    return {
      sections: sectionResults,
      totalSquares,
      bundlesNeeded,
      underlaymentSquares: Math.ceil(totalSquares),
      iceWaterShieldSquares: Math.ceil(totalSquares * 0.15), // ~15% for eaves/valleys
      dripEdgeLinearFt: Math.ceil(totalLengthFt),
      ridgeVentLinearFt: Math.ceil(sections.reduce((sum, s) => sum + s.length * toFeet[s.unit], 0)),
      flashingLinearFt: Math.ceil(totalLengthFt * 0.25), // ~25% for valleys, chimneys, etc.
      materialCost: 
        bundlesNeeded * costs.bundleCost +
        Math.ceil(totalSquares) * costs.underlaymentCost +
        Math.ceil(totalSquares * 0.15) * costs.iceWaterShieldCost +
        Math.ceil(totalLengthFt) * costs.dripEdgeCost +
        Math.ceil(sections.reduce((sum, s) => sum + s.length * toFeet[s.unit], 0)) * costs.ridgeVentCost +
        Math.ceil(totalLengthFt * 0.25) * costs.flashingCost +
        Math.ceil(totalSquares) * costs.nailCost,
    };
  }, [sections, wasteFactor, costs]);

  // Section management
  const addSection = () => {
    setSections([...sections, { ...defaultSection, id: genId(), name: `Section ${sections.length + 1}` }]);
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<RoofSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Reset
  const reset = () => {
    setSections([defaultSection]);
    setWasteFactor(10);
    setCosts(defaultCosts);
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
    doc.text("Roofing Estimate Report", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    // Project Summary
    section("Project Summary");
    row("Number of Sections", String(sections.length));
    row("Waste Factor", `${wasteFactor}%`);
    row("Total Roofing Squares", `${fmt(totals.totalSquares, 1)} squares`);
    y += 2;

    // Material Summary
    section("Material Requirements");
    row("Shingle Bundles", String(totals.bundlesNeeded));
    row("Underlayment", `${totals.underlaymentSquares} squares`);
    row("Ice & Water Shield", `${totals.iceWaterShieldSquares} squares`);
    row("Drip Edge", `${totals.dripEdgeLinearFt} linear ft`);
    row("Ridge Vent", `${totals.ridgeVentLinearFt} linear ft`);
    row("Flashing", `${totals.flashingLinearFt} linear ft`);
    totalLine("Total Material Cost", `$${fmt(totals.materialCost, 2)}`);

    // Section Details
    section("Roof Section Details");
    sections.forEach((sect, i) => {
      const sr = totals.sections[i];
      checkPage();

      y += 2;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${sect.name}  (${roofTypeLabels[sect.type]})`, margin + 3, y + 4.2);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      doc.text(`Dimensions: ${sect.length} × ${sect.width} ${unitLabels[sect.unit]}`, margin + 3, y);
      y += 5;
      doc.text(`Pitch: ${sect.pitch}/12 (${fmt(sr.slopeFactor, 2)} slope factor)`, margin + 3, y);
      y += 5;
      doc.text(`Base Area: ${fmt(sr.baseArea, 0)} sq ft`, margin + 3, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`Roofing Squares: ${fmt(sr.roofingSquares, 1)}`, margin + 3, y);
      y += 8;
    });

    // Cost Breakdown
    section("Cost Breakdown");
    row("Shingles", `$${fmt(totals.bundlesNeeded * costs.bundleCost, 2)}`);
    row("Underlayment", `$${fmt(totals.underlaymentSquares * costs.underlaymentCost, 2)}`);
    row("Ice & Water Shield", `$${fmt(totals.iceWaterShieldSquares * costs.iceWaterShieldCost, 2)}`);
    row("Drip Edge", `$${fmt(totals.dripEdgeLinearFt * costs.dripEdgeCost, 2)}`);
    row("Ridge Vent", `$${fmt(totals.ridgeVentLinearFt * costs.ridgeVentCost, 2)}`);
    row("Flashing", `$${fmt(totals.flashingLinearFt * costs.flashingCost, 2)}`);
    row("Nails & Fasteners", `$${fmt(Math.ceil(totals.totalSquares) * costs.nailCost, 2)}`);
    totalLine("Total", `$${fmt(totals.materialCost, 2)}`);

    // Disclaimer
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      doc.splitTextToSize(
        "This is a material estimate only. Actual requirements may vary based on roof complexity, local building codes, and site conditions. Always consult a qualified roofing contractor for final measurements and installation.",
        pageW - margin * 2
      ),
      margin,
      y
    );

    doc.save(`roofing-estimate-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Roofing Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Estimate roofing squares, shingles, underlayment, and total material cost for any roof shape. 
            Supports gable, hip, gambrel, and flat roofs with waste factor included.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Roof Sections */}
            {sections.map((section, i) => {
              const sr = totals.sections[i];
              
              return (
                <Card key={section.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                        className="font-semibold text-zinc-950 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Roof Type */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Roof Type</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(roofTypeLabels) as RoofType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => updateSection(section.id, { type: t })}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            section.type === t
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                          }`}
                        >
                          {roofTypeLabels[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Unit */}
                  <div className="flex gap-2 mb-4">
                    <span className="text-sm text-zinc-500 self-center mr-1">Unit:</span>
                    {(Object.keys(unitLabels) as Unit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => updateSection(section.id, { unit: u })}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          section.unit === u
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                        }`}
                      >
                        {unitLabels[u]}
                      </button>
                    ))}
                  </div>

                  {/* Dimensions */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <NumberField
                      label="Length"
                      value={section.length}
                      onChange={(v) => updateSection(section.id, { length: v })}
                      unit={unitLabels[section.unit]}
                    />
                    <NumberField
                      label="Width"
                      value={section.width}
                      onChange={(v) => updateSection(section.id, { width: v })}
                      unit={unitLabels[section.unit]}
                    />
                  </div>

                  {/* Pitch */}
                  <div className="mt-4">
                    <NumberField
                      label="Roof Pitch"
                      value={section.pitch}
                      onChange={(v) => updateSection(section.id, { pitch: v })}
                      unit="/12"
                      note="Rise over run (e.g., 6/12 = 6 inches rise per 12 inches run)"
                    />
                  </div>

                  {/* Gambrel-specific */}
                  {section.type === "gambrel" && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <NumberField
                        label="Upper Section Pitch"
                        value={section.upperPitch}
                        onChange={(v) => updateSection(section.id, { upperPitch: v })}
                        unit="/12"
                        note="Pitch for the upper section of gambrel roof"
                      />
                    </div>
                  )}

                  {/* Overhang */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <NumberField
                      label="Eave Overhang"
                      value={section.overhang}
                      onChange={(v) => updateSection(section.id, { overhang: v })}
                      unit={unitLabels[section.unit]}
                      note="Distance the roof extends beyond the walls"
                    />
                  </div>

                  {/* Section Summary */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xs text-zinc-500">Base Area</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(sr.baseArea, 0)} sq ft</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Slope Factor</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(sr.slopeFactor, 2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Roof Area</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(sr.actualArea, 0)} sq ft</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Squares</div>
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(sr.roofingSquares, 1)}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add Section Button */}
            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Roof Section
            </button>

            {/* Waste Factor */}
            <Card>
              <SectionTitle icon={Layers} title="Waste Factor" />
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={25}
                  value={wasteFactor}
                  onChange={(e) => setWasteFactor(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-lg font-semibold text-zinc-950 dark:text-white w-16 text-right">{wasteFactor}%</span>
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                Standard: 10% | Complex roofs: 15-20% | Simple gable: 5-10%
              </p>
            </Card>

            {/* Material Costs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle icon={DollarSign} title="Material Costs" />
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showAdvanced ? "Hide Details" : "Edit Costs"}
                </button>
              </div>

              {showAdvanced && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <NumberField
                    label="Shingles per Bundle"
                    value={costs.shinglesPerBundle}
                    onChange={(v) => setCosts({ ...costs, shinglesPerBundle: v })}
                    unit="sq ft"
                    note="Coverage per bundle (usually 33.3 sq ft)"
                  />
                  <NumberField
                    label="Bundle Cost"
                    value={costs.bundleCost}
                    onChange={(v) => setCosts({ ...costs, bundleCost: v })}
                    unit="$"
                    step={0.5}
                  />
                  <NumberField
                    label="Underlayment"
                    value={costs.underlaymentCost}
                    onChange={(v) => setCosts({ ...costs, underlaymentCost: v })}
                    unit="$/sq"
                  />
                  <NumberField
                    label="Ice & Water Shield"
                    value={costs.iceWaterShieldCost}
                    onChange={(v) => setCosts({ ...costs, iceWaterShieldCost: v })}
                    unit="$/sq"
                  />
                  <NumberField
                    label="Drip Edge"
                    value={costs.dripEdgeCost}
                    onChange={(v) => setCosts({ ...costs, dripEdgeCost: v })}
                    unit="$/ft"
                  />
                  <NumberField
                    label="Ridge Vent"
                    value={costs.ridgeVentCost}
                    onChange={(v) => setCosts({ ...costs, ridgeVentCost: v })}
                    unit="$/ft"
                  />
                  <NumberField
                    label="Flashing"
                    value={costs.flashingCost}
                    onChange={(v) => setCosts({ ...costs, flashingCost: v })}
                    unit="$/ft"
                  />
                  <NumberField
                    label="Nails & Fasteners"
                    value={costs.nailCost}
                    onChange={(v) => setCosts({ ...costs, nailCost: v })}
                    unit="$/sq"
                  />
                </div>
              )}

              {!showAdvanced && (
                <p className="text-sm text-zinc-500">
                  Default costs based on typical asphalt shingle roofing materials. Click &quot;Edit Costs&quot; to customize prices for your area.
                </p>
              )}
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Card className="bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20">
              <SectionTitle icon={Calculator} title="Roofing Estimate" />
              
              <div className="space-y-4">
                <div className="border-b border-indigo-200 dark:border-indigo-500/20 pb-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {fmt(totals.totalSquares, 1)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">roofing squares</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    ({fmt(totals.totalSquares * 100, 0)} sq ft with {wasteFactor}% waste)
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Shingle Bundles</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.bundlesNeeded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Underlayment</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.underlaymentSquares} sq</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Ice & Water Shield</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.iceWaterShieldSquares} sq</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Drip Edge</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.dripEdgeLinearFt} ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Ridge Vent</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.ridgeVentLinearFt} ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Triangle className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Flashing</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.flashingLinearFt} ft</span>
                  </div>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Material Cost</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${fmt(totals.materialCost, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Roofing Tips */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Roofing Tips</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Always add 10-15% extra for cuts and waste
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      1 roofing square = 100 sq ft = 3 bundles
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Ice & water shield at eaves and valleys
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Check local codes for ventilation requirements
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
              How to Calculate Roofing Materials
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Calculating roofing materials accurately is crucial for any roofing project. Whether you&apos;re 
              installing asphalt shingles, metal roofing, or tile, knowing how many roofing squares you need 
              helps you budget properly and order the right amount of materials.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  What is a Roofing Square?
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  A <strong>roofing square</strong> is the standard unit of measurement in the roofing industry. 
                  One roofing square equals 100 square feet of roof area. When contractors quote roofing jobs, 
                  they typically price by the square.
                </p>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <div className="grid sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">1 Square</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">= 100 sq ft</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">3 Bundles</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">= 1 Square (shingles)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">~30 lbs</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">per bundle</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Calculating Roof Area by Type
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <h4 className="font-semibold text-zinc-950 dark:text-white mb-2">Gable Roof</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Two rectangular planes meeting at a ridge.
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded block">
                      Area = Length × Width × Slope Factor
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Slope Factor = √(1 + pitch²)
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <h4 className="font-semibold text-zinc-950 dark:text-white mb-2">Hip Roof</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Slopes on all four sides meeting at a ridge.
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded block">
                      Area = Base × Slope Factor × 1.05
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      5% extra for hip ridges
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <h4 className="font-semibold text-zinc-950 dark:text-white mb-2">Gambrel Roof</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Two different slopes on each side (barn style).
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded block">
                      Area = Base × (Slope₁ + Slope₂) / 2
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Lower slope steeper than upper slope
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <h4 className="font-semibold text-zinc-950 dark:text-white mb-2">Flat/Low Slope</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Minimal pitch, requires different materials.
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded block">
                      Area ≈ Base × 1.02 to 1.05
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Usually 2-5% over footprint
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Slope Factor Table (Common Pitches)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Pitch</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Angle</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Slope Factor</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-400">
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">3/12</td>
                        <td className="py-2">14.0°</td>
                        <td className="py-2">1.031</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">4/12</td>
                        <td className="py-2">18.4°</td>
                        <td className="py-2">1.054</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">6/12</td>
                        <td className="py-2">26.6°</td>
                        <td className="py-2">1.118</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">8/12</td>
                        <td className="py-2">33.7°</td>
                        <td className="py-2">1.202</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">10/12</td>
                        <td className="py-2">39.8°</td>
                        <td className="py-2">1.302</td>
                      </tr>
                      <tr>
                        <td className="py-2">12/12</td>
                        <td className="py-2">45.0°</td>
                        <td className="py-2">1.414</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Additional Materials</h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>• <strong>Underlayment:</strong> 1 square per roofing square</li>
                    <li>• <strong>Ice & Water Shield:</strong> 15% of total (eaves + valleys)</li>
                    <li>• <strong>Drip Edge:</strong> Perimeter of roof (linear feet)</li>
                    <li>• <strong>Ridge Vent:</strong> Length of ridge (linear feet)</li>
                    <li>• <strong>Flashing:</strong> Valleys, chimneys, penetrations</li>
                  </ul>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Waste Factors</h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>• <strong>Simple Gable:</strong> 5-10% waste</li>
                    <li>• <strong>Hip Roof:</strong> 10-15% waste</li>
                    <li>• <strong>Complex/Cut-up:</strong> 15-20% waste</li>
                    <li>• <strong>Dormers/Valleys:</strong> Add 5% extra</li>
                    <li>• <strong>Starter Strip:</strong> Perimeter × 1.5</li>
                  </ul>
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
                  name: "How many shingles do I need for my roof?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "To calculate shingles needed, first determine your roof's total square footage. Multiply the footprint area by the slope factor (based on roof pitch), then add 10-15% for waste. Divide by 100 to get roofing squares. Most shingles come 3 bundles per square, with each bundle covering about 33 square feet.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a roofing square?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A roofing square is a unit of measurement equal to 100 square feet of roof area. It's the standard unit used in the roofing industry for estimating materials and pricing jobs. Three bundles of standard asphalt shingles typically cover one roofing square.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I calculate roof pitch?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Roof pitch is expressed as rise over run (e.g., 6/12 means 6 inches of rise for every 12 inches of horizontal run). To measure, use a level and tape measure: place the level 12 inches horizontally from the roof edge, then measure vertically from the 12-inch mark to the roof surface. The vertical measurement is your pitch.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much extra roofing material should I buy?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Buy 10-15% extra material for standard gable roofs. For complex roofs with many valleys, dormers, or hips, add 15-20% extra. This accounts for cutting waste, starter strips, ridge caps, and mistakes. Always keep a few extra shingles for future repairs.",
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
                <Home className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Select Roof Type</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose from gable, hip, gambrel, or flat roof. Each type has specific calculation formulas.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Ruler className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Enter Dimensions</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Input length, width, pitch, and overhang. Add multiple sections for complex roofs.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Get Materials List</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Receive roofing squares, bundles, underlayment, and total cost with waste factor.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Don&apos;t know your roof&apos;s pitch?{" "}
            <Link href="/roof-pitch-calculator" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Calculate your roof pitch
            </Link>
            {" "}first for an accurate material estimate.
          </p>
        </div>

        {/* Related Tools */}
        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="roofing-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
