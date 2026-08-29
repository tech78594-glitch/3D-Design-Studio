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
import { CommandPaletteModal } from './components/shared/CommandPaletteModal';
import { ExplodedAnimationPlayer } from './components/shared/ExplodedAnimationPlayer';
import { AutoOrientationModal } from './components/shared/AutoOrientationModal';
import { BatchExportModal } from './components/shared/BatchExportModal';
import { HotkeyLegendModal } from './components/shared/HotkeyLegendModal';
import { SketchAnnotationStudio } from './components/shared/SketchAnnotationStudio';
import { ARPreviewModal } from './components/shared/ARPreviewModal';
import { MassCalculatorModal } from './components/shared/MassCalculatorModal';
import { SmartEdgeInspectorPanel } from './components/shared/SmartEdgeInspectorPanel';
import { ExplodedViewEditorModal } from './components/shared/ExplodedViewEditorModal';
import { ProjectCollaborationChatModal } from './components/shared/ProjectCollaborationChatModal';
import { AutoTextureModal } from './components/shared/AutoTextureModal';
import { PhysicsSimulationModal } from './components/shared/PhysicsSimulationModal';
import { DesignEngineModal } from './components/shared/DesignEngineModal';
import { VoiceCommandInterface } from './components/shared/VoiceCommandInterface';
import { ChatMessage, LiveUserCursor } from './types/collaboration';
import { VoiceCommandMatch } from './utils/voiceCommand';
import { exportSceneToSTL, exportSceneToOBJ, exportSceneTo3MF } from './utils/cadEngine';
import { detectAssemblyClashes } from './utils/clashDetection';
import { createVersionSnapshot } from './utils/versionManager';
import {
  CADEdge,
  ExplodedTrailsSettings,
} from './types/cad';
import { DEFAULT_EXPLODED_TRAILS_SETTINGS } from './utils/explodedTrails';
import {
  useAutoSave,
  loadStudioSession,
  exportBackupJSON,
  clearAutoSavedSession,
  AutoSaveData,
  AutoSaveIntervalOption,
  loadAutoSaveIntervalPref,
  saveAutoSaveIntervalPref,
  getAutoSaveIntervalMs,
} from './utils/autoSave';
import confetti from 'canvas-confetti';

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

  // Collaborative Spatial 3D Comments & Pin Annotations
  const [comments, setComments] = useState<CADCommentPin[]>([
    {
      id: 'comment_init_1',
      author: 'Lead DFM Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      title: 'Thermal Venting Path Validation',
      body: 'Verified internal heatsink clearance against graphite vapor chamber. 0.4mm air gap maintained across CNC perimeter.',
      position: [0, 30, 4.5],
      normal: [0, 0, 1],
      targetPartId: 'part_chassis_outer',
      targetPartName: 'Titanium Perimeter Chassis Frame',
      category: 'thermal',
      priority: 'high',
      status: 'in_review',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      replies: [
        {
          id: 'reply_init_1',
          author: 'CAD Modeler',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
          body: 'Added fillet chamfers to reduce turbulence around the camera module perimeter.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    },
    {
      id: 'comment_init_2',
      author: 'Optics Architect',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80',
      title: 'Periscope Telephoto Lens Z-Height',
      body: 'Lens bump protrusion capped at 2.4mm above back sapphire plate to ensure table stability when flat.',
      position: [18, 52, 6],
      normal: [0, 0, 1],
      targetPartId: 'part_camera_module',
      targetPartName: 'Triple Lens Camera & LiDAR Array',
      category: 'geometry',
      priority: 'medium',
      status: 'resolved',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      replies: [],
    },
  ]);

  // Design Versioning & Revisions
  const [versionHistory, setVersionHistory] = useState<DesignVersion[]>([
    createVersionSnapshot(
      DEVICE_PRESETS.smartphone_pro.objects,
      'v1.0.0-PROTOTYPE',
      'Initial Concept Baseline',
      'Initial parametric architecture with triple lens camera and monolithic chassis frame.'
    ),
    createVersionSnapshot(
      DEVICE_PRESETS.smartphone_pro.objects,
      'v1.1.0-THERMAL',
      'Thermal & Structural Optimization',
      'Added dual graphite heat spreaders, increased battery cavity tolerance, and refined chamfers.'
    ),
  ]);

  // High-Resolution Snapshot Gallery
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);

  // Studio Modals Visibility State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isPBRModalOpen, setIsPBRModalOpen] = useState(false);
  const [isHoloStudioOpen, setIsHoloStudioOpen] = useState(false);
  const [isAutoAlignOpen, setIsAutoAlignOpen] = useState(false);
  const [isClashModalOpen, setIsClashModalOpen] = useState(false);
  const [isKinematicsOpen, setIsKinematicsOpen] = useState(false);
  const [isLayerTagOpen, setIsLayerTagOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isMeasuringPanelOpen, setIsMeasuringPanelOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  // New Requested Feature States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExplodedPlayerOpen, setIsExplodedPlayerOpen] = useState(false);
  const [isAutoOrientationOpen, setIsAutoOrientationOpen] = useState(false);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [isHotkeyLegendOpen, setIsHotkeyLegendOpen] = useState(false);
  const [isSketchAnnotationOpen, setIsSketchAnnotationOpen] = useState(false);
  const [isARPreviewOpen, setIsARPreviewOpen] = useState(false);
  const [isMassCalculatorOpen, setIsMassCalculatorOpen] = useState(false);

  // Additional 13 Features Studio States
  const [isExplodedEditorOpen, setIsExplodedEditorOpen] = useState(false);
  const [isProjectChatOpen, setIsProjectChatOpen] = useState(false);
  const [isAutoTextureOpen, setIsAutoTextureOpen] = useState(false);
  const [isPhysicsSimOpen, setIsPhysicsSimOpen] = useState(false);
  const [isDesignEngineOpen, setIsDesignEngineOpen] = useState(false);
  const [isVoiceCommandOpen, setIsVoiceCommandOpen] = useState(false);

  // Auto Save Interval Preference State
  const [autoSaveIntervalPref, setAutoSaveIntervalPref] = useState<AutoSaveIntervalOption>(loadAutoSaveIntervalPref);

  // Team Collaboration Messages State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'chat_init_1',
      author: 'Lead DFM Engineer',
      avatarColor: '#38bdf8',
      channel: 'general',
      text: 'Verified 3MF export specifications and parametric tolerances across all assembly layers.',
      timestamp: '02:15 PM',
    },
    {
      id: 'chat_init_2',
      author: 'Optics Architect',
      avatarColor: '#a78bfa',
      channel: 'dfm-review',
      text: 'Triple lens camera module Z-height clearance confirmed at 2.4mm.',
      timestamp: '02:18 PM',
    },
  ]);

  // Collaborative Live Cursors State
  const [onlineUsers, setOnlineUsers] = useState<LiveUserCursor[]>([
    {
      id: 'usr_sarah',
      name: 'Sarah (DFM)',
      avatarColor: '#38bdf8',
      x: 35,
      y: 42,
      activeTool: 'Measuring Tool',
      selectedPartName: 'Titanium Chassis',
      lastActive: Date.now(),
    },
    {
      id: 'usr_alex',
      name: 'Alex (Optics)',
      avatarColor: '#a78bfa',
      x: 68,
      y: 28,
      activeTool: 'PBR Diagnostics',
      selectedPartName: 'Camera Module',
      lastActive: Date.now(),
    },
  ]);

  // Smart Edge Selection & Feature Highlighting State
  const [isEdgeSelectionMode, setIsEdgeSelectionMode] = useState(false);
  const [selectedEdges, setSelectedEdges] = useState<CADEdge[]>([]);
  const [isEdgeInspectorOpen, setIsEdgeInspectorOpen] = useState(false);

  // Interactive Exploded Trails Settings State
  const [showExplodedTrails, setShowExplodedTrails] = useState(true);
  const [explodedTrailsSettings, setExplodedTrailsSettings] = useState<ExplodedTrailsSettings>(DEFAULT_EXPLODED_TRAILS_SETTINGS);

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

  // Hook for Debounced Auto-Save Persistence
  const { autoSaveState, triggerImmediateSave, clearAutoSave } = useAutoSave({
    techObjects,
    buildingObjects,
    deviceConfig,
    buildingConfig,
    section,
    layers,
    tags,
    kinematicJoints,
    techConstraints,
    measurements,
    comments,
    versionHistory,
    themeMode,
    debounceMs: getAutoSaveIntervalMs(autoSaveIntervalPref) || 30000,
  });

  const handleChangeAutoSaveIntervalPref = (pref: AutoSaveIntervalOption) => {
    setAutoSaveIntervalPref(pref);
    saveAutoSaveIntervalPref(pref);
  };

  // Restore state from auto-saved session data
  const handleRestoreFromAutoSave = (customData?: AutoSaveData | null) => {
    const dataToLoad = customData || loadStudioSession();
    if (!dataToLoad) return;

    if (dataToLoad.techObjects && Array.isArray(dataToLoad.techObjects)) {
      setTechObjects(dataToLoad.techObjects);
    }
    if (dataToLoad.buildingObjects && Array.isArray(dataToLoad.buildingObjects)) {
      setBuildingObjects(dataToLoad.buildingObjects);
    }
    if (dataToLoad.deviceConfig) {
      setDeviceConfig(dataToLoad.deviceConfig);
    }
    if (dataToLoad.buildingConfig) {
      setBuildingConfig(dataToLoad.buildingConfig);
    }
    if (dataToLoad.section) {
      setSection(dataToLoad.section);
    }
    if (dataToLoad.layers && Array.isArray(dataToLoad.layers)) {
      setLayers(dataToLoad.layers);
    }
    if (dataToLoad.tags && Array.isArray(dataToLoad.tags)) {
      setTags(dataToLoad.tags);
    }
    if (dataToLoad.kinematicJoints && Array.isArray(dataToLoad.kinematicJoints)) {
      setKinematicJoints(dataToLoad.kinematicJoints);
    }
    if (dataToLoad.techConstraints && Array.isArray(dataToLoad.techConstraints)) {
      setTechConstraints(dataToLoad.techConstraints);
    }
    if (dataToLoad.measurements && Array.isArray(dataToLoad.measurements)) {
      setMeasurements(dataToLoad.measurements);
    }
    if (dataToLoad.comments && Array.isArray(dataToLoad.comments)) {
      setComments(dataToLoad.comments);
    }
    if (dataToLoad.versionHistory && Array.isArray(dataToLoad.versionHistory)) {
      setVersionHistory(dataToLoad.versionHistory);
    }
    if (dataToLoad.themeMode) {
      setThemeMode(dataToLoad.themeMode);
    }

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.1 } });
    recordHistory();
  };

  const handleForceSave = () => {
    triggerImmediateSave();
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.1 } });
  };

  const handleClearAutoSave = () => {
    clearAutoSave();
  };

  const handleExportBackupFile = () => {
    exportBackupJSON({
      techObjects,
      buildingObjects,
      deviceConfig,
      buildingConfig,
      section,
      layers,
      tags,
      kinematicJoints,
      techConstraints,
      measurements,
      comments,
      versionHistory,
      themeMode,
    });
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input, textarea or contenteditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K: Quick Commands & Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Cmd+S / Ctrl+S: Quick Save Snapshot
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleForceSave();
        return;
      }

      // Cmd+E / Ctrl+E: Batch Export
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsBatchExportOpen(prev => !prev);
        return;
      }

      if (isInput) return;

      // Hotkey Legend: '?'
      if (e.key === '?') {
        setIsHotkeyLegendOpen(prev => !prev);
        return;
      }

      // Single Key Hotkeys when no input is focused
      if (e.key === 'v' || e.key === 'V') {
        if (!e.ctrlKey && !e.metaKey) {
          setIsVersionModalOpen(prev => !prev);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        if (!e.ctrlKey && !e.metaKey) {
          setIsBOMModalOpen(prev => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey) {
          setTransformMode(prev => (prev === 'measure' ? 'select' : 'measure'));
          setIsMeasuringPanelOpen(prev => !prev);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.metaKey) {
          setIsCommentsModalOpen(prev => !prev);
        }
      } else if (e.key === 'g' || e.key === 'G') {
        if (!e.ctrlKey && !e.metaKey) {
          setGridVisible(prev => !prev);
        }
      } else if (e.key === 'o' || e.key === 'O') {
        if (!e.ctrlKey && !e.metaKey) {
          setIsAutoOrientationOpen(prev => !prev);
        }
      } else if (e.key === 'a' || e.key === 'A') {
        if (e.altKey) {
          e.preventDefault();
          setIsARPreviewOpen(prev => !prev);
        } else if (!e.ctrlKey && !e.metaKey) {
          setIsSketchAnnotationOpen(prev => !prev);
        }
      } else if (e.key === 'q' || e.key === 'Q') {
        if (!e.ctrlKey && !e.metaKey) {
          setTransformMode('select');
        }
      } else if (e.key === 'w' || e.key === 'W') {
        if (!e.ctrlKey && !e.metaKey) {
          setTransformMode('translate');
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (!e.ctrlKey && !e.metaKey) {
          setTransformMode('rotate');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (e.altKey) {
          e.preventDefault();
          setIsARPreviewOpen(prev => !prev);
        } else if (!e.ctrlKey && !e.metaKey) {
          setTransformMode('scale');
        }
      } else if (e.key === '1') {
        setRenderMode('shaded');
      } else if (e.key === '2') {
        setRenderMode('wireframe');
      } else if (e.key === '3') {
        setRenderMode('xray');
      } else if (e.key === ' ') {
        // Spacebar: Toggle Exploded Animation Player
        e.preventDefault();
        setIsExplodedPlayerOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [techObjects, deviceConfig, buildingConfig]);

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
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAutoOrientation={() => setIsAutoOrientationOpen(true)}
        onOpenBatchExport={() => setIsBatchExportOpen(true)}
        onOpenHotkeyLegend={() => setIsHotkeyLegendOpen(true)}
        onOpenSketchAnnotation={() => setIsSketchAnnotationOpen(true)}
        onOpenARPreview={() => setIsARPreviewOpen(true)}
        onOpenMassCalculator={() => setIsMassCalculatorOpen(true)}
        onToggleEdgeSelection={() => {
          setIsEdgeSelectionMode(prev => {
            const next = !prev;
            if (next) setIsEdgeInspectorOpen(true);
            return next;
          });
        }}
        isEdgeSelectionActive={isEdgeSelectionMode}
        isAutoOrientationOpen={isAutoOrientationOpen}
        isBatchExportOpen={isBatchExportOpen}
        isHotkeyLegendOpen={isHotkeyLegendOpen}
        isSketchAnnotationOpen={isSketchAnnotationOpen}
        isARPreviewOpen={isARPreviewOpen}
        onToggleExplodedPlayer={() => setIsExplodedPlayerOpen(prev => !prev)}
        isExplodedPlayerOpen={isExplodedPlayerOpen}
        autoSaveTime={autoSaveState.lastSavedTime}
        isAutoSaving={autoSaveState.isSaving}
        onForceSave={handleForceSave}
        onRestoreAutoSave={() => handleRestoreFromAutoSave()}
        onClearAutoSave={handleClearAutoSave}
        onExportBackup={handleExportBackupFile}
        clashCount={assemblyClashes.length}
        versionCount={versionHistory.length}
        commentCount={comments.filter(c => c.status !== 'resolved').length}
        measurementCount={measurements.length}
        onOpenExplodedEditor={() => setIsExplodedEditorOpen(true)}
        onOpenProjectChat={() => setIsProjectChatOpen(true)}
        onOpenAutoTexture={() => setIsAutoTextureOpen(true)}
        onOpenPhysicsSim={() => setIsPhysicsSimOpen(true)}
        onOpenDesignEngine={() => setIsDesignEngineOpen(true)}
        onOpenVoiceCommand={() => setIsVoiceCommandOpen(true)}
        autoSaveIntervalPref={autoSaveIntervalPref}
        onChangeAutoSaveIntervalPref={handleChangeAutoSaveIntervalPref}
      />

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
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
            isEdgeSelectionMode={isEdgeSelectionMode}
            selectedEdges={selectedEdges}
            onSelectEdge={(edge, loop) => {
              if (edge) {
                setSelectedEdges(loop && loop.length > 0 ? loop : [edge]);
                setIsEdgeInspectorOpen(true);
              } else {
                setSelectedEdges([]);
              }
            }}
            showExplodedTrails={showExplodedTrails}
            explodedTrailsSettings={explodedTrailsSettings}
            liveCursors={onlineUsers}
          />

          {/* Floating Smart Edge Inspector Dock */}
          <SmartEdgeInspectorPanel
            isActive={isEdgeSelectionMode && isEdgeInspectorOpen}
            onToggleActive={active => {
              setIsEdgeInspectorOpen(active);
              if (!active) setIsEdgeSelectionMode(false);
            }}
            selectedEdges={selectedEdges}
            onClearSelection={() => setSelectedEdges([])}
            onSelectLoop={() => {}}
            onApplyFillet={() => {}}
            onApplyChamfer={() => {}}
          />

          {/* Floating Exploded View Animation Player Dock */}
          {isExplodedPlayerOpen && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-full px-4 animate-in slide-in-from-bottom-3 duration-200">
              <ExplodedAnimationPlayer
                deviceConfig={deviceConfig}
                onChangeDeviceConfig={updated => setDeviceConfig(prev => ({ ...prev, ...updated }))}
                onClose={() => setIsExplodedPlayerOpen(false)}
              />
            </div>
          )}
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
            onOpenAutoOrientation={() => setIsAutoOrientationOpen(true)}
            onOpenARPreview={() => setIsARPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Global Quick Commands & Search Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        objects={currentObjects}
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
        onSelectSection={sec => {
          setSection(sec);
          setSelectedObjectId(null);
        }}
        section={section}
        renderMode={renderMode}
        onChangeRenderMode={setRenderMode}
        lightingPreset={lightingPreset}
        onChangeLightingPreset={setLightingPreset}
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
        onOpenMeasuringTool={() => {
          setTransformMode('measure');
          setIsMeasuringPanelOpen(true);
        }}
        onOpenCommentsModal={() => setIsCommentsModalOpen(true)}
        onOpenAutoOrientation={() => setIsAutoOrientationOpen(true)}
        onOpenBatchExport={() => setIsBatchExportOpen(true)}
        onOpenHotkeyLegend={() => setIsHotkeyLegendOpen(true)}
        onOpenSketchAnnotation={() => setIsSketchAnnotationOpen(true)}
        onOpenARPreview={() => setIsARPreviewOpen(true)}
        onToggleExplodedPlayer={() => setIsExplodedPlayerOpen(prev => !prev)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onForceSave={handleForceSave}
        onRestoreAutoSave={() => handleRestoreFromAutoSave()}
        onLoadTechPreset={handleLoadTechPreset}
        onLoadBuildingPreset={handleLoadBuildingPreset}
      />

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

      {/* 5. 3D Print Auto-Orientation & DFM Solver Modal */}
      <AutoOrientationModal
        isOpen={isAutoOrientationOpen}
        onClose={() => setIsAutoOrientationOpen(false)}
        objects={currentObjects}
        selectedObjectId={selectedObjectId}
        onApplyOrientation={(partId, eulerRot) => {
          setObjectsForCurrentSection(prev =>
            prev.map(o => (o.id === partId ? { ...o, rotation: eulerRot } : o))
          );
          recordHistory();
        }}
      />

      {/* 6. Batch CAD Mesh Exporter & ZIP Package Bundler */}
      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        objects={currentObjects}
        assemblyName={
          section === 'technology'
            ? `${deviceConfig.name || 'Hardware'} Assembly`
            : `${buildingConfig.style} Architectural BIM Project`
        }
        deviceConfig={deviceConfig}
        buildingConfig={buildingConfig}
      />

      {/* 7. Hotkey & Keyboard Shortcut Interactive Cheatsheet */}
      <HotkeyLegendModal
        isOpen={isHotkeyLegendOpen}
        onClose={() => setIsHotkeyLegendOpen(false)}
      />

      {/* 8. 2D/3D Sketch Annotation & Engineering Markup Studio */}
      <SketchAnnotationStudio
        isOpen={isSketchAnnotationOpen}
        onClose={() => setIsSketchAnnotationOpen(false)}
        objects={currentObjects}
        assemblyName={
          section === 'technology'
            ? `${deviceConfig.name || 'Hardware'} CAD Model`
            : `${buildingConfig.style} Architectural Design`
        }
      />

      {/* 9. AR Preview & Real-World Spatial Placement Studio Modal */}
      <ARPreviewModal
        isOpen={isARPreviewOpen}
        onClose={() => setIsARPreviewOpen(false)}
        objects={currentObjects}
        assemblyName={
          section === 'technology'
            ? `${deviceConfig.name || 'Hardware'} Assembly`
            : `${buildingConfig.style} BIM Model`
        }
        selectedObjectId={selectedObjectId}
      />

      {/* 10. Real-time Assembly Mass Calculator & Physical Dynamics Modal */}
      <MassCalculatorModal
        isOpen={isMassCalculatorOpen}
        onClose={() => setIsMassCalculatorOpen(false)}
        objects={currentObjects}
        assemblyName={
          section === 'technology'
            ? `${deviceConfig.name || 'Hardware'} Assembly`
            : `${buildingConfig.style} Architectural BIM Project`
        }
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
      />

      {/* 11. Exploded View & Disassembly Sequence Editor Modal */}
      <ExplodedViewEditorModal
        isOpen={isExplodedEditorOpen}
        onClose={() => setIsExplodedEditorOpen(false)}
        deviceConfig={deviceConfig}
        onChangeDeviceConfig={setDeviceConfig}
        objects={currentObjects}
        onUpdateObject={handleUpdateObject}
      />

      {/* 12. Project Collaboration Team Chat Modal */}
      <ProjectCollaborationChatModal
        isOpen={isProjectChatOpen}
        onClose={() => setIsProjectChatOpen(false)}
        messages={chatMessages}
        onSendMessage={msg => setChatMessages(prev => [...prev, msg])}
        objects={currentObjects}
        onlineUsers={onlineUsers}
      />

      {/* 13. Automatic AI PBR Texture Generator Modal */}
      <AutoTextureModal
        isOpen={isAutoTextureOpen}
        onClose={() => setIsAutoTextureOpen(false)}
        selectedObject={selectedObject}
        onApplyMaterial={(objId, mat) => {
          const targetObj = currentObjects.find(o => o.id === objId);
          if (targetObj) {
            handleUpdateObject({ ...targetObj, material: mat });
          }
        }}
      />

      {/* 14. 3D Rigid Body Physics Simulation Studio Modal */}
      <PhysicsSimulationModal
        isOpen={isPhysicsSimOpen}
        onClose={() => setIsPhysicsSimOpen(false)}
        objects={currentObjects}
        onUpdateObjectPositions={transformMap => {
          setObjectsForCurrentSection(prev =>
            prev.map(o => {
              const tr = transformMap.get(o.id);
              return tr ? { ...o, position: tr.position, rotation: tr.rotation } : o;
            })
          );
        }}
      />

      {/* 15. Generative AI CAD Design Engine Modal */}
      <DesignEngineModal
        isOpen={isDesignEngineOpen}
        onClose={() => setIsDesignEngineOpen(false)}
        section={section}
        onGenerateDesign={newObjects => {
          setObjectsForCurrentSection(prev => [...prev, ...newObjects]);
          recordHistory();
        }}
      />

      {/* 16. Voice Command Interface Modal */}
      <VoiceCommandInterface
        isOpen={isVoiceCommandOpen}
        onClose={() => setIsVoiceCommandOpen(false)}
        onExecuteCommand={match => {
          switch (match.action) {
            case 'explode':
              setDeviceConfig(prev => ({
                ...prev,
                explodedAmount: prev.explodedAmount > 0.1 ? 0 : 0.8,
                starkModeEnabled: prev.explodedAmount <= 0.1,
              }));
              break;
            case 'blueprint':
              setRenderMode('blueprint');
              setThemeMode('blueprint');
              break;
            case 'shaded':
              setRenderMode('shaded');
              break;
            case 'wireframe':
              setRenderMode('wireframe');
              break;
            case 'xray':
              setRenderMode('xray');
              break;
            case 'export_3mf':
              exportSceneTo3MF(currentObjects, `${section}_Assembly`).then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${section}_assembly_${Date.now()}.3mf`;
                link.click();
              });
              break;
            case 'export_stl':
              const stlData = exportSceneToSTL(currentObjects);
              const blob = new Blob([stlData], { type: 'text/plain' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `${section}_model_${Date.now()}.stl`;
              link.click();
              break;
            case 'mass_calculator':
              setIsMassCalculatorOpen(true);
              break;
            case 'edge_selection':
              setIsEdgeSelectionMode(prev => !prev);
              break;
            case 'physics_sim':
              setIsPhysicsSimOpen(true);
              break;
            case 'design_engine':
              setIsDesignEngineOpen(true);
              break;
            case 'chat':
              setIsProjectChatOpen(true);
              break;
            case 'auto_texture':
              setIsAutoTextureOpen(true);
              break;
            case 'toggle_grid':
              setGridVisible(prev => !prev);
              break;
          }
        }}
      />
    </div>
  );
}
