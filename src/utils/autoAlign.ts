import { CADObject, AutoAlignDirection, AutoAlignOptions } from '../types/cad';

export interface BoundingBox3D {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
  size: [number, number, number];
}

/**
 * Calculates accurate 3D AABB bounding box for any CAD object primitive
 */
export function getObjectBoundingBox(obj: CADObject): BoundingBox3D {
  const [px, py, pz] = obj.position;
  const [sx, sy, sz] = obj.scale;
  const dims = obj.dimensions;

  let rawW = dims.width || 20;
  let rawH = dims.height || 20;
  let rawD = dims.depth || 20;

  if (obj.primitive === 'cylinder' || obj.primitive === 'cone') {
    const r = dims.radius || dims.radiusBottom || 10;
    rawW = r * 2;
    rawD = r * 2;
    rawH = dims.height || 20;
  } else if (obj.primitive === 'sphere') {
    const r = dims.radius || 10;
    rawW = r * 2;
    rawH = r * 2;
    rawD = r * 2;
  } else if (obj.primitive === 'camera_lens' || obj.primitive === 'screw_head') {
    const r = dims.radius || 8;
    rawW = r * 2;
    rawD = r * 2;
    rawH = dims.height || 5;
  }

  const halfW = (rawW * sx) / 2;
  const halfH = (rawH * sy) / 2;
  const halfD = (rawD * sz) / 2;

  return {
    min: [px - halfW, py - halfH, pz - halfD],
    max: [px + halfW, py + halfH, pz + halfD],
    center: [px, py, pz],
    size: [rawW * sx, rawH * sy, rawD * sz],
  };
}

/**
 * Calculates union bounding box for a set of CAD objects
 */
export function getGroupBoundingBox(objects: CADObject[]): BoundingBox3D {
  if (objects.length === 0) {
    return { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0], size: [0, 0, 0] };
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const obj of objects) {
    const box = getObjectBoundingBox(obj);
    if (box.min[0] < minX) minX = box.min[0];
    if (box.min[1] < minY) minY = box.min[1];
    if (box.min[2] < minZ) minZ = box.min[2];
    if (box.max[0] > maxX) maxX = box.max[0];
    if (box.max[1] > maxY) maxY = box.max[1];
    if (box.max[2] > maxZ) maxZ = box.max[2];
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size: [maxX - minX, maxY - minY, maxZ - minZ],
  };
}

/**
 * Performs smart automated alignment calculations across selected or all CAD objects
 */
export function executeSmartAutoAlign(
  allObjects: CADObject[],
  targetObjectIds: string[],
  options: AutoAlignOptions
): CADObject[] {
  if (targetObjectIds.length === 0) return allObjects;

  const targetSet = new Set(targetObjectIds);
  const selectedObjs = allObjects.filter(o => targetSet.has(o.id));
  if (selectedObjs.length === 0) return allObjects;

  // Determine reference boundary / anchor
  let anchorBox: BoundingBox3D;
  if (options.referenceTarget === 'anchor_part' && options.anchorPartId) {
    const anchorObj = allObjects.find(o => o.id === options.anchorPartId);
    anchorBox = anchorObj ? getObjectBoundingBox(anchorObj) : getGroupBoundingBox(selectedObjs);
  } else if (options.referenceTarget === 'origin_ground') {
    anchorBox = {
      min: [0, 0, 0],
      max: [0, 0, 0],
      center: [0, 0, 0],
      size: [0, 0, 0],
    };
  } else {
    // Assembly bounding box of all non-selected (or all selected if only selected exist)
    const otherObjs = allObjects.filter(o => !targetSet.has(o.id));
    anchorBox = otherObjs.length > 0 ? getGroupBoundingBox(otherObjs) : getGroupBoundingBox(selectedObjs);
  }

  const offset = options.spacingOffsetMm || 0;

  // Clone objects map
  const updatedMap = new Map<string, CADObject>();

  switch (options.direction) {
    case 'center_all': {
      const group = getGroupBoundingBox(selectedObjs);
      const deltaX = anchorBox.center[0] - group.center[0];
      const deltaY = anchorBox.center[1] - group.center[1];
      const deltaZ = anchorBox.center[2] - group.center[2];
      selectedObjs.forEach(o => {
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0] + deltaX, o.position[1] + deltaY, o.position[2] + deltaZ],
        });
      });
      break;
    }

    case 'center_x': {
      const targetCenterX = anchorBox.center[0];
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = targetCenterX - box.center[0];
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0] + shift, o.position[1], o.position[2]],
        });
      });
      break;
    }

    case 'center_y': {
      const targetCenterY = anchorBox.center[1];
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = targetCenterY - box.center[1];
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1] + shift, o.position[2]],
        });
      });
      break;
    }

    case 'center_z': {
      const targetCenterZ = anchorBox.center[2];
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = targetCenterZ - box.center[2];
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1], o.position[2] + shift],
        });
      });
      break;
    }

    case 'flush_min_x': {
      // Align to left edge of anchor
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = anchorBox.min[0] - box.min[0] + offset;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0] + shift, o.position[1], o.position[2]],
        });
      });
      break;
    }

    case 'flush_max_x': {
      // Align to right edge of anchor
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = anchorBox.max[0] - box.max[0] - offset;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0] + shift, o.position[1], o.position[2]],
        });
      });
      break;
    }

    case 'flush_min_y': {
      // Align to bottom edge of anchor
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = anchorBox.min[1] - box.min[1] + offset;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1] + shift, o.position[2]],
        });
      });
      break;
    }

    case 'flush_max_y': {
      // Align to top edge of anchor
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = anchorBox.max[1] - box.max[1] - offset;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1] + shift, o.position[2]],
        });
      });
      break;
    }

    case 'flush_min_z': {
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = anchorBox.min[2] - box.min[2] + offset;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1], o.position[2] + shift],
        });
      });
      break;
    }

    case 'flush_max_z': {
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const shift = anchorBox.max[2] - box.max[2] - offset;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1], o.position[2] + shift],
        });
      });
      break;
    }

    case 'stack_up_y': {
      // Sort selected objects by current Y position
      const sorted = [...selectedObjs].sort((a, b) => a.position[1] - b.position[1]);
      let currentTopY = anchorBox.max[1] + offset;
      
      sorted.forEach(o => {
        const box = getObjectBoundingBox(o);
        const height = box.size[1];
        const newCenterY = currentTopY + height / 2;
        updatedMap.set(o.id, {
          ...o,
          position: [anchorBox.center[0], newCenterY, anchorBox.center[2]],
        });
        currentTopY += height + offset;
      });
      break;
    }

    case 'stack_down_y': {
      const sorted = [...selectedObjs].sort((a, b) => b.position[1] - a.position[1]);
      let currentBottomY = anchorBox.min[1] - offset;
      
      sorted.forEach(o => {
        const box = getObjectBoundingBox(o);
        const height = box.size[1];
        const newCenterY = currentBottomY - height / 2;
        updatedMap.set(o.id, {
          ...o,
          position: [anchorBox.center[0], newCenterY, anchorBox.center[2]],
        });
        currentBottomY -= height + offset;
      });
      break;
    }

    case 'concentric_axial': {
      // Aligns center X and center Z to anchor, preserving current Y
      selectedObjs.forEach(o => {
        updatedMap.set(o.id, {
          ...o,
          position: [anchorBox.center[0], o.position[1], anchorBox.center[2]],
        });
      });
      break;
    }

    case 'ground_to_bottom': {
      selectedObjs.forEach(o => {
        const box = getObjectBoundingBox(o);
        const halfH = box.size[1] / 2;
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], halfH + offset, o.position[2]],
        });
      });
      break;
    }

    case 'distribute_linear_x': {
      if (selectedObjs.length < 3) break;
      const sorted = [...selectedObjs].sort((a, b) => a.position[0] - b.position[0]);
      const minX = sorted[0].position[0];
      const maxX = sorted[sorted.length - 1].position[0];
      const step = (maxX - minX) / (sorted.length - 1);
      sorted.forEach((o, idx) => {
        updatedMap.set(o.id, {
          ...o,
          position: [minX + idx * step, o.position[1], o.position[2]],
        });
      });
      break;
    }

    case 'distribute_linear_y': {
      if (selectedObjs.length < 3) break;
      const sorted = [...selectedObjs].sort((a, b) => a.position[1] - b.position[1]);
      const minY = sorted[0].position[1];
      const maxY = sorted[sorted.length - 1].position[1];
      const step = (maxY - minY) / (sorted.length - 1);
      sorted.forEach((o, idx) => {
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], minY + idx * step, o.position[2]],
        });
      });
      break;
    }

    case 'distribute_linear_z': {
      if (selectedObjs.length < 3) break;
      const sorted = [...selectedObjs].sort((a, b) => a.position[2] - b.position[2]);
      const minZ = sorted[0].position[2];
      const maxZ = sorted[sorted.length - 1].position[2];
      const step = (maxZ - minZ) / (sorted.length - 1);
      sorted.forEach((o, idx) => {
        updatedMap.set(o.id, {
          ...o,
          position: [o.position[0], o.position[1], minZ + idx * step],
        });
      });
      break;
    }
  }

  return allObjects.map(o => (updatedMap.has(o.id) ? updatedMap.get(o.id)! : o));
}
