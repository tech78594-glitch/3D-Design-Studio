import React, { useState } from 'react';
import {
  CADObject,
  DeviceConfig,
  ShapePrimitive,
  CADMaterial,
  CADConstraint,
} from '../../types/cad';
import { DEVICE_PRESETS } from './DevicePresets';
import { MATERIAL_PRESETS } from '../../utils/materials';
import { ComponentHierarchyTree } from '../shared/ComponentHierarchyTree';
import { AssemblyConstraintManager } from '../shared/AssemblyConstraintManager';
import { SmartAutoAlignPanel } from '../shared/SmartAutoAlignPanel';
import { LayerTagManager } from '../shared/LayerTagManager';
import { KinematicMotionStudio } from '../shared/KinematicMotionStudio';
import {
  CADLayer,
  CADTag,
  KinematicJoint,
  DEFAULT_CAD_LAYERS,
  DEFAULT_CAD_TAGS,
} from '../../types/cad';
import {
  Cpu,
  Layers,
  Flame,
  Scissors,
  Sliders,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Gauge,
  Thermometer,
  Eye,
  Maximize,
  Boxes,
  Radio,
  Settings2,
  Paintbrush,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Move,
  Target,
  FolderTree,
  Link2,
  AlignHorizontalJustifyCenter,
  AlertTriangle,
  PlayCircle,
  Tag,
  BarChart3,
} from 'lucide-react';

interface TechnologyDesignerProps {
  config: DeviceConfig;
  onChangeConfig: (updated: Partial<DeviceConfig>) => void;
  objects: CADObject[];
  onAddObject: (newObj: CADObject) => void;
  onUpdateObject: (updated: CADObject) => void;
  onUpdateObjects?: (updated: CADObject[]) => void;
  onDeleteObject?: (id: string) => void;
  onDuplicateObject?: (obj: CADObject) => void;
  onLoadPreset: (presetKey: string) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  constraints?: CADConstraint[];
  onUpdateConstraints?: (constraints: CADConstraint[]) => void;
  layers?: CADLayer[];
  onUpdateLayers?: (layers: CADLayer[]) => void;
  tags?: CADTag[];
  onUpdateTags?: (tags: CADTag[]) => void;
  activeTagFilter?: string | null;
  onSetActiveTagFilter?: (tagId: string | null) => void;
  joints?: KinematicJoint[];
  onUpdateJoints?: (joints: KinematicJoint[]) => void;
  onOpenMaterialLibrary?: () => void;
  onOpenSnapshotStudio?: () => void;
  onOpenPBRReview?: () => void;
  onOpenHolographicStudio?: () => void;
  onOpenAutoAlign?: () => void;
  onOpenClashDetection?: () => void;
  onOpenKinematics?: () => void;
  onOpenDesignAnalytics?: () => void;
}

export const TechnologyDesigner: React.FC<TechnologyDesignerProps> = ({
  config,
  onChangeConfig,
  objects,
  onAddObject,
  onUpdateObject,
  onUpdateObjects = () => {},
  onDeleteObject,
  onDuplicateObject,
  onLoadPreset,
  selectedObjectId,
  onSelectObject,
  constraints = [],
  onUpdateConstraints = () => {},
  layers = DEFAULT_CAD_LAYERS,
  onUpdateLayers = () => {},
  tags = DEFAULT_CAD_TAGS,
  onUpdateTags = () => {},
  activeTagFilter = null,
  onSetActiveTagFilter = () => {},
  joints = [],
  onUpdateJoints = () => {},
  onOpenMaterialLibrary,
  onOpenSnapshotStudio,
  onOpenPBRReview,
  onOpenHolographicStudio,
  onOpenAutoAlign,
  onOpenClashDetection,
  onOpenKinematics,
  onOpenDesignAnalytics,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'hierarchy'
    | 'constraints'
    | 'align'
    | 'kinematics'
    | 'layers'
    | 'ironman'
    | 'assembly'
    | 'parametric'
    | 'presets'
    | 'components'
    | 'thermal'
    | 'bom'
  >('hierarchy');
  const [isStarkPlaying, setIsStarkPlaying] = useState(false);

  // Quick Stark Hologram Sequence Animator
  const toggleStarkAnimation = () => {
    if (isStarkPlaying) {
      setIsStarkPlaying(false);
      return;
    }
    setIsStarkPlaying(true);
    onChangeConfig({ starkModeEnabled: true });

    let currentVal = config.starkSeparationAmount ?? 0;
    let step = 0.04;
    let increasing = currentVal < 0.5;

    const interval = setInterval(() => {
      currentVal = increasing ? currentVal + step : currentVal - step;
      if (currentVal >= 1.5) increasing = false;
      if (currentVal <= 0.1) increasing = true;

      onChangeConfig({
        starkSeparationAmount: Math.max(0, Math.min(2, currentVal)),
      });
    }, 40);

    setTimeout(() => {
      clearInterval(interval);
      setIsStarkPlaying(false);
    }, 8000);
  };

  // Add Component helper
  const handleAddNewComponent = (
    name: string,
    primitive: ShapePrimitive,
    category: CADObject['category'],
    dims: { width: number; height: number; depth: number; radius?: number },
    material: CADMaterial,
    electricalProps?: CADObject['electricalProps']
  ) => {
    const id = `custom_part_${Date.now()}`;
    const newPart: CADObject = {
      id,
      name,
      category,
      section: 'technology',
      primitive,
      position: [0, 0, 10],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: dims,
      material,
      visible: true,
      locked: false,
      explodeDirection: [0, 0, 1],
      explodeDistance: 40,
      electricalProps,
    };
    onAddObject(newPart);
    onSelectObject(id);
  };

  // Helper to pull an individual part outward in Stark mode
  const handlePullPart = (objId: string, axisOffset: [number, number, number]) => {
    const currentOffsets = { ...(config.starkPullOffsets || {}) };
    currentOffsets[objId] = axisOffset;
    onChangeConfig({
      starkModeEnabled: true,
      starkPullOffsets: currentOffsets,
    });
  };

  const handleResetPartPull = (objId: string) => {
    const currentOffsets = { ...(config.starkPullOffsets || {}) };
    delete currentOffsets[objId];
    onChangeConfig({
      starkPullOffsets: currentOffsets,
    });
  };

  const handleResetAllPulls = () => {
    onChangeConfig({
      starkPullOffsets: {},
      starkSeparationAmount: 0,
      starkModeEnabled: false,
      explodedAmount: 0,
    });
  };

  // Calculate Bill of Materials (BOM) & Specs
  const visibleTechObjects = objects.filter(o => o.section === 'technology' && o.visible);
  const totalPowerWattage = visibleTechObjects.reduce(
    (acc, o) => acc + (o.electricalProps?.heatWattage || 0),
    0
  );
  const maxTemp = Math.max(
    25,
    ...visibleTechObjects.map(o => o.electricalProps?.temperatureC || 25)
  );

  const totalEstimatedWeight = visibleTechObjects.reduce((acc, o) => {
    const volCm3 = (o.dimensions.width * o.dimensions.height * o.dimensions.depth) / 1000;
    let density = 2.0;
    if (o.material.type === 'polished_metal') density = 4.5;
    if (o.material.type === 'anodized_aluminum') density = 2.7;
    if (o.material.type === 'copper') density = 8.9;
    if (o.material.type === 'clear_glass' || o.material.type === 'tinted_glass') density = 2.5;
    if (o.material.type === 'matte_plastic' || o.material.type === 'rubber_grip') density = 1.1;
    return acc + volCm3 * density;
  }, 0);

  return (
    <div id="technology_designer_panel" className="flex flex-col h-full bg-zinc-900 text-zinc-200 border-r border-zinc-800">
      {/* Sub-Header Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-blue-400 border border-zinc-700/60">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              Device CAD Studio
              <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Major Workspace
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-normal">Precision Electronics & Stark Holographic Disassembly</p>
          </div>
        </div>

        {/* Quick Studio Modals */}
        <div className="flex items-center gap-1.5">
          {onOpenHolographicStudio && (
            <button
              onClick={onOpenHolographicStudio}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium transition-colors border border-blue-500/40 shadow-sm"
              title="Open Holographic Exploded Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Holo Studio</span>
            </button>
          )}

          {onOpenPBRReview && (
            <button
              onClick={onOpenPBRReview}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700"
              title="Open Real-time PBR Review Modal"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>PBR Review</span>
            </button>
          )}

          {onOpenMaterialLibrary && (
            <button
              onClick={onOpenMaterialLibrary}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700"
              title="Open CAD Material Library"
            >
              <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
              <span>Materials</span>
            </button>
          )}

          {onOpenSnapshotStudio && (
            <button
              onClick={onOpenSnapshotStudio}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700"
              title="Open High-Res Snapshot Studio"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Snapshot</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-950 border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
        {/* Component Hierarchy Tree Tab */}
        <button
          id="tab_tech_hierarchy"
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'hierarchy'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-600/60 shadow-sm shadow-blue-950/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-blue-400" />
          Hierarchy Tree
        </button>

        {/* Assembly Constraint Manager Tab */}
        <button
          id="tab_tech_constraints"
          onClick={() => setActiveTab('constraints')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'constraints'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-600/60 shadow-sm shadow-blue-950/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Link2 className="w-3.5 h-3.5 text-blue-400" />
          Constraints & Mates
        </button>

        {/* Smart Auto-Align Tab */}
        <button
          id="tab_tech_align"
          onClick={() => setActiveTab('align')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'align'
              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-600/60 shadow-sm shadow-indigo-950/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-indigo-400" />
          Auto Align
        </button>

        {/* Kinematic Motion Player Tab */}
        <button
          id="tab_tech_kinematics"
          onClick={() => setActiveTab('kinematics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'kinematics'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/60 shadow-sm shadow-cyan-950/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
          Kinematics
        </button>

        {/* Layers & Tags Tab */}
        <button
          id="tab_tech_layers"
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'layers'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 shadow-sm shadow-emerald-950/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-400" />
          Layers & Tags
        </button>

        {/* Dedicated Iron Man Disassembly Tab */}
        <button
          id="tab_tech_ironman"
          onClick={() => setActiveTab('ironman')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'ironman'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-600/60 shadow-sm shadow-blue-950/50'
              : 'text-blue-400/80 hover:text-blue-300 hover:bg-zinc-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          Holo Explode
        </button>

        <button
          id="tab_tech_assembly"
          onClick={() => setActiveTab('assembly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'assembly'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Explode & Slicing
        </button>

        <button
          id="tab_tech_parametric"
          onClick={() => setActiveTab('parametric')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'parametric'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          Parametric Casing
        </button>

        <button
          id="tab_tech_presets"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'presets'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Device Presets
        </button>

        <button
          id="tab_tech_components"
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'components'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
          Add Parts
        </button>

        <button
          id="tab_tech_thermal"
          onClick={() => setActiveTab('thermal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'thermal'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          Thermal Sim
        </button>

        <button
          id="tab_tech_bom"
          onClick={() => setActiveTab('bom')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'bom'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
          BOM & Specs
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB: COMPONENT HIERARCHY TREE ================= */}
        {activeTab === 'hierarchy' && (
          <div className="h-full -m-4">
            <ComponentHierarchyTree
              objects={objects}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
              onUpdateObject={onUpdateObject}
              onUpdateObjects={onUpdateObjects || (() => {})}
              onDeleteObject={onDeleteObject || (() => {})}
              onDuplicateObject={onDuplicateObject || (() => {})}
              onOpenMaterialLibrary={onOpenMaterialLibrary}
            />
          </div>
        )}

        {/* ================= TAB: ASSEMBLY CONSTRAINT MANAGER ================= */}
        {activeTab === 'constraints' && (
          <div className="h-full -m-4">
            <AssemblyConstraintManager
              objects={objects}
              constraints={constraints}
              onUpdateConstraints={onUpdateConstraints}
              onUpdateObjects={onUpdateObjects || (() => {})}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
            />
          </div>
        )}

        {/* ================= TAB: SMART AUTO ALIGN ================= */}
        {activeTab === 'align' && (
          <div className="h-full -m-4 p-4">
            <SmartAutoAlignPanel
              objects={objects}
              selectedObjectId={selectedObjectId}
              onUpdateObjects={onUpdateObjects}
            />
          </div>
        )}

        {/* ================= TAB: KINEMATIC MOTION PLAYER ================= */}
        {activeTab === 'kinematics' && (
          <div className="h-full -m-4 p-4">
            <KinematicMotionStudio
              objects={objects}
              joints={joints}
              onUpdateJoints={onUpdateJoints}
              onUpdateObjects={onUpdateObjects}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
            />
          </div>
        )}

        {/* ================= TAB: CAD LAYERS & TAGS ================= */}
        {activeTab === 'layers' && (
          <div className="h-full -m-4 p-4">
            <LayerTagManager
              objects={objects}
              onUpdateObjects={onUpdateObjects}
              layers={layers}
              onUpdateLayers={onUpdateLayers}
              tags={tags}
              onUpdateTags={onUpdateTags}
              selectedObjectId={selectedObjectId}
              activeTagFilter={activeTagFilter}
              onSetActiveTagFilter={onSetActiveTagFilter}
            />
          </div>
        )}

        {/* ================= TAB: IRON MAN / STARK HOLOGRAPHIC DISASSEMBLY ================= */}
        {activeTab === 'ironman' && (
          <div className="space-y-4">
            {/* Primary Stark Mode Activation Box */}
            <div className="bg-zinc-950/80 border border-blue-900/60 p-4 rounded-xl space-y-3.5 shadow-lg shadow-blue-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/80">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                      Stark Holographic Separation
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Multi-dimensional levitation & radial part disassembly
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!config.starkModeEnabled}
                    onChange={e => {
                      onChangeConfig({
                        starkModeEnabled: e.target.checked,
                        starkSeparationAmount: e.target.checked
                          ? (config.starkSeparationAmount || 1.0)
                          : 0,
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Separation Distance Slider */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>3D Separation Distance</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {Math.round((config.starkSeparationAmount ?? (config.starkModeEnabled ? 1 : 0)) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={config.starkSeparationAmount ?? (config.starkModeEnabled ? 1 : 0)}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    onChangeConfig({
                      starkSeparationAmount: val,
                      starkModeEnabled: val > 0,
                    });
                  }}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={toggleStarkAnimation}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40 transition-all"
                  >
                    {isStarkPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isStarkPlaying ? 'Pause Sequence' : 'Animate Breakdown'}</span>
                  </button>

                  <button
                    onClick={handleResetAllPulls}
                    className="py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Snap all parts back into assembled casing"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Assemble</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stark Disassembly Presets */}
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                Disassembly Stages & Subsystems
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    key: 'radial_all',
                    title: 'Full 3D Hologram',
                    desc: 'Spherical expansion of all assemblies',
                    icon: Zap,
                  },
                  {
                    key: 'optics_stack',
                    title: 'Optics & Sensor Stack',
                    desc: 'Telescopic lens separation',
                    icon: Target,
                  },
                  {
                    key: 'power_core',
                    title: 'Power Cell Ejection',
                    desc: 'Battery & charging coil isolate',
                    icon: Flame,
                  },
                  {
                    key: 'logic_board',
                    title: 'Logic SoC Levitation',
                    desc: 'Mainboard & processor hover',
                    icon: Cpu,
                  },
                  {
                    key: 'chassis_orbit',
                    title: 'Chassis Orbital Lift',
                    desc: 'Enclosure lifts off architecture',
                    icon: Boxes,
                  },
                ].map(stage => {
                  const Icon = stage.icon;
                  const isActive = (config.starkSeparationPreset || 'radial_all') === stage.key && config.starkModeEnabled;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => {
                        onChangeConfig({
                          starkModeEnabled: true,
                          starkSeparationPreset: stage.key as any,
                          starkSeparationAmount: config.starkSeparationAmount || 1.0,
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-blue-950/60 border-blue-500/80 text-blue-200 shadow-md shadow-blue-950/50'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                        <span className="text-xs font-semibold text-zinc-200">{stage.title}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 leading-tight">{stage.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anti-Gravity Physics & Hologram Laser Guidelines */}
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                Hologram Physics & Optics
              </span>

              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-medium text-zinc-200 block">Anti-Gravity Magnetic Levitation</span>
                    <span className="text-[10px] text-zinc-400">Harmonic sine oscillation of suspended parts</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.starkLevitationActive ?? true}
                  onChange={e => onChangeConfig({ starkLevitationActive: e.target.checked })}
                  className="accent-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Individual Component Pull-Out & Inspection List */}
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Individual Part Pull-Out
                </span>
                <span className="text-[10px] text-zinc-400">{visibleTechObjects.length} components</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {visibleTechObjects.map(obj => {
                  const hasCustomPull = !!config.starkPullOffsets?.[obj.id];
                  const isSelected = selectedObjectId === obj.id;

                  return (
                    <div
                      key={obj.id}
                      onClick={() => onSelectObject(obj.id)}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500/70 text-zinc-100'
                          : 'bg-zinc-900 border-zinc-800/80 text-zinc-300 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-black/40"
                          style={{ backgroundColor: obj.material.color }}
                        />
                        <span className="truncate font-medium">{obj.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {hasCustomPull ? (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleResetPartPull(obj.id);
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700"
                            title="Reset part position"
                          >
                            Reset
                          </button>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handlePullPart(obj.id, [20, 30, 45]);
                            }}
                            className="px-2 py-0.5 text-[10px] font-medium rounded bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-300 transition-colors"
                            title="Pull part out into foreground"
                          >
                            Pull Out
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: ASSEMBLY & EXPLODED VIEW ================= */}
        {activeTab === 'assembly' && (
          <div className="space-y-4">
            {/* Exploded View Control Box */}
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Linear Exploded View
                </span>
                <span className="font-mono text-xs font-semibold text-blue-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {Math.round(config.explodedAmount * 100)}%
                </span>
              </div>

              <input
                id="slider_exploded_amount"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.explodedAmount}
                onChange={e => onChangeConfig({ explodedAmount: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              <div className="grid grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => onChangeConfig({ explodedAmount: 0 })}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    config.explodedAmount === 0
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  Assembled
                </button>
                <button
                  onClick={() => onChangeConfig({ explodedAmount: 0.35 })}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    config.explodedAmount === 0.35
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  35% Stack
                </button>
                <button
                  onClick={() => onChangeConfig({ explodedAmount: 0.7 })}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    config.explodedAmount === 0.7
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  70% Layered
                </button>
                <button
                  onClick={() => onChangeConfig({ explodedAmount: 1.0 })}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    config.explodedAmount === 1.0
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  100% Full
                </button>
              </div>
            </div>

            {/* Cross Section / Slicing Plane Tool */}
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-emerald-400" />
                  CAD Slicing Plane (Cross-Section)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.slicePlaneEnabled}
                    onChange={e => onChangeConfig({ slicePlaneEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {config.slicePlaneEnabled && (
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map(axis => (
                      <button
                        key={axis}
                        onClick={() => onChangeConfig({ sliceAxis: axis })}
                        className={`py-1.5 text-xs font-semibold rounded-lg uppercase transition-all ${
                          config.sliceAxis === axis
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {axis}-Cut Plane
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Slice Depth Offset</span>
                      <span className="font-mono text-zinc-300">{config.sliceOffset} mm</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={config.sliceOffset}
                      onChange={e => onChangeConfig({ sliceOffset: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: PARAMETRIC CASING ================= */}
        {activeTab === 'parametric' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-4 shadow-sm">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                Outer Casing Enclosure Dimensions (mm)
              </span>

              {/* Width */}
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Width (X-Axis)</span>
                  <span className="font-mono text-zinc-200 font-semibold">{config.dimensions.width} mm</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="350"
                  step="1"
                  value={config.dimensions.width}
                  onChange={e =>
                    onChangeConfig({
                      dimensions: { ...config.dimensions, width: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Height */}
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Height / Length (Y-Axis)</span>
                  <span className="font-mono text-zinc-200 font-semibold">{config.dimensions.height} mm</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="450"
                  step="1"
                  value={config.dimensions.height}
                  onChange={e =>
                    onChangeConfig({
                      dimensions: { ...config.dimensions, height: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Depth / Thickness */}
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Depth / Profile (Z-Axis)</span>
                  <span className="font-mono text-zinc-200 font-semibold">{config.dimensions.depth} mm</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="120"
                  step="0.5"
                  value={config.dimensions.depth}
                  onChange={e =>
                    onChangeConfig({
                      dimensions: { ...config.dimensions, depth: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Corner Fillet Radius */}
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Corner Fillet Radius</span>
                  <span className="font-mono text-zinc-200 font-semibold">{config.cornerFilletRadius} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.cornerFilletRadius}
                  onChange={e => onChangeConfig({ cornerFilletRadius: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: DEVICE PRESETS ================= */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Engineering Hardware Blueprints
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(DEVICE_PRESETS).map(([key, p]) => (
                <div
                  key={key}
                  onClick={() => onLoadPreset(key)}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/90 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                        {p.config.name}
                      </h4>
                      <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                        {p.objects.length} parts
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{p.config.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-850">
                    <span>
                      {p.config.dimensions.width}×{p.config.dimensions.height}×{p.config.dimensions.depth} mm
                    </span>
                    <span className="text-blue-400 font-sans font-semibold group-hover:translate-x-0.5 transition-transform">
                      Load Blueprint →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: ADD PARTS ================= */}
        {activeTab === 'components' && (
          <div className="space-y-4">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Insert Precision Component
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleAddNewComponent(
                    'Precision Lens Barrel',
                    'cylinder',
                    'optics',
                    { width: 14, height: 14, depth: 8, radius: 7 },
                    MATERIAL_PRESETS.sapphire_glass,
                    { heatWattage: 0.2, temperatureC: 26 }
                  )
                }
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-left transition-all"
              >
                <span className="text-xs font-semibold text-zinc-200 block">Optics Lens</span>
                <span className="text-[10px] text-zinc-500 font-mono">Sapphire Glass Cylinder</span>
              </button>

              <button
                onClick={() =>
                  handleAddNewComponent(
                    'Thermal Vapor Chamber',
                    'box',
                    'internal',
                    { width: 55, height: 90, depth: 0.8 },
                    MATERIAL_PRESETS.copper_heatsink,
                    { heatWattage: 0, temperatureC: 42 }
                  )
                }
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-left transition-all"
              >
                <span className="text-xs font-semibold text-zinc-200 block">Vapor Chamber</span>
                <span className="text-[10px] text-zinc-500 font-mono">Pure Copper Plate</span>
              </button>

              <button
                onClick={() =>
                  handleAddNewComponent(
                    'Sub-Mainboard PCB',
                    'box',
                    'pcb',
                    { width: 45, height: 35, depth: 1.2 },
                    MATERIAL_PRESETS.pcb_substrate,
                    { heatWattage: 2.5, temperatureC: 38 }
                  )
                }
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-left transition-all"
              >
                <span className="text-xs font-semibold text-zinc-200 block">PCB Substrate</span>
                <span className="text-[10px] text-zinc-500 font-mono">FR4 Circuit Sub-Board</span>
              </button>

              <button
                onClick={() =>
                  handleAddNewComponent(
                    'Haptic Vibration Motor',
                    'cylinder',
                    'internal',
                    { width: 12, height: 12, depth: 5, radius: 6 },
                    MATERIAL_PRESETS.polished_titanium,
                    { heatWattage: 0.8, temperatureC: 30 }
                  )
                }
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-left transition-all"
              >
                <span className="text-xs font-semibold text-zinc-200 block">Haptic Actuator</span>
                <span className="text-[10px] text-zinc-500 font-mono">Linear Resonant Motor</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB: THERMAL SIM ================= */}
        {activeTab === 'thermal' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Thermal Heat-Map Simulation
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.thermalSimActive}
                    onChange={e => onChangeConfig({ thermalSimActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Total Heat Dissipation</span>
                  <span className="text-amber-400 font-bold text-base">{totalPowerWattage.toFixed(1)} W</span>
                </div>
                <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Peak Hotspot Temp</span>
                  <span className="text-orange-400 font-bold text-base">{maxTemp.toFixed(1)} °C</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: BOM & SPECS ================= */}
        {activeTab === 'bom' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                Assembly Physical Metrics
              </span>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Total Mass</span>
                  <span className="text-zinc-200 font-bold">{Math.round(totalEstimatedWeight)} g</span>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Parts Count</span>
                  <span className="text-zinc-200 font-bold">{visibleTechObjects.length}</span>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Status</span>
                  <span className="text-emerald-400 font-bold">Valid CAD</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
