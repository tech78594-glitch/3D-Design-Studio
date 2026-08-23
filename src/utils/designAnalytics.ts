import { CADObject, DesignAnalyticsMetrics, MaterialType } from '../types/cad';

// Density in g/cm³ for CAD material types
export const MATERIAL_DENSITIES: Record<MaterialType, number> = {
  anodized_aluminum: 2.70,
  polished_metal: 7.85, // Steel
  matte_plastic: 1.05,  // ABS / Polycarbonate
  glossy_ceramic: 3.90, // Zirconia
  tinted_glass: 2.50,
  clear_glass: 2.50,
  carbon_fiber: 1.60,
  gold_trace: 19.32,
  copper: 8.96,
  pcb_green: 1.85,     // FR4 Glass Epoxy + Copper
  pcb_black: 1.85,
  rubber_grip: 1.20,
  led_emissive: 1.40,
  concrete: 2.40,
  warm_wood: 0.65,
  white_plaster: 1.25,
  brick: 1.90,
  steel_beam: 7.85,
};

// Raw Material Cost Factor ($ / kg)
export const MATERIAL_COST_PER_KG: Record<MaterialType, number> = {
  anodized_aluminum: 12.50,
  polished_metal: 8.00,
  matte_plastic: 4.20,
  glossy_ceramic: 35.00,
  tinted_glass: 18.00,
  clear_glass: 15.00,
  carbon_fiber: 65.00,
  gold_trace: 850.00,
  copper: 22.00,
  pcb_green: 45.00,
  pcb_black: 48.00,
  rubber_grip: 6.50,
  led_emissive: 120.00,
  concrete: 0.15,
  warm_wood: 3.50,
  white_plaster: 0.80,
  brick: 0.40,
  steel_beam: 2.80,
};

// Embodied Carbon Factor (kg CO₂ eq / kg material)
export const MATERIAL_CARBON_FACTOR: Record<MaterialType, number> = {
  anodized_aluminum: 8.2,
  polished_metal: 2.3,
  matte_plastic: 3.1,
  glossy_ceramic: 5.5,
  tinted_glass: 1.4,
  clear_glass: 1.2,
  carbon_fiber: 21.0,
  gold_trace: 180.0,
  copper: 4.8,
  pcb_green: 14.5,
  pcb_black: 14.8,
  rubber_grip: 2.8,
  led_emissive: 25.0,
  concrete: 0.12,
  warm_wood: -0.4, // Carbon sink
  white_plaster: 0.35,
  brick: 0.22,
  steel_beam: 1.8,
};

/**
 * Calculates volume (in cm³) and surface area (in cm²) of a CAD object primitive
 */
export function calculateObjectGeometryMetrics(obj: CADObject): { volumeCm3: number; surfaceAreaCm2: number } {
  const [sx, sy, sz] = obj.scale;
  const dims = obj.dimensions;

  // Convert dimensions from mm to cm (1 cm = 10 mm)
  const w = ((dims.width || 20) * sx) / 10;
  const h = ((dims.height || 20) * sy) / 10;
  const d = ((dims.depth || 20) * sz) / 10;

  let vol = 0;
  let sa = 0;

  if (obj.primitive === 'cylinder' || obj.primitive === 'cone') {
    const r = ((dims.radius || dims.radiusBottom || 10) * sx) / 10;
    vol = Math.PI * r * r * h;
    sa = 2 * Math.PI * r * h + 2 * Math.PI * r * r;
  } else if (obj.primitive === 'sphere') {
    const r = ((dims.radius || 10) * sx) / 10;
    vol = (4 / 3) * Math.PI * Math.pow(r, 3);
    sa = 4 * Math.PI * r * r;
  } else if (obj.primitive === 'torus') {
    const rTube = (2 * sx) / 10;
    const rRing = ((dims.radius || 10) * sx) / 10;
    vol = 2 * Math.PI * Math.PI * rRing * rTube * rTube;
    sa = 4 * Math.PI * Math.PI * rRing * rTube;
  } else {
    // Box / rounded_box / pcb / slabs / walls
    vol = w * h * d;
    sa = 2 * (w * h + w * d + h * d);
  }

  return {
    volumeCm3: Math.max(vol, 0.001),
    surfaceAreaCm2: Math.max(sa, 0.01),
  };
}

/**
 * Calculates mass in grams for an object
 */
export function calculateObjectMassGrams(obj: CADObject): number {
  if (obj.massKg && obj.massKg > 0) {
    return obj.massKg * 1000;
  }
  const { volumeCm3 } = calculateObjectGeometryMetrics(obj);
  const density = MATERIAL_DENSITIES[obj.material.type] || 2.0;
  return volumeCm3 * density;
}

/**
 * Computes full assembly telemetry, center of mass, BOM economics, carbon index, and structural risks
 */
export function computeAssemblyDesignAnalytics(objects: CADObject[]): DesignAnalyticsMetrics {
  const visibleObjects = objects.filter(o => o.visible);
  if (visibleObjects.length === 0) {
    return {
      totalMassGrams: 0,
      totalVolumeCm3: 0,
      totalSurfaceAreaCm2: 0,
      centerOfMass: [0, 0, 0],
      estimatedBOMCostUsd: 0,
      carbonFootprintKgCo2: 0,
      totalHeatDissipationWatts: 0,
      structuralRiskIndex: 0,
      partCount: 0,
      massDistribution: [],
      costDistribution: [],
      sustainabilityRating: 'A+',
    };
  }

  let totalMassGrams = 0;
  let totalVolumeCm3 = 0;
  let totalSurfaceAreaCm2 = 0;
  let weightedPosX = 0;
  let weightedPosY = 0;
  let weightedPosZ = 0;
  let totalBOMCost = 0;
  let totalCarbonKg = 0;
  let totalHeatWatts = 0;

  const categoryMassMap: Record<string, number> = {};
  const categoryCostMap: Record<string, number> = {};

  const categoryColors: Record<string, string> = {
    casing: '#38bdf8',
    internal: '#a855f7',
    pcb: '#10b981',
    optics: '#06b6d4',
    power: '#f59e0b',
    io: '#ec4899',
    fastener: '#94a3b8',
    structure: '#6366f1',
    envelope: '#3b82f6',
    interior: '#84cc16',
    custom: '#eab308',
  };

  for (const obj of visibleObjects) {
    const { volumeCm3, surfaceAreaCm2 } = calculateObjectGeometryMetrics(obj);
    const massGrams = calculateObjectMassGrams(obj);
    const massKg = massGrams / 1000;

    totalMassGrams += massGrams;
    totalVolumeCm3 += volumeCm3;
    totalSurfaceAreaCm2 += surfaceAreaCm2;

    // Center of Mass accumulation
    weightedPosX += obj.position[0] * massGrams;
    weightedPosY += obj.position[1] * massGrams;
    weightedPosZ += obj.position[2] * massGrams;

    // BOM Cost calculation
    const rawMaterialCost = massKg * (MATERIAL_COST_PER_KG[obj.material.type] || 10);
    const mfgComplexityMultiplier = obj.primitive === 'rounded_box' || obj.primitive === 'camera_lens' ? 2.5 : 1.5;
    const partCost = obj.unitCostUsd || rawMaterialCost * mfgComplexityMultiplier + (obj.category === 'pcb' ? 12.0 : 1.5);
    totalBOMCost += partCost;

    // Carbon calculation
    const carbonFactor = MATERIAL_CARBON_FACTOR[obj.material.type] || 4.0;
    const carbonEmission = massKg * carbonFactor;
    totalCarbonKg += carbonEmission;

    // Electrical wattage & heat
    if (obj.electricalProps?.heatWattage) {
      totalHeatWatts += obj.electricalProps.heatWattage;
    } else if (obj.category === 'pcb') {
      totalHeatWatts += 4.5;
    } else if (obj.category === 'power') {
      totalHeatWatts += 1.8;
    }

    // Category mappings
    const cat = obj.category || 'casing';
    categoryMassMap[cat] = (categoryMassMap[cat] || 0) + massGrams;
    categoryCostMap[cat] = (categoryCostMap[cat] || 0) + partCost;
  }

  const centerOfMass: [number, number, number] = totalMassGrams > 0
    ? [
        Number((weightedPosX / totalMassGrams).toFixed(2)),
        Number((weightedPosY / totalMassGrams).toFixed(2)),
        Number((weightedPosZ / totalMassGrams).toFixed(2)),
      ]
    : [0, 0, 0];

  // Mass distribution array for charts
  const massDistribution = Object.entries(categoryMassMap).map(([category, mass]) => ({
    category: category.toUpperCase(),
    massGrams: Number(mass.toFixed(1)),
    percentage: Number(((mass / totalMassGrams) * 100).toFixed(1)),
    color: categoryColors[category] || '#38bdf8',
  }));

  // Cost distribution array for charts
  const costDistribution = Object.entries(categoryCostMap).map(([category, cost]) => ({
    category: category.toUpperCase(),
    costUsd: Number(cost.toFixed(2)),
    percentage: Number(((cost / totalBOMCost) * 100).toFixed(1)),
    color: categoryColors[category] || '#38bdf8',
  }));

  // Structural Risk Score (0-100) based on aspect ratio imbalance, CoM offset from center, and thermal load density
  const comOffsetMag = Math.sqrt(centerOfMass[0] ** 2 + centerOfMass[1] ** 2 + centerOfMass[2] ** 2);
  let riskScore = 15; // baseline
  if (comOffsetMag > 25) riskScore += 25;
  if (totalHeatWatts > 10) riskScore += 20;
  if (totalMassGrams > 500) riskScore += 15;
  riskScore = Math.min(Math.max(riskScore, 5), 95);

  // Sustainability Rating
  let sustainabilityRating: 'A+' | 'A' | 'B' | 'C' | 'D' = 'A';
  if (totalCarbonKg < 0.5) sustainabilityRating = 'A+';
  else if (totalCarbonKg < 1.5) sustainabilityRating = 'A';
  else if (totalCarbonKg < 3.0) sustainabilityRating = 'B';
  else if (totalCarbonKg < 6.0) sustainabilityRating = 'C';
  else sustainabilityRating = 'D';

  return {
    totalMassGrams: Number(totalMassGrams.toFixed(1)),
    totalVolumeCm3: Number(totalVolumeCm3.toFixed(2)),
    totalSurfaceAreaCm2: Number(totalSurfaceAreaCm2.toFixed(2)),
    centerOfMass,
    estimatedBOMCostUsd: Number(totalBOMCost.toFixed(2)),
    carbonFootprintKgCo2: Number(totalCarbonKg.toFixed(2)),
    totalHeatDissipationWatts: Number(totalHeatWatts.toFixed(1)),
    structuralRiskIndex: riskScore,
    partCount: visibleObjects.length,
    massDistribution,
    costDistribution,
    sustainabilityRating,
  };
}
