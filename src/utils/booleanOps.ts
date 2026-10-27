import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } from 'three-bvh-csg';
import { CADObject, BooleanOperationType } from '../types/cad';
import { createCADGeometry } from './cadEngine';

const OP_MAP: Record<BooleanOperationType, number> = {
  union: ADDITION,
  subtract: SUBTRACTION,
  intersect: INTERSECTION,
};

function buildBrush(obj: CADObject): Brush {
  const geom = createCADGeometry(obj);
  const brush = new Brush(geom);
  brush.position.set(obj.position[0], obj.position[1], obj.position[2]);
  brush.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
  brush.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
  brush.updateMatrixWorld(true);
  return brush;
}

export interface BooleanOpOutcome {
  success: boolean;
  message: string;
  object?: CADObject;
}

/**
 * Performs an AutoCAD-style boolean solid operation (UNION/SUBTRACT/INTERSECT, mirroring
 * AutoCAD's SOLIDEDIT/boolean commands) between two CAD parts using three-bvh-csg, baking
 * the result into a brand-new 'custom_mesh' CADObject. Both inputs are consumed — the
 * caller is responsible for removing the two source objects from the scene after this
 * resolves successfully (kept symmetrical with how AutoCAD's own boolean ops replace the
 * source solids with the result).
 */
export function performBooleanOperation(
  objA: CADObject,
  objB: CADObject,
  operation: BooleanOperationType
): BooleanOpOutcome {
  try {
    const brushA = buildBrush(objA);
    const brushB = buildBrush(objB);
    const evaluator = new Evaluator();
    const resultBrush = evaluator.evaluate(brushA, brushB, OP_MAP[operation]);

    const resultGeom = resultBrush.geometry as THREE.BufferGeometry;
    const posAttr = resultGeom.getAttribute('position');

    if (!posAttr || posAttr.count === 0) {
      return {
        success: false,
        message:
          'The boolean operation produced an empty result — the two parts may not actually overlap (try Subtract/Intersect only on parts that physically intersect).',
      };
    }

    // Re-center the result geometry on its own bounding-box center so the new CADObject's
    // `position` field becomes a meaningful part origin, consistent with every other
    // primitive in this app (geometry centered locally, placed in world via `position`).
    resultGeom.computeBoundingBox();
    const bbox = resultGeom.boundingBox!;
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const positions = Array.from(posAttr.array as Float32Array);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }

    let normals: number[] | undefined;
    const normalAttr = resultGeom.getAttribute('normal');
    if (normalAttr) {
      normals = Array.from(normalAttr.array as Float32Array);
    }

    let indices: number[] | undefined;
    if (resultGeom.index) {
      indices = Array.from(resultGeom.index.array as Uint32Array | Uint16Array);
    }

    const opLabel = operation === 'union' ? 'Union' : operation === 'subtract' ? 'Subtract' : 'Intersect';

    const newObject: CADObject = {
      id: `bool_${operation}_${Date.now()}`,
      name: `${opLabel}: ${objA.name} + ${objB.name}`,
      category: objA.category,
      section: objA.section,
      primitive: 'custom_mesh',
      position: [center.x, center.y, center.z],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: {
        width: bbox.max.x - bbox.min.x || 1,
        height: bbox.max.y - bbox.min.y || 1,
        depth: bbox.max.z - bbox.min.z || 1,
      },
      customGeometryData: { positions, normals, indices },
      material: objA.material,
      visible: true,
      locked: false,
      booleanSourceNote: `${opLabel} of "${objA.name}" and "${objB.name}"`,
    };

    return {
      success: true,
      message: `${opLabel} completed: produced a new solid from "${objA.name}" and "${objB.name}".`,
      object: newObject,
    };
  } catch (err) {
    return {
      success: false,
      message: `Boolean operation failed: ${err instanceof Error ? err.message : 'unknown error'}. This can happen with non-manifold (not fully watertight) geometry — try simpler parametric shapes (box/cylinder/sphere) as inputs.`,
    };
  }
}
