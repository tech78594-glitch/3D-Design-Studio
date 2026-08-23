import { CADObject, DesignVersion, VersionDiffResult } from '../types/cad';

export function createVersionSnapshot(
  objects: CADObject[],
  versionNumber: string,
  title: string,
  description: string,
  author: string = 'CAD Systems Engineer',
  tag: 'milestone' | 'release' | 'wip' | 'review' | 'prototype' = 'milestone',
  changeLog: string[] = []
): DesignVersion {
  // Approximate total mass and cost
  let totalMassGrams = 0;
  let bomCostUsd = 0;

  objects.forEach(obj => {
    const dim = obj.dimensions;
    const vol = ((dim?.width ?? 10) * (dim?.height ?? 10) * (dim?.depth ?? 10)) / 1000;
    const mass = vol * 2.0; // average density
    totalMassGrams += mass;
    bomCostUsd += vol * 1.5 + 2.0;
  });

  return {
    id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    versionNumber,
    title,
    description,
    author,
    timestamp: new Date().toISOString(),
    tag,
    objects: JSON.parse(JSON.stringify(objects)),
    metricsSummary: {
      partCount: objects.length,
      totalMassGrams: parseFloat(totalMassGrams.toFixed(1)),
      bomCostUsd: parseFloat(bomCostUsd.toFixed(2)),
    },
    changeLog: changeLog.length > 0 ? changeLog : ['Updated 3D geometry & assembly parameters'],
  };
}

export function computeVersionDiff(versionA: DesignVersion, versionB: DesignVersion): VersionDiffResult {
  const mapA = new Map<string, CADObject>();
  versionA.objects.forEach(o => mapA.set(o.id, o));

  const mapB = new Map<string, CADObject>();
  versionB.objects.forEach(o => mapB.set(o.id, o));

  const addedParts: CADObject[] = [];
  const removedParts: CADObject[] = [];
  const modifiedParts: { partId: string; name: string; changes: string[] }[] = [];

  // Check added and modified in B vs A
  versionB.objects.forEach(bObj => {
    const aObj = mapA.get(bObj.id);
    if (!aObj) {
      addedParts.push(bObj);
    } else {
      const changes: string[] = [];
      if (aObj.name !== bObj.name) {
        changes.push(`Renamed from "${aObj.name}" to "${bObj.name}"`);
      }
      if (
        aObj.position[0] !== bObj.position[0] ||
        aObj.position[1] !== bObj.position[1] ||
        aObj.position[2] !== bObj.position[2]
      ) {
        changes.push(
          `Repositioned from [${aObj.position.map(v => v.toFixed(1)).join(',')}] to [${bObj.position.map(v => v.toFixed(1)).join(',')}]`
        );
      }
      if (
        aObj.dimensions.width !== bObj.dimensions.width ||
        aObj.dimensions.height !== bObj.dimensions.height ||
        aObj.dimensions.depth !== bObj.dimensions.depth
      ) {
        changes.push(
          `Resized: ${bObj.dimensions.width}×${bObj.dimensions.height}×${bObj.dimensions.depth}mm`
        );
      }
      if (aObj.material?.name !== bObj.material?.name) {
        changes.push(`Material changed from "${aObj.material?.name}" to "${bObj.material?.name}"`);
      }
      if (changes.length > 0) {
        modifiedParts.push({
          partId: bObj.id,
          name: bObj.name,
          changes,
        });
      }
    }
  });

  // Check removed in A not in B
  versionA.objects.forEach(aObj => {
    if (!mapB.has(aObj.id)) {
      removedParts.push(aObj);
    }
  });

  return {
    versionA,
    versionB,
    addedParts,
    removedParts,
    modifiedParts,
    deltaMassGrams: parseFloat((versionB.metricsSummary.totalMassGrams - versionA.metricsSummary.totalMassGrams).toFixed(1)),
    deltaCostUsd: parseFloat((versionB.metricsSummary.bomCostUsd - versionA.metricsSummary.bomCostUsd).toFixed(2)),
    deltaPartCount: versionB.metricsSummary.partCount - versionA.metricsSummary.partCount,
  };
}

export function getDefaultVersionHistory(initialObjects: CADObject[]): DesignVersion[] {
  const v1Objects = JSON.parse(JSON.stringify(initialObjects));
  // Create slightly altered baseline for v1.0.0
  const v0Objects = JSON.parse(JSON.stringify(initialObjects)).slice(0, Math.max(3, initialObjects.length - 2));

  return [
    {
      id: 'ver_init_001',
      versionNumber: 'v1.0.0',
      title: 'Initial Concept & Core Structural Chassis',
      description: 'First engineering alpha release establishing outer envelope and core PCB anchor mounts.',
      author: 'A. Stark',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      tag: 'prototype',
      objects: v0Objects,
      metricsSummary: {
        partCount: v0Objects.length,
        totalMassGrams: 145.2,
        bomCostUsd: 284.5,
      },
      changeLog: ['Established primary outer envelope geometry', 'Added battery cell cavity and mainboard brackets'],
    },
    {
      id: 'ver_init_002',
      versionNumber: 'v1.1.0',
      title: 'Optics Subsystem & High-Speed I/O Integration',
      description: 'Integrated multi-sensor periscope optics, USB-C fast charge bus, and thermal copper heat pipes.',
      author: 'L. Chen',
      timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
      tag: 'milestone',
      objects: v1Objects,
      metricsSummary: {
        partCount: v1Objects.length,
        totalMassGrams: 189.4,
        bomCostUsd: 362.8,
      },
      changeLog: [
        'Added periscope telephoto lens stack',
        'Reinforced chassis side rails with 7000-series aerospace alloy',
        'Validated kinematic travel for tactile side buttons',
      ],
    },
  ];
}
