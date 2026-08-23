import * as THREE from 'three';
import JSZip from 'jszip';
import { CADObject, RenderMode, CADMaterial } from '../types/cad';

// Cache procedural textures
let pcbTextureCache: THREE.CanvasTexture | null = null;
let solarTextureCache: THREE.CanvasTexture | null = null;
let carbonTextureCache: THREE.CanvasTexture | null = null;

export function getPCBTexture(): THREE.CanvasTexture {
  if (pcbTextureCache) return pcbTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark substrate background
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 512, 512);

  // Gold & copper traces
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.5;

  // Grid bus lines
  for (let i = 20; i < 512; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Circular SMD pads
  ctx.fillStyle = '#e5c058';
  for (let x = 20; x < 512; x += 40) {
    for (let y = 20; y < 512; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e5c058';
    }
  }

  // IC chip mounting footprint in center
  ctx.fillStyle = '#222';
  ctx.fillRect(196, 196, 120, 120);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(196, 196, 120, 120);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  pcbTextureCache = texture;
  return texture;
}

export function getSolarTexture(): THREE.CanvasTexture {
  if (solarTextureCache) return solarTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c1524';
  ctx.fillRect(0, 0, 256, 256);

  // Solar cell silver busbars
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1;
  for (let i = 0; i < 256; i += 16) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 0);
  ctx.lineTo(64, 256);
  ctx.moveTo(192, 0);
  ctx.lineTo(192, 256);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  solarTextureCache = texture;
  return texture;
}

export function getCarbonTexture(): THREE.CanvasTexture {
  if (carbonTextureCache) return carbonTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#17171a';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#26262b';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillRect(32, 32, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  carbonTextureCache = texture;
  return texture;
}

/**
 * Creates Three.js geometry for a CAD object
 */
export function createCADGeometry(obj: CADObject): THREE.BufferGeometry {
  const d = obj.dimensions;

  switch (obj.primitive) {
    case 'box':
    case 'wall':
    case 'slab':
    case 'furniture_desk':
      return new THREE.BoxGeometry(d.width, d.height, d.depth);

    case 'rounded_box': {
      // Rounded box approximation with BoxGeometry and subdivisions
      return new THREE.BoxGeometry(d.width, d.height, d.depth, 4, 4, 4);
    }

    case 'cylinder':
    case 'column':
    case 'battery_cell':
    case 'screw_head': {
      const radius = d.radius || d.width / 2;
      return new THREE.CylinderGeometry(
        d.radiusTop !== undefined ? d.radiusTop : radius,
        d.radiusBottom !== undefined ? d.radiusBottom : radius,
        d.height,
        d.segments || 32
      );
    }

    case 'sphere': {
      const radius = d.radius || d.width / 2;
      return new THREE.SphereGeometry(radius, 32, 32);
    }

    case 'torus': {
      const radius = d.radius || d.width / 2;
      return new THREE.TorusGeometry(radius, Math.max(1, (d.depth || 4) / 2), 16, 48);
    }

    case 'cone': {
      return new THREE.ConeGeometry(d.radius || d.width / 2, d.height, 32);
    }

    case 'pcb_board':
    case 'chip_ic':
    case 'port_usbc':
    case 'screen_panel':
    case 'solar_panel':
    case 'window':
    case 'door':
      return new THREE.BoxGeometry(d.width, d.height, d.depth);

    case 'camera_lens': {
      const radius = d.radius || d.width / 2;
      return new THREE.CylinderGeometry(radius, radius * 0.95, d.depth || 5, 32);
    }

    case 'roof_pitched': {
      // Prism geometry for roof
      const shape = new THREE.Shape();
      const halfW = d.width / 2;
      shape.moveTo(-halfW, 0);
      shape.lineTo(0, d.height);
      shape.lineTo(halfW, 0);
      shape.closePath();

      const extrudeSettings = {
        steps: 1,
        depth: d.depth,
        bevelEnabled: false,
      };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      return geom;
    }

    default:
      return new THREE.BoxGeometry(d.width || 10, d.height || 10, d.depth || 10);
  }
}

/**
 * Creates Three.js material configured for CAD rendering modes & PBR diagnostic passes
 */
export function createCADMaterial(
  mat: CADMaterial,
  renderMode: RenderMode,
  thermalActive: boolean = false,
  electricalHeat: number = 0,
  slicePlane?: THREE.Plane | null,
  pbrDiagnosticChannel: string = 'lit'
): THREE.Material {
  const clippingPlanes = slicePlane ? [slicePlane] : [];

  // Diagnostic PBR Review Shader Passes
  if (pbrDiagnosticChannel === 'roughness_zebra') {
    // Roughness diagnostic: blue (0.0 gloss) -> cyan -> green -> yellow -> red (1.0 diffuse)
    const r = mat.roughness ?? 0.3;
    const hslColor = new THREE.Color().setHSL((1 - r) * 0.7, 0.9, 0.5);
    return new THREE.MeshStandardMaterial({
      color: hslColor,
      roughness: r,
      metalness: 0,
      clippingPlanes,
    });
  }

  if (pbrDiagnosticChannel === 'metalness') {
    // Metalness mask: Black (dielectric 0.0) -> White (conductor 1.0)
    const m = mat.metalness ?? 0.5;
    const grayVal = Math.round(m * 255);
    const hex = `rgb(${grayVal},${grayVal},${grayVal})`;
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(hex),
      clippingPlanes,
    });
  }

  if (pbrDiagnosticChannel === 'normals') {
    return new THREE.MeshNormalMaterial({
      clippingPlanes,
    });
  }

  if (pbrDiagnosticChannel === 'fresnel') {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#000000'),
      emissive: new THREE.Color('#38bdf8'),
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      clearcoat: 1.0,
      clippingPlanes,
    });
  }

  if (pbrDiagnosticChannel === 'curvature') {
    // High-contrast CAD zebra curvature stripes
    const zebraCanvas = document.createElement('canvas');
    zebraCanvas.width = 128;
    zebraCanvas.height = 128;
    const ctx = zebraCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < 128; i += 16) {
        ctx.fillRect(0, i, 128, 8);
      }
    }
    const zebraTexture = new THREE.CanvasTexture(zebraCanvas);
    zebraTexture.wrapS = THREE.RepeatWrapping;
    zebraTexture.wrapT = THREE.RepeatWrapping;
    zebraTexture.repeat.set(4, 4);

    return new THREE.MeshStandardMaterial({
      map: zebraTexture,
      roughness: 0.05,
      metalness: 0.9,
      clippingPlanes,
    });
  }

  if (pbrDiagnosticChannel === 'ao') {
    return new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.9,
      metalness: 0.0,
      clippingPlanes,
    });
  }

  if (renderMode === 'wireframe' || pbrDiagnosticChannel === 'wireframe_pbr') {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(mat.color || '#3b82f6'),
      wireframe: true,
      roughness: mat.roughness ?? 0.3,
      metalness: mat.metalness ?? 0.5,
      clippingPlanes,
      clipShadows: true,
    });
  }

  if (renderMode === 'clay') {
    return new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.85,
      metalness: 0.05,
      clippingPlanes,
      clipShadows: true,
    });
  }

  if (renderMode === 'blueprint') {
    return new THREE.MeshBasicMaterial({
      color: '#1d4ed8',
      wireframe: true,
      clippingPlanes,
    });
  }

  if (renderMode === 'thermal' || thermalActive) {
    // False-color thermal heatmap: Blue (cool 25C) -> Green (40C) -> Yellow (60C) -> Red (80C+)
    const heat = electricalHeat || 0;
    let thermalColor = new THREE.Color('#3b82f6'); // Cool blue
    if (heat > 10) {
      thermalColor = new THREE.Color('#ef4444'); // Overheating Red
    } else if (heat > 5) {
      thermalColor = new THREE.Color('#f97316'); // Warm Orange
    } else if (heat > 2) {
      thermalColor = new THREE.Color('#eab308'); // Moderate Yellow
    } else if (heat > 0.5) {
      thermalColor = new THREE.Color('#10b981'); // Normal Green
    }

    return new THREE.MeshStandardMaterial({
      color: thermalColor,
      emissive: thermalColor,
      emissiveIntensity: 0.45,
      roughness: 0.5,
      metalness: 0.1,
      clippingPlanes,
      clipShadows: true,
    });
  }

  if (renderMode === 'xray') {
    return new THREE.MeshPhysicalMaterial({
      color: mat.color || '#38bdf8',
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
      wireframe: false,
      clippingPlanes,
      clipShadows: true,
    });
  }

  // Standard PBR Shaded Material
  const standardMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(mat.color),
    roughness: mat.roughness ?? 0.3,
    metalness: mat.metalness ?? 0.5,
    clearcoat: mat.clearcoat ?? 0.0,
    clearcoatRoughness: 0.1,
    transparent: mat.transparent || (mat.opacity !== undefined && mat.opacity < 1),
    opacity: mat.opacity ?? 1.0,
    transmission: mat.transmission ?? 0.0,
    ior: 1.5,
    wireframe: mat.wireframe ?? false,
    clippingPlanes,
    clipShadows: true,
  });

  if (mat.emissive) {
    standardMat.emissive = new THREE.Color(mat.emissive);
    standardMat.emissiveIntensity = mat.emissiveIntensity ?? 1.0;
  }

  if (mat.texturePattern === 'pcb_grid') {
    standardMat.map = getPCBTexture();
    standardMat.roughnessMap = getPCBTexture();
  } else if (mat.texturePattern === 'carbon') {
    standardMat.map = getCarbonTexture();
  }

  return standardMat;
}

/**
 * STL Exporter for 3D Printing & CAD sharing
 */
export function exportSceneToSTL(objects: CADObject[]): string {
  let stl = 'solid CAD_Design_Studio_Export\n';

  objects.filter(o => o.visible).forEach(obj => {
    const geom = createCADGeometry(obj);
    geom.computeVertexNormals();

    const positionAttr = geom.getAttribute('position');
    const indexAttr = geom.getIndex();

    const euler = new THREE.Euler(...obj.rotation);
    const pos = new THREE.Vector3(...obj.position);
    const scale = new THREE.Vector3(...obj.scale);
    const matrix = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(euler), scale);

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const normal = new THREE.Vector3(0, 0, 1);

    const numTriangles = indexAttr ? indexAttr.count / 3 : positionAttr.count / 3;

    for (let i = 0; i < numTriangles; i++) {
      let iA = i * 3;
      let iB = i * 3 + 1;
      let iC = i * 3 + 2;

      if (indexAttr) {
        iA = indexAttr.getX(i * 3);
        iB = indexAttr.getX(i * 3 + 1);
        iC = indexAttr.getX(i * 3 + 2);
      }

      vA.fromBufferAttribute(positionAttr, iA).applyMatrix4(matrix);
      vB.fromBufferAttribute(positionAttr, iB).applyMatrix4(matrix);
      vC.fromBufferAttribute(positionAttr, iC).applyMatrix4(matrix);

      // Compute face normal
      const cb = new THREE.Vector3().subVectors(vC, vB);
      const ab = new THREE.Vector3().subVectors(vA, vB);
      normal.crossVectors(cb, ab).normalize();

      stl += `  facet normal ${normal.x.toFixed(4)} ${normal.y.toFixed(4)} ${normal.z.toFixed(4)}\n`;
      stl += '    outer loop\n';
      stl += `      vertex ${vA.x.toFixed(4)} ${vA.y.toFixed(4)} ${vA.z.toFixed(4)}\n`;
      stl += `      vertex ${vB.x.toFixed(4)} ${vB.y.toFixed(4)} ${vB.z.toFixed(4)}\n`;
      stl += `      vertex ${vC.x.toFixed(4)} ${vC.y.toFixed(4)} ${vC.z.toFixed(4)}\n`;
      stl += '    endloop\n';
      stl += '  endfacet\n';
    }
  });

  stl += 'endsolid CAD_Design_Studio_Export\n';
  return stl;
}

/**
 * OBJ Exporter for Blender, Maya, Rhino, SolidWorks
 */
export function exportSceneToOBJ(objects: CADObject[]): string {
  let objOutput = '# 3D Design Studio OBJ Exporter\n# Units: Millimeters / Meters\n\n';
  let vertexOffset = 1;

  objects.filter(o => o.visible).forEach(obj => {
    objOutput += `o ${obj.name.replace(/\s+/g, '_')}\n`;
    const geom = createCADGeometry(obj);
    const positionAttr = geom.getAttribute('position');
    const indexAttr = geom.getIndex();

    const euler = new THREE.Euler(...obj.rotation);
    const pos = new THREE.Vector3(...obj.position);
    const scale = new THREE.Vector3(...obj.scale);
    const matrix = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(euler), scale);

    const v = new THREE.Vector3();
    for (let i = 0; i < positionAttr.count; i++) {
      v.fromBufferAttribute(positionAttr, i).applyMatrix4(matrix);
      objOutput += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
    }

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i += 3) {
        const a = indexAttr.getX(i) + vertexOffset;
        const b = indexAttr.getX(i + 1) + vertexOffset;
        const c = indexAttr.getX(i + 2) + vertexOffset;
        objOutput += `f ${a} ${b} ${c}\n`;
      }
    } else {
      for (let i = 0; i < positionAttr.count; i += 3) {
        objOutput += `f ${i + vertexOffset} ${i + 1 + vertexOffset} ${i + 2 + vertexOffset}\n`;
      }
    }

    vertexOffset += positionAttr.count;
  });

  return objOutput;
}

/**
 * 3MF Exporter for Modern 3D Printing (Bambu Studio, PrusaSlicer, Cura, SolidWorks, Fusion 360)
 * Generates an OPC/ZIP package compliant with 3MF Core Specification (Unit: Millimeters)
 */
export async function exportSceneTo3MF(
  objects: CADObject[],
  assemblyName: string = 'CAD_Assembly'
): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
  zip.file('_rels/.rels', relsXml);

  // 3. 3D/3dmodel.model
  let objectResourcesXml = '';
  let buildItemsXml = '';
  let colorGroupXml = '';
  let colorIndex = 0;

  const visibleObjects = objects.filter(o => o.visible);
  
  // Build color group
  const colorMap = new Map<string, number>();
  visibleObjects.forEach((obj) => {
    const hex = (obj.material?.color || '#3b82f6').replace('#', '').toUpperCase();
    const alphaHex = Math.round((obj.material?.opacity ?? 1.0) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
    const fullHex = `#${hex.slice(0, 6)}${alphaHex}`;
    if (!colorMap.has(fullHex)) {
      colorMap.set(fullHex, colorIndex++);
    }
  });

  let colorsListXml = '';
  colorMap.forEach((idx, col) => {
    colorsListXml += `      <m:color color="${col}"/>\n`;
  });
  
  if (colorMap.size > 0) {
    colorGroupXml = `    <m:colorgroup id="1">\n${colorsListXml}    </m:colorgroup>\n`;
  }

  visibleObjects.forEach((obj, objIdx) => {
    const objectId = objIdx + 2; // IDs > 1 (1 reserved for colorgroup if present)
    const geom = createCADGeometry(obj);
    geom.computeVertexNormals();

    const positionAttr = geom.getAttribute('position');
    const indexAttr = geom.getIndex();

    const euler = new THREE.Euler(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    const pos = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
    const scale = new THREE.Vector3(obj.scale[0], obj.scale[1], obj.scale[2]);
    const matrix = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(euler), scale);

    const hex = (obj.material?.color || '#3b82f6').replace('#', '').toUpperCase();
    const alphaHex = Math.round((obj.material?.opacity ?? 1.0) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
    const fullHex = `#${hex.slice(0, 6)}${alphaHex}`;
    const p1ColorIndex = colorMap.get(fullHex) ?? 0;

    let verticesXml = '';
    const v = new THREE.Vector3();
    for (let i = 0; i < positionAttr.count; i++) {
      v.fromBufferAttribute(positionAttr, i).applyMatrix4(matrix);
      verticesXml += `          <vertex x="${v.x.toFixed(4)}" y="${v.y.toFixed(4)}" z="${v.z.toFixed(4)}"/>\n`;
    }

    let trianglesXml = '';
    const numTriangles = indexAttr ? indexAttr.count / 3 : positionAttr.count / 3;
    for (let i = 0; i < numTriangles; i++) {
      let v1 = i * 3;
      let v2 = i * 3 + 1;
      let v3 = i * 3 + 2;

      if (indexAttr) {
        v1 = indexAttr.getX(i * 3);
        v2 = indexAttr.getX(i * 3 + 1);
        v3 = indexAttr.getX(i * 3 + 2);
      }
      trianglesXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" p1="${p1ColorIndex}"/>\n`;
    }

    const safeName = obj.name.replace(/[<>&"']/g, '');
    objectResourcesXml += `    <object id="${objectId}" name="${safeName}" pid="1" pindex="${p1ColorIndex}" type="model">
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>\n`;

    buildItemsXml += `    <item objectid="${objectId}"/>\n`;
  });

  const currentDate = new Date().toISOString().split('T')[0];
  const safeAssemblyName = assemblyName.replace(/[<>&"']/g, '');

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${safeAssemblyName}</metadata>
  <metadata name="Designer">3D CAD Design Studio</metadata>
  <metadata name="Application">AI Studio CAD Engine</metadata>
  <metadata name="CreationDate">${currentDate}</metadata>
  <resources>
${colorGroupXml}${objectResourcesXml}  </resources>
  <build>
${buildItemsXml}  </build>
</model>`;

  zip.file('3D/3dmodel.model', modelXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

