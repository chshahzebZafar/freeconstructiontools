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
  Ruler,
  DollarSign,
  Plus,
  Trash2,
  Square,
  Layers,
  Settings,
} from "lucide-react";

/* ─── Types ─── */
type FenceType = "wood-privacy" | "wood-picket" | "vinyl" | "chain-link" | "split-rail" | "aluminum";
type PostMaterial = "wood" | "metal" | "vinyl";
type Unit = "ft" | "m";

interface FenceSection {
  id: string;
  name: string;
  length: number;
  unit: Unit;
  gates: number;
  gateWidth: number;
}

interface FenceConfig {
  fenceType: FenceType;
  fenceHeight: number;
  postSpacing: number;
  postMaterial: PostMaterial;
  railCount: number;
  wasteFactor: number;
}

interface MaterialCosts {
  postCost: number;
  railCostPerFt: number;
  panelCostPerFt: number;
  concreteBagCost: number;
  gateCost: number;
  postCapCost: number;
}

interface SectionResult {
  lengthFt: number;
  fenceLengthFt: number;
  posts: number;
  rails: number;
  panels: number;
  concreteBags: number;
  gates: number;
}

interface TotalResult {
  sections: SectionResult[];
  totalLengthFt: number;
  totalPosts: number;
  totalRails: number;
  totalPanels: number;
  totalConcreteBags: number;
  totalGates: number;
  materialCost: number;
}

/* ─── Constants ─── */
const fenceTypeLabels: Record<FenceType, string> = {
  "wood-privacy": "Wood Privacy",
  "wood-picket": "Wood Picket",
  vinyl: "Vinyl",
  "chain-link": "Chain-Link",
  "split-rail": "Split Rail",
  aluminum: "Aluminum",
};

const fenceTypeDefaults: Record<FenceType, { postSpacing: number; railCount: number; height: number }> = {
  "wood-privacy": { postSpacing: 8, railCount: 3, height: 6 },
  "wood-picket": { postSpacing: 8, railCount: 2, height: 4 },
  vinyl: { postSpacing: 8, railCount: 3, height: 6 },
  "chain-link": { postSpacing: 10, railCount: 1, height: 4 },
  "split-rail": { postSpacing: 8, railCount: 2, height: 4 },
  aluminum: { postSpacing: 6, railCount: 3, height: 4 },
};

const unitLabels: Record<Unit, string> = { ft: "ft", m: "m" };
const toFeet: Record<Unit, number> = { ft: 1, m: 3.28084 };
const genId = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const defaultSection: FenceSection = {
  id: genId(),
  name: "Main Fence",
  length: 100,
  unit: "ft",
  gates: 1,
  gateWidth: 4,
};

const defaultConfig: FenceConfig = {
  fenceType: "wood-privacy",
  fenceHeight: 6,
  postSpacing: 8,
  postMaterial: "wood",
  railCount: 3,
  wasteFactor: 10,
};

const defaultCosts: MaterialCosts = {
  postCost: 20,
  railCostPerFt: 2.5,
  panelCostPerFt: 12,
  concreteBagCost: 6,
  gateCost: 150,
  postCapCost: 3,
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
export default function FenceCalculator() {
  const [sections, setSections] = useState<FenceSection[]>([defaultSection]);
  const [config, setConfig] = useState<FenceConfig>(defaultConfig);
  const [costs, setCosts] = useState<MaterialCosts>(defaultCosts);
  const [showCosts, setShowCosts] = useState(false);

  const calcSection = (section: FenceSection): SectionResult => {
    const lengthFt = section.length * toFeet[section.unit];
    const gateFt = section.gates * section.gateWidth;
    const fenceLengthFt = Math.max(0, lengthFt - gateFt);

    const wasteMultiplier = 1 + config.wasteFactor / 100;
    const posts = Math.ceil(fenceLengthFt / config.postSpacing) + 1 + section.gates * 2;
    const rails = Math.ceil((fenceLengthFt * config.railCount) / config.postSpacing) * Math.ceil(config.postSpacing) * wasteMultiplier;
    const panels = Math.ceil(fenceLengthFt * wasteMultiplier);
    const concreteBags = posts * 2; // ~2 bags per post for standard 6x6 hole

    return {
      lengthFt,
      fenceLengthFt,
      posts,
      rails: Math.ceil((fenceLengthFt / config.postSpacing) * config.railCount * wasteMultiplier) * Math.ceil(config.postSpacing),
      panels,
      concreteBags,
      gates: section.gates,
    };
  };

  const totals: TotalResult = useMemo(() => {
    const sectionResults = sections.map(calcSection);
    const totalLengthFt = sectionResults.reduce((s, r) => s + r.lengthFt, 0);
    const totalPosts = sectionResults.reduce((s, r) => s + r.posts, 0);
    const totalRails = sectionResults.reduce((s, r) => s + r.rails, 0);
    const totalPanels = sectionResults.reduce((s, r) => s + r.panels, 0);
    const totalConcreteBags = sectionResults.reduce((s, r) => s + r.concreteBags, 0);
    const totalGates = sectionResults.reduce((s, r) => s + r.gates, 0);

    const materialCost =
      totalPosts * costs.postCost +
      totalRails * costs.railCostPerFt +
      totalPanels * costs.panelCostPerFt +
      totalConcreteBags * costs.concreteBagCost +
      totalGates * costs.gateCost +
      totalPosts * costs.postCapCost;

    return { sections: sectionResults, totalLengthFt, totalPosts, totalRails, totalPanels, totalConcreteBags, totalGates, materialCost };
  }, [sections, config, costs]);

  const addSection = () => setSections([...sections, { ...defaultSection, id: genId(), name: `Section ${sections.length + 1}` }]);
  const removeSection = (id: string) => { if (sections.length > 1) setSections(sections.filter((s) => s.id !== id)); };
  const updateSection = (id: string, updates: Partial<FenceSection>) => setSections(sections.map((s) => s.id === id ? { ...s, ...updates } : s));

  const applyFenceType = (type: FenceType) => {
    const d = fenceTypeDefaults[type];
    setConfig({ ...config, fenceType: type, postSpacing: d.postSpacing, railCount: d.railCount, fenceHeight: d.height });
  };

  const reset = () => {
    setSections([defaultSection]);
    setConfig(defaultConfig);
    setCosts(defaultCosts);
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ts = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    let y = 20;

    const checkPage = () => { if (y > 268) { doc.addPage(); y = 18; } };
    const section = (title: string) => {
      checkPage(); y += 3;
      doc.setFillColor(30, 30, 30);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");
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
    doc.text("Fence Material Estimate", margin, 12);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(170, 170, 170);
    doc.text(`freeconstructiontools.com  ·  ${ts}`, pageW - margin, 12, { align: "right" });
    y = 26;

    section("Project Summary");
    row("Fence Type", fenceTypeLabels[config.fenceType]);
    row("Fence Height", `${config.fenceHeight} ft`);
    row("Post Spacing", `${config.postSpacing} ft`);
    row("Rails per Span", String(config.railCount));
    row("Waste Factor", `${config.wasteFactor}%`);
    row("Total Fence Length", `${fmt(totals.totalLengthFt, 0)} ft`);
    y += 2;

    section("Material Requirements");
    row("Posts", String(totals.totalPosts));
    row("Rails (linear ft)", fmt(totals.totalRails, 0));
    row("Fence Panels / Boards", `${fmt(totals.totalPanels, 0)} linear ft`);
    row("Concrete Bags (60 lb)", String(totals.totalConcreteBags));
    row("Gates", String(totals.totalGates));
    totalLine("Total Material Cost", `$${fmt(totals.materialCost, 2)}`);

    section("Section Details");
    sections.forEach((sect, i) => {
      const sr = totals.sections[i];
      checkPage(); y += 2;
      doc.setFillColor(240, 240, 240); doc.rect(margin, y, pageW - margin * 2, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      doc.text(sect.name, margin + 3, y + 4.2); y += 9;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text(`Length: ${sect.length} ${unitLabels[sect.unit]} (${fmt(sr.lengthFt, 0)} ft)`, margin + 3, y); y += 5;
      doc.text(`Gates: ${sect.gates} × ${sect.gateWidth} ft`, margin + 3, y); y += 5;
      doc.text(`Posts: ${sr.posts}  |  Rails: ${sr.rails} ft  |  Concrete: ${sr.concreteBags} bags`, margin + 3, y); y += 8;
    });

    section("Cost Breakdown");
    row("Posts", `$${fmt(totals.totalPosts * costs.postCost, 2)}`);
    row("Rails", `$${fmt(totals.totalRails * costs.railCostPerFt, 2)}`);
    row("Fence Panels / Boards", `$${fmt(totals.totalPanels * costs.panelCostPerFt, 2)}`);
    row("Concrete", `$${fmt(totals.totalConcreteBags * costs.concreteBagCost, 2)}`);
    row("Gates", `$${fmt(totals.totalGates * costs.gateCost, 2)}`);
    row("Post Caps", `$${fmt(totals.totalPosts * costs.postCapCost, 2)}`);
    totalLine("Total", `$${fmt(totals.materialCost, 2)}`);

    doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 6;
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(130, 130, 130);
    doc.text(doc.splitTextToSize("This is a material-only estimate. Labor, permits, site preparation, and hardware are not included. Always consult a professional for accurate project quotes.", pageW - margin * 2), margin, y);

    doc.save(`fence-estimate-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />

        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight mb-3">
            Fence Calculator
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Estimate fence posts, rails, panels, concrete, and total material cost for any fence style and length.
            Supports wood, vinyl, chain-link, split-rail, and aluminum fences.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fence Type */}
            <Card>
              <SectionTitle icon={Square} title="Fence Type" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(fenceTypeLabels) as FenceType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => applyFenceType(t)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors text-center ${
                      config.fenceType === t
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {fenceTypeLabels[t]}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-4">
                <NumberField
                  label="Fence Height"
                  value={config.fenceHeight}
                  onChange={(v) => setConfig({ ...config, fenceHeight: v })}
                  unit="ft"
                />
                <NumberField
                  label="Post Spacing"
                  value={config.postSpacing}
                  onChange={(v) => setConfig({ ...config, postSpacing: v })}
                  unit="ft"
                  note="8 ft is standard for wood"
                />
                <NumberField
                  label="Rails per Span"
                  value={config.railCount}
                  onChange={(v) => setConfig({ ...config, railCount: Math.max(1, v) })}
                  unit="rails"
                  note="2–3 for wood, 1 for chain-link"
                />
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Post Material</label>
                  <div className="flex gap-2">
                    {(["wood", "metal", "vinyl"] as PostMaterial[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setConfig({ ...config, postMaterial: m })}
                        className={`flex-1 py-1.5 text-xs rounded border transition-colors capitalize ${
                          config.postMaterial === m
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Waste Factor: {config.wasteFactor}%</label>
                  <input
                    type="range" min={5} max={20} value={config.wasteFactor}
                    onChange={(e) => setConfig({ ...config, wasteFactor: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-zinc-500">Standard 10% | Complex layout 15–20%</p>
                </div>
              </div>
            </Card>

            {/* Fence Sections */}
            {sections.map((section, i) => {
              const sr = totals.sections[i];
              return (
                <Card key={section.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                        className="font-semibold text-zinc-950 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(section.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Unit toggle */}
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
                        {u}
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <NumberField
                      label="Fence Length"
                      value={section.length}
                      onChange={(v) => updateSection(section.id, { length: v })}
                      unit={unitLabels[section.unit]}
                    />
                    <NumberField
                      label="Number of Gates"
                      value={section.gates}
                      onChange={(v) => updateSection(section.id, { gates: Math.max(0, v) })}
                      unit="gates"
                    />
                    <NumberField
                      label="Gate Width"
                      value={section.gateWidth}
                      onChange={(v) => updateSection(section.id, { gateWidth: v })}
                      unit={unitLabels[section.unit]}
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xs text-zinc-500">Net Length</div>
                      <div className="font-semibold text-zinc-950 dark:text-white">{Math.round(sr.fenceLengthFt)} ft</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Posts</div>
                      <div className="font-semibold text-zinc-950 dark:text-white">{sr.posts}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Rails</div>
                      <div className="font-semibold text-zinc-950 dark:text-white">{sr.rails} ft</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Concrete Bags</div>
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400">{sr.concreteBags}</div>
                    </div>
                  </div>
                </Card>
              );
            })}

            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Fence Section
            </button>

            {/* Material Costs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle icon={Settings} title="Material Costs" />
                <button onClick={() => setShowCosts(!showCosts)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  {showCosts ? "Hide" : "Edit Costs"}
                </button>
              </div>
              {showCosts ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <NumberField label="Post Cost" value={costs.postCost} onChange={(v) => setCosts({ ...costs, postCost: v })} unit="$/post" step={0.5} />
                  <NumberField label="Rail Cost" value={costs.railCostPerFt} onChange={(v) => setCosts({ ...costs, railCostPerFt: v })} unit="$/ft" step={0.25} />
                  <NumberField label="Panel / Board Cost" value={costs.panelCostPerFt} onChange={(v) => setCosts({ ...costs, panelCostPerFt: v })} unit="$/ft" step={0.5} />
                  <NumberField label="Concrete Bag (60 lb)" value={costs.concreteBagCost} onChange={(v) => setCosts({ ...costs, concreteBagCost: v })} unit="$/bag" step={0.5} />
                  <NumberField label="Gate Cost" value={costs.gateCost} onChange={(v) => setCosts({ ...costs, gateCost: v })} unit="$/gate" />
                  <NumberField label="Post Cap Cost" value={costs.postCapCost} onChange={(v) => setCosts({ ...costs, postCapCost: v })} unit="$/cap" step={0.25} />
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Default costs reflect typical residential lumber and vinyl pricing. Click &quot;Edit Costs&quot; to adjust for your region or material choice.</p>
              )}
            </Card>
          </div>

          {/* Right — Results */}
          <div className="space-y-6">
            <Card className="bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20">
              <SectionTitle icon={Calculator} title="Fence Estimate" />

              <div className="space-y-4">
                <div className="border-b border-indigo-200 dark:border-indigo-500/20 pb-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.round(totals.totalLengthFt)} ft
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">total fence length</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Posts Needed</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.totalPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Rails (linear ft)</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{fmt(totals.totalRails, 0)} ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Panels / Boards</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{fmt(totals.totalPanels, 0)} ft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Concrete Bags</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.totalConcreteBags}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Gates</span>
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-white">{totals.totalGates}</span>
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

            {/* Tips */}
            <Card>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Fence Tips</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Call 811 before digging — locate utilities
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Posts should be buried 1/3 of their height
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Use 2 concrete bags (60 lb) per post
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                      Check local codes for height limits
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

        {/* SEO Content */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white mb-6">
              How to Calculate Fence Materials
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Building a fence requires accurate material estimates to avoid costly overbuying or frustrating
              mid-project shortages. Our fence calculator handles posts, rails, panels, and concrete so you
              can head to the lumber yard with confidence.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">Fence Post Calculation</h3>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 mb-4">
                  <code className="text-sm text-indigo-600 dark:text-indigo-400 block">
                    Posts = (Total Length ÷ Post Spacing) + 1 + (Gates × 2)
                  </code>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Add 1 for the end post on each run, and 2 extra posts per gate opening (gate posts need 
                  extra support). Standard post spacing is 8 ft for wood and vinyl, 10 ft for chain-link.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Material by Fence Type</h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>• <strong>Wood Privacy:</strong> 3 rails, 8 ft post spacing</li>
                    <li>• <strong>Wood Picket:</strong> 2 rails, 8 ft post spacing</li>
                    <li>• <strong>Vinyl:</strong> Pre-assembled panels, 8 ft spans</li>
                    <li>• <strong>Chain-Link:</strong> Top rail only, 10 ft spacing</li>
                    <li>• <strong>Split Rail:</strong> 2 rails, no facing boards</li>
                    <li>• <strong>Aluminum:</strong> 3 rails, 6 ft post spacing</li>
                  </ul>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                  <h4 className="font-semibold text-zinc-950 dark:text-white mb-3">Post Depth Guide</h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>• <strong>4 ft fence:</strong> 6 ft post, 2 ft buried</li>
                    <li>• <strong>6 ft fence:</strong> 8 ft post, 2.5 ft buried</li>
                    <li>• <strong>8 ft fence:</strong> 10 ft post, 3 ft buried</li>
                    <li>• <strong>Rule of thumb:</strong> Bury ⅓ of post height</li>
                    <li>• <strong>Concrete:</strong> 2 × 60 lb bags per post</li>
                    <li>• <strong>Freeze line:</strong> Dig 6&quot; below frost line</li>
                  </ul>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-zinc-950 dark:text-white mb-4">Average Fence Costs (2025)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Fence Type</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Material (per ft)</th>
                        <th className="text-left py-2 text-zinc-700 dark:text-zinc-300">Installed (per ft)</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-600 dark:text-zinc-400">
                      {[
                        ["Wood Privacy", "$8–$15", "$18–$45"],
                        ["Wood Picket", "$5–$12", "$15–$30"],
                        ["Vinyl", "$12–$22", "$25–$50"],
                        ["Chain-Link", "$5–$10", "$12–$25"],
                        ["Split Rail", "$4–$8", "$10–$20"],
                        ["Aluminum", "$20–$35", "$35–$60"],
                      ].map(([type, mat, inst]) => (
                        <tr key={type} className="border-b border-zinc-100 dark:border-zinc-800">
                          <td className="py-2">{type}</td>
                          <td className="py-2">{mat}</td>
                          <td className="py-2">{inst}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  name: "How many fence posts do I need?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Divide your total fence length by the post spacing (usually 8 ft for wood, 10 ft for chain-link), then add 1 for the final end post. Add 2 extra posts for each gate opening. For example, a 100 ft fence with 8 ft spacing needs (100 ÷ 8) + 1 = 14 posts, plus gate posts.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How deep should fence posts be buried?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Fence posts should be buried at least 1/3 of their total length. For a 6 ft fence, use 8 ft posts and bury 2.5 ft deep. In cold climates, always dig below the frost line (check local codes). Use 2 bags of 60 lb concrete per post for a secure hold.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much does a 6 foot privacy fence cost?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A 6 ft wood privacy fence costs $8–$15 per linear foot for materials and $18–$45 per linear foot installed. For a 100 ft fence, expect $800–$1,500 in materials and $1,800–$4,500 installed. Vinyl and aluminum options cost more upfront but require less maintenance.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How many rails does a fence need?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A standard 6 ft privacy fence uses 3 horizontal rails (top, middle, bottom). A 4 ft picket fence uses 2 rails. Chain-link fences typically have a single top rail. Split-rail fences have 2 rails mortised into the posts. More rails provide greater stability and wind resistance.",
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
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Choose Your Fence Style</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Select from wood, vinyl, chain-link, or other styles. Defaults auto-fill for post spacing and rails.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Ruler className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Enter Fence Length</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Add one or more fence sections with length, gate count, and gate width for each run.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Calculator className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="font-medium text-zinc-950 dark:text-white mb-2">Get Your Material List</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Instantly see posts, rails, panels, concrete bags, and total material cost. Download a PDF report.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Setting posts in concrete?{" "}
            <Link href="/concrete-calculator" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Estimate concrete for your post holes
            </Link>
            {" "}with our concrete calculator.
          </p>
        </div>

        <div className="mt-10">
          <RelatedCategoryTools category="construction" currentSlug="fence-calculator" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
