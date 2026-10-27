import * as THREE from 'three';
import { CADObject } from '../types/cad';
import { createCADGeometry } from './cadEngine';

// --- AutoCAD DXF (R12 ASCII) Interchange -----------------------------------------------
// DWG is Autodesk's proprietary binary format and has no documented spec or free parser —
// genuinely supporting it would require a paid SDK (the ODA/Teigha libraries Autodesk
// itself licenses out), so it isn't implemented here. DXF, by contrast, is Autodesk's own
// open, published, plain-text interchange format, and AutoCAD opens/saves DXF natively, so
// this gives real interchange with AutoCAD without pretending to support the binary format.
//
// Export: every visible part's top-down (XY) world-space footprint is written out as a
// DXF entity (a CIRCLE for round parts, an LWPOLYLINE rectangle for everything else), one
// AutoCAD layer per part category. This captures a 2D floor-plan/footprint view of the
// design — a true 3D DXF (ACIS solids) is a materially bigger, AutoCAD-version-specific
// undertaking and out of scope here.
//
// Import: reads LINE, CIRCLE, and LWPOLYLINE entities back out of a DXF file and turns
// each closed polyline/circle into a real 3D CADObject (a thin 'custom_extrude' solid),
// so a floor plan or profile drawn in AutoCAD and exported as DXF can be brought in here.

const ROUND_PRIMITIVES = new Set([
  'cylinder', 'column', 'battery_cell', 'screw_head', 'sphere', 'torus', 'cone', 'camera_lens', 'custom_revolve',
]);

function worldFootprint(obj: CADObject): { cx: number; cy: number; radius: number | null; halfW: number; halfD: number } {
  const geom = createCADGeometry(obj);
  geom.computeBoundingBox();
  const bbox = geom.boundingBox!;
  const euler = new THREE.Euler(...obj.rotation);
  const pos = new THREE.Vector3(...obj.position);
  const scale = new THREE.Vector3(...obj.scale);
  const matrix = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(euler), scale);
  const worldBox = bbox.clone().applyMatrix4(matrix);

  const isRound = ROUND_PRIMITIVES.has(obj.primitive);
  const radius = isRound ? Math.max(worldBox.max.x - worldBox.min.x, worldBox.max.z - worldBox.min.z) / 2 : null;

  return {
    cx: (worldBox.min.x + worldBox.max.x) / 2,
    cy: (worldBox.min.z + worldBox.max.z) / 2, // DXF's "Y" maps to this app's world Z (top-down plan view)
    radius,
    halfW: (worldBox.max.x - worldBox.min.x) / 2,
    halfD: (worldBox.max.z - worldBox.min.z) / 2,
  };
}

function dxfLayerName(category: string): string {
  return category.toUpperCase().replace(/[^A-Z0-9_]/g, '_') || 'DEFAULT';
}

/**
 * Exports the current design's top-down XY footprint as an AutoCAD-compatible DXF R12
 * ASCII file: one layer per part category, a CIRCLE entity for round parts, an
 * LWPOLYLINE rectangle for everything else.
 */
export function exportDesignToDXF(objects: CADObject[], drawingName: string): string {
  const visible = objects.filter(o => o.visible);
  const layers = Array.from(new Set(visible.map(o => dxfLayerName(o.category))));

  const lines: string[] = [];
  const push = (code: number | string, value: string | number) => {
    lines.push(String(code), String(value));
  };

  // --- HEADER ---
  push(0, 'SECTION');
  push(2, 'HEADER');
  push(9, '$ACADVER');
  push(1, 'AC1009'); // AutoCAD R12
  push(0, 'ENDSEC');

  // --- TABLES (layers) ---
  push(0, 'SECTION');
  push(2, 'TABLES');
  push(0, 'TABLE');
  push(2, 'LAYER');
  push(70, layers.length);
  layers.forEach((layer, i) => {
    push(0, 'LAYER');
    push(2, layer);
    push(70, 0);
    push(62, (i % 7) + 1); // ACI color index 1-7
    push(6, 'CONTINUOUS');
  });
  push(0, 'ENDTAB');
  push(0, 'ENDSEC');

  // --- ENTITIES ---
  push(0, 'SECTION');
  push(2, 'ENTITIES');

  for (const obj of visible) {
    const fp = worldFootprint(obj);
    const layer = dxfLayerName(obj.category);

    if (fp.radius !== null) {
      push(0, 'CIRCLE');
      push(8, layer);
      push(10, fp.cx.toFixed(4));
      push(20, fp.cy.toFixed(4));
      push(30, '0.0');
      push(40, fp.radius.toFixed(4));
    } else {
      const x0 = fp.cx - fp.halfW;
      const x1 = fp.cx + fp.halfW;
      const y0 = fp.cy - fp.halfD;
      const y1 = fp.cy + fp.halfD;

      push(0, 'LWPOLYLINE');
      push(8, layer);
      push(90, 4); // vertex count
      push(70, 1); // closed
      push(10, x0.toFixed(4));
      push(20, y0.toFixed(4));
      push(10, x1.toFixed(4));
      push(20, y0.toFixed(4));
      push(10, x1.toFixed(4));
      push(20, y1.toFixed(4));
      push(10, x0.toFixed(4));
      push(20, y1.toFixed(4));
    }

    // TEXT entity labeling the part name, so the DXF stays identifiable once opened in
    // AutoCAD rather than being a field of unlabeled shapes.
    push(0, 'TEXT');
    push(8, layer);
    push(10, (fp.cx - (fp.radius ?? fp.halfW)).toFixed(4));
    push(20, (fp.cy - (fp.radius ?? fp.halfD) - 2).toFixed(4));
    push(30, '0.0');
    push(40, '1.5');
    push(1, obj.name.replace(/[\r\n]/g, ' '));
  }

  push(0, 'ENDSEC');
  push(0, 'EOF');

  return lines.join('\n') + '\n';
}

// --- DXF Import --------------------------------------------------------------------

interface DxfEntity {
  type: string;
  layer: string;
  points: [number, number][];
  closed: boolean;
  radius?: number;
  center?: [number, number];
}

function parseDxfGroups(text: string): { code: number; value: string }[] {
  const rawLines = text.split(/\r\n|\r|\n/);
  const groups: { code: number; value: string }[] = [];
  for (let i = 0; i + 1 < rawLines.length; i += 2) {
    const code = parseInt(rawLines[i].trim(), 10);
    const value = rawLines[i + 1];
    if (!Number.isNaN(code)) {
      groups.push({ code, value: value !== undefined ? value.trim() : '' });
    }
  }
  return groups;
}

/**
 * Parses LINE, CIRCLE, and LWPOLYLINE entities out of a DXF (R12+ ASCII) file's ENTITIES
 * section. Unrecognized entity types and other sections are ignored rather than rejected,
 * since real-world DXF files commonly contain far more than this app needs to read back.
 */
export function parseDxfEntities(dxfText: string): DxfEntity[] {
  const groups = parseDxfGroups(dxfText);
  const entities: DxfEntity[] = [];

  let inEntities = false;
  let current: DxfEntity | null = null;
  let pendingVertex: Partial<{ x: number; y: number }> = {};

  const flushVertex = () => {
    if (current && pendingVertex.x !== undefined && pendingVertex.y !== undefined) {
      current.points.push([pendingVertex.x, pendingVertex.y]);
    }
    pendingVertex = {};
  };

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];

    if (g.code === 0) {
      if (g.value === 'SECTION') continue;
      if (g.value === 'ENDSEC') {
        inEntities = false;
        continue;
      }

      // Peek ahead for the section name immediately following a SECTION marker handled
      // by the simpler check below (groups[i-1] code 2 after a 'SECTION' 0-group).
      if (current) {
        flushVertex();
        entities.push(current);
        current = null;
      }

      if (g.value === 'LINE' || g.value === 'CIRCLE' || g.value === 'LWPOLYLINE' || g.value === 'POLYLINE') {
        current = { type: g.value, layer: '0', points: [], closed: false };
      } else if (g.value === 'VERTEX' && current && current.type === 'POLYLINE') {
        // handled via pendingVertex below
      } else {
        current = null;
      }
      continue;
    }

    if (g.code === 2 && g.value === 'ENTITIES') {
      inEntities = true;
      continue;
    }

    if (!current) continue;

    if (g.code === 8) current.layer = g.value;
    if (g.code === 70 && current.type === 'LWPOLYLINE') current.closed = (parseInt(g.value, 10) & 1) === 1;
    if (g.code === 40 && current.type === 'CIRCLE') current.radius = parseFloat(g.value);

    if (current.type === 'CIRCLE') {
      if (g.code === 10) current.center = [parseFloat(g.value), current.center?.[1] ?? 0];
      if (g.code === 20) current.center = [current.center?.[0] ?? 0, parseFloat(g.value)];
    } else if (current.type === 'LINE') {
      if (g.code === 10) current.points[0] = [parseFloat(g.value), current.points[0]?.[1] ?? 0];
      if (g.code === 20) current.points[0] = [current.points[0]?.[0] ?? 0, parseFloat(g.value)];
      if (g.code === 11) current.points[1] = [parseFloat(g.value), current.points[1]?.[1] ?? 0];
      if (g.code === 21) current.points[1] = [current.points[1]?.[0] ?? 0, parseFloat(g.value)];
    } else if (current.type === 'LWPOLYLINE') {
      if (g.code === 10) {
        flushVertex();
        pendingVertex.x = parseFloat(g.value);
      }
      if (g.code === 20) pendingVertex.y = parseFloat(g.value);
    }
  }

  if (current) {
    flushVertex();
    entities.push(current);
  }

  return entities;
}

/**
 * Converts parsed DXF entities into CADObjects: closed LWPOLYLINEs and lone CIRCLEs become
 * thin 'custom_extrude'/'custom_revolve' solids (a real, editable 3D part with the DXF
 * footprint's exact shape); open LINE/open-polyline entities are skipped since a 2D line
 * alone isn't a solid — pair them into a closed LWPOLYLINE in the source DXF to import them.
 */
export function dxfEntitiesToObjects(
  entities: DxfEntity[],
  section: 'technology' | 'building',
  defaultDepth: number,
  baseMaterial: CADObject['material']
): CADObject[] {
  const objects: CADObject[] = [];
  let counter = 0;

  for (const e of entities) {
    counter++;

    if (e.type === 'CIRCLE' && e.center && e.radius) {
      objects.push({
        id: `dxf_import_${Date.now()}_${counter}`,
        name: `DXF Import: Circle (${e.layer})`,
        category: 'custom',
        section,
        primitive: 'cylinder',
        position: [e.center[0], defaultDepth / 2, e.center[1]],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { width: e.radius * 2, height: defaultDepth, depth: e.radius * 2, radius: e.radius, segments: 32 },
        material: baseMaterial,
        visible: true,
        locked: false,
      });
      continue;
    }

    if ((e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') && e.closed && e.points.length >= 3) {
      const xs = e.points.map(p => p[0]);
      const ys = e.points.map(p => p[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const centered: [number, number][] = e.points.map(([x, y]) => [x - cx, y - cy]);

      objects.push({
        id: `dxf_import_${Date.now()}_${counter}`,
        name: `DXF Import: ${e.layer}`,
        category: 'custom',
        section,
        primitive: 'custom_extrude',
        position: [cx, defaultDepth / 2, cy],
        rotation: [Math.PI / 2, 0, 0], // the sketch was drawn in DXF's XY; stand it up into world XZ (floor plan)
        scale: [1, 1, 1],
        dimensions: {
          width: Math.max(...xs) - Math.min(...xs) || 1,
          height: Math.max(...ys) - Math.min(...ys) || 1,
          depth: defaultDepth,
        },
        sketchProfile: { points: centered, closed: true },
        material: baseMaterial,
        visible: true,
        locked: false,
      });
    }
  }

  return objects;
}
