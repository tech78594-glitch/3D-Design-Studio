import * as THREE from 'three';
import { CADObject, CADEdge, SelectedEdgeInfo } from '../types/cad';
import { createCADGeometry } from './cadEngine';

/**
 * Extracts geometric feature edges from a CADObject's geometry
 */
export function extractObjectEdges(obj: CADObject, thresholdAngleDeg: number = 24): CADEdge[] {
  const geom = createCADGeometry(obj);
  const edgesGeom = new THREE.EdgesGeometry(geom, thresholdAngleDeg);
  const positionAttr = edgesGeom.getAttribute('position');

  if (!positionAttr || positionAttr.count === 0) {
    return [];
  }

  const euler = new THREE.Euler(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
  const objPos = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
  const objScale = new THREE.Vector3(obj.scale[0], obj.scale[1], obj.scale[2]);
  const matrix = new THREE.Matrix4().compose(objPos, new THREE.Quaternion().setFromEuler(euler), objScale);

  const edges: CADEdge[] = [];
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();

  for (let i = 0; i < positionAttr.count; i += 2) {
    vA.fromBufferAttribute(positionAttr, i).applyMatrix4(matrix);
    vB.fromBufferAttribute(positionAttr, i + 1).applyMatrix4(matrix);

    const length = vA.distanceTo(vB);
    if (length < 0.05) continue; // Skip degenerate zero-length micro edges

    const mid = new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.5);

    // Identify edge curvature / type
    let edgeType: 'linear' | 'circular_arc' | 'fillet' | 'seam' = 'linear';
    if (obj.primitive === 'cylinder' || obj.primitive === 'sphere' || obj.primitive === 'torus') {
      edgeType = 'circular_arc';
    }

    edges.push({
      id: `edge_${obj.id}_${i / 2}`,
      objectId: obj.id,
      objectName: obj.name,
      vertexA: [parseFloat(vA.x.toFixed(3)), parseFloat(vA.y.toFixed(3)), parseFloat(vA.z.toFixed(3))],
      vertexB: [parseFloat(vB.x.toFixed(3)), parseFloat(vB.y.toFixed(3)), parseFloat(vB.z.toFixed(3))],
      lengthMm: parseFloat(length.toFixed(2)),
      midpoint: [parseFloat(mid.x.toFixed(3)), parseFloat(mid.y.toFixed(3)), parseFloat(mid.z.toFixed(3))],
      edgeType,
      dihedralAngleDeg: thresholdAngleDeg >= 45 ? 90 : 45,
    });
  }

  return edges;
}

/**
 * Extracts edges across all visible CAD objects in the scene
 */
export function extractSceneEdges(objects: CADObject[], thresholdAngleDeg: number = 24): CADEdge[] {
  const visible = objects.filter(o => o.visible);
  const allEdges: CADEdge[] = [];

  visible.forEach(obj => {
    const partEdges = extractObjectEdges(obj, thresholdAngleDeg);
    allEdges.push(...partEdges);
  });

  return allEdges;
}

/**
 * Distance from 2D point P to 2D line segment AB in screen pixel space
 */
function distancePointToSegment2D(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 0.0001) {
    return Math.hypot(px - x1, py - y1);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.hypot(px - projX, py - projY);
}

/**
 * Raycast-style Smart Edge Picker: Finds nearest edge to mouse screen coordinates
 */
export function pickNearestEdge(
  mouseCanvasPos: { x: number; y: number },
  edges: CADEdge[],
  camera: THREE.Camera,
  canvasWidth: number,
  canvasHeight: number,
  pixelThreshold: number = 14
): CADEdge | null {
  let closestEdge: CADEdge | null = null;
  let minDistance = pixelThreshold;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();

  for (const edge of edges) {
    vA.set(edge.vertexA[0], edge.vertexA[1], edge.vertexA[2]).project(camera);
    vB.set(edge.vertexB[0], edge.vertexB[1], edge.vertexB[2]).project(camera);

    // Behind camera check
    if (vA.z > 1.0 || vB.z > 1.0) continue;

    // Convert NDC [-1, 1] to screen pixel coordinates
    const sx1 = (vA.x * 0.5 + 0.5) * canvasWidth;
    const sy1 = (-vA.y * 0.5 + 0.5) * canvasHeight;
    const sx2 = (vB.x * 0.5 + 0.5) * canvasWidth;
    const sy2 = (-vB.y * 0.5 + 0.5) * canvasHeight;

    const dist = distancePointToSegment2D(mouseCanvasPos.x, mouseCanvasPos.y, sx1, sy1, sx2, sy2);

    if (dist < minDistance) {
      minDistance = dist;
      closestEdge = edge;
    }
  }

  return closestEdge;
}

/**
 * Finds all connected edges forming a continuous chain / tangent loop
 */
export function findConnectedEdgeLoop(startEdge: CADEdge, allEdges: CADEdge[], toleranceMm: number = 0.5): CADEdge[] {
  const samePartEdges = allEdges.filter(e => e.objectId === startEdge.objectId);
  const loop: CADEdge[] = [startEdge];
  const visited = new Set<string>([startEdge.id]);

  let currentEdge = startEdge;
  let searching = true;

  while (searching && loop.length < 50) {
    const ptB = new THREE.Vector3(...currentEdge.vertexB);
    const nextEdge = samePartEdges.find(e => {
      if (visited.has(e.id)) return false;
      const otherA = new THREE.Vector3(...e.vertexA);
      const otherB = new THREE.Vector3(...e.vertexB);
      return otherA.distanceTo(ptB) < toleranceMm || otherB.distanceTo(ptB) < toleranceMm;
    });

    if (nextEdge) {
      visited.add(nextEdge.id);
      loop.push(nextEdge);
      currentEdge = nextEdge;
    } else {
      searching = false;
    }
  }

  return loop;
}

/**
 * Builds 3D visual geometry for selected and hovered edges in Three.js scene
 */
export function createEdgeSelectionVisuals(
  selectedEdges: CADEdge[],
  hoveredEdge: CADEdge | null
): THREE.Group {
  const group = new THREE.Group();
  group.name = '__smart_edge_selection_group';

  // 1. Highlight Selected Edges (Bright Amber/Cyan Tube)
  selectedEdges.forEach(edge => {
    const ptA = new THREE.Vector3(...edge.vertexA);
    const ptB = new THREE.Vector3(...edge.vertexB);
    const curve = new THREE.LineCurve3(ptA, ptB);
    const tubeGeom = new THREE.TubeGeometry(curve, 4, 0.6, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Electric cyan
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    });
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    tube.renderOrder = 999;
    group.add(tube);

    // End-point vertices
    const sphereGeom = new THREE.SphereGeometry(0.8, 8, 8);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false });
    const sA = new THREE.Mesh(sphereGeom, sphereMat);
    sA.position.copy(ptA);
    sA.renderOrder = 999;
    group.add(sA);

    const sB = new THREE.Mesh(sphereGeom, sphereMat);
    sB.position.copy(ptB);
    sB.renderOrder = 999;
    group.add(sB);
  });

  // 2. Highlight Hovered Edge (Glowing Amber)
  if (hoveredEdge && !selectedEdges.some(e => e.id === hoveredEdge.id)) {
    const ptA = new THREE.Vector3(...hoveredEdge.vertexA);
    const ptB = new THREE.Vector3(...hoveredEdge.vertexB);
    const curve = new THREE.LineCurve3(ptA, ptB);
    const tubeGeom = new THREE.TubeGeometry(curve, 4, 0.7, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber gold
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    tube.renderOrder = 1000;
    group.add(tube);
  }

  return group;
}
