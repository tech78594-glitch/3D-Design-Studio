/**
 * Manufacturability (DFM) Analysis Engine
 * Applies process-specific Design-for-Manufacture rules (minimum wall thickness,
 * minimum feature size, aspect ratio, draft angle requirements) against the live
 * CAD assembly, and produces per-part findings plus a process-aware cost & lead
 * time estimate — the "Manufacture" stage of the design → test → manufacture pipeline.
 */

import { CADObject, ManufacturingProcess, ManufacturingProcessRules, DFMFinding, ManufacturabilityReport } from '../types/cad';
import { getMaterialPresetForCADObject, computeMeshVolumeAndSurfaceArea } from './massCalculator';

export const MANUFACTURING_PROCESS_RULES: Record<ManufacturingProcess, ManufacturingProcessRules> = {
  cnc_machining: {
    id: 'cnc_machining',
    name: 'CNC Machining (3/5-axis)',
    minWallThicknessMm: 0.8,
    minFeatureSizeMm: 1.0,
    maxAspectRatio: 15,
    requiresDraftAngle: false,
    recommendedDraftAngleDeg: 0,
    setupCostUsd: 85,
    perPartLaborUsdPerCm3: 1.35,
    baseLeadTimeDays: 2,
    perPartLeadTimeDays: 0.4,
    description: 'Subtractive machining from billet stock. No draft required; tight tolerances; thin unsupported walls can chatter.',
  },
  injection_molding: {
    id: 'injection_molding',
    name: 'Injection Molding',
    minWallThicknessMm: 1.0,
    minFeatureSizeMm: 0.5,
    maxAspectRatio: 20,
    requiresDraftAngle: true,
    recommendedDraftAngleDeg: 1.5,
    setupCostUsd: 4500, // tooling
    perPartLaborUsdPerCm3: 0.08,
    baseLeadTimeDays: 21, // tooling lead time
    perPartLeadTimeDays: 0.002,
    description: 'High-volume plastic tooling. Requires draft angles for ejection, uniform wall thickness to avoid sink marks/warping.',
  },
  fdm_3d_printing: {
    id: 'fdm_3d_printing',
    name: 'FDM 3D Printing',
    minWallThicknessMm: 0.8,
    minFeatureSizeMm: 0.8,
    maxAspectRatio: 25,
    requiresDraftAngle: false,
    recommendedDraftAngleDeg: 0,
    setupCostUsd: 5,
    perPartLaborUsdPerCm3: 0.18,
    baseLeadTimeDays: 0.5,
    perPartLeadTimeDays: 0.3,
    description: 'Layer-extrusion additive process. Overhangs beyond 45° need supports; thin walls below nozzle width will not print solid.',
  },
  sls_3d_printing: {
    id: 'sls_3d_printing',
    name: 'SLS 3D Printing (Nylon)',
    minWallThicknessMm: 0.7,
    minFeatureSizeMm: 0.5,
    maxAspectRatio: 30,
    requiresDraftAngle: false,
    recommendedDraftAngleDeg: 0,
    setupCostUsd: 15,
    perPartLaborUsdPerCm3: 0.45,
    baseLeadTimeDays: 1,
    perPartLeadTimeDays: 0.2,
    description: 'Powder-bed fusion, self-supporting (no support structures needed). Fine lattice walls below ~0.7mm are fragile post-depowder.',
  },
  sheet_metal: {
    id: 'sheet_metal',
    name: 'Sheet Metal Fabrication',
    minWallThicknessMm: 0.5,
    minFeatureSizeMm: 1.5,
    maxAspectRatio: 40,
    requiresDraftAngle: false,
    recommendedDraftAngleDeg: 0,
    setupCostUsd: 350,
    perPartLaborUsdPerCm3: 0.6,
    baseLeadTimeDays: 5,
    perPartLeadTimeDays: 0.1,
    description: 'Laser-cut & brake-formed flat stock. Uniform gauge thickness only; bend radii must clear minimum feature size.',
  },
  general_construction: {
    id: 'general_construction',
    name: 'General Construction (Cast/Framed)',
    // Architectural elements (slabs, walls, columns, beams) are poured, framed, or
    // masonry-built, not molded or machined — limits are in whole centimeters, not mm,
    // and there is no mold-ejection or nozzle-width constraint to speak of.
    minWallThicknessMm: 50,
    minFeatureSizeMm: 10,
    maxAspectRatio: 60,
    requiresDraftAngle: false,
    recommendedDraftAngleDeg: 0,
    setupCostUsd: 1200, // formwork / site mobilization
    perPartLaborUsdPerCm3: 0.0006, // labor is priced per m3 of concrete/timber/masonry, not per cm3 of plastic
    baseLeadTimeDays: 10,
    perPartLeadTimeDays: 1.5,
    description: 'Poured concrete, framed timber, and masonry construction for architectural elements. No draft or mold constraints; governed by minimum structural thickness and span-to-depth ratio instead.',
  },
};

/**
 * Runs the full Design-for-Manufacture audit across the assembly for a given process.
 */
export function runDFMAnalysis(objects: CADObject[], process: ManufacturingProcess): DFMFinding[] {
  const rules = MANUFACTURING_PROCESS_RULES[process];
  const findings: DFMFinding[] = [];
  const visibleObjects = objects.filter(o => o.visible);

  visibleObjects.forEach(obj => {
    const { width, height, depth } = obj.dimensions;
    const [sx, sy, sz] = obj.scale || [1, 1, 1];
    // Apply the part's scale transform, matching every other engine that reads
    // geometry (mass/volume calc, STEP export, stress test) — an un-scaled read
    // here previously let a resized part silently skip real DFM violations.
    const dims = [width * (sx || 1), height * (sy || 1), depth * (sz || 1)].filter(d => typeof d === 'number' && d > 0);
    if (dims.length === 0) return;

    const minDim = Math.min(...dims);
    const maxDim = Math.max(...dims);
    const aspectRatio = maxDim / Math.max(0.01, minDim);

    // Rule 1: Minimum wall / feature thickness — the thinnest overall dimension
    // of a part is used as a proxy for its thinnest producible section.
    if (minDim < rules.minWallThicknessMm) {
      findings.push({
        id: `dfm_${obj.id}_wall`,
        partId: obj.id,
        partName: obj.name,
        ruleId: 'min_wall_thickness',
        severity: 'fail',
        message: `Thinnest section (${minDim.toFixed(2)}mm) is below the ${rules.minWallThicknessMm}mm minimum wall thickness for ${rules.name}.`,
        suggestedFix: `Increase the smallest dimension to at least ${rules.minWallThicknessMm}mm, or switch to a process with a lower minimum wall thickness.`,
        measuredValueMm: minDim,
        limitValueMm: rules.minWallThicknessMm,
      });
    } else if (minDim < rules.minWallThicknessMm * 1.5) {
      findings.push({
        id: `dfm_${obj.id}_wall_warn`,
        partId: obj.id,
        partName: obj.name,
        ruleId: 'min_wall_thickness',
        severity: 'warning',
        message: `Thinnest section (${minDim.toFixed(2)}mm) is close to the ${rules.minWallThicknessMm}mm minimum for ${rules.name} — at risk of warping or short-shot.`,
        suggestedFix: `Add ${(rules.minWallThicknessMm * 1.5 - minDim).toFixed(2)}mm of margin for a safer production tolerance.`,
        measuredValueMm: minDim,
        limitValueMm: rules.minWallThicknessMm,
      });
    }

    // Rule 2: Minimum feature size (small detail parts like screws, chips, ports)
    if (['screw_head', 'chip_ic', 'port_usbc', 'camera_lens'].includes(obj.primitive) && minDim < rules.minFeatureSizeMm) {
      findings.push({
        id: `dfm_${obj.id}_feature`,
        partId: obj.id,
        partName: obj.name,
        ruleId: 'min_feature_size',
        severity: 'warning',
        message: `Fine feature (${minDim.toFixed(2)}mm) is below the ${rules.minFeatureSizeMm}mm reliably-resolvable feature size for ${rules.name}.`,
        suggestedFix: `Enlarge the feature or produce it as a separate insert/fastener rather than a molded/printed detail.`,
        measuredValueMm: minDim,
        limitValueMm: rules.minFeatureSizeMm,
      });
    }

    // Rule 3: Aspect ratio — very thin + very long/tall geometry is prone to
    // machining chatter, print warping, or mold flow starvation.
    if (aspectRatio > rules.maxAspectRatio) {
      findings.push({
        id: `dfm_${obj.id}_aspect`,
        partId: obj.id,
        partName: obj.name,
        ruleId: 'max_aspect_ratio',
        severity: 'fail',
        message: `Aspect ratio ${aspectRatio.toFixed(1)}:1 exceeds the ${rules.maxAspectRatio}:1 limit for ${rules.name} — risk of warping, chatter, or incomplete fill.`,
        suggestedFix: `Add ribs/gussets to shorten the unsupported span, or split the part into shorter segments.`,
      });
    }

    // Rule 4: Draft angle requirement for molded parts — flat box-like
    // primitives without rounded/tapered geometry will not release from a mold.
    if (rules.requiresDraftAngle && (obj.primitive === 'box' || obj.primitive === 'rounded_box') && !obj.tags?.includes('tag_has_draft')) {
      findings.push({
        id: `dfm_${obj.id}_draft`,
        partId: obj.id,
        partName: obj.name,
        ruleId: 'draft_angle',
        severity: 'warning',
        message: `Vertical-walled part has no tagged draft angle — ${rules.name} requires ≥${rules.recommendedDraftAngleDeg}° draft per wall to eject from the mold.`,
        suggestedFix: `Add a ${rules.recommendedDraftAngleDeg}° draft to all pull-direction faces, or tag the part "tag_has_draft" once draft is modeled.`,
      });
    }

    // Rule 5: Overhang risk for unsupported FDM printing. Only flag a part that is
    // BOTH meaningfully elevated above the lowest part in the assembly (our proxy for
    // the build plate) AND has no other part's bounding box beneath it to act as
    // support — not just "any internal part above some multiple of its own thickness",
    // which flagged nearly every internal component of a typical assembly.
    if (process === 'fdm_3d_printing' && !obj.locked) {
      const buildPlateY = Math.min(...visibleObjects.map(o => o.position[1]));
      const elevationMm = obj.position[1] - buildPlateY;
      const halfW = (width * (sx || 1)) / 2;
      const halfD = (depth * (sz || 1)) / 2;

      const hasSupportBelow = visibleObjects.some(other => {
        if (other.id === obj.id) return false;
        if (other.position[1] >= obj.position[1]) return false; // must be strictly beneath
        const [osx, , osz] = other.scale || [1, 1, 1];
        const otherHalfW = (other.dimensions.width * (osx || 1)) / 2;
        const otherHalfD = (other.dimensions.depth * (osz || 1)) / 2;
        const overlapsX = Math.abs(other.position[0] - obj.position[0]) < halfW + otherHalfW;
        const overlapsZ = Math.abs(other.position[2] - obj.position[2]) < halfD + otherHalfD;
        return overlapsX && overlapsZ;
      });

      if (elevationMm > Math.max(15, minDim * 2) && !hasSupportBelow) {
        findings.push({
          id: `dfm_${obj.id}_overhang`,
          partId: obj.id,
          partName: obj.name,
          ruleId: 'overhang_support',
          severity: 'warning',
          message: `Part sits ${elevationMm.toFixed(1)}mm above the lowest point of the assembly with no other part's footprint beneath it — likely needs print supports.`,
          suggestedFix: `Re-orient the assembly so this part has a contiguous support path to the bed, or enable supports in the slicer.`,
        });
      }
    }
  });

  if (findings.length === 0) {
    findings.push({
      id: 'dfm_none',
      partId: 'assembly',
      partName: 'Full Assembly',
      ruleId: 'none',
      severity: 'pass',
      message: `All ${visibleObjects.length} visible parts satisfy ${rules.name} manufacturability rules.`,
      suggestedFix: 'No action required.',
    });
  }

  return findings;
}

/**
 * Estimates process-aware per-unit production cost and lead time, reusing the
 * same material density/volume math as the Mass Properties engine.
 */
export function estimateManufacturingCost(
  objects: CADObject[],
  process: ManufacturingProcess
): { unitCostUsd: number; setupCostUsd: number; leadTimeDays: number } {
  const rules = MANUFACTURING_PROCESS_RULES[process];
  const visibleObjects = objects.filter(o => o.visible);

  let unitCostUsd = 0;
  visibleObjects.forEach(obj => {
    const preset = getMaterialPresetForCADObject(obj);
    const { volumeCm3 } = computeMeshVolumeAndSurfaceArea(obj);
    const materialCost = volumeCm3 * (preset.densityGcm3 / 1000) * preset.costPerKgUsd;
    const laborCost = volumeCm3 * rules.perPartLaborUsdPerCm3;
    unitCostUsd += materialCost + laborCost;
  });

  const leadTimeDays = rules.baseLeadTimeDays + visibleObjects.length * rules.perPartLeadTimeDays;

  return {
    unitCostUsd: parseFloat(unitCostUsd.toFixed(2)),
    setupCostUsd: rules.setupCostUsd,
    leadTimeDays: parseFloat(leadTimeDays.toFixed(1)),
  };
}

/**
 * Produces a complete Manufacturability Report: DFM findings + cost/lead time + verdict.
 */
export function runManufacturabilityReport(objects: CADObject[], process: ManufacturingProcess): ManufacturabilityReport {
  const findings = runDFMAnalysis(objects, process);
  const failCount = findings.filter(f => f.severity === 'fail').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const passCount = findings.filter(f => f.severity === 'pass').length;

  const { unitCostUsd, setupCostUsd, leadTimeDays } = estimateManufacturingCost(objects, process);

  let overallVerdict: 'ready_for_production' | 'needs_revision' | 'blocked' = 'ready_for_production';
  if (failCount > 0) overallVerdict = 'blocked';
  else if (warningCount > 0) overallVerdict = 'needs_revision';

  return {
    process,
    processName: MANUFACTURING_PROCESS_RULES[process].name,
    generatedAt: new Date().toISOString(),
    partCount: objects.filter(o => o.visible).length,
    findings,
    failCount,
    warningCount,
    passCount,
    overallVerdict,
    estimatedUnitCostUsd: unitCostUsd,
    estimatedSetupCostUsd: setupCostUsd,
    estimatedLeadTimeDays: leadTimeDays,
  };
}

/**
 * Markdown manufacturability report for export alongside the BOM / specs documents.
 */
export function generateManufacturabilityMarkdown(report: ManufacturabilityReport, assemblyName: string): string {
  let md = `# Design-for-Manufacture (DFM) Audit\n\n`;
  md += `**Assembly:** ${assemblyName}  \n`;
  md += `**Target Process:** ${report.processName}  \n`;
  md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}  \n`;
  md += `**Parts Audited:** ${report.partCount}  \n`;
  md += `**Overall Verdict:** ${report.overallVerdict.replace(/_/g, ' ').toUpperCase()}  \n\n`;

  md += `## Cost & Lead Time Estimate\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Estimated Unit Cost | $${report.estimatedUnitCostUsd.toFixed(2)} |\n`;
  md += `| Tooling / Setup Cost | $${report.estimatedSetupCostUsd.toFixed(2)} |\n`;
  md += `| Estimated Lead Time | ${report.estimatedLeadTimeDays} days |\n\n`;

  md += `## Findings (${report.failCount} fail, ${report.warningCount} warning, ${report.passCount} pass)\n\n`;
  md += `| Severity | Part | Rule | Issue | Suggested Fix |\n|---|---|---|---|---|\n`;
  report.findings.forEach(f => {
    md += `| ${f.severity.toUpperCase()} | ${f.partName} | ${f.ruleId} | ${f.message} | ${f.suggestedFix} |\n`;
  });

  md += `\n*Report generated by 3D CAD Design Studio Manufacturability Engine.*\n`;
  return md;
}
