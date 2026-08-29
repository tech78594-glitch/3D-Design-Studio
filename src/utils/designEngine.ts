import { CADObject, DesignSection, MaterialType } from '../types/cad';

export interface DesignEngineRequest {
  prompt: string;
  category: 'electronics' | 'bracket' | 'drone_arm' | 'heatsink' | 'enclosure' | 'architectural_frame';
  targetWidthMm?: number;
  targetHeightMm?: number;
  targetDepthMm?: number;
  section?: DesignSection;
}

export interface GeneratedDesignResult {
  title: string;
  description: string;
  objects: CADObject[];
  generatedBy: 'parametric_template';
}

// Generate parametric fallback CAD assembly templates
export function generateParametricTemplate(req: DesignEngineRequest): CADObject[] {
  const w = req.targetWidthMm || 80;
  const h = req.targetHeightMm || 150;
  const d = req.targetDepthMm || 12;
  const baseId = `gen_${Date.now()}`;
  const section = req.section || 'technology';

  if (req.category === 'heatsink') {
    const basePlate: CADObject = {
      id: `${baseId}_base`,
      name: 'Extruded Aluminum Baseplate',
      category: 'casing',
      section,
      primitive: 'box',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { width: w, height: 4, depth: d },
      material: { id: 'mat_aluminum', name: 'Anodized Aluminum', type: 'anodized_aluminum', color: '#94a3b8', roughness: 0.3, metalness: 0.8 },
      visible: true,
      locked: false,
      massKg: (w * 4 * d * 2.7) / 1e6,
      unitCostUsd: 8.5,
    };

    const fins: CADObject[] = [];
    const finCount = 7;
    const spacing = w / (finCount + 1);
    for (let i = 0; i < finCount; i++) {
      const xPos = -w / 2 + spacing * (i + 1);
      fins.push({
        id: `${baseId}_fin_${i}`,
        name: `Cooling Fin Blade #${i + 1}`,
        category: 'casing',
        section,
        primitive: 'box',
        position: [xPos, h / 2 + 2, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { width: 1.5, height: h, depth: d },
        material: { id: 'mat_copper', name: 'Copper Heat Spreader', type: 'copper', color: '#f97316', roughness: 0.25, metalness: 0.9 },
        visible: true,
        locked: false,
        massKg: (1.5 * h * d * 8.9) / 1e6,
        unitCostUsd: 3.2,
      });
    }

    return [basePlate, ...fins];
  }

  if (req.category === 'drone_arm') {
    const armTube: CADObject = {
      id: `${baseId}_arm`,
      name: 'Carbon Fiber Structural Arm Tube',
      category: 'casing',
      section,
      primitive: 'cylinder',
      position: [0, h / 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { width: 16, height: h, depth: 16, radius: 8 },
      material: { id: 'mat_carbon', name: '3K Carbon Weave', type: 'carbon_fiber', color: '#1e293b', roughness: 0.4, metalness: 0.2 },
      visible: true,
      locked: false,
      massKg: 0.045,
      unitCostUsd: 14.0,
    };

    const motorMount: CADObject = {
      id: `${baseId}_mount`,
      name: 'CNC Aluminum Brushless Motor Mount Plate',
      category: 'casing',
      section,
      primitive: 'box',
      position: [0, h, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { width: 35, height: 6, depth: 35 },
      material: { id: 'mat_anodized', name: 'Anodized Red Aluminum', type: 'anodized_aluminum', color: '#ef4444', roughness: 0.3, metalness: 0.8 },
      visible: true,
      locked: false,
      massKg: 0.022,
      unitCostUsd: 9.5,
    };

    return [armTube, motorMount];
  }

  // Default Enclosure Case
  const outerShell: CADObject = {
    id: `${baseId}_shell`,
    name: 'Parametric Device Enclosure Case',
    category: 'casing',
    section,
    primitive: 'rounded_box',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width: w, height: h, depth: d, bevelRadius: 4 },
    material: { id: 'mat_polycarbonate', name: 'Matte Polymer Chassis', type: 'matte_plastic', color: '#38bdf8', roughness: 0.4, metalness: 0.1 },
    visible: true,
    locked: false,
    massKg: (w * h * d * 1.2) / 1e6,
    unitCostUsd: 18.0,
  };

  const pcbBoard: CADObject = {
    id: `${baseId}_pcb`,
    name: 'Internal Logic PCB Substrate',
    category: 'pcb',
    section,
    primitive: 'pcb_board',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { width: w - 8, height: h - 12, depth: 2 },
    material: { id: 'mat_fr4', name: 'FR4 Solder Mask PCB', type: 'pcb_green', color: '#10b981', roughness: 0.3, metalness: 0.5 },
    visible: true,
    locked: false,
    massKg: 0.035,
    unitCostUsd: 24.5,
  };

  return [outerShell, pcbBoard];
}

// Generates a 3D CAD design entirely from the algorithmic parametric
// templates above. No AI backend, network call, or API token is used.
export async function generateGenerativeDesign(
  req: DesignEngineRequest
): Promise<GeneratedDesignResult> {
  const objects = generateParametricTemplate(req);
  return {
    title: `Parametric ${req.category.toUpperCase()} Design`,
    description: `Algorithmic 3D layout for: "${req.prompt}"`,
    objects,
    generatedBy: 'parametric_template',
  };
}
