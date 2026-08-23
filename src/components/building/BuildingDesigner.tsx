import React, { useState } from 'react';
import {
  CADObject,
  BuildingConfig,
  ShapePrimitive,
  CADMaterial,
} from '../../types/cad';
import { BUILDING_PRESETS } from './BuildingPresets';
import { MATERIAL_PRESETS } from '../../utils/materials';
import {
  Building2,
  Sun,
  Layers,
  Home,
  PlusCircle,
  CheckCircle2,
  Columns,
  Grid,
  Trees,
  Maximize2,
  Compass,
  Sparkles,
} from 'lucide-react';

interface BuildingDesignerProps {
  config: BuildingConfig;
  onChangeConfig: (updated: Partial<BuildingConfig>) => void;
  objects: CADObject[];
  onAddObject: (newObj: CADObject) => void;
  onUpdateObject: (updated: CADObject) => void;
  onLoadPreset: (presetKey: string) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
}

export const BuildingDesigner: React.FC<BuildingDesignerProps> = ({
  config,
  onChangeConfig,
  objects,
  onAddObject,
  onUpdateObject,
  onLoadPreset,
  selectedObjectId,
  onSelectObject,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'environment' | 'levels' | 'catalog' | 'metrics'>('environment');

  // Add architectural component helper
  const handleAddArchitecturalElement = (
    name: string,
    primitive: ShapePrimitive,
    category: CADObject['category'],
    dims: { width: number; height: number; depth: number },
    material: CADMaterial,
    floorLevel: number = 0
  ) => {
    const id = `arch_elem_${Date.now()}`;
    const newElement: CADObject = {
      id,
      name,
      category,
      section: 'building',
      primitive,
      position: [0, dims.height / 2 + floorLevel * 3.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: dims,
      material,
      visible: true,
      locked: false,
      architecturalProps: { floorLevel },
    };
    onAddObject(newElement);
    onSelectObject(id);
  };

  const visibleBuildingObjects = objects.filter(o => o.section === 'building' && o.visible);

  // Approximate Gross Floor Area calculation from slabs
  const slabs = visibleBuildingObjects.filter(o => o.primitive === 'slab');
  const grossFloorAreaM2 = slabs.reduce(
    (acc, s) => acc + s.dimensions.width * s.dimensions.depth,
    0
  );

  return (
    <div id="building_designer_panel" className="flex flex-col h-full bg-zinc-900 text-zinc-200 border-r border-zinc-800">
      {/* Sub-Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-blue-400 border border-zinc-700/60">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              Architectural Studio
              <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Secondary Section
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-normal">BIM Structure, Glazing & Solar Environmental Simulator</p>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-950 border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
        <button
          id="tab_arch_env"
          onClick={() => setActiveTab('environment')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'environment'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          Sun & Daylight
        </button>

        <button
          id="tab_arch_levels"
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'levels'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Floor Levels
        </button>

        <button
          id="tab_arch_presets"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'presets'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Villa Presets
        </button>

        <button
          id="tab_arch_catalog"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'catalog'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
          Add Element
        </button>

        <button
          id="tab_arch_metrics"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'metrics'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          GFA & Specs
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB 1: SUN & DAYLIGHT SIMULATOR ================= */}
        {activeTab === 'environment' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Sun Daylight Simulation
                </span>
                <span className="font-mono text-xs font-semibold text-amber-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {Math.floor(config.timeOfDay).toString().padStart(2, '0')}:
                  {Math.round((config.timeOfDay % 1) * 60).toString().padStart(2, '0')}
                </span>
              </div>

              <input
                id="slider_time_of_day"
                type="range"
                min="6"
                max="20"
                step="0.25"
                value={config.timeOfDay}
                onChange={e => onChangeConfig({ timeOfDay: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
                <button
                  onClick={() => onChangeConfig({ timeOfDay: 7.5 })}
                  className={`py-1.5 rounded-lg border transition-all ${
                    Math.abs(config.timeOfDay - 7.5) < 0.3
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  Morning (07:30)
                </button>
                <button
                  onClick={() => onChangeConfig({ timeOfDay: 12.0 })}
                  className={`py-1.5 rounded-lg border transition-all ${
                    Math.abs(config.timeOfDay - 12.0) < 0.3
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  Solar Noon
                </button>
                <button
                  onClick={() => onChangeConfig({ timeOfDay: 15.5 })}
                  className={`py-1.5 rounded-lg border transition-all ${
                    Math.abs(config.timeOfDay - 15.5) < 0.3
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  Afternoon
                </button>
                <button
                  onClick={() => onChangeConfig({ timeOfDay: 18.5 })}
                  className={`py-1.5 rounded-lg border transition-all ${
                    Math.abs(config.timeOfDay - 18.5) < 0.3
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  Golden Hour
                </button>
              </div>
            </div>

            {/* Realistic Shadow Cast Toggle */}
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Raytraced Solar Shadows
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.shadowsEnabled}
                    onChange={e => onChangeConfig({ shadowsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Sun Beam Luminance</span>
                  <span className="font-mono text-zinc-300">{config.sunIntensity}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={config.sunIntensity}
                  onChange={e => onChangeConfig({ sunIntensity: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FLOOR LEVELS ================= */}
        {activeTab === 'levels' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                Storey / Level Filter
              </span>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { level: -1, label: 'All Levels (Full Structure)', desc: 'Show combined building envelope' },
                  { level: 0, label: 'Level 0 • Ground Floor', desc: 'Living area, patio, foundation slab' },
                  { level: 1, label: 'Level 1 • First Floor', desc: 'Master bedroom cantilever wing' },
                  { level: 2, label: 'Level 2 • Roof & Solar Deck', desc: 'Photovoltaic solar array & green roof' },
                ].map(item => (
                  <button
                    key={item.level}
                    onClick={() => onChangeConfig({ activeFloor: item.level })}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      config.activeFloor === item.level
                        ? 'bg-zinc-800/90 border-blue-500/80 text-zinc-100 shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[11px] text-zinc-400">{item.desc}</div>
                    </div>
                    {config.activeFloor === item.level && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BUILDING PRESETS ================= */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Architectural Typologies
            </span>

            {Object.entries(BUILDING_PRESETS).map(([key, preset]) => (
              <div
                key={key}
                onClick={() => onLoadPreset(key)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                  config.id === preset.config.id
                    ? 'bg-zinc-800/90 border-blue-500/80 shadow-md shadow-zinc-950/50'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-800 text-blue-400 border border-zinc-700/60">
                      <Home className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-semibold text-zinc-100">{preset.config.name}</h3>
                  </div>
                  {config.id === preset.config.id && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {preset.config.description}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono pt-1">
                  <span>Footprint: {preset.config.dimensions.width}×{preset.config.dimensions.length}m</span>
                  <span>•</span>
                  <span>{preset.config.dimensions.stories} Stories</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 4: ARCHITECTURAL ELEMENT CATALOG ================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Structural & Fenestration Elements
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() =>
                  handleAddArchitecturalElement(
                    'Reinforced Concrete Slab (12x12m)',
                    'slab',
                    'structure',
                    { width: 12, height: 0.35, depth: 12 },
                    MATERIAL_PRESETS.architectural_concrete,
                    0
                  )
                }
                className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-100 group-hover:text-blue-400">Concrete Slab</div>
                    <div className="text-[11px] text-zinc-400">12×12×0.35m • Load-bearing Foundation</div>
                  </div>
                </div>
                <PlusCircle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
              </button>

              <button
                onClick={() =>
                  handleAddArchitecturalElement(
                    'Low-E Glass Curtain Wall',
                    'window',
                    'envelope',
                    { width: 10, height: 3.5, depth: 0.1 },
                    MATERIAL_PRESETS.curtain_wall_glass,
                    0
                  )
                }
                className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 text-blue-400 border border-zinc-800">
                    <Columns className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-100 group-hover:text-blue-400">Curtain Wall Glazing</div>
                    <div className="text-[11px] text-zinc-400">10×3.5m • Low-E Solar Control Glass</div>
                  </div>
                </div>
                <PlusCircle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
              </button>

              <button
                onClick={() =>
                  handleAddArchitecturalElement(
                    'PV Rooftop Solar Module (8x6m)',
                    'solar_panel',
                    'custom',
                    { width: 8, height: 0.1, depth: 6 },
                    MATERIAL_PRESETS.pv_solar_cell,
                    1
                  )
                }
                className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 text-amber-400 border border-zinc-800">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-100 group-hover:text-blue-400">PV Solar Array Panel</div>
                    <div className="text-[11px] text-zinc-400">8×6m • High-Efficiency Monocrystalline</div>
                  </div>
                </div>
                <PlusCircle className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 5: GROSS FLOOR AREA & METRICS ================= */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                Architectural Performance Specs
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Gross Floor Area</span>
                  <span className="font-mono font-semibold text-zinc-100 text-sm">
                    {grossFloorAreaM2.toFixed(1)} m²
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Solar Hour Angle</span>
                  <span className="font-mono font-semibold text-amber-400 text-sm">
                    {((config.timeOfDay - 12) * 15).toFixed(0)}° Azimuth
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
