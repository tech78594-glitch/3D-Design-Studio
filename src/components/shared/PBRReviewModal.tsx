/**
 * Real-time PBR Material & Lighting Review Studio
 * Diagnostic Shader Channels (Lit, Roughness Zebra, Metalness, Surface Normals, Fresnel, AO, Curvature)
 * Environment IBL Studio Rigs, Exposure, ACES Tone Mapping, 3-Point Light Customizer
 */

import React, { useState } from 'react';
import {
  PBRReviewSettings,
  PBRDiagnosticChannel,
  PBREnvironmentPreset,
  CADMaterial,
  CADObject,
} from '../../types/cad';
import {
  Sun,
  Sliders,
  Sparkles,
  Layers,
  Eye,
  Camera,
  Paintbrush,
  Check,
  RotateCcw,
  Zap,
  Maximize2,
  X,
  Gauge,
  Activity,
  Flame,
  Globe,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PBRReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PBRReviewSettings;
  onChangeSettings: (updated: Partial<PBRReviewSettings>) => void;
  selectedObject: CADObject | null;
  onUpdateMaterial?: (mat: CADMaterial) => void;
  onOpenMaterialLibrary?: () => void;
  onOpenSnapshotStudio?: () => void;
}

export const PBRReviewModal: React.FC<PBRReviewModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  selectedObject,
  onUpdateMaterial,
  onOpenMaterialLibrary,
  onOpenSnapshotStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'lighting' | 'shader_tuning'>('diagnostics');

  if (!isOpen) return null;

  const DIAGNOSTIC_CHANNELS: {
    id: PBRDiagnosticChannel;
    label: string;
    description: string;
    badge: string;
    icon: string;
  }[] = [
    {
      id: 'lit',
      label: 'Full PBR Shaded (Beauty Pass)',
      description: 'Physical photorealistic rendering with Cook-Torrance specular BRDF, environmental IBL, and indirect light.',
      badge: 'Production',
      icon: '🎨',
    },
    {
      id: 'roughness_zebra',
      label: 'Roughness Heatmap & Zebra Map',
      description: 'Visualizes surface micro-roughness: blue/violet (0.0 ultra-glossy mirror) to yellow/red (1.0 diffuse matte).',
      badge: 'Surface Analysis',
      icon: '🦓',
    },
    {
      id: 'metalness',
      label: 'Metalness Conductor Mask',
      description: 'Isolates true conductive metals (F0=0.9+ with colored reflections) from dielectrics (plastics, glass, coatings).',
      badge: 'Conductance',
      icon: '⚡',
    },
    {
      id: 'normals',
      label: 'World Surface Normals (XYZ RGB)',
      description: 'Inspects Class-A CAD curvature tangency, smooth fillet transitions, and geometry seam topology.',
      badge: 'Curvature Inspection',
      icon: '🧭',
    },
    {
      id: 'fresnel',
      label: 'Fresnel & Glancing Sheen Pass',
      description: 'Analyzes Schlick Fresnel reflectance at steep grazing camera viewing angles.',
      badge: 'Specular Sheen',
      icon: '✨',
    },
    {
      id: 'curvature',
      label: 'Zebra Curvature Reflection Lines',
      description: 'High-contrast alternating CAD zebra lines for surface continuity (G0/G1/G2/G3 surface curvature).',
      badge: 'Class-A CAD',
      icon: '🏁',
    },
    {
      id: 'ao',
      label: 'Ambient Occlusion & Crevice Shadows',
      description: 'Renders micro-cavities, parting lines, and enclosed fastener joint contact shadowing.',
      badge: 'Contact Shadows',
      icon: '🌑',
    },
    {
      id: 'wireframe_pbr',
      label: 'PBR Shaded + Topology Wireframe',
      description: 'Superimposes CAD boundary edge tessellation on top of physical materials for mesh QA.',
      badge: 'Mesh QA',
      icon: '📐',
    },
  ];

  const ENV_PRESETS: {
    id: PBREnvironmentPreset;
    name: string;
    type: string;
    tempK: string;
    bgStyle: string;
  }[] = [
    {
      id: 'clean_studio',
      name: 'Clean Tech Cyc Studio',
      type: 'White Studio Softbox',
      tempK: '5600K Daylight',
      bgStyle: 'from-zinc-800 to-zinc-900 border-blue-500/50',
    },
    {
      id: 'cyber_neon',
      name: 'Cyberpunk Neon Laboratory',
      type: 'Cyan & Magenta High-Contrast',
      tempK: '9000K Cool Fluorescent',
      bgStyle: 'from-cyan-950/80 to-purple-950/80 border-cyan-500/50',
    },
    {
      id: 'golden_hour',
      name: 'Golden Hour Warm Sunlight',
      type: 'Low Sun Natural Directional',
      tempK: '3200K Warm Sunset',
      bgStyle: 'from-amber-950/80 to-orange-950/80 border-amber-500/50',
    },
    {
      id: 'industrial_warehouse',
      name: 'Industrial Aerospace Hangar',
      type: 'Overhead Gantry High-Bay LED',
      tempK: '6500K Industrial Neutral',
      bgStyle: 'from-slate-900 to-zinc-950 border-emerald-500/50',
    },
    {
      id: 'deep_space',
      name: 'Deep Space Stark Arc',
      type: 'Single Ultra-Sharp Key Sun',
      tempK: 'Solar Hard Shadow',
      bgStyle: 'from-zinc-950 via-blue-950/30 to-black border-blue-400/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-inner">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">Real-time PBR Review & Diagnostic Studio</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Cook-Torrance BRDF
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Inspect physical surface properties, Class-A reflection continuity, environment IBL, and diagnostic shader channels in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSnapshotStudio && (
              <button
                onClick={onOpenSnapshotStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
                title="Capture high-resolution snapshot of review pass"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Capture Snapshot</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800 bg-zinc-900/90 text-xs font-medium">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'diagnostics'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>PBR Diagnostic Passes ({DIAGNOSTIC_CHANNELS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lighting')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'lighting'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>IBL Environments & 3-Point Light Rig</span>
          </button>
          <button
            onClick={() => setActiveTab('shader_tuning')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'shader_tuning'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Active Part Material Tuning</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/60">
          {/* TAB 1: PBR DIAGNOSTIC PASSES */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Select Diagnostic Inspection Pass
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Click any shader pass below to immediately switch the WebGL viewport shader pipeline.
                  </p>
                </div>
                <button
                  onClick={() => onChangeSettings({ channel: 'lit' })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Full Lit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DIAGNOSTIC_CHANNELS.map(ch => {
                  const isSelected = settings.channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => onChangeSettings({ channel: ch.id })}
                      className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/90'
                      }`}
                    >
                      <div className="text-2xl pt-0.5 shrink-0">{ch.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-400' : 'text-zinc-200'}`}>
                            {ch.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {ch.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{ch.description}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Real-time Viewport Post-Processing Controls */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Camera Exposure & Tone Mapping Engine
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Exposure Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Camera Exposure</span>
                      <span className="font-mono text-blue-400 font-semibold">{settings.exposure.toFixed(2)} EV</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={settings.exposure}
                      onChange={e => onChangeSettings({ exposure: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Tone Mapping Selector */}
                  <div className="space-y-1.5">
                    <span className="text-zinc-300">Tone Mapping Operator</span>
                    <select
                      value={settings.toneMapping}
                      onChange={e => onChangeSettings({ toneMapping: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                      <option value="aces">ACES Filmic (Film Standard)</option>
                      <option value="reinhard">Reinhard (Smooth Highlights)</option>
                      <option value="cineon">Cineon (Kodak Color Range)</option>
                      <option value="linear">Linear (Raw Radiance)</option>
                    </select>
                  </div>

                  {/* Ground Contact Shadow */}
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-zinc-300">Ground Contact Shadows</span>
                    <button
                      onClick={() => onChangeSettings({ groundContactShadow: !settings.groundContactShadow })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.groundContactShadow ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          settings.groundContactShadow ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IBL ENVIRONMENTS & 3-POINT LIGHT RIG */}
          {activeTab === 'lighting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  High Dynamic Range Environment (IBL)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Simulates realistic studio reflections and indirect ambient lighting from 360-degree environment maps.
                </p>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ENV_PRESETS.map(env => {
                  const isSelected = settings.environmentPreset === env.id;
                  return (
                    <button
                      key={env.id}
                      onClick={() => onChangeSettings({ environmentPreset: env.id })}
                      className={`p-3.5 rounded-xl border text-left transition-all bg-gradient-to-br ${env.bgStyle} ${
                        isSelected
                          ? 'ring-2 ring-blue-400 border-blue-400 shadow-lg'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-100">{env.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-300 mb-1">{env.type}</div>
                      <div className="text-[10px] text-zinc-400">{env.tempK}</div>
                    </button>
                  );
                })}
              </div>

              {/* IBL Controls */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  IBL Rotation & Intensity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-300">
                      <span>IBL Intensity</span>
                      <span className="font-mono text-blue-400">{settings.envIntensity.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.05"
                      value={settings.envIntensity}
                      onChange={e => onChangeSettings({ envIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-300">
                      <span>Environment Rotation</span>
                      <span className="font-mono text-blue-400">{settings.envRotationDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={settings.envRotationDeg}
                      onChange={e => onChangeSettings({ envRotationDeg: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-300">
                      <span>Shadow Softness</span>
                      <span className="font-mono text-blue-400">{settings.shadowIntensity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={settings.shadowIntensity}
                      onChange={e => onChangeSettings({ shadowIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3-Point Studio Light Rig */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-blue-400" />
                  3-Point Studio Light Intensity Rig
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Key Light */}
                  <div className="space-y-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Key Light (Main)</span>
                      <span className="font-mono text-blue-400">{settings.keyLightIntensity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3.0"
                      step="0.1"
                      value={settings.keyLightIntensity}
                      onChange={e => onChangeSettings({ keyLightIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-400">Tint Color</span>
                      <input
                        type="color"
                        value={settings.keyLightColor}
                        onChange={e => onChangeSettings({ keyLightColor: e.target.value })}
                        className="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Fill Light */}
                  <div className="space-y-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Fill Light (Soft)</span>
                      <span className="font-mono text-blue-400">{settings.fillLightIntensity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.0"
                      step="0.05"
                      value={settings.fillLightIntensity}
                      onChange={e => onChangeSettings({ fillLightIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-400">Tint Color</span>
                      <input
                        type="color"
                        value={settings.fillLightColor}
                        onChange={e => onChangeSettings({ fillLightColor: e.target.value })}
                        className="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Rim / Back Light */}
                  <div className="space-y-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Rim Light (Silhouetter)</span>
                      <span className="font-mono text-blue-400">{settings.rimLightIntensity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4.0"
                      step="0.1"
                      value={settings.rimLightIntensity}
                      onChange={e => onChangeSettings({ rimLightIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-400">Tint Color</span>
                      <input
                        type="color"
                        value={settings.rimLightColor}
                        onChange={e => onChangeSettings({ rimLightColor: e.target.value })}
                        className="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE PART MATERIAL TUNING */}
          {activeTab === 'shader_tuning' && (
            <div className="space-y-6">
              {selectedObject ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <Paintbrush className="w-4 h-4 text-blue-400" />
                        Live PBR Shader Parameters: {selectedObject.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Adjust micro-roughness, metallic conductance, clearcoat reflections, and glass transmission in real-time.
                      </p>
                    </div>
                    {onOpenMaterialLibrary && (
                      <button
                        onClick={onOpenMaterialLibrary}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Paintbrush className="w-3.5 h-3.5" />
                        <span>Open Material Preset Library</span>
                      </button>
                    )}
                  </div>

                  {/* Shader Sliders Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Roughness */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-zinc-200 font-semibold">
                        <span>Roughness (Microfacet Dispersion)</span>
                        <span className="font-mono text-blue-400">{selectedObject.material.roughness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedObject.material.roughness}
                        onChange={e => {
                          if (onUpdateMaterial) {
                            onUpdateMaterial({
                              ...selectedObject.material,
                              roughness: parseFloat(e.target.value),
                            });
                          }
                        }}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>0.0 (Ultra Mirror Gloss)</span>
                        <span>1.0 (Diffuse Chalk)</span>
                      </div>
                    </div>

                    {/* Metalness */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-zinc-200 font-semibold">
                        <span>Metalness (Conductor Index)</span>
                        <span className="font-mono text-blue-400">{selectedObject.material.metalness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedObject.material.metalness}
                        onChange={e => {
                          if (onUpdateMaterial) {
                            onUpdateMaterial({
                              ...selectedObject.material,
                              metalness: parseFloat(e.target.value),
                            });
                          }
                        }}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>0.0 (Dielectric Plastic)</span>
                        <span>1.0 (Pure Metal)</span>
                      </div>
                    </div>

                    {/* Clearcoat */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-zinc-200 font-semibold">
                        <span>Clearcoat Lacquer Layer</span>
                        <span className="font-mono text-blue-400">
                          {(selectedObject.material.clearcoat || 0).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedObject.material.clearcoat || 0}
                        onChange={e => {
                          if (onUpdateMaterial) {
                            onUpdateMaterial({
                              ...selectedObject.material,
                              clearcoat: parseFloat(e.target.value),
                            });
                          }
                        }}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-[10px] text-zinc-500">
                        Automotive urethane top coat reflection
                      </span>
                    </div>

                    {/* Emissive Glow */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-zinc-200 font-semibold">
                        <span>Emissive Radiance Intensity</span>
                        <span className="font-mono text-blue-400">
                          {(selectedObject.material.emissiveIntensity || 0).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3.0"
                        step="0.1"
                        value={selectedObject.material.emissiveIntensity || 0}
                        onChange={e => {
                          if (onUpdateMaterial) {
                            onUpdateMaterial({
                              ...selectedObject.material,
                              emissiveIntensity: parseFloat(e.target.value),
                            });
                          }
                        }}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-400">Emissive Hue</span>
                        <input
                          type="color"
                          value={selectedObject.material.emissive || '#000000'}
                          onChange={e => {
                            if (onUpdateMaterial) {
                              onUpdateMaterial({
                                ...selectedObject.material,
                                emissive: e.target.value,
                              });
                            }
                          }}
                          className="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-zinc-950/50 rounded-xl border border-zinc-800">
                  <Eye className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-zinc-300">No Component Selected</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                    Select a component in the 3D viewport or hierarchy tree to tune its PBR material shader properties.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Pass: <strong className="text-zinc-200 uppercase">{settings.channel}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Done & Return to Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
