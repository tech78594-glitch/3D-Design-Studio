import { CADObject, AdvancedClashItem, ClashDetectionSettings, ClashSeverity } from '../types/cad';
import { getObjectBoundingBox, BoundingBox3D } from './autoAlign';

export const DEFAULT_CLASH_SETTINGS: ClashDetectionSettings = {
  clearanceToleranceMm: 0.5, // Flag if parts are closer than 0.5mm
  includeFasteners: true,
  highlightClashingMeshes: true,
  showBoundingHulls: true,
  filterSeverity: 'all',
};

/**
 * Checks overlap and calculates interference metrics between two CAD objects
 */
export function checkPairInterference(
  objA: CADObject,
  objB: CADObject,
  settings: Partial<ClashDetectionSettings> = DEFAULT_CLASH_SETTINGS
): AdvancedClashItem | null {
  const mergedSettings: ClashDetectionSettings = { ...DEFAULT_CLASH_SETTINGS, ...settings };
  if (!objA.visible || !objB.visible) return null;
  if (!mergedSettings.includeFasteners && (objA.category === 'fastener' || objB.category === 'fastener')) {
    return null;
  }

  const boxA = getObjectBoundingBox(objA);
  const boxB = getObjectBoundingBox(objB);

  // Compute intersection boundaries
  const interMinX = Math.max(boxA.min[0], boxB.min[0]);
  const interMaxX = Math.min(boxA.max[0], boxB.max[0]);

  const interMinY = Math.max(boxA.min[1], boxB.min[1]);
  const interMaxY = Math.min(boxA.max[1], boxB.max[1]);

  const interMinZ = Math.max(boxA.min[2], boxB.min[2]);
  const interMaxZ = Math.min(boxA.max[2], boxB.max[2]);

  const overlapX = interMaxX - interMinX;
  const overlapY = interMaxY - interMinY;
  const overlapZ = interMaxZ - interMinZ;

  // Calculate distance between boxes if no overlap
  const dx = Math.max(0, boxA.min[0] - boxB.max[0], boxB.min[0] - boxA.max[0]);
  const dy = Math.max(0, boxA.min[1] - boxB.max[1], boxB.min[1] - boxA.max[1]);
  const dz = Math.max(0, boxA.min[2] - boxB.max[2], boxB.min[2] - boxA.max[2]);
  const minClearance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Direct intersection check
  const isDirectClash = overlapX > 0 && overlapY > 0 && overlapZ > 0;

  if (isDirectClash) {
    const volumeMm3 = overlapX * overlapY * overlapZ;
    const penetrationDepth = Math.min(overlapX, overlapY, overlapZ);
    const centerPoint: [number, number, number] = [
      (interMinX + interMaxX) / 2,
      (interMinY + interMaxY) / 2,
      (interMinZ + interMaxZ) / 2,
    ];

    let severity: ClashSeverity = 'critical_clash';
    if (volumeMm3 < 5.0 && penetrationDepth < 0.2) {
      severity = 'clearance_touch';
    } else if (volumeMm3 < 50.0 || penetrationDepth < 1.0) {
      severity = 'soft_interference';
    }

    return {
      id: `clash_${objA.id}_${objB.id}`,
      partAId: objA.id,
      partBId: objB.id,
      partAName: objA.name,
      partBName: objB.name,
      categoryA: objA.category,
      categoryB: objB.category,
      severity,
      overlapVolumeMm3: Number(volumeMm3.toFixed(2)),
      penetrationDepthMm: Number(penetrationDepth.toFixed(2)),
      minClearanceDistanceMm: 0,
      clashCenterPoint: centerPoint,
      boundingBoxIntersection: {
        min: [interMinX, interMinY, interMinZ],
        max: [interMaxX, interMaxY, interMaxZ],
      },
    };
  }

  // Check clearance violation tolerance
  if (minClearance > 0 && minClearance < settings.clearanceToleranceMm) {
    const centerPoint: [number, number, number] = [
      (boxA.center[0] + boxB.center[0]) / 2,
      (boxA.center[1] + boxB.center[1]) / 2,
      (boxA.center[2] + boxB.center[2]) / 2,
    ];

    return {
      id: `clearance_${objA.id}_${objB.id}`,
      partAId: objA.id,
      partBId: objB.id,
      partAName: objA.name,
      partBName: objB.name,
      categoryA: objA.category,
      categoryB: objB.category,
      severity: 'clearance_touch',
      overlapVolumeMm3: 0,
      penetrationDepthMm: 0,
      minClearanceDistanceMm: Number(minClearance.toFixed(2)),
      clashCenterPoint: centerPoint,
      boundingBoxIntersection: {
        min: boxA.min,
        max: boxB.max,
      },
    };
  }

  return null;
}

/**
 * Runs a full assembly scan across all CAD objects and returns detailed clash reports
 */
export function runAssemblyClashScan(
  objects: CADObject[],
  settings: Partial<ClashDetectionSettings> = DEFAULT_CLASH_SETTINGS
): AdvancedClashItem[] {
  const mergedSettings: ClashDetectionSettings = { ...DEFAULT_CLASH_SETTINGS, ...settings };
  const results: AdvancedClashItem[] = [];

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const clash = checkPairInterference(objects[i], objects[j], mergedSettings);
      if (clash) {
        if (mergedSettings.filterSeverity === 'critical' && clash.severity !== 'critical_clash') continue;
        if (mergedSettings.filterSeverity === 'interference' && clash.severity === 'clearance_touch') continue;
        results.push(clash);
      }
    }
  }

  // Sort critical first, then largest volume
  return results.sort((a, b) => {
    if (a.severity === 'critical_clash' && b.severity !== 'critical_clash') return -1;
    if (b.severity === 'critical_clash' && a.severity !== 'critical_clash') return 1;
    return b.overlapVolumeMm3 - a.overlapVolumeMm3;
  });
}

export const detectAssemblyClashes = runAssemblyClashScan;

/**
 * Resolves a clash by auto-separating Part B from Part A along the minimal overlap axis
 */
export function autoResolveClash(
  objects: CADObject[],
  clash: AdvancedClashItem,
  clearanceBufferMm = 0.5
): CADObject[] {
  const targetObj = objects.find(o => o.id === clash.partBId);
  const fixedObj = objects.find(o => o.id === clash.partAId);
  if (!targetObj || !fixedObj) return objects;

  const boxA = getObjectBoundingBox(fixedObj);
  const boxB = getObjectBoundingBox(targetObj);

  const overlapX = Math.min(boxA.max[0], boxB.max[0]) - Math.max(boxA.min[0], boxB.min[0]);
  const overlapY = Math.min(boxA.max[1], boxB.max[1]) - Math.max(boxA.min[1], boxB.min[1]);
  const overlapZ = Math.min(boxA.max[2], boxB.max[2]) - Math.max(boxA.min[2], boxB.min[2]);

  let nudgeVector: [number, number, number] = [0, 0, 0];

  // Nudge along the smallest overlap axis
  if (overlapZ <= overlapX && overlapZ <= overlapY) {
    const sign = boxB.center[2] >= boxA.center[2] ? 1 : -1;
    nudgeVector[2] = (overlapZ + clearanceBufferMm) * sign;
  } else if (overlapX <= overlapY) {
    const sign = boxB.center[0] >= boxA.center[0] ? 1 : -1;
    nudgeVector[0] = (overlapX + clearanceBufferMm) * sign;
  } else {
    const sign = boxB.center[1] >= boxA.center[1] ? 1 : -1;
    nudgeVector[1] = (overlapY + clearanceBufferMm) * sign;
  }

  return objects.map(o => {
    if (o.id === targetObj.id) {
      return {
        ...o,
        position: [
          o.position[0] + nudgeVector[0],
          o.position[1] + nudgeVector[1],
          o.position[2] + nudgeVector[2],
        ],
      };
    }
    return o;
  });
}
