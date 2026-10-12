/**
 * Engineering Validation Studio — Structural Test & Manufacturability (DFM) Modal
 * Covers the "Test" and "Manufacture" stages of the concept → design → test →
 * manufacture pipeline: a simplified structural safety-factor check under a
 * user-defined load case, and a process-aware Design-for-Manufacture audit with
 * cost & lead-time estimation.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  X,
  Gauge,
  Factory,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Weight,
  Clock,
  DollarSign,
} from 'lucide-react';
import { CADObject, DesignSection, ManufacturingProcess, StressLoadDirection } from '../../types/cad';
import { runStressAnalysis, generateStressReportMarkdown } from '../../utils/stressAnalysis';
import { runManufacturabilityReport, generateManufacturabilityMarkdown, MANUFACTURING_PROCESS_RULES } from '../../utils/manufacturing';

interface EngineeringValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  assemblyName?: string;
  // Drives the default manufacturing process — architectural elements (Building/BIM)
  // are cast/framed, not molded or machined, so they get their own process by default.
  section?: DesignSection;
}

const PROCESS_OPTIONS: ManufacturingProcess[] = [
  'cnc_machining',
  'injection_molding',
  'fdm_3d_printing',
  'sls_3d_printing',
  'sheet_metal',
  'general_construction',
];

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const EngineeringValidationModal: React.FC<EngineeringValidationModalProps> = ({
  isOpen,
  onClose,
  objects,
  assemblyName = 'CAD_Studio_Assembly',
  section = 'technology',
}) => {
  const [activeTab, setActiveTab] = useState<'stress' | 'dfm'>('stress');

  // Structural Stress Test State
  const [appliedLoadN, setAppliedLoadN] = useState<number>(50);
  const [loadDirection, setLoadDirection] = useState<StressLoadDirection>('bending');
  const [safetyFactorTarget, setSafetyFactorTarget] = useState<number>(1.5);

  // DFM / Manufacturing State — Building/BIM assemblies default to the
  // construction process since none of the fabrication processes (molding,
  // machining, printing) apply to poured/framed architectural elements.
  const [process, setProcess] = useState<ManufacturingProcess>(
    section === 'building' ? 'general_construction' : 'cnc_machining'
  );

  // The modal is always-mounted (App.tsx just toggles `isOpen`), so the useState
  // initializer above only ever runs once at first mount — it won't react to the
  // user switching sections later. Re-default `process` whenever the section
  // changes or the modal is (re)opened on a new section, but only when the user
  // hasn't manually picked a process themselves — a manual choice should stick
  // even if the user later reopens the modal.
  const userPickedProcessRef = useRef(false);
  const lastSectionRef = useRef<DesignSection | undefined>(section);
  useEffect(() => {
    if (!isOpen) return;
    const sectionChanged = lastSectionRef.current !== section;
    lastSectionRef.current = section;
    if (sectionChanged) {
      // A section change invalidates any prior manual pick — the appropriate
      // process for a different section is a different question entirely.
      userPickedProcessRef.current = false;
    }
    if (!userPickedProcessRef.current) {
      setProcess(section === 'building' ? 'general_construction' : 'cnc_machining');
    }
  }, [isOpen, section]);

  const handleProcessChange = (next: ManufacturingProcess) => {
    userPickedProcessRef.current = true;
    setProcess(next);
  };

  const stressReport = useMemo(
    () => runStressAnalysis(objects, { appliedLoadN, loadDirection, safetyFactorTarget }),
    [objects, appliedLoadN, loadDirection, safetyFactorTarget]
  );

  const dfmReport = useMemo(() => runManufacturabilityReport(objects, process), [objects, process]);

  if (!isOpen) return null;

  const verdictColor = (v: string) =>
    v === 'pass' || v === 'ready_for_production'
      ? 'text-emerald-400'
      : v === 'marginal' || v === 'needs_revision'
      ? 'text-amber-400'
      : 'text-rose-400';

  const verdictIcon = (v: string) =>
    v === 'pass' || v === 'ready_for_production' ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : v === 'marginal' || v === 'needs_revision' ? (
      <AlertTriangle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[860px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Engineering Validation Studio</h2>
              <p className="text-xs text-zinc-400">Structural safety-factor testing and process-aware manufacturability (DFM) audits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('stress')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'stress' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Structural Test</span>
              </button>
              <button
                onClick={() => setActiveTab('dfm')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'dfm' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Manufacturability (DFM)</span>
              </button>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= TAB 1: STRUCTURAL STRESS TEST ================= */}
        {activeTab === 'stress' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Applied Load (N)</label>
                <input
                  type="number"
                  value={appliedLoadN}
                  onChange={e => setAppliedLoadN(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Load Direction</label>
                <select
                  value={loadDirection}
                  onChange={e => setLoadDirection(e.target.value as StressLoadDirection)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                >
                  <option value="bending">Bending (cantilever load)</option>
                  <option value="axial_tension">Axial Tension</option>
                  <option value="axial_compression">Axial Compression</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Target Safety Factor</label>
                <input
                  type="number"
                  step={0.1}
                  value={safetyFactorTarget}
                  onChange={e => setSafetyFactorTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>
            </div>

            {/* Overall Verdict */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={verdictColor(stressReport.overallVerdict)}>{verdictIcon(stressReport.overallVerdict)}</span>
                <span className="text-sm font-bold text-zinc-100">
                  Overall Verdict: <span className={verdictColor(stressReport.overallVerdict)}>{stressReport.overallVerdict.toUpperCase()}</span>
                </span>
                {stressReport.weakestPart && (
                  <span className="text-xs text-zinc-500">
                    — Critical part: <strong className="text-zinc-300">{stressReport.weakestPart.partName}</strong> (SF {stressReport.weakestPart.safetyFactor}×)
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  downloadText(
                    generateStressReportMarkdown(stressReport, assemblyName),
                    `${assemblyName.replace(/\s+/g, '_')}_Stress_Report.md`,
                    'text/markdown'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Report
              </button>
            </div>

            {/* Per-Part Results Table */}
            <div className="rounded-2xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Part</th>
                    <th className="text-left px-3 py-2 font-semibold">Material</th>
                    <th className="text-right px-3 py-2 font-semibold">Yield (MPa)</th>
                    <th className="text-right px-3 py-2 font-semibold">Stress (MPa)</th>
                    <th className="text-right px-3 py-2 font-semibold">Safety Factor</th>
                    <th className="text-center px-3 py-2 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {stressReport.results.map(r => (
                    <tr key={r.partId} className="border-t border-zinc-800/80 hover:bg-zinc-950/40">
                      <td className="px-3 py-2 text-zinc-200 font-medium">{r.partName}</td>
                      <td className="px-3 py-2 text-zinc-400">{r.materialName}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-300">{r.yieldStrengthMpa}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-300">{r.computedStressMpa}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-100">{r.safetyFactor}×</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 ${verdictColor(r.verdict)}`}>{verdictIcon(r.verdict)} {r.verdict.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-500 px-1">
              Simplified analytical beam/strut approximation (axial = F/A, bending = Mc/I) using each part's real matched engineering material yield
              strength — a concept-screening check, not a substitute for full FEA.
            </p>
          </div>
        )}

        {/* ================= TAB 2: MANUFACTURABILITY (DFM) ================= */}
        {activeTab === 'dfm' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 block">Target Manufacturing Process</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {PROCESS_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => handleProcessChange(p)}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                      process === p
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="font-bold">{MANUFACTURING_PROCESS_RULES[p].name}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Min wall {MANUFACTURING_PROCESS_RULES[p].minWallThicknessMm}mm</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">{MANUFACTURING_PROCESS_RULES[process].description}</p>
            </div>

            {/* Verdict + Cost/Lead Time KPIs */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 col-span-1">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                  <span className={verdictColor(dfmReport.overallVerdict)}>{verdictIcon(dfmReport.overallVerdict)}</span>
                  <span>Verdict</span>
                </div>
                <div className={`text-sm font-bold ${verdictColor(dfmReport.overallVerdict)}`}>
                  {dfmReport.overallVerdict.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Unit Cost</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-sm font-bold font-mono text-emerald-400">${dfmReport.estimatedUnitCostUsd.toFixed(2)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Setup / Tooling</span>
                  <Weight className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-sm font-bold font-mono text-zinc-100">${dfmReport.estimatedSetupCostUsd.toFixed(2)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Lead Time</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm font-bold font-mono text-zinc-100">{dfmReport.estimatedLeadTimeDays}d</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {dfmReport.failCount} fail · {dfmReport.warningCount} warning · {dfmReport.passCount} pass ({dfmReport.partCount} parts audited)
              </span>
              <button
                onClick={() =>
                  downloadText(
                    generateManufacturabilityMarkdown(dfmReport, assemblyName),
                    `${assemblyName.replace(/\s+/g, '_')}_DFM_Report.md`,
                    'text/markdown'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Report
              </button>
            </div>

            {/* Findings List */}
            <div className="space-y-2">
              {dfmReport.findings.map(f => (
                <div
                  key={f.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                    f.severity === 'fail'
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : f.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-800/40'
                      : 'bg-emerald-950/20 border-emerald-800/40'
                  }`}
                >
                  <span className={verdictColor(f.severity)}>{verdictIcon(f.severity)}</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-zinc-200">
                      {f.partName} <span className="text-zinc-500 font-normal">· {f.ruleId}</span>
                    </div>
                    <div className="text-zinc-400">{f.message}</div>
                    <div className="text-zinc-500 italic">Fix: {f.suggestedFix}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
