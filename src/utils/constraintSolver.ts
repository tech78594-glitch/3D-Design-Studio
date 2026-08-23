/**
 * CAD Assembly Constraint Engine & Interference Solver
 * Provides mathematical mating solvers for coincident, concentric, offset,
 * parallel, perpendicular, tangent, and angular kinematic mates.
 */

import { CADObject, CADConstraint, InterferenceResult } from '../types/cad';

export interface SolvedConstraintResult {
  updatedObjects: CADObject[];
  updatedConstraints: CADConstraint[];
  interferences: InterferenceResult[];
  clashesCount: number;
}

/**
 * Solve and align CAD objects according to active kinematic & assembly constraints
 */
export function solveAssemblyConstraints(
  objects: CADObject[],
  constraints: CADConstraint[]
): SolvedConstraintResult {
  const objMap = new Map<string, CADObject>(objects.map(o => [o.id, { ...o }]));
  const updatedConstraints: CADConstraint[] = [];

  for (const c of constraints) {
    if (!c.active) {
      updatedConstraints.push(c);
      continue;
    }

    const partA = objMap.get(c.partAId);
    const partB = objMap.get(c.partBId);

    if (!partA || !partB) {
      updatedConstraints.push({ ...c, status: 'warning', errorDistanceMm: 999 });
      continue;
    }

    let status: CADConstraint['status'] = 'satisfied';
    let errorDist = 0;

    // Part A is reference / parent, Part B is aligned to Part A (unless B is locked)
    if (!partB.locked) {
      const axisIdx = c.axis === 'x' ? 0 : c.axis === 'y' ? 1 : 2;

      switch (c.type) {
        case 'coincident': {
          // Align planar surfaces along the axis with offset
          // Surface edge position of Part A
          const halfDimA = getDimensionAlongAxis(partA, c.axis) / 2;
          const halfDimB = getDimensionAlongAxis(partB, c.axis) / 2;
          
          let targetPos = partA.position[axisIdx];
          if (c.alignment === 'aligned') {
            targetPos = partA.position[axisIdx] + halfDimA + halfDimB + c.offset;
          } else {
            targetPos = partA.position[axisIdx] - (halfDimA + halfDimB) - c.offset;
          }

          const currentPos = partB.position[axisIdx];
          errorDist = Math.abs(currentPos - targetPos);

          const newPos: [number, number, number] = [...partB.position];
          newPos[axisIdx] = targetPos;
          partB.position = newPos;
          break;
        }

        case 'concentric': {
          // Align centers along the other two orthogonal axes (making them share a central centerline axis)
          const orthoAxes = [0, 1, 2].filter(i => i !== axisIdx);
          const newPos: [number, number, number] = [...partB.position];
          
          let maxErr = 0;
          for (const oAxis of orthoAxes) {
            const diff = Math.abs(newPos[oAxis] - partA.position[oAxis]);
            if (diff > maxErr) maxErr = diff;
            newPos[oAxis] = partA.position[oAxis];
          }
          errorDist = maxErr;
          partB.position = newPos;
          break;
        }

        case 'distance': {
          // Fixed center-to-center or surface distance offset
          const targetPos = partA.position[axisIdx] + c.offset;
          errorDist = Math.abs(partB.position[axisIdx] - targetPos);
          const newPos: [number, number, number] = [...partB.position];
          newPos[axisIdx] = targetPos;
          partB.position = newPos;
          break;
        }

        case 'parallel': {
          // Lock Euler rotation to match Part A
          partB.rotation = [...partA.rotation];
          errorDist = 0;
          break;
        }

        case 'perpendicular': {
          // 90 degree orthogonal rotation
          const newRot: [number, number, number] = [...partA.rotation];
          newRot[axisIdx] = (newRot[axisIdx] + Math.PI / 2) % (Math.PI * 2);
          partB.rotation = newRot;
          errorDist = 0;
          break;
        }

        case 'tangent': {
          // Tangent contact between cylinder/sphere and box face
          const radiusB = partB.dimensions.radius || (getDimensionAlongAxis(partB, c.axis) / 2);
          const halfDimA = getDimensionAlongAxis(partA, c.axis) / 2;
          const targetPos = partA.position[axisIdx] + halfDimA + radiusB + c.offset;
          
          errorDist = Math.abs(partB.position[axisIdx] - targetPos);
          const newPos: [number, number, number] = [...partB.position];
          newPos[axisIdx] = targetPos;
          partB.position = newPos;
          break;
        }

        case 'angle': {
          // Angular kinematic mate (in degrees converted to radians)
          const rad = (c.offset * Math.PI) / 180;
          const newRot: [number, number, number] = [...partA.rotation];
          newRot[axisIdx] = partA.rotation[axisIdx] + rad;
          partB.rotation = newRot;
          errorDist = 0;
          break;
        }
      }
    }

    if (errorDist > 20) {
      status = 'warning';
    }

    updatedConstraints.push({
      ...c,
      status,
      errorDistanceMm: Math.round(errorDist * 10) / 10,
    });
  }

  // Calculate interference & clearances between objects
  const updatedObjectsList = Array.from(objMap.values());
  const interferences = calculateInterferences(updatedObjectsList);
  const clashesCount = interferences.filter(i => i.type === 'clash').length;

  return {
    updatedObjects: updatedObjectsList,
    updatedConstraints,
    interferences,
    clashesCount,
  };
}

/**
 * Get dimensional length along X, Y, or Z axis
 */
function getDimensionAlongAxis(obj: CADObject, axis: 'x' | 'y' | 'z'): number {
  if (axis === 'x') {
    return obj.dimensions.width || (obj.dimensions.radius ? obj.dimensions.radius * 2 : 10);
  }
  if (axis === 'y') {
    return obj.dimensions.height || (obj.dimensions.radius ? obj.dimensions.radius * 2 : 10);
  }
  return obj.dimensions.depth || (obj.dimensions.radius ? obj.dimensions.radius * 2 : 10);
}

/**
 * Check 3D AABB Bounding Box / Cylinder clearances and volumetric clashes
 */
export function calculateInterferences(objects: CADObject[]): InterferenceResult[] {
  const results: InterferenceResult[] = [];

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i];
      const b = objects[j];

      if (!a.visible || !b.visible) continue;

      // Calculate bounding box in world space
      const halfWa = (a.dimensions.width || 10) / 2;
      const halfHa = (a.dimensions.height || 10) / 2;
      const halfDa = (a.dimensions.depth || 10) / 2;

      const halfWb = (b.dimensions.width || 10) / 2;
      const halfHb = (b.dimensions.height || 10) / 2;
      const halfDb = (b.dimensions.depth || 10) / 2;

      const minAx = a.position[0] - halfWa;
      const maxAx = a.position[0] + halfWa;
      const minAy = a.position[1] - halfHa;
      const maxAy = a.position[1] + halfHa;
      const minAz = a.position[2] - halfDa;
      const maxAz = a.position[2] + halfDa;

      const minBx = b.position[0] - halfWb;
      const maxBx = b.position[0] + halfWb;
      const minBy = b.position[1] - halfHb;
      const maxBy = b.position[1] + halfHb;
      const minBz = b.position[2] - halfDb;
      const maxBz = b.position[2] + halfDb;

      // Overlap distances along axes
      const overlapX = Math.min(maxAx, maxBx) - Math.max(minAx, minBx);
      const overlapY = Math.min(maxAy, maxBy) - Math.max(minAy, minBy);
      const overlapZ = Math.min(maxAz, maxBz) - Math.max(minAz, minBz);

      if (overlapX > 0.05 && overlapY > 0.05 && overlapZ > 0.05) {
        // Volumetric clash / interference detected!
        const overlapVolumeMm3 = Math.round(overlapX * overlapY * overlapZ);
        results.push({
          partAId: a.id,
          partBId: b.id,
          partAName: a.name,
          partBName: b.name,
          type: 'clash',
          overlapVolumeMm3,
          minDistanceMm: 0,
        });
      } else {
        // Compute minimal gap clearance
        const dx = Math.max(0, Math.max(minAx - maxBx, minBx - maxAx));
        const dy = Math.max(0, Math.max(minAy - maxBy, minBy - maxAy));
        const dz = Math.max(0, Math.max(minAz - maxBz, minBz - maxAz));
        const minDistanceMm = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 10) / 10;

        if (minDistanceMm < 2.0 && minDistanceMm > 0) {
          results.push({
            partAId: a.id,
            partBId: b.id,
            partAName: a.name,
            partBName: b.name,
            type: minDistanceMm < 0.2 ? 'touching' : 'clearance',
            overlapVolumeMm3: 0,
            minDistanceMm,
          });
        }
      }
    }
  }

  return results;
}
