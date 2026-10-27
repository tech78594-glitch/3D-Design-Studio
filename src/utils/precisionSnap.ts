import { CADObject, CADPrecisionSettings, SnapCandidate } from '../types/cad';
import { extractObjectEdges } from './edgeSelection';

/**
 * AutoCAD-style SNAP: rounds a world-space point to the nearest intersection of the
 * active grid (SNAP command / the status-bar "Snap Mode" toggle).
 */
export function snapPointToGrid(
  point: [number, number, number],
  gridSizeMm: number
): [number, number, number] {
  if (gridSizeMm <= 0) return point;
  const roundTo = (v: number) => Math.round(v / gridSizeMm) * gridSizeMm;
  return [roundTo(point[0]), roundTo(point[1]), roundTo(point[2])];
}

/**
 * Collects AutoCAD-style OSNAP (object snap) candidate points from the current scene:
 * endpoints and midpoints of every real geometric edge (via extractObjectEdges, which
 * already does the world-matrix transform), plus each object's own center/origin.
 * Skips the object currently being moved so it can't snap to itself, and skips
 * invisible/locked objects (locked parts shouldn't be snap targets being bumped into).
 */
export function collectSnapCandidates(
  objects: CADObject[],
  settings: CADPrecisionSettings,
  excludeObjectId?: string
): SnapCandidate[] {
  if (!settings.objectSnapEnabled) return [];

  const candidates: SnapCandidate[] = [];

  for (const obj of objects) {
    if (obj.id === excludeObjectId) continue;
    if (!obj.visible) continue;

    if (settings.snapCenter) {
      candidates.push({
        point: obj.position,
        type: 'center',
        objectId: obj.id,
        objectName: obj.name,
      });
    }

    if (!settings.snapEndpoint && !settings.snapMidpoint) continue;

    // Edge extraction does real geometry work (EdgesGeometry + matrix transform), so cap
    // it to a reasonable scene size — for very large assemblies, center-snap alone (above)
    // still works, and users can zoom/select to narrow things down.
    if (objects.length > 120) continue;

    const edges = extractObjectEdges(obj, 24);
    for (const edge of edges) {
      if (settings.snapEndpoint) {
        candidates.push({ point: edge.vertexA, type: 'endpoint', objectId: obj.id, objectName: obj.name });
        candidates.push({ point: edge.vertexB, type: 'endpoint', objectId: obj.id, objectName: obj.name });
      }
      if (settings.snapMidpoint) {
        candidates.push({ point: edge.midpoint, type: 'midpoint', objectId: obj.id, objectName: obj.name });
      }
    }
  }

  return candidates;
}

function distance3(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Finds the nearest object-snap candidate within tolerance, or null if nothing is close
 * enough (so the caller falls back to grid snap / the raw point).
 */
export function findNearestSnapCandidate(
  worldPoint: [number, number, number],
  candidates: SnapCandidate[],
  toleranceMm: number
): SnapCandidate | null {
  let best: SnapCandidate | null = null;
  let bestDist = toleranceMm;

  for (const c of candidates) {
    const d = distance3(worldPoint, c.point);
    if (d <= bestDist) {
      bestDist = d;
      best = c;
    }
  }

  return best;
}

/**
 * AutoCAD-style ORTHO: constrains a drag from `origin` to `candidate` to whichever single
 * axis has the largest absolute delta, snapping the other two axes back to origin.
 */
export function applyOrthoConstraint(
  origin: [number, number, number],
  candidate: [number, number, number]
): [number, number, number] {
  const dx = Math.abs(candidate[0] - origin[0]);
  const dy = Math.abs(candidate[1] - origin[1]);
  const dz = Math.abs(candidate[2] - origin[2]);

  if (dx >= dy && dx >= dz) {
    return [candidate[0], origin[1], origin[2]];
  }
  if (dy >= dx && dy >= dz) {
    return [origin[0], candidate[1], origin[2]];
  }
  return [origin[0], origin[1], candidate[2]];
}

/**
 * Full AutoCAD-style resolution pipeline for a single drag/placement point: object snap
 * takes priority over grid snap (same precedence AutoCAD uses), ortho is applied last
 * against the provided drag origin (if any).
 */
export function resolvePrecisionPoint(
  rawPoint: [number, number, number],
  settings: CADPrecisionSettings,
  snapCandidates: SnapCandidate[],
  dragOrigin?: [number, number, number]
): { point: [number, number, number]; snappedTo: SnapCandidate | null } {
  let resolved = rawPoint;
  let snappedTo: SnapCandidate | null = null;

  if (settings.objectSnapEnabled) {
    const nearest = findNearestSnapCandidate(rawPoint, snapCandidates, settings.snapToleranceMm);
    if (nearest) {
      resolved = nearest.point;
      snappedTo = nearest;
    }
  }

  if (!snappedTo && settings.gridSnapEnabled) {
    resolved = snapPointToGrid(resolved, settings.gridSizeMm);
  }

  if (settings.orthoEnabled && dragOrigin) {
    resolved = applyOrthoConstraint(dragOrigin, resolved);
  }

  return { point: resolved, snappedTo };
}
