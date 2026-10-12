/**
 * Structural Stress & Safety Factor Analysis Engine
 * A simplified analytical (closed-form) structural check — the "Test" stage of the
 * design → test → manufacture pipeline. For each part it estimates the worst-case
 * cross-sectional stress under a user-defined applied load and compares it against
 * the real yield strength of the part's matched engineering material, producing a
 * pass/marginal/fail safety factor per part (and for the weakest link overall).
 *
 * This is an engineering approximation suitable for early concept screening — a thin
 * rectangular-section beam/strut model (axial stress = F/A, bending stress = Mc/I) —
 * not a substitute for full FEA, which this app does not perform.
 */

import { CADObject, StressLoadCase, PartStressResult, StressAnalysisReport } from '../types/cad';
import { getMaterialPresetForCADObject } from './massCalculator';

// A part is a physical failure below 1.0x regardless of what the user targets;
// between 1.0x and the user's own target it's a "marginal" design risk, not an
// outright fail — so the target the user set in the UI actually drives the verdict.
const SAFETY_FACTOR_FAIL_BELOW = 1.0;

function verdictForSafetyFactor(sf: number, safetyFactorTarget: number): 'pass' | 'marginal' | 'fail' {
  const target = Math.max(SAFETY_FACTOR_FAIL_BELOW, safetyFactorTarget || SAFETY_FACTOR_FAIL_BELOW);
  if (sf < SAFETY_FACTOR_FAIL_BELOW) return 'fail';
  if (sf < target) return 'marginal';
  return 'pass';
}

/**
 * Computes the worst-case stress (MPa) for a single part under the given load case.
 * Uses the part's bounding dimensions (scaled by its transform, matching how every
 * other engine in this app — mass/volume calc, DFM, STEP export — reads geometry)
 * as a rectangular-section beam approximation.
 */
export function computePartStress(obj: CADObject, loadCase: StressLoadCase): PartStressResult {
  const preset = getMaterialPresetForCADObject(obj);
  const { width, height, depth } = obj.dimensions;
  const [sx, sy, sz] = obj.scale || [1, 1, 1];
  const w = Math.max(0.1, (width || 10) * (sx || 1));
  const h = Math.max(0.1, (height || 10) * (sy || 1));
  const d = Math.max(0.1, (depth || 10) * (sz || 1));

  // Cross-section perpendicular to the load path: use the two smallest
  // dimensions as the load-bearing section (worst-case orientation).
  const dims = [w, h, d].sort((a, b) => a - b);
  const sectionA = dims[0]; // smallest — the "thin" axis
  const sectionB = dims[1]; // next smallest
  const spanLength = dims[2]; // largest — treated as the unsupported span/lever arm

  const crossSectionAreaMm2 = sectionA * sectionB;
  let computedStressMpa: number;

  if (loadCase.loadDirection === 'bending') {
    // Simple cantilever bending: stress = M*c / I, M = F * span, c = sectionA/2,
    // I = sectionB * sectionA^3 / 12 (rectangular section, bending about the weak axis)
    const momentNmm = loadCase.appliedLoadN * spanLength;
    const c = sectionA / 2;
    const I = (sectionB * Math.pow(sectionA, 3)) / 12;
    const stressNmm2 = I > 0.0001 ? (momentNmm * c) / I : Infinity;
    computedStressMpa = stressNmm2; // 1 N/mm^2 = 1 MPa
  } else {
    // Axial tension/compression: stress = F / A
    computedStressMpa = loadCase.appliedLoadN / crossSectionAreaMm2;
  }

  // Fall back to a conservative 50 MPa if a material preset is ever missing a yield
  // strength (the field is optional on MaterialDensityPreset), rather than silently
  // producing NaN/Infinity safety factors.
  const yieldStrengthMpa = preset.yieldStrengthMpa || 50;
  const safetyFactor = computedStressMpa > 0.0001 ? yieldStrengthMpa / computedStressMpa : 999;

  return {
    partId: obj.id,
    partName: obj.name,
    materialName: preset.name,
    yieldStrengthMpa,
    crossSectionAreaMm2: parseFloat(crossSectionAreaMm2.toFixed(2)),
    computedStressMpa: parseFloat(Math.min(computedStressMpa, 999999).toFixed(2)),
    safetyFactor: parseFloat(Math.min(safetyFactor, 999).toFixed(2)),
    verdict: verdictForSafetyFactor(safetyFactor, loadCase.safetyFactorTarget),
  };
}

/**
 * Runs the stress test across every visible part in the assembly for a given load case.
 */
export function runStressAnalysis(objects: CADObject[], loadCase: StressLoadCase): StressAnalysisReport {
  const visibleObjects = objects.filter(o => o.visible);
  const results = visibleObjects.map(obj => computePartStress(obj, loadCase));

  const weakestPart = results.length > 0
    ? results.reduce((worst, r) => (r.safetyFactor < worst.safetyFactor ? r : worst), results[0])
    : undefined;

  let overallVerdict: 'pass' | 'marginal' | 'fail' = 'pass';
  if (results.some(r => r.verdict === 'fail')) overallVerdict = 'fail';
  else if (results.some(r => r.verdict === 'marginal')) overallVerdict = 'marginal';

  return {
    loadCase,
    generatedAt: new Date().toISOString(),
    results: results.sort((a, b) => a.safetyFactor - b.safetyFactor),
    weakestPart,
    overallVerdict,
  };
}

/**
 * Markdown structural test report.
 */
export function generateStressReportMarkdown(report: StressAnalysisReport, assemblyName: string): string {
  let md = `# Structural Stress & Safety Factor Test Report\n\n`;
  md += `**Assembly:** ${assemblyName}  \n`;
  md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}  \n`;
  md += `**Applied Load:** ${report.loadCase.appliedLoadN} N (${report.loadCase.loadDirection.replace(/_/g, ' ')})  \n`;
  md += `**Target Safety Factor:** ${report.loadCase.safetyFactorTarget}×  \n`;
  md += `**Overall Verdict:** ${report.overallVerdict.toUpperCase()}  \n\n`;

  if (report.weakestPart) {
    md += `**Critical / Weakest Part:** ${report.weakestPart.partName} — SF ${report.weakestPart.safetyFactor}×\n\n`;
  }

  md += `## Per-Part Results\n\n`;
  md += `| Part | Material | Yield (MPa) | Section Area (mm²) | Stress (MPa) | Safety Factor | Verdict |\n|---|---|---|---|---|---|---|\n`;
  report.results.forEach(r => {
    md += `| ${r.partName} | ${r.materialName} | ${r.yieldStrengthMpa} | ${r.crossSectionAreaMm2} | ${r.computedStressMpa} | ${r.safetyFactor}× | ${r.verdict.toUpperCase()} |\n`;
  });

  md += `\n*Simplified analytical approximation (beam/strut theory) — not a substitute for full FEA.*\n`;
  md += `*Report generated by 3D CAD Design Studio Structural Test Engine.*\n`;
  return md;
}
