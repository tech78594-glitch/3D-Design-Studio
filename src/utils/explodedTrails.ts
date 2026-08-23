import * as THREE from 'three';
import { CADObject, CADExplodedTrail, ExplodedTrailsSettings, DeviceConfig } from '../types/cad';

export const DEFAULT_EXPLODED_TRAILS_SETTINGS: ExplodedTrailsSettings = {
  enabled: true,
  style: 'dashed_cad',
  colorPreset: 'cad_blue',
  dashScale: 1.0,
  lineWidth: 1.5,
  showAnchorSpheres: true,
  showDistanceBadges: true,
  showDirectionArrows: true,
  animateFlow: true,
  filterPartId: null,
};

/**
 * Calculates exploded trajectory displacement for a component
 */
export function computePartExplodedOffset(
  obj: CADObject,
  index: number,
  deviceConfig: DeviceConfig
): {
  origin: [number, number, number];
  exploded: [number, number, number];
  offset: [number, number, number];
  distanceMm: number;
} {
  const origin: [number, number, number] = [obj.position[0], obj.position[1], obj.position[2]];

  const isStark = !!deviceConfig.starkModeEnabled;
  const starkAmount = deviceConfig.starkSeparationAmount ?? 0;
  const explodedAmount = deviceConfig.explodedAmount ?? 0;
  const effectiveFactor = Math.max(isStark ? starkAmount : 0, explodedAmount);

  if (effectiveFactor <= 0.001) {
    return {
      origin,
      exploded: origin,
      offset: [0, 0, 0],
      distanceMm: 0,
    };
  }

  // Calculate explosion direction vector based on component role / layout
  const name = (obj.name || '').toLowerCase();
  let dx = 0;
  let dy = 0;
  let dz = 0;

  const baseDistance = 80 * effectiveFactor;

  if (name.includes('top') || name.includes('cap') || name.includes('headband') || name.includes('dial')) {
    dy = baseDistance * 1.4;
  } else if (name.includes('bottom') || name.includes('base') || name.includes('cushion') || name.includes('jack')) {
    dy = -baseDistance * 1.2;
  } else if (name.includes('left') || name.includes('driver l') || name.includes('yoke l')) {
    dx = -baseDistance * 1.5;
  } else if (name.includes('right') || name.includes('driver r') || name.includes('yoke r')) {
    dx = baseDistance * 1.5;
  } else if (name.includes('front') || name.includes('grille') || name.includes('lens')) {
    dz = baseDistance * 1.3;
  } else if (name.includes('back') || name.includes('plate') || name.includes('rear')) {
    dz = -baseDistance * 1.3;
  } else {
    // Radial distribution
    const angle = (index / 8) * Math.PI * 2;
    dx = Math.cos(angle) * baseDistance * 0.9;
    dz = Math.sin(angle) * baseDistance * 0.9;
    dy = (index % 2 === 0 ? 1 : -1) * (baseDistance * 0.5);
  }

  const exploded: [number, number, number] = [
    origin[0] + dx,
    origin[1] + dy,
    origin[2] + dz,
  ];

  const distanceMm = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    origin,
    exploded,
    offset: [dx, dy, dz],
    distanceMm: parseFloat(distanceMm.toFixed(1)),
  };
}

/**
 * Generates all active exploded trails
 */
export function generateExplodedTrails(
  objects: CADObject[],
  deviceConfig: DeviceConfig,
  settings: ExplodedTrailsSettings = DEFAULT_EXPLODED_TRAILS_SETTINGS
): CADExplodedTrail[] {
  const visibleObjects = objects.filter(o => o.visible);
  const trails: CADExplodedTrail[] = [];

  visibleObjects.forEach((obj, idx) => {
    if (settings.filterPartId && settings.filterPartId !== obj.id) {
      return;
    }

    const { origin, exploded, offset, distanceMm } = computePartExplodedOffset(obj, idx, deviceConfig);

    if (distanceMm < 2.0) return; // Skip if virtually stationary

    let color = '#38bdf8'; // CAD cyan blue
    if (settings.colorPreset === 'laser_cyan') color = '#00f0ff';
    if (settings.colorPreset === 'amber_gold') color = '#f59e0b';
    if (settings.colorPreset === 'neon_emerald') color = '#10b981';
    if (settings.colorPreset === 'part_match') color = obj.material?.color || '#38bdf8';

    // Dominant axis determination
    const absX = Math.abs(offset[0]);
    const absY = Math.abs(offset[1]);
    const absZ = Math.abs(offset[2]);
    let stepAxis: 'x' | 'y' | 'z' = 'y';
    if (absX >= absY && absX >= absZ) stepAxis = 'x';
    else if (absZ >= absX && absZ >= absY) stepAxis = 'z';

    trails.push({
      id: `trail_${obj.id}`,
      partId: obj.id,
      partName: obj.name,
      originPoint: origin,
      explodedPoint: exploded,
      offsetVector: offset,
      distanceMm,
      color,
      style: settings.style,
      visible: true,
      stepAxis,
    });
  });

  return trails;
}

/**
 * Builds Three.js 3D Visual Objects for Exploded Trails
 */
export function createExplodedTrailsGroup(
  trails: CADExplodedTrail[],
  settings: ExplodedTrailsSettings
): THREE.Group {
  const group = new THREE.Group();
  group.name = '__exploded_trails_group';

  if (!settings.enabled || trails.length === 0) {
    return group;
  }

  trails.forEach(trail => {
    const vOrigin = new THREE.Vector3(...trail.originPoint);
    const vExploded = new THREE.Vector3(...trail.explodedPoint);
    const trailColor = new THREE.Color(trail.color);

    // 1. Origin Anchor Sphere
    if (settings.showAnchorSpheres) {
      const originSphereGeom = new THREE.SphereGeometry(1.2, 12, 12);
      const originSphereMat = new THREE.MeshBasicMaterial({
        color: trailColor,
        wireframe: false,
      });
      const originSphere = new THREE.Mesh(originSphereGeom, originSphereMat);
      originSphere.position.copy(vOrigin);
      group.add(originSphere);

      // Destination Target Ring
      const destRingGeom = new THREE.RingGeometry(1.5, 2.2, 16);
      const destRingMat = new THREE.MeshBasicMaterial({
        color: trailColor,
        side: THREE.DoubleSide,
      });
      const destRing = new THREE.Mesh(destRingGeom, destRingMat);
      destRing.position.copy(vExploded);
      destRing.lookAt(vOrigin);
      group.add(destRing);
    }

    // 2. Trajectory Line (Straight or Step Axis)
    let points: THREE.Vector3[] = [];
    if (trail.style === 'axis_step') {
      // Orthogonal step line (e.g. X then Y then Z)
      const mid1 = new THREE.Vector3(vExploded.x, vOrigin.y, vOrigin.z);
      const mid2 = new THREE.Vector3(vExploded.x, vExploded.y, vOrigin.z);
      points = [vOrigin, mid1, mid2, vExploded];
    } else {
      points = [vOrigin, vExploded];
    }

    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

    if (trail.style === 'dashed_cad') {
      const lineMat = new THREE.LineDashedMaterial({
        color: trailColor,
        dashSize: 4 * settings.dashScale,
        gapSize: 2.5 * settings.dashScale,
        linewidth: 1,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.computeLineDistances();
      group.add(line);
    } else if (trail.style === 'laser_glow') {
      // Glowing neon tube
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.4, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: trailColor,
        transparent: true,
        opacity: 0.85,
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      group.add(tube);
    } else {
      // Solid CAD Line
      const lineMat = new THREE.LineBasicMaterial({
        color: trailColor,
        linewidth: 1,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      group.add(line);
    }

    // 3. Trajectory Direction Arrow
    if (settings.showDirectionArrows) {
      const dir = new THREE.Vector3().subVectors(vExploded, vOrigin).normalize();
      const midPoint = new THREE.Vector3().addVectors(vOrigin, vExploded).multiplyScalar(0.5);
      const arrowHelper = new THREE.ArrowHelper(dir, midPoint, 8, trailColor.getHex(), 3.5, 2);
      group.add(arrowHelper);
    }
  });

  return group;
}
