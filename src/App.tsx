/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DesignSection,
  CADObject,
  DeviceConfig,
  BuildingConfig,
  RenderMode,
  LightingPreset,
  TransformMode,
  SceneHistoryStep,
  CADMaterial,
  SnapshotItem,
  CADConstraint,
  PBRReviewSettings,
  DEFAULT_PBR_SETTINGS,
  CADLayer,
  CADTag,
  KinematicJoint,
  DEFAULT_CAD_LAYERS,
  DEFAULT_CAD_TAGS,
  DesignVersion,
  CADMeasurement,
  CADCommentPin,
  MeasureMode,
  StudioThemeMode,
} from './types/cad';
import { DEVICE_PRESETS } from './components/tech/DevicePresets';
import { BUILDING_PRESETS } from './components/building/BuildingPresets';
import { Header } from './components/shared/Header';
import { Viewport3D } from './components/canvas/Viewport3D';
import { TechnologyDesigner } from './components/tech/TechnologyDesigner';
import { BuildingDesigner } from './components/building/BuildingDesigner';
import { InspectorPanel } from './components/shared/InspectorPanel';
import { MaterialLibraryModal } from './components/shared/MaterialLibraryModal';
import { SnapshotStudioModal } from './components/shared/SnapshotStudioModal';
import { PBRReviewModal } from './components/shared/PBRReviewModal';
import { HolographicExplodedStudio } from './components/shared/HolographicExplodedStudio';
import { SmartAutoAlignPanel } from './components/shared/SmartAutoAlignPanel';
import { ClashDetectionModal } from './components/shared/ClashDetectionModal';
import { KinematicMotionStudio } from './components/shared/KinematicMotionStudio';
import { LayerTagManager } from './components/shared/LayerTagManager';
import { DesignAnalyticsModal } from './components/shared/DesignAnalyticsModal';
import { VersionManagerModal } from './components/shared/VersionManagerModal';
import { BOMExportModal } from './components/shared/BOMExportModal';
import { MeasuringToolPanel } from './components/shared/MeasuringToolPanel';
import { CollaborativeCommentsModal } from './components/shared/CollaborativeCommentsModal';
import { detectAssemblyClashes } from './utils/clashDetection';
import { createVersionSnapshot } from './utils/versionManager';

export default function App() {
  // Theme state: Dark, Light, Blueprint
  const [themeMode, setThemeMode] = useState<StudioThemeMode>('dark');

  // Primary active section - defaults to Technology & Device Design (Major Section)
  const [section, setSection] = useState<DesignSection>('technology');

  // Technology Section State
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>(DEVICE_PRESETS.smartphone_pro.config);
  // Building Section State
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>(BUILDING_PRESETS.modern_villa.config);

  // Scene Objects Collection (combined for current section)
  const [techObjects, setTechObjects] = useState<CADObject[]>(DEVICE_PRESETS.smartphone_pro.objects);
  const [buildingObjects, setBuildingObjects] = useState<CADObject[]>(BUILDING_PRESETS.modern_villa.objects);

  // CAD Layers & Tagging State
  const [layers, setLayers] = useState<CADLayer[]>(DEFAULT_CAD_LAYERS);
  const [tags, setTags] = useState<CADTag[]>(DEFAULT_CAD_TAGS);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Kinematic Joints & Motion Simulation
  const [kinematicJoints, setKinematicJoints] = useState<KinematicJoint[]>([
    {
      id: 'joint_cam_actuator',
      name: 'Optics Zoom Linear Actuator',
      type: 'prismatic',
      parentPartId: 'part_chassis_outer',
      childPartId: 'part_camera_module',
      anchorPoint: [18, 52, 6],
      axisVector: [0, 0, 1],
      currentValue: 0,
      minLimit: 0,
      maxLimit: 12,
      speed: 15,
      direction: 1,
      cycleType: 'oscillate',
      active: true,
      trajectoryColor: '#38bdf8',
    },
    {
      id: 'joint_power_switch',
      name: 'Tactile Button Switch Rocker',
      type: 'prismatic',
      parentPartId: 'part_chassis_outer',
      childPartId: 'part_usb_c_port',
      anchorPoint: [0, -70, 0],
      axisVector: [0, 1, 0],
      currentValue: 0,
      minLimit: -3,
      maxLimit: 3,
      speed: 8,
      direction: 1,
      cycleType: 'pingpong',
      active: false,
      trajectoryColor: '#10b981',
    },
  ]);

  // Assembly Geometric Constraints & Kinematic Mates
  const [techConstraints, setTechConstraints] = useState<CADConstraint[]>([
    {
      id: 'c_screen_chassis',
      name: 'Coincident: OLED Display ➔ Outer Chassis',
      type: 'coincident',
      partAId: 'part_chassis_outer',
      partBId: 'part_screen_oled',
      axis: 'z',
      offset: 0,
      alignment: 'aligned',
      active: true,
      status: 'satisfied',
    },
    {
      id: 'c_battery_chassis',
      name: 'Coincident: Power Cell ➔ Chassis Cavity',
      type: 'coincident',
      partAId: 'part_chassis_outer',
      partBId: 'part_battery_cell',
      axis: 'y',
      offset: -10,
      alignment: 'aligned',
      active: true,
      status: 'satisfied',
    },
    {
      id: 'c_pcb_concentric',
      name: 'Concentric: Logic Board ➔ Chassis Standoffs',
      type: 'concentric',
      partAId: 'part_chassis_outer',
      partBId: 'part_logic_pcb',
      axis: 'z',
      offset: 0,
      alignment: 'aligned',
      active: true,
      status: 'satisfied',
    },
  ]);

  // Real-time PBR Review Shader Diagnostics & Environment Settings
  const [pbrSettings, setPbrSettings] = useState<PBRReviewSettings>(DEFAULT_PBR_SETTINGS);

  // Selection & Transform State
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('select');
  const [renderMode, setRenderMode] = useState<RenderMode>('shaded');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [snapStep, setSnapStep] = useState<number>(1.0);

  // 3D Measuring Tool State
  const [measurements, setMeasurements] = useState<CADMeasurement[]>([
    {
      id: 'meas_init_width',
      name: 'Chassis Overall Width Caliper',
      mode: 'point_to_point',
      pointA: [-37.5, 0, 0],
      pointB: [37.5, 0, 0],
      distanceMm: 75.0,
      deltaX: 75.0,
      deltaY: 0,
      deltaZ: 0,
      color: '#06b6d4',
      visible: true,
      notes: 'Standard handheld grip envelope tolerance verified (+/- 0.05mm)',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'meas_init_height',
      name: 'Chassis Overall Height Caliper',
      mode: 'point_to_point',
      pointA: [0, -75.0, 0],
      pointB: [0, 75.0, 0],
      distanceMm: 150.0,
      deltaX: 0,
      deltaY: 150.0,
      deltaZ: 0,
      color: '#38bdf8',
      visible: true,
      notes: 'Pocketable height profile',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
  const [activeMeasureMode, setActiveMeasureMode] = useState<MeasureMode>('point_to_point');

  // 3D Collaborative Spatial Comments State
  const [comments, setComments] = useState<CADCommentPin[]>([
    {
      id: 'pin_optics_clearance',
      title: 'Camera Module Bezel Chamfer',
      text: 'Verify CNC undercut clearance around periscope telephoto lens array to prevent acoustic vibration coupling.',
      author: 'Sarah Chen (Lead Optics)',
      authorInitials: 'SC',
      avatarColor: '#38bdf8',
      position: [18, 52, 6],
      targetPartId: 'part_camera_module',
      targetPartName: 'Optics Camera Array',
      status: 'open',
      category: 'tolerance_issue',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      replies: [
        {
          id: 'rep_1',
          author: 'Alex Rivera (Mechanical Lead)',
          avatarColor: '#10b981',
          text: 'Chamfer radius increased from 0.8mm to 1.2mm in rev v1.1.0 to ensure 0.25mm gap.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    },
    {
      id: 'pin_battery_thermal',
      title: 'Graphite Thermal Spreader Contact',
      text: 'Ensure uniform thermal paste contact between high-density Li-Po pouch and CNC aluminum mid-frame.',
      author: 'Marcus Vance (Thermal Eng)',
      authorInitials: 'MV',
      avatarColor: '#f59e0b',
      position: [0, -10, -2],
      targetPartId: 'part_battery_cell',
      targetPartName: 'Li-Po Power Cell',
      status: 'in_review',
      category: 'electrical_note',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      replies: [],
    },
  ]);

  // Design Version History State
  const [versionHistory, setVersionHistory] = useState<DesignVersion[]>(() => {
    const initialV1 = createVersionSnapshot(
      DEVICE_PRESETS.smartphone_pro.objects,
      'v1.0.0',
      'Initial Baseline Prototype',
      'Initial assembly architecture with modular OLED, CNC chassis, and multi-lens camera module',
      'Lead Hardware Architect',
      'release',
      ['Initial CAD structural layout', 'Defined standard component interfaces']
    );

    const initialV2 = createVersionSnapshot(
      DEVICE_PRESETS.smartphone_pro.objects,
      'v1.1.0',
      'Optics & Thermal Optimization',
      'Refined camera protrusion bevel and optimized battery pouch clearance',
      'Sarah Chen',
      'milestone',
      ['Optimized chassis thermal channel', 'Increased camera bump chamfer radius']
    );

    return [initialV1, initialV2];
  });

  // Modals state
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState<boolean>(false);
  const [isMeasuringPanelOpen, setIsMeasuringPanelOpen] = useState<boolean>(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState<boolean>(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [isPBRModalOpen, setIsPBRModalOpen] = useState<boolean>(false);
  const [isHoloStudioOpen, setIsHoloStudioOpen] = useState<boolean>(false);
  const [isAutoAlignOpen, setIsAutoAlignOpen] = useState<boolean>(false);
  const [isClashModalOpen, setIsClashModalOpen] = useState<boolean>(false);
  const [isKinematicsOpen, setIsKinematicsOpen] = useState<boolean>(false);
  const [isLayerTagOpen, setIsLayerTagOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  // Session Snapshots Collection
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>(() => {
    try {
      const saved = localStorage.getItem('cad_snapshots_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cad_snapshots_v1', JSON.stringify(snapshots));
    } catch (e) {
      console.warn('LocalStorage snapshot persist limit:', e);
    }
  }, [snapshots]);

  // Snapshot Exporter Hook Reference
  const snapshotExporterRef = useRef<
    | ((options: {
        resolutionMultiplier: number;
        transparentBg: boolean;
        includeWatermark: boolean;
        aspectRatio: string;
      }) => Promise<SnapshotItem | null>)
    | null
  >(null);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<SceneHistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active objects according to section
  const currentObjects = section === 'technology' ? techObjects : buildingObjects;
  const setObjectsForCurrentSection = (updater: (prev: CADObject[]) => CADObject[]) => {
    if (section === 'technology') {
      setTechObjects(updater);
    } else {
      setBuildingObjects(updater);
    }
  };

  // Record History Step on significant changes
  const recordHistory = useCallback(() => {
    const step: SceneHistoryStep = {
      objects: currentObjects,
      deviceConfig,
      buildingConfig,
      timestamp: Date.now(),
    };
    setHistory(prev => [...prev.slice(0, historyIndex + 1), step]);
    setHistoryIndex(prev => prev + 1);
  }, [currentObjects, deviceConfig, buildingConfig, historyIndex]);

  // Load Preset
  const handleLoadTechPreset = (presetKey: string) => {
    const preset = DEVICE_PRESETS[presetKey];
    if (!preset) return;
    setDeviceConfig(preset.config);
    setTechObjects(preset.objects);
    setSelectedObjectId(null);
    recordHistory();
  };

  const handleLoadBuildingPreset = (presetKey: string) => {
    const preset = BUILDING_PRESETS[presetKey];
    if (!preset) return;
    setBuildingConfig(preset.config);
    setBuildingObjects(preset.objects);
    setSelectedObjectId(null);
    recordHistory();
  };

  // Add new Object
  const handleAddObject = (newObj: CADObject) => {
    setObjectsForCurrentSection(prev => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
    recordHistory();
  };

  // Update Object
  const handleUpdateObject = (updated: CADObject) => {
    setObjectsForCurrentSection(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  };

  // Batch Update Objects
  const handleUpdateObjects = (updatedObjects: CADObject[]) => {
    if (section === 'technology') {
      setTechObjects(updatedObjects);
    } else {
      setBuildingObjects(updatedObjects);
    }
  };

  // Delete Object
  const handleDeleteObject = (id: string) => {
    setObjectsForCurrentSection(prev => prev.filter(o => o.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
    recordHistory();
  };

  // Duplicate Object
  const handleDuplicateObject = (obj: CADObject) => {
    const duplicate: CADObject = {
      ...obj,
      id: `${obj.id}_dup_${Date.now()}`,
      name: `${obj.name} (Copy)`,
      position: [obj.position[0] + 5, obj.position[1] + 5, obj.position[2] + 5],
    };
    handleAddObject(duplicate);
  };

  // Update Object Transform directly from Gizmo / Viewport
  const handleUpdateObjectTransform = (
    id: string,
    transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }
  ) => {
    setObjectsForCurrentSection(prev =>
      prev.map(o => (o.id === id ? { ...o, ...transform } : o))
    );
  };

  // Apply Material from Material Library Modal
  const handleApplyMaterial = (material: CADMaterial, scope: 'selected' | 'category' | 'all') => {
    if (scope === 'selected' && selectedObjectId) {
      setObjectsForCurrentSection(prev =>
        prev.map(o => (o.id === selectedObjectId ? { ...o, material } : o))
      );
    } else if (scope === 'category') {
      const targetCategory = selectedObject?.category || 'casing';
      setObjectsForCurrentSection(prev =>
        prev.map(o => (o.category === targetCategory ? { ...o, material } : o))
      );
    } else {
      setObjectsForCurrentSection(prev =>
        prev.map(o => ({ ...o, material }))
      );
    }
    recordHistory();
  };

  // Trigger Snapshot Capture
  const handleTakeSnapshot = async (options: {
    resolutionMultiplier: number;
    transparentBg: boolean;
    includeWatermark: boolean;
    aspectRatio: string;
  }): Promise<SnapshotItem | null> => {
    if (!snapshotExporterRef.current) return null;
    const snap = await snapshotExporterRef.current(options);
    if (snap) {
      setSnapshots(prev => [snap, ...prev]);
    }
    return snap;
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  // Import Project JSON
  const handleImportScene = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.section) {
        setSection(data.section);
      }
      if (Array.isArray(data.objects)) {
        if (data.section === 'building') {
          setBuildingObjects(data.objects);
        } else {
          setTechObjects(data.objects);
        }
      }
      recordHistory();
    } catch (e) {
      console.error('Failed to import JSON scene:', e);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevStep = history[historyIndex - 1];
      if (section === 'technology') {
        setTechObjects(prevStep.objects);
        setDeviceConfig(prevStep.deviceConfig);
      } else {
        setBuildingObjects(prevStep.objects);
        setBuildingConfig(prevStep.buildingConfig);
      }
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextStep = history[historyIndex + 1];
      if (section === 'technology') {
        setTechObjects(nextStep.objects);
        setDeviceConfig(nextStep.deviceConfig);
      } else {
        setBuildingObjects(nextStep.objects);
        setBuildingConfig(nextStep.buildingConfig);
      }
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Restore Design Version from Manager
  const handleRestoreVersion = (version: DesignVersion) => {
    if (section === 'technology') {
      setTechObjects(JSON.parse(JSON.stringify(version.objects)));
    } else {
      setBuildingObjects(JSON.parse(JSON.stringify(version.objects)));
    }
    recordHistory();
  };

  // Clashes computation for header indicator
  const assemblyClashes = useMemo(() => {
    return detectAssemblyClashes(currentObjects, { clearanceToleranceMm: 0.2 });
  }, [currentObjects]);

  const selectedObject = currentObjects.find(o => o.id === selectedObjectId) || null;

  const isLight = themeMode === 'light';
  const isBlueprint = themeMode === 'blueprint';

  return (
    <div
      className={`flex flex-col w-full h-screen overflow-hidden font-sans select-none antialiased transition-colors ${
        isLight
          ? 'bg-slate-100 text-slate-900'
          : isBlueprint
          ? 'bg-[#001733] text-cyan-100'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Top Application Navigation & CAD Toolbar */}
      <Header
        section={section}
        onSelectSection={sec => {
          setSection(sec);
          setSelectedObjectId(null);
        }}
        renderMode={renderMode}
        onChangeRenderMode={setRenderMode}
        lightingPreset={lightingPreset}
        onChangeLightingPreset={setLightingPreset}
        transformMode={transformMode}
        onChangeTransformMode={setTransformMode}
        gridVisible={gridVisible}
        onToggleGrid={() => setGridVisible(!gridVisible)}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        objects={currentObjects}
        onImportScene={handleImportScene}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        themeMode={themeMode}
        onChangeThemeMode={setThemeMode}
        onOpenMaterialLibrary={() => setIsMaterialModalOpen(true)}
        onOpenSnapshotStudio={() => setIsSnapshotModalOpen(true)}
        onOpenPBRReview={() => setIsPBRModalOpen(true)}
        onOpenHolographicStudio={() => setIsHoloStudioOpen(true)}
        onOpenAutoAlign={() => setIsAutoAlignOpen(true)}
        onOpenClashDetection={() => setIsClashModalOpen(true)}
        onOpenKinematics={() => setIsKinematicsOpen(true)}
        onOpenLayerTagManager={() => setIsLayerTagOpen(true)}
        onOpenDesignAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onOpenBOMModal={() => setIsBOMModalOpen(true)}
        onOpenMeasuringTool={() => setIsMeasuringPanelOpen(true)}
        onOpenCommentsModal={() => setIsCommentsModalOpen(true)}
        clashCount={assemblyClashes.length}
        versionCount={versionHistory.length}
        commentCount={comments.filter(c => c.status !== 'resolved').length}
        measurementCount={measurements.length}
      />

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Major Section (Technology CAD) or Secondary (Building CAD) */}
        <div
          className={`w-80 md:w-96 shrink-0 h-full border-r z-10 overflow-hidden transition-colors ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : isBlueprint
              ? 'bg-[#001f44] border-blue-900/60 text-cyan-100'
              : 'bg-zinc-900 border-zinc-800 text-zinc-100'
          }`}
        >
          {section === 'technology' ? (
            <TechnologyDesigner
              config={deviceConfig}
              onChangeConfig={updated => setDeviceConfig(prev => ({ ...prev, ...updated }))}
              objects={techObjects}
              onAddObject={handleAddObject}
              onUpdateObject={handleUpdateObject}
              onUpdateObjects={handleUpdateObjects}
              onDeleteObject={handleDeleteObject}
              onDuplicateObject={handleDuplicateObject}
              onLoadPreset={handleLoadTechPreset}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              constraints={techConstraints}
              onUpdateConstraints={setTechConstraints}
              layers={layers}
              onUpdateLayers={setLayers}
              tags={tags}
              onUpdateTags={setTags}
              activeTagFilter={activeTagFilter}
              onSetActiveTagFilter={setActiveTagFilter}
              joints={kinematicJoints}
              onUpdateJoints={setKinematicJoints}
              onOpenMaterialLibrary={() => setIsMaterialModalOpen(true)}
              onOpenSnapshotStudio={() => setIsSnapshotModalOpen(true)}
              onOpenPBRReview={() => setIsPBRModalOpen(true)}
              onOpenHolographicStudio={() => setIsHoloStudioOpen(true)}
              onOpenAutoAlign={() => setIsAutoAlignOpen(true)}
              onOpenClashDetection={() => setIsClashModalOpen(true)}
              onOpenKinematics={() => setIsKinematicsOpen(true)}
              onOpenDesignAnalytics={() => setIsAnalyticsOpen(true)}
            />
          ) : (
            <BuildingDesigner
              config={buildingConfig}
              onChangeConfig={updated => setBuildingConfig(prev => ({ ...prev, ...updated }))}
              objects={buildingObjects}
              onAddObject={handleAddObject}
              onUpdateObject={handleUpdateObject}
              onLoadPreset={handleLoadBuildingPreset}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
            />
          )}
        </div>

        {/* Center: 3D Interactive WebGL Canvas Viewport */}
        <div className="flex-1 h-full relative overflow-hidden">
          <Viewport3D
            section={section}
            objects={currentObjects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onUpdateObjectTransform={handleUpdateObjectTransform}
            renderMode={renderMode}
            lightingPreset={lightingPreset}
            transformMode={transformMode}
            deviceConfig={deviceConfig}
            buildingConfig={buildingConfig}
            gridVisible={gridVisible}
            snapEnabled={snapEnabled}
            snapStep={snapStep}
            pbrSettings={pbrSettings}
            constraints={techConstraints}
            measurements={measurements}
            onAddMeasurement={m => setMeasurements(prev => [m, ...prev])}
            comments={comments}
            onSelectCommentPin={pinId => {
              const target = comments.find(c => c.id === pinId);
              if (target?.targetPartId) {
                setSelectedObjectId(target.targetPartId);
              }
              setIsCommentsModalOpen(true);
            }}
            themeMode={themeMode}
            onOpenMaterialLibrary={() => setIsMaterialModalOpen(true)}
            onOpenSnapshotStudio={() => setIsSnapshotModalOpen(true)}
            onOpenPBRReview={() => setIsPBRModalOpen(true)}
            onOpenHolographicStudio={() => setIsHoloStudioOpen(true)}
            onOpenMeasuringTool={() => {
              setTransformMode('measure');
              setIsMeasuringPanelOpen(true);
            }}
            onOpenCommentsModal={() => setIsCommentsModalOpen(true)}
            onOpenVersionModal={() => setIsVersionModalOpen(true)}
            onOpenBOMModal={() => setIsBOMModalOpen(true)}
            onRegisterSnapshotCapture={fn => {
              snapshotExporterRef.current = fn;
            }}
          />
        </div>

        {/* Right Side: CAD Properties & Material Inspector Panel */}
        <div
          className={`w-72 md:w-80 shrink-0 h-full border-l z-10 overflow-hidden transition-colors ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : isBlueprint
              ? 'bg-[#001f44] border-blue-900/60 text-cyan-100'
              : 'bg-zinc-900 border-zinc-800 text-zinc-100'
          }`}
        >
          <InspectorPanel
            selectedObject={selectedObject}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            onDuplicateObject={handleDuplicateObject}
            section={section}
            onOpenMaterialLibrary={() => setIsMaterialModalOpen(true)}
          />
        </div>
      </div>

      {/* 1. Design Versioning & Revision History Modal */}
      <VersionManagerModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        currentObjects={currentObjects}
        constraints={techConstraints}
        versionHistory={versionHistory}
        onUpdateVersionHistory={setVersionHistory}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* 2. Bill of Materials (BOM) Datasheet & Cost Analysis Modal */}
      <BOMExportModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        objects={currentObjects}
        assemblyName={
          section === 'technology'
            ? `${deviceConfig.dimensions.width}x${deviceConfig.dimensions.height}mm ${deviceConfig.category || 'Tech'} Hardware Assembly`
            : `${buildingConfig.style} Architectural BIM Project`
        }
      />

      {/* 3. 3D Measuring Tool Floating Drawer / Modal */}
      {isMeasuringPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <MeasuringToolPanel
            objects={currentObjects}
            selectedObjectId={selectedObjectId}
            measurements={measurements}
            onUpdateMeasurements={setMeasurements}
            activeMeasureMode={activeMeasureMode}
            onSetMeasureMode={mode => {
              setActiveMeasureMode(mode);
              setTransformMode('measure');
            }}
            onClearAllMeasurements={() => setMeasurements([])}
            onClose={() => {
              setIsMeasuringPanelOpen(false);
              setTransformMode('select');
            }}
          />
        </div>
      )}

      {/* 4. Collaborative Spatial 3D Comments & Pin Markup Modal */}
      <CollaborativeCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        comments={comments}
        onUpdateComments={setComments}
        objects={currentObjects}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
      />

      {/* Material Library Modal */}
      <MaterialLibraryModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        selectedObject={selectedObject}
        onApplyMaterial={handleApplyMaterial}
      />

      {/* View Snapshot Studio & Gallery Modal */}
      <SnapshotStudioModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        snapshots={snapshots}
        onTakeSnapshot={handleTakeSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        currentSection={section}
      />

      {/* Real-time PBR Review & Shader Diagnostics Modal */}
      <PBRReviewModal
        isOpen={isPBRModalOpen}
        onClose={() => setIsPBRModalOpen(false)}
        settings={pbrSettings}
        onChangeSettings={updated => setPbrSettings(prev => ({ ...prev, ...updated }))}
        selectedObject={selectedObject}
        onUpdateMaterial={mat => {
          if (selectedObjectId) {
            handleApplyMaterial(mat, 'selected');
          }
        }}
        onOpenMaterialLibrary={() => {
          setIsPBRModalOpen(false);
          setIsMaterialModalOpen(true);
        }}
        onOpenSnapshotStudio={() => {
          setIsPBRModalOpen(false);
          setIsSnapshotModalOpen(true);
        }}
      />

      {/* Holographic Exploded View & Timeline Studio Modal */}
      <HolographicExplodedStudio
        isOpen={isHoloStudioOpen}
        onClose={() => setIsHoloStudioOpen(false)}
        config={deviceConfig}
        onChangeConfig={updated => setDeviceConfig(prev => ({ ...prev, ...updated }))}
        objects={techObjects}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
        onOpenSnapshotStudio={() => {
          setIsHoloStudioOpen(false);
          setIsSnapshotModalOpen(true);
        }}
      />

      {/* Smart Assembly Auto Align Modal */}
      {isAutoAlignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <SmartAutoAlignPanel
            objects={currentObjects}
            selectedObjectId={selectedObjectId}
            onUpdateObjects={handleUpdateObjects}
            onClose={() => setIsAutoAlignOpen(false)}
          />
        </div>
      )}

      {/* Advanced Clash Detection System Modal */}
      <ClashDetectionModal
        isOpen={isClashModalOpen}
        onClose={() => setIsClashModalOpen(false)}
        objects={currentObjects}
        onUpdateObjects={handleUpdateObjects}
        onSelectObject={setSelectedObjectId}
      />

      {/* Kinematic Motion Player Studio Modal */}
      {isKinematicsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <KinematicMotionStudio
            objects={currentObjects}
            joints={kinematicJoints}
            onUpdateJoints={setKinematicJoints}
            onUpdateObjects={handleUpdateObjects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onClose={() => setIsKinematicsOpen(false)}
          />
        </div>
      )}

      {/* CAD Layer & Metadata Tagging Manager Modal */}
      {isLayerTagOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <LayerTagManager
            objects={currentObjects}
            onUpdateObjects={handleUpdateObjects}
            layers={layers}
            onUpdateLayers={setLayers}
            tags={tags}
            onUpdateTags={setTags}
            selectedObjectId={selectedObjectId}
            activeTagFilter={activeTagFilter}
            onSetActiveTagFilter={setActiveTagFilter}
            onClose={() => setIsLayerTagOpen(false)}
          />
        </div>
      )}

      {/* Design Analytics & Engineering Telemetry Modal */}
      <DesignAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        objects={currentObjects}
        onOpenSnapshotStudio={() => {
          setIsAnalyticsOpen(false);
          setIsSnapshotModalOpen(true);
        }}
      />
    </div>
  );
}
