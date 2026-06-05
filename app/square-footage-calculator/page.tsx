"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedCategoryTools from "@/components/RelatedCategoryTools";
import { Button } from "@/components/ui/Button";
import {
  Square,
  Calculator,
  FileDown,
  Plus,
  Trash2,
  Info,
  Check,
  Ruler,
  DollarSign,
  Layers,
  BoxSelect,
  Circle,
  Triangle,
  Hexagon,
} from "lucide-react";

/* ─── Types ─── */
type Unit = "ft" | "in" | "m" | "yd";
type Shape = "rectangle" | "l-shape" | "triangle" | "circle";

interface Area {
  id: string;
  name: string;
  shape: Shape;
  unit: Unit;
  // Rectangle / L-shape dimensions
  width: number;
  length: number;
  width2: number;
  length2: number;
  // Triangle dimensions
  base: number;
  height: number;
  sideA: number;
  sideB: number;
  sideC: number;
  // Circle dimensions
  radius: number;
  diameter: number;
  // Cost
  costPerSqFt: number;
}

interface AreaResult {
  areaSqFt: number;
  areaOriginal: number;
  areaCost: number;
}

interface TotalResult {
  areas: AreaResult[];
  totalSqFt: number;
  totalCost: number;
}

/* ─── Helpers ─── */
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
const genId = () => Math.random().toString(36).slice(2, 9);

// Conversion factors to square feet
const toSqFt: Record<Unit, number> = {
  ft: 1,
  in: 1 / 144, // 12x12 = 144 sq in per sq ft
  m: 10.7639, // 1 sq meter = 10.7639 sq ft
  yd: 9, // 1 sq yard = 9 sq ft
};

const unitLabels: Record<Unit, string> = {
  ft: "ft",
  in: "in",
  m: "m",
  yd: "yd",
};

const shapeLabels: Record<Shape, string> = {
  rectangle: "Rectangle",
  "l-shape": "L-Shape",
  triangle: "Triangle",
  circle: "Circle",
};

const defaultArea: Area = {
  id: genId(),
  name: "Area 1",
  shape: "rectangle",
  unit: "ft",
  width: 12,
  length: 10,
  width2: 0,
  length2: 0,
  base: 10,
  height: 8,
  sideA: 6,
  sideB: 8,
  sideC: 10,
  radius: 5,
  diameter: 10,
  costPerSqFt: 0,
};

/* ─── Components ─── */
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  unit?: string;
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
export default function SquareFootageCalculator() {
  const [areas, setAreas] = useState<Area[]>([defaultArea]);
  const [globalCost, setGlobalCost] = useState(0);

  // Calculate area for a shape
  const calcArea = (area: Area): number => {
    const factor = toSqFt[area.unit];
    
    switch (area.shape) {
      case "rectangle":
        return area.width * area.length * factor;
      
      case "l-shape": {
        const mainArea = area.width * area.length * factor;
        const wingArea = area.width2 * area.length2 * factor;
        const overlap = Math.min(area.width, area.width2) * Math.min(area.length, area.length2) * factor;
        return mainArea + wingArea - overlap;
      }
      
      case "triangle": {
        // Use base * height / 2 if height is provided
        if (area.height > 0 && area.base > 0) {
          return (area.base * area.height / 2) * factor;
        }
        // Heron's formula for three sides
        const a = area.sideA;
        const b = area.sideB;
        const c = area.sideC;
        const s = (a + b + c) / 2;
        const areaSq = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        return areaSq * factor;
      }
      
      case "circle": {
        const r = area.radius > 0 ? area.radius : area.diameter / 2;
        return Math.PI * r * r * factor;
      }
      
      default:
        return 0;
    }
  };

  // Calculate all results
  const totals: TotalResult = useMemo(() => {
    const areaResults = areas.map((area) => {
      const areaSqFt = calcArea(area);
      const areaOriginal = areaSqFt / toSqFt[area.unit];
      const costPerUnit = area.costPerSqFt > 0 ? area.costPerSqFt : globalCost;
      const areaCost = areaSqFt * costPerUnit;

      return {
        areaSqFt,
        areaOriginal,
        areaCost,
      };
    });

    const totalSqFt = areaResults.reduce((sum, a) => sum + a.areaSqFt, 0);
    const totalCost = areaResults.reduce((sum, a) => sum + a.areaCost, 0);

    return {
      areas: areaResults,
      totalSqFt,
      totalCost,
    };
  }, [areas, globalCost]);

  // Area management
  const addArea = () => {
    setAreas([...areas, { ...defaultArea, id: genId(), name: `Area ${areas.length + 1}` }]);
  };

  const removeArea = (id: string) => {
    if (areas.length <= 1) return;
    setAreas(areas.filter((a) => a.id !== id));
  };

  const updateArea = (id: string, updates: Partial<Area>) => {
    setAreas(areas.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  // Reset
  const reset = () => {
    setAreas([defaultArea]);
    setGlobalCost(0);
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
    doc.text("Square Footage Report", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    // Summary
    section("Total Summary");
    row("Number of Areas", String(areas.length));
    row("Total Square Feet", `${fmt(totals.totalSqFt, 1)} sq ft`);
    row("Total Square Meters", `${fmt(totals.totalSqFt / 10.7639, 2)} m²`);
    row("Total Acres", `${fmt(totals.totalSqFt / 43560, 4)} acres`);
    if (totals.totalCost > 0) {
      totalLine("Total Cost", `$${fmt(totals.totalCost, 2)}`);
    }
    y += 2;

    // Per-area details
    section("Area Breakdown");
    areas.forEach((area, i) => {
      const ar = totals.areas[i];
      checkPage();

      y += 2;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`${area.name}  (${shapeLabels[area.shape]})`, margin + 3, y + 4.2);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      // Shape-specific dimensions
      if (area.shape === "rectangle") {
        doc.text(`Dimensions: ${area.width} × ${area.length} ${unitLabels[area.unit]}`, margin + 3, y);
        y += 5;
      } else if (area.shape === "l-shape") {
        doc.text(`Main: ${area.width} × ${area.length} ${unitLabels[area.unit]}`, margin + 3, y);
        y += 5;
        doc.text(`Wing: ${area.width2} × ${area.length2} ${unitLabels[area.unit]}`, margin + 3, y);
        y += 5;
      } else if (area.shape === "triangle") {
        if (area.height > 0) {
          doc.text(`Base: ${area.base}, Height: ${area.height} ${unitLabels[area.unit]}`, margin + 3, y);
        } else {
          doc.text(`Sides: ${area.sideA}, ${area.sideB}, ${area.sideC} ${unitLabels[area.unit]}`, margin + 3, y);
        }
        y += 5;
      } else if (area.shape === "circle") {
        const r = area.radius > 0 ? area.radius : area.diameter / 2;
        doc.text(`Radius: ${fmt(r, 1)} ${unitLabels[area.unit]}`, margin + 3, y);
        y += 5;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`Area: ${fmt(ar.areaSqFt, 2)} sq ft`, margin + 3, y);
      y += 8;
    });

    // Conversions reference
    section("Conversion Reference");
    row("1 Square Foot", "144 sq in");
    row("1 Square Yard", "9 sq ft");
    row("1 Square Meter", "10.764 sq ft");
    row("1 Acre", "43,560 sq ft");
    y += 2;

    // Disclaimer
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      doc.splitTextToSize(
        "Measurements are for estimation purposes. Always verify dimensions on site before purchasing materials or making financial decisions.",
        pageW - margin * 2
      ),
      margin,
      y
    );

    doc.save(`square-footage-${Date.now()}.pdf`);
  };

  // Get shape icon
  const getShapeIcon = (shape: Shape) => {
    switch (shape) {
      case "rectangle":
      case "l-shape":
        return BoxSelect;
      case "triangle":
        return Triangle;
      case "circle":
        return Circle;
      default:
        return Square;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Square Footage Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Calculate square footage for rooms, houses, yards, and irregular shapes. 
            Supports rectangles, L-shapes, triangles, and circles. Perfect for flooring, 
            paint, and real estate calculations.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Global Cost */}
            <Card>
              <SectionTitle icon={DollarSign} title="Cost Per Square Foot (Optional)" />
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={globalCost}
                    onChange={(e) => setGlobalCost(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full h-10 pl-8 pr-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <span className="text-sm text-zinc-500 whitespace-nowrap">per sq ft</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Set a default cost per square foot, or customize per area below.
              </p>
            </Card>

            {/* Areas */}
            {areas.map((area, i) => {
              const ar = totals.areas[i];
              const ShapeIcon = getShapeIcon(area.shape);
              
              return (
                <Card key={area.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShapeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <input
                        type="text"
                        value={area.name}
                        onChange={(e) => updateArea(area.id, { name: e.target.value })}
                        className="font-semibold text-zinc-950 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </div>
                    {areas.length > 1 && (
                      <button
                        onClick={() => removeArea(area.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Shape Selector */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(Object.keys(shapeLabels) as Shape[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateArea(area.id, { shape: s })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          area.shape === s
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                        }`}
                      >
                        {shapeLabels[s]}
                      </button>
                    ))}
                  </div>

                  {/* Unit Selector */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm text-zinc-500 self-center mr-1">Unit:</span>
                    {(Object.keys(unitLabels) as Unit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => updateArea(area.id, { unit: u })}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          area.unit === u
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                        }`}
                      >
                        {unitLabels[u]}
                      </button>
                    ))}
                  </div>

                  {/* Shape-specific inputs */}
                  {area.shape === "rectangle" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <NumberField
                        label="Width"
                        value={area.width}
                        onChange={(v) => updateArea(area.id, { width: v })}
                        unit={unitLabels[area.unit]}
                      />
                      <NumberField
                        label="Length"
                        value={area.length}
                        onChange={(v) => updateArea(area.id, { length: v })}
                        unit={unitLabels[area.unit]}
                      />
                    </div>
                  )}

                  {area.shape === "l-shape" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberField
                          label="Main Width"
                          value={area.width}
                          onChange={(v) => updateArea(area.id, { width: v })}
                          unit={unitLabels[area.unit]}
                        />
                        <NumberField
                          label="Main Length"
                          value={area.length}
                          onChange={(v) => updateArea(area.id, { length: v })}
                          unit={unitLabels[area.unit]}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberField
                          label="Wing Width"
                          value={area.width2}
                          onChange={(v) => updateArea(area.id, { width2: v })}
                          unit={unitLabels[area.unit]}
                        />
                        <NumberField
                          label="Wing Length"
                          value={area.length2}
                          onChange={(v) => updateArea(area.id, { length2: v })}
                          unit={unitLabels[area.unit]}
                        />
                      </div>
                    </div>
                  )}

                  {area.shape === "triangle" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberField
                          label="Base"
                          value={area.base}
                          onChange={(v) => updateArea(area.id, { base: v })}
                          unit={unitLabels[area.unit]}
                        />
                        <NumberField
                          label="Height"
                          value={area.height}
                          onChange={(v) => updateArea(area.id, { height: v })}
                          unit={unitLabels[area.unit]}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">Or use Heron&apos;s formula with three sides:</p>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <NumberField
                          label="Side A"
                          value={area.sideA}
                          onChange={(v) => updateArea(area.id, { sideA: v })}
                          unit={unitLabels[area.unit]}
                        />
                        <NumberField
                          label="Side B"
                          value={area.sideB}
                          onChange={(v) => updateArea(area.id, { sideB: v })}
                          unit={unitLabels[area.unit]}
                        />
                        <NumberField
                          label="Side C"
                          value={area.sideC}
                          onChange={(v) => updateArea(area.id, { sideC: v })}
                          unit={unitLabels[area.unit]}
                        />
                      </div>
                    </div>
                  )}

                  {area.shape === "circle" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <NumberField
                        label="Radius"
                        value={area.radius}
                        onChange={(v) => updateArea(area.id, { radius: v })}
                        unit={unitLabels[area.unit]}
                      />
                      <NumberField
                        label="Diameter"
                        value={area.diameter}
                        onChange={(v) => updateArea(area.id, { diameter: v, radius: v / 2 })}
                        unit={unitLabels[area.unit]}
                      />
                    </div>
                  )}

                  {/* Cost per area */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">Cost per sq ft:</span>
                      <div className="relative flex-1 max-w-[150px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={area.costPerSqFt}
                          onChange={(e) => updateArea(area.id, { costPerSqFt: parseFloat(e.target.value) || 0 })}
                          placeholder={String(globalCost || 0)}
                          className="w-full h-9 pl-7 pr-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Area Summary */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xs text-zinc-500">Sq Ft</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(ar.areaSqFt, 1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Sq M</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(ar.areaSqFt / 10.7639, 2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Sq Yd</div>
                        <div className="font-semibold text-zinc-950 dark:text-white">{fmt(ar.areaSqFt / 9, 2)}</div>
                      </div>
                      {ar.areaCost > 0 && (
                        <div>
                          <div className="text-xs text-zinc-500">Cost</div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">${fmt(ar.areaCost, 0)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add Area Button */}
            <button
              onClick={addArea}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Area
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Card className="bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20">
              <SectionTitle icon={Calculator} title="Total Area" />
              
              <div className="space-y-4">
                <div className="border-b border-indigo-200 dark:border-indigo-500/20 pb-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {fmtInt(totals.totalSqFt)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">square feet</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Square Meters</span>
                    <span className="font-medium text-zinc-950 dark:text-white">{fmt(totals.totalSqFt / 10.7639, 2)} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Square Yards</span>
                    <span className="font-medium text-zinc-950 dark:text-white">{fmt(totals.totalSqFt / 9, 2)} yd²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Acres</span>
                    <span className="font-medium text-zinc-950 dark:text-white">{fmt(totals.totalSqFt / 43560, 4)} ac</span>
                  </div>
                </div>

                {totals.totalCost > 0 && (
                  <div className="border-t border-indigo-200 dark:border-indigo-500/20 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Total Cost</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${fmt(totals.totalCost, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Conversions */}
            <Card>
              <SectionTitle icon={Ruler} title="Quick Conversions" />
              <div className="space-y-3">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">1 Square Foot =</div>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                    <div>• 144 square inches</div>
                    <div>• 0.0929 square meters</div>
                    <div>• 0.1111 square yards</div>
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">1 Acre =</div>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                    <div>• 43,560 square feet</div>
                    <div>• 4,840 square yards</div>
                    <div>• 0.4047 hectares</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Measurement Tips</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Measure at the widest points of each dimension
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      For irregular rooms, break into multiple shapes
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Add 5-10% extra for flooring, paint, or tile projects
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Double-check measurements before ordering materials
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
              How to Calculate Square Footage
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Square footage is the standard unit of measurement for area in real estate, construction, 
              and home improvement projects. Knowing how to accurately calculate square footage helps 
              you estimate material costs, compare property sizes, and plan renovation projects.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Square Footage Formulas by Shape
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BoxSelect className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-semibold text-zinc-950 dark:text-white">Rectangle</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Multiply length × width
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded">
                      Area = Length × Width
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Example: 12 ft × 10 ft = 120 sq ft
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Square className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-semibold text-zinc-950 dark:text-white">L-Shape</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Split into two rectangles and subtract overlap
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded">
                      Area = Main + Wing - Overlap
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Or: Calculate each rectangle separately and add
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Triangle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-semibold text-zinc-950 dark:text-white">Triangle</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Base × Height ÷ 2, or use Heron&apos;s formula
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded">
                      Area = (Base × Height) / 2
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Heron&apos;s: s=(a+b+c)/2, Area=√(s(s-a)(s-b)(s-c))
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Circle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-semibold text-zinc-950 dark:text-white">Circle</h4>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      π × radius²
                    </p>
                    <code className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded">
                      Area = π × r²
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      Or: Area = π × (diameter/2)²
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">
                  Common Square Footage Conversions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">From</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">To</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Formula</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-400">
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Square Feet</td>
                        <td className="py-2">Square Meters</td>
                        <td className="py-2">÷ 10.764</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Square Feet</td>
                        <td className="py-2">Square Yards</td>
                        <td className="py-2">÷ 9</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Square Feet</td>
                        <td className="py-2">Acres</td>
                        <td className="py-2">÷ 43,560</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">Square Inches</td>
                        <td className="py-2">Square Feet</td>
                        <td className="py-2">÷ 144</td>
                      </tr>
                      <tr>
                        <td className="py-2">Acres</td>
                        <td className="py-2">Square Feet</td>
                        <td className="py-2">× 43,560</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Real Estate Uses</h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>• Calculate home listing size</li>
                    <li>• Compare property values ($/sq ft)</li>
                    <li>• Determine room dimensions</li>
                    <li>• Estimate property taxes</li>
                  </ul>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Construction Uses</h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>• Flooring material estimates</li>
                    <li>• Paint coverage calculations</li>
                    <li>• Tile quantity planning</li>
                    <li>• HVAC sizing requirements</li>
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
                  name: "How do I calculate square footage of a room?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "To calculate the square footage of a rectangular room, measure the length and width in feet, then multiply them together. For example, a room that is 12 feet long and 10 feet wide has 120 square feet (12 × 10 = 120). For L-shaped rooms, split the room into rectangles, calculate each area, and add them together.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How many square feet are in an acre?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "There are 43,560 square feet in one acre. This is the standard measurement used in real estate and land surveying in the United States. To convert acres to square feet, multiply the number of acres by 43,560.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I convert square feet to square meters?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "To convert square feet to square meters, divide the square footage by 10.764. For example, 500 square feet ÷ 10.764 = approximately 46.45 square meters. To convert square meters to square feet, multiply by 10.764.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I calculate square footage for an L-shaped room?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "For an L-shaped room, divide the space into two rectangles. Calculate the area of each rectangle by multiplying length × width, then add the two areas together. Alternatively, calculate the main rectangle area, add the wing area, and subtract any overlapping corner section.",
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
                <BoxSelect className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Select Shape</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose from rectangle, L-shape, triangle, or circle. Each shape has the appropriate input fields.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Ruler className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Enter Dimensions</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Input your measurements in feet, inches, meters, or yards. The calculator handles conversions automatically.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Get Results</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                See total square footage with automatic conversions to square meters, yards, and acres. Add cost estimates too.
              </p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="square-footage-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
