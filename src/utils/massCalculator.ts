import * as THREE from 'three';
import { CADObject, CADMassProperties, PartMassItem, MaterialDensityPreset, InertiaTensor } from '../types/cad';
import { createCADGeometry } from './cadEngine';

/**
 * Standard Engineering Materials Physical Database
 * Densities in g/cm³ and typical raw material stock pricing in USD/kg
 */
export const MATERIAL_DENSITY_DATABASE: MaterialDensityPreset[] = [
  {
    id: 'mat_al6061',
    name: 'Aluminum 6061-T6',
    category: 'Metal',
    densityGcm3: 2.70,
    costPerKgUsd: 4.80,
    yieldStrengthMpa: 276,
    color: '#94a3b8',
    description: 'General aerospace and structural alloy with excellent strength-to-weight ratio.',
  },
  {
    id: 'mat_al7075',
    name: 'Aluminum 7075-T6',
    category: 'Metal',
    densityGcm3: 2.81,
    costPerKgUsd: 8.50,
    yieldStrengthMpa: 503,
    color: '#cbd5e1',
    description: 'High-strength zinc-aluminum alloy for extreme structural load applications.',
  },
  {
    id: 'mat_ss316l',
    name: 'Stainless Steel 316L',
    category: 'Metal',
    densityGcm3: 8.00,
    costPerKgUsd: 7.20,
    yieldStrengthMpa: 290,
    color: '#e2e8f0',
    description: 'Marine and medical grade austenitic steel with high corrosion resistance.',
  },
  {
    id: 'mat_ss304',
    name: 'Stainless Steel 304',
    category: 'Metal',
    densityGcm3: 7.93,
    costPerKgUsd: 5.50,
    yieldStrengthMpa: 215,
    color: '#f1f5f9',
    description: 'Versatile standard stainless steel for enclosures and fasteners.',
  },
  {
    id: 'mat_ti6al4v',
    name: 'Titanium Grade 5 (Ti-6Al-4V)',
    category: 'Metal',
    densityGcm3: 4.43,
    costPerKgUsd: 42.00,
    yieldStrengthMpa: 880,
    color: '#a1a1aa',
    description: 'High-performance aerospace alloy with superior strength and heat resistance.',
  },
  {
    id: 'mat_brass_c360',
    name: 'Free-Cutting Brass (C36000)',
    category: 'Metal',
    densityGcm3: 8.50,
    costPerKgUsd: 9.80,
    yieldStrengthMpa: 310,
    color: '#eab308',
    description: 'High-density decorative and low-friction alloy for bushings and hardware.',
  },
  {
    id: 'mat_copper_c110',
    name: 'Pure Copper (ETP C11000)',
    category: 'Metal',
    densityGcm3: 8.96,
    costPerKgUsd: 11.20,
    yieldStrengthMpa: 195,
    color: '#f97316',
    description: 'Electrolytic copper with extreme thermal and electrical conductivity.',
  },
  {
    id: 'mat_gold_24k',
    name: 'Gold 24k Plating',
    category: 'Metal',
    densityGcm3: 19.32,
    costPerKgUsd: 68500.00,
    yieldStrengthMpa: 120,
    color: '#facc15',
    description: 'Noble precious metal for premium corrosion-free contacts and luxury styling.',
  },
  {
    id: 'mat_abs_plastic',
    name: 'ABS Injection Plastic',
    category: 'Plastic',
    densityGcm3: 1.04,
    costPerKgUsd: 2.90,
    yieldStrengthMpa: 45,
    color: '#38bdf8',
    description: 'Rigid impact-resistant polymer used in consumer electronics housings.',
  },
  {
    id: 'mat_polycarbonate',
    name: 'Polycarbonate (PC)',
    category: 'Plastic',
    densityGcm3: 1.20,
    costPerKgUsd: 4.10,
    yieldStrengthMpa: 65,
    color: '#60a5fa',
    description: 'High impact optical-grade transparent thermoplastic.',
  },
  {
    id: 'mat_nylon_pa12',
    name: 'Nylon PA12 (SLS 3D Print)',
    category: 'Plastic',
    densityGcm3: 1.01,
    costPerKgUsd: 28.00,
    yieldStrengthMpa: 48,
    color: '#818cf8',
    description: 'Durable engineering polymer with excellent fatigue and chemical resistance.',
  },
  {
    id: 'mat_peek',
    name: 'PEEK (Polyetheretherketone)',
    category: 'Plastic',
    densityGcm3: 1.32,
    costPerKgUsd: 120.00,
    yieldStrengthMpa: 100,
    color: '#fbbf24',
    description: 'Ultra-high performance thermoplastic with continuous 250°C service rating.',
  },
  {
    id: 'mat_carbon_fiber',
    name: 'Carbon Fiber Composite (Prepreg)',
    category: 'Composite',
    densityGcm3: 1.60,
    costPerKgUsd: 48.00,
    yieldStrengthMpa: 600,
    color: '#27272a',
    description: 'Woven carbon fabric with epoxy resin for lightweight rigid structures.',
  },
  {
    id: 'mat_silicon_wafer',
    name: 'Silicon Semiconductor Substrate',
    category: 'Ceramic',
    densityGcm3: 2.33,
    costPerKgUsd: 34.00,
    yieldStrengthMpa: 120,
    color: '#0284c7',
    description: 'Monocrystalline semiconductor base for PCB dies and sensors.',
  },
  {
    id: 'mat_silicone_rubber',
    name: 'Silicone Elastomer / Memory Foam',
    category: 'Elastomer',
    densityGcm3: 1.15,
    costPerKgUsd: 6.50,
    yieldStrengthMpa: 8,
    color: '#ec4899',
    description: 'Soft high-compliance damping and ergonomic cushion material.',
  },
  {
    id: 'mat_gorilla_glass',
    name: 'Aluminosilicate Glass',
    category: 'Glass',
    densityGcm3: 2.45,
    costPerKgUsd: 14.00,
    yieldStrengthMpa: 80,
    color: '#a7f3d0',
    description: 'Chemically strengthened scratch-resistant display glass.',
  },
];

/**
 * Match CAD Material Name or Type to physical material preset
 */
export function getMaterialPresetForCADObject(obj: CADObject): MaterialDensityPreset {
  const matName = (obj.material?.name || '').toLowerCase();
  const objName = (obj.name || '').toLowerCase();

  if (matName.includes('titan') || objName.includes('titan')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_ti6al4v')!;
  }
  if (matName.includes('steel') || objName.includes('steel') || objName.includes('screw') || objName.includes('pin')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_ss316l')!;
  }
  if (matName.includes('gold') || objName.includes('gold') || objName.includes('contact')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_gold_24k')!;
  }
  if (matName.includes('copper') || objName.includes('trace') || objName.includes('coil') || objName.includes('jack')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_copper_c110')!;
  }
  if (matName.includes('brass') || objName.includes('bushing') || objName.includes('dial')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_brass_c360')!;
  }
  if (matName.includes('carbon') || objName.includes('carbon')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_carbon_fiber')!;
  }
  if (matName.includes('glass') || objName.includes('lens') || objName.includes('display') || objName.includes('screen')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_gorilla_glass')!;
  }
  if (matName.includes('silicon') || objName.includes('pcb') || objName.includes('chip') || objName.includes('sensor')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_silicon_wafer')!;
  }
  if (matName.includes('foam') || matName.includes('rubber') || matName.includes('leather') || objName.includes('cushion') || objName.includes('pad')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_silicone_rubber')!;
  }
  if (matName.includes('plastic') || matName.includes('abs') || objName.includes('cap') || objName.includes('housing')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_abs_plastic')!;
  }
  if (matName.includes('polycarb') || matName.includes('clear')) {
    return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_polycarbonate')!;
  }

  // Default to Aluminum 6061-T6
  return MATERIAL_DENSITY_DATABASE.find(m => m.id === 'mat_al6061')!;
}

/**
 * Calculates exact signed volume (mm³) and total surface area (mm²) from mesh triangles
 */
export function computeMeshVolumeAndSurfaceArea(obj: CADObject): {
  volumeMm3: number;
  volumeCm3: number;
  surfaceAreaMm2: number;
  surfaceAreaCm2: number;
  localCoGMm: [number, number, number];
} {
  const geom = createCADGeometry(obj);
  const positionAttr = geom.getAttribute('position');
  const indexAttr = geom.getIndex();

  const scale = new THREE.Vector3(obj.scale[0], obj.scale[1], obj.scale[2]);

  let totalSignedVolumeMm3 = 0;
  let totalSurfaceAreaMm2 = 0;
  const weightedCoG = new THREE.Vector3(0, 0, 0);

  const numTriangles = indexAttr ? indexAttr.count / 3 : positionAttr.count / 3;

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const diff1 = new THREE.Vector3();
  const diff2 = new THREE.Vector3();

  for (let i = 0; i < numTriangles; i++) {
    let iA = i * 3;
    let iB = i * 3 + 1;
    let iC = i * 3 + 2;

    if (indexAttr) {
      iA = indexAttr.getX(i * 3);
      iB = indexAttr.getX(i * 3 + 1);
      iC = indexAttr.getX(i * 3 + 2);
    }

    p1.fromBufferAttribute(positionAttr, iA).multiply(scale);
    p2.fromBufferAttribute(positionAttr, iB).multiply(scale);
    p3.fromBufferAttribute(positionAttr, iC).multiply(scale);

    // Signed volume of tetrahedron: 1/6 * det([p1, p2, p3]) = 1/6 * (p1 x p2) . p3
    cross.crossVectors(p1, p2);
    const tetraVol = cross.dot(p3) / 6.0;
    totalSignedVolumeMm3 += tetraVol;

    // Tetrahedron centroid contribution: (p1 + p2 + p3) / 4
    weightedCoG.addScaledVector(p1.clone().add(p2).add(p3).multiplyScalar(0.25), tetraVol);

    // Triangle surface area: 0.5 * ||(p2 - p1) x (p3 - p1)||
    diff1.subVectors(p2, p1);
    diff2.subVectors(p3, p1);
    const triCross = new THREE.Vector3().crossVectors(diff1, diff2);
    totalSurfaceAreaMm2 += triCross.length() * 0.5;
  }

  // Handle open meshes or flat sheets gracefully
  let volumeMm3 = Math.abs(totalSignedVolumeMm3);
  if (volumeMm3 < 0.001) {
    // Analytic fallback: approximate from bounding box volume
    geom.computeBoundingBox();
    const bbox = geom.boundingBox;
    if (bbox) {
      const size = new THREE.Vector3();
      bbox.getSize(size);
      size.multiply(scale);
      volumeMm3 = Math.max(0.1, size.x * size.y * size.z * 0.7);
    } else {
      volumeMm3 = 1.0;
    }
  }

  const localCoGMm: [number, number, number] = [0, 0, 0];
  if (Math.abs(totalSignedVolumeMm3) > 0.001) {
    weightedCoG.divideScalar(totalSignedVolumeMm3);
    localCoGMm[0] = weightedCoG.x;
    localCoGMm[1] = weightedCoG.y;
    localCoGMm[2] = weightedCoG.z;
  }

  const volumeCm3 = volumeMm3 / 1000.0; // 1 cm³ = 1000 mm³
  const surfaceAreaCm2 = totalSurfaceAreaMm2 / 100.0; // 1 cm² = 100 mm²

  return {
    volumeMm3,
    volumeCm3,
    surfaceAreaMm2: totalSurfaceAreaMm2,
    surfaceAreaCm2,
    localCoGMm,
  };
}

/**
 * Calculates Full Real-Time Mass Properties for the active CAD Assembly
 */
export function calculateAssemblyMassProperties(
  objects: CADObject[],
  densityOverrides: Record<string, number> = {}
): CADMassProperties {
  const visibleObjects = objects.filter(o => o.visible);
  const partItems: PartMassItem[] = [];

  let totalMassGrams = 0;
  let totalVolumeCm3 = 0;
  let totalSurfaceAreaCm2 = 0;
  let totalCostUsd = 0;

  const globalCoGSum = new THREE.Vector3(0, 0, 0);

  const minBounds = new THREE.Vector3(Infinity, Infinity, Infinity);
  const maxBounds = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  // First pass: compute individual part mass, volume, and global CoG
  visibleObjects.forEach(obj => {
    const preset = getMaterialPresetForCADObject(obj);
    const customDensity = densityOverrides[obj.id];
    const densityGcm3 = customDensity !== undefined ? customDensity : preset.densityGcm3;

    const { volumeCm3, surfaceAreaCm2, localCoGMm } = computeMeshVolumeAndSurfaceArea(obj);
    const massGrams = volumeCm3 * densityGcm3;
    const costUsd = (massGrams / 1000.0) * preset.costPerKgUsd;

    // Transform local CoG to World CAD space
    const euler = new THREE.Euler(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    const objPos = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
    const objScale = new THREE.Vector3(obj.scale[0], obj.scale[1], obj.scale[2]);
    const matrix = new THREE.Matrix4().compose(objPos, new THREE.Quaternion().setFromEuler(euler), objScale);

    const worldPartCoG = new THREE.Vector3(...localCoGMm).applyMatrix4(matrix);

    // Update global assembly bounds
    const halfDim = new THREE.Vector3(15, 15, 15).multiply(objScale);
    minBounds.min(objPos.clone().sub(halfDim));
    maxBounds.max(objPos.clone().add(halfDim));

    totalMassGrams += massGrams;
    totalVolumeCm3 += volumeCm3;
    totalSurfaceAreaCm2 += surfaceAreaCm2;
    totalCostUsd += costUsd;

    globalCoGSum.addScaledVector(worldPartCoG, massGrams);

    partItems.push({
      id: obj.id,
      name: obj.name,
      materialName: customDensity !== undefined ? `${preset.name} (Custom)` : preset.name,
      densityGcm3,
      volumeCm3,
      massGrams,
      surfaceAreaCm2,
      centerOfGravity: [
        parseFloat(worldPartCoG.x.toFixed(2)),
        parseFloat(worldPartCoG.y.toFixed(2)),
        parseFloat(worldPartCoG.z.toFixed(2)),
      ],
      costUsd,
      percentageOfTotal: 0, // computed below
      isCustomDensity: customDensity !== undefined,
    });
  });

  // Safe division for total CoG
  const finalCoG: [number, number, number] = [0, 0, 0];
  if (totalMassGrams > 0.0001) {
    const cogVec = globalCoGSum.clone().divideScalar(totalMassGrams);
    finalCoG[0] = parseFloat(cogVec.x.toFixed(2));
    finalCoG[1] = parseFloat(cogVec.y.toFixed(2));
    finalCoG[2] = parseFloat(cogVec.z.toFixed(2));
  }

  // Second pass: percentages & Moments of Inertia Tensor relative to assembly CoG
  let Ixx = 0;
  let Iyy = 0;
  let Izz = 0;
  let Ixy = 0;
  let Iyz = 0;
  let Izx = 0;

  partItems.forEach(item => {
    item.percentageOfTotal = totalMassGrams > 0 ? (item.massGrams / totalMassGrams) * 100 : 0;

    // Parallel axis theorem offset from assembly center of gravity
    const rx = item.centerOfGravity[0] - finalCoG[0];
    const ry = item.centerOfGravity[1] - finalCoG[1];
    const rz = item.centerOfGravity[2] - finalCoG[2];
    const m = item.massGrams; // in g * mm²

    Ixx += m * (ry * ry + rz * rz);
    Iyy += m * (rx * rx + rz * rz);
    Izz += m * (rx * rx + ry * ry);
    Ixy -= m * (rx * ry);
    Iyz -= m * (ry * rz);
    Izx -= m * (rz * rx);
  });

  const bboxWidth = isFinite(maxBounds.x - minBounds.x) ? Math.max(1, maxBounds.x - minBounds.x) : 100;
  const bboxHeight = isFinite(maxBounds.y - minBounds.y) ? Math.max(1, maxBounds.y - minBounds.y) : 100;
  const bboxDepth = isFinite(maxBounds.z - minBounds.z) ? Math.max(1, maxBounds.z - minBounds.z) : 100;

  return {
    totalMassGrams: parseFloat(totalMassGrams.toFixed(2)),
    totalMassKg: parseFloat((totalMassGrams / 1000.0).toFixed(4)),
    totalMassLbs: parseFloat((totalMassGrams * 0.00220462).toFixed(4)),
    totalVolumeCm3: parseFloat(totalVolumeCm3.toFixed(2)),
    totalSurfaceAreaCm2: parseFloat(totalSurfaceAreaCm2.toFixed(2)),
    centerOfGravity: finalCoG,
    inertiaTensor: {
      Ixx: parseFloat(Ixx.toFixed(2)),
      Iyy: parseFloat(Iyy.toFixed(2)),
      Izz: parseFloat(Izz.toFixed(2)),
      Ixy: parseFloat(Ixy.toFixed(2)),
      Iyz: parseFloat(Iyz.toFixed(2)),
      Izx: parseFloat(Izx.toFixed(2)),
    },
    estimatedMaterialCostUsd: parseFloat(totalCostUsd.toFixed(2)),
    parts: partItems.sort((a, b) => b.massGrams - a.massGrams),
    boundingBoxMm: {
      width: parseFloat(bboxWidth.toFixed(1)),
      height: parseFloat(bboxHeight.toFixed(1)),
      depth: parseFloat(bboxDepth.toFixed(1)),
    },
    calculatedAt: Date.now(),
  };
}

/**
 * Generates an Engineering Mass Properties Report in Markdown
 */
export function generateMassReportMarkdown(
  massProps: CADMassProperties,
  assemblyName: string = 'CAD Assembly'
): string {
  const dateStr = new Date(massProps.calculatedAt).toLocaleString();

  let md = `# Engineering Mass & Physical Properties Report\n`;
  md += `**Assembly Name:** ${assemblyName}  \n`;
  md += `**Generated Date:** ${dateStr}  \n`;
  md += `**Total Part Count:** ${massProps.parts.length} components  \n\n`;

  md += `## 1. Global Assembly Mass Properties Summary\n\n`;
  md += `| Property | Value | Units |\n`;
  md += `|---|---|---|\n`;
  md += `| **Total Mass** | **${massProps.totalMassGrams.toLocaleString()}** | grams (g) |\n`;
  md += `| **Total Mass** | **${massProps.totalMassKg}** | kilograms (kg) |\n`;
  md += `| **Total Mass (Imperial)** | **${massProps.totalMassLbs}** | pounds (lbs) |\n`;
  md += `| **Total Enclosed Volume** | ${massProps.totalVolumeCm3.toLocaleString()} | cm³ |\n`;
  md += `| **Total Surface Area** | ${massProps.totalSurfaceAreaCm2.toLocaleString()} | cm² |\n`;
  md += `| **Center of Gravity (X, Y, Z)** | \`[${massProps.centerOfGravity.join(', ')}]\` | mm |\n`;
  md += `| **Estimated Raw Material Cost** | **$${massProps.estimatedMaterialCostUsd.toFixed(2)}** | USD |\n`;
  md += `| **Bounding Box Enclosure** | ${massProps.boundingBoxMm.width} × ${massProps.boundingBoxMm.height} × ${massProps.boundingBoxMm.depth} | mm |\n\n`;

  md += `## 2. Moments of Inertia Tensor (g · mm² at CoG)\n\n`;
  md += `\`\`\`\n`;
  md += `| Ixx = ${massProps.inertiaTensor.Ixx.toLocaleString()}   Ixy = ${massProps.inertiaTensor.Ixy.toLocaleString()}   Ixz = ${massProps.inertiaTensor.Izx.toLocaleString()} |\n`;
  md += `| Iyx = ${massProps.inertiaTensor.Ixy.toLocaleString()}   Iyy = ${massProps.inertiaTensor.Iyy.toLocaleString()}   Iyz = ${massProps.inertiaTensor.Iyz.toLocaleString()} |\n`;
  md += `| Izx = ${massProps.inertiaTensor.Izx.toLocaleString()}   Izy = ${massProps.inertiaTensor.Iyz.toLocaleString()}   Izz = ${massProps.inertiaTensor.Izz.toLocaleString()} |\n`;
  md += `\`\`\`\n\n`;

  md += `## 3. Bill of Materials Mass Breakdown\n\n`;
  md += `| Part Name | Material | Density (g/cm³) | Volume (cm³) | Mass (g) | % Total | CoG [X, Y, Z] (mm) | Cost (USD) |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  massProps.parts.forEach(p => {
    md += `| **${p.name}** | ${p.materialName} | ${p.densityGcm3.toFixed(2)} | ${p.volumeCm3.toFixed(2)} | **${p.massGrams.toFixed(2)}** | ${p.percentageOfTotal.toFixed(1)}% | \`[${p.centerOfGravity.join(', ')}]\` | $${p.costUsd.toFixed(2)} |\n`;
  });

  md += `\n*Report generated by 3D CAD Design Studio Mass Properties Engine.*\n`;
  return md;
}

/**
 * Generates a Bill of Materials Mass CSV
 */
export function generateMassReportCSV(massProps: CADMassProperties): string {
  let csv = 'Part ID,Part Name,Material,Density (g/cm3),Volume (cm3),Mass (g),Percentage (%),CoG X (mm),CoG Y (mm),CoG Z (mm),Cost (USD)\n';
  massProps.parts.forEach(p => {
    csv += `"${p.id}","${p.name.replace(/"/g, '""')}","${p.materialName}",${p.densityGcm3.toFixed(3)},${p.volumeCm3.toFixed(3)},${p.massGrams.toFixed(3)},${p.percentageOfTotal.toFixed(2)},${p.centerOfGravity[0]},${p.centerOfGravity[1]},${p.centerOfGravity[2]},${p.costUsd.toFixed(2)}\n`;
  });
  return csv;
}
