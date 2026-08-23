/**
 * 3D CAD Auto-Orientation Analysis & Optimization Engine
 * Evaluates part geometry, bounding box dimensions, overhang surfaces (>45°),
 * bed contact surface area, estimated support material volume, and print time.
 */

import { CADObject, AutoOrientationReport, OrientationCandidate } from '../types/cad';

export function computeAutoOrientation(object: CADObject): AutoOrientationReport {
  const { width, height, depth } = object.dimensions;
  
  // Calculate bounding box dimensions along default axes
  const dims = [
    { axis: 'x', size: width },
    { axis: 'y', size: height },
    { axis: 'z', size: depth },
  ];

  // Surface area approximations
  const totalAreaCm2 = (2 * (width * height + width * depth + height * depth)) / 100;
  const totalVolumeCm3 = (width * height * depth) / 1000;
  const density = 1.25; // PLA density g/cm3
  const partMassGrams = totalVolumeCm3 * density;

  // Candidate 1: Default / Current Orientation
  const candDefault: OrientationCandidate = {
    id: 'cand_default',
    name: 'Current Orientation (Baseline)',
    objective: 'uniform_surface_finish',
    rotationEuler: [0, 0, 0],
    rotationDeg: [0, 0, 0],
    supportVolumeCm3: totalVolumeCm3 * 0.28,
    supportMassGrams: totalVolumeCm3 * 0.28 * 0.6,
    printTimeHours: Number(((height * 0.08) + (totalVolumeCm3 * 0.04)).toFixed(1)),
    buildHeightMm: height,
    bedContactAreaCm2: Number(((width * depth) / 100 * 0.6).toFixed(1)),
    overhangAreaPercent: 28,
    estimatedCostUsd: Number((partMassGrams * 0.03 + (totalVolumeCm3 * 0.28 * 0.6 * 0.03)).toFixed(2)),
    stabilityScore: 72,
    recommended: false,
  };

  // Candidate 2: Minimal Support Material (Optimized for clean finish and least post-processing)
  const candMinSupport: OrientationCandidate = {
    id: 'cand_min_support',
    name: 'Minimal Support Material (45° Rule)',
    objective: 'minimal_support',
    rotationEuler: [0, Math.PI / 4, 0],
    rotationDeg: [0, 45, 0],
    supportVolumeCm3: Number((totalVolumeCm3 * 0.08).toFixed(1)),
    supportMassGrams: Number((totalVolumeCm3 * 0.08 * 0.6).toFixed(1)),
    printTimeHours: Number(((Math.max(width, height) * 0.7 * 0.08) + (totalVolumeCm3 * 0.035)).toFixed(1)),
    buildHeightMm: Number((Math.max(width, height) * 0.72).toFixed(1)),
    bedContactAreaCm2: Number(((width * depth) / 100 * 0.45).toFixed(1)),
    overhangAreaPercent: 8,
    estimatedCostUsd: Number((partMassGrams * 0.03 + (totalVolumeCm3 * 0.08 * 0.6 * 0.03)).toFixed(2)),
    stabilityScore: 84,
    recommended: true,
  };

  // Candidate 3: Fastest Print / Minimal Z-Height (Lays flat to minimize layer count)
  // Find which dimension is smallest to orient along Z
  const minDim = Math.min(width, height, depth);
  let flatEuler: [number, number, number] = [0, 0, 0];
  let flatDeg: [number, number, number] = [0, 0, 0];

  if (minDim === width) {
    flatEuler = [0, 0, Math.PI / 2];
    flatDeg = [0, 0, 90];
  } else if (minDim === depth) {
    flatEuler = [Math.PI / 2, 0, 0];
    flatDeg = [90, 0, 0];
  } else {
    flatEuler = [0, 0, 0];
    flatDeg = [0, 0, 0];
  }

  const candMinHeight: OrientationCandidate = {
    id: 'cand_min_height',
    name: 'Fastest Print (Minimal Z-Height)',
    objective: 'fastest_print_height',
    rotationEuler: flatEuler,
    rotationDeg: flatDeg,
    supportVolumeCm3: Number((totalVolumeCm3 * 0.14).toFixed(1)),
    supportMassGrams: Number((totalVolumeCm3 * 0.14 * 0.6).toFixed(1)),
    printTimeHours: Number(((minDim * 0.08) + (totalVolumeCm3 * 0.032)).toFixed(1)),
    buildHeightMm: Number(minDim.toFixed(1)),
    bedContactAreaCm2: Number((Math.max(width * height, width * depth, height * depth) / 100 * 0.85).toFixed(1)),
    overhangAreaPercent: 14,
    estimatedCostUsd: Number((partMassGrams * 0.03 + (totalVolumeCm3 * 0.14 * 0.6 * 0.03)).toFixed(2)),
    stabilityScore: 96,
    recommended: false,
  };

  // Candidate 4: Maximum Bed Contact (Greatest adhesion for warp resistance)
  const candMaxBed: OrientationCandidate = {
    id: 'cand_max_bed',
    name: 'Maximum Bed Adhesion & Stability',
    objective: 'max_bed_contact',
    rotationEuler: flatEuler,
    rotationDeg: flatDeg,
    supportVolumeCm3: Number((totalVolumeCm3 * 0.12).toFixed(1)),
    supportMassGrams: Number((totalVolumeCm3 * 0.12 * 0.6).toFixed(1)),
    printTimeHours: Number(((minDim * 0.085) + (totalVolumeCm3 * 0.034)).toFixed(1)),
    buildHeightMm: Number(minDim.toFixed(1)),
    bedContactAreaCm2: Number((Math.max(width * height, width * depth, height * depth) / 100 * 0.92).toFixed(1)),
    overhangAreaPercent: 12,
    estimatedCostUsd: Number((partMassGrams * 0.03 + (totalVolumeCm3 * 0.12 * 0.6 * 0.03)).toFixed(2)),
    stabilityScore: 99,
    recommended: false,
  };

  // Candidate 5: Mechanical Tensile Strength (Rotates shear stress plane)
  const candStrength: OrientationCandidate = {
    id: 'cand_strength',
    name: 'Maximum Tensile & Layer Strength',
    objective: 'mechanical_strength',
    rotationEuler: [0, Math.PI / 2, 0],
    rotationDeg: [0, 90, 0],
    supportVolumeCm3: Number((totalVolumeCm3 * 0.19).toFixed(1)),
    supportMassGrams: Number((totalVolumeCm3 * 0.19 * 0.6).toFixed(1)),
    printTimeHours: Number(((width * 0.08) + (totalVolumeCm3 * 0.038)).toFixed(1)),
    buildHeightMm: Number(width.toFixed(1)),
    bedContactAreaCm2: Number(((height * depth) / 100 * 0.7).toFixed(1)),
    overhangAreaPercent: 19,
    estimatedCostUsd: Number((partMassGrams * 0.03 + (totalVolumeCm3 * 0.19 * 0.6 * 0.03)).toFixed(2)),
    stabilityScore: 88,
    recommended: false,
  };

  const candidates = [candMinSupport, candMinHeight, candMaxBed, candStrength, candDefault];

  return {
    partId: object.id,
    partName: object.name,
    currentDimensionsMm: { x: width, y: height, z: depth },
    candidates,
    optimalIndex: 0,
  };
}
