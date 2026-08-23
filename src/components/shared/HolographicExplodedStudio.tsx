/**
 * Holographic Exploded View & Assembly Sequence Studio
 * Multi-Axis Radial, Orthogonal Cartesian & Spherical Trajectory Disassembly,
 * Step-by-Step Assembly Timeline Player, Holographic Radar Matrix & JARVIS HUD Telemetry.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CADObject,
  DeviceConfig,
  HolographicExplodedConfig,
  HolographicStep,
  HolographicDisassemblyMode,
} from '../../types/cad';
import { holoAudio } from '../../utils/hologramAudio';
import {
  Sparkles,
  Zap,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Compass,
  Radio,
  Sliders,
  Layers,
  Check,
  X,
  Camera,
  Activity,
  Cpu,
  Eye,
  Crosshair,
  Shield,
  Gauge,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HolographicExplodedStudioProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeviceConfig;
  onChangeConfig: (updated: Partial<DeviceConfig>) => void;
  objects: CADObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onOpenSnapshotStudio?: () => void;
}

export const HolographicExplodedStudio: React.FC<HolographicExplodedStudioProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  objects,
  selectedObjectId,
  onSelectObject,
  onOpenSnapshotStudio,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [disassemblyMode, setDisassemblyMode] = useState<HolographicDisassemblyMode>('radial');
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [autoOrbit, setAutoOrbit] = useState(false);

  // Holographic Assembly Breakdown Steps
  const STEPS: HolographicStep[] = [
    {
      id: 'step_casing',
      stepNumber: 1,
      title: 'Aerospace Chassis & Enclosure Ejection',
      subsystem: 'Structure / Enclosure',
      description: 'Outer anodized chassis panels separate along normal vectors to reveal the internal heat sink shielding.',
      targetObjectIds: objects.filter(o => o.category === 'casing').map(o => o.id),
      offsetVector: [0, 0, 45],
      estimatedTorqueNm: 0.8,
      toolingRequired: 'Torx T3 Micro-Driver',
    },
    {
      id: 'step_display',
      stepNumber: 2,
      title: 'OLED Display & Digitizer Panel Lift',
      subsystem: 'Optics & HMI',
      description: 'Super Retina OLED matrix and sapphire cover glass disengage with calibrated vertical separation.',
      targetObjectIds: objects.filter(o => o.primitive === 'screen_panel' || o.material.type === 'tinted_glass').map(o => o.id),
      offsetVector: [0, 0, 75],
      estimatedTorqueNm: 0.2,
      toolingRequired: 'Thermal Suction Fixture',
    },
    {
      id: 'step_power',
      stepNumber: 3,
      title: 'High-Density Lithium-Polymer Power Cell',
      subsystem: 'Power / Storage',
      description: 'High-capacity battery cell and graphite thermal dissipation pads eject laterally.',
      targetObjectIds: objects.filter(o => o.category === 'power' || o.primitive === 'battery_cell').map(o => o.id),
      offsetVector: [0, -45, 15],
      estimatedTorqueNm: 0.4,
      toolingRequired: 'Anti-Static Release Tool',
    },
    {
      id: 'step_logic',
      stepNumber: 4,
      title: 'Neural SoC Logic Board & RF Modems',
      subsystem: 'Processing & RF',
      description: 'Multi-layer stacked FR-4 logic motherboard floats at the central equilibrium axis.',
      targetObjectIds: objects.filter(o => o.category === 'pcb' || o.primitive === 'pcb_board' || o.primitive === 'chip_ic').map(o => o.id),
      offsetVector: [0, 0, 0],
      estimatedTorqueNm: 0.6,
      toolingRequired: 'SMD Tweezers',
    },
    {
      id: 'step_optics',
      stepNumber: 5,
      title: 'Periscope Camera Optics & Sensor Stack',
      subsystem: 'Optics / Imaging',
      description: 'Multi-element optical glass lens barrel and sensor actuators extend along the focal axis.',
      targetObjectIds: objects.filter(o => o.category === 'optics' || o.primitive === 'camera_lens').map(o => o.id),
      offsetVector: [35, 45, 60],
      estimatedTorqueNm: 0.15,
      toolingRequired: 'Cleanroom Vacuum Wand',
    },
    {
      id: 'step_io',
      stepNumber: 6,
      title: 'USB-C Bus, Speakers & Haptic Actuators',
      subsystem: 'I/O & Transducers',
      description: 'Peripheral interconnects, tactile actuators, and acoustic chambers dismount.',
      targetObjectIds: objects.filter(o => o.category === 'io' || o.primitive === 'port_usbc').map(o => o.id),
      offsetVector: [0, -65, -20],
      estimatedTorqueNm: 0.3,
      toolingRequired: 'Micro Hex 1.5mm',
    },
  ];

  // Sequence Player Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep(prev => {
          const next = (prev + 1) % STEPS.length;
          if (audioEnabled) {
            holoAudio.playHoloExpand(1.0 + next * 0.1);
          }
          return next;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioEnabled, STEPS.length]);

  if (!isOpen) return null;

  const currentStepData = STEPS[activeStep];
  const separationAmt = config.starkSeparationAmount ?? 1.2;

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    if (audioEnabled) {
      holoAudio.playHoloExpand(1.0 + index * 0.1);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && audioEnabled) {
      holoAudio.playHoloExpand(1.2);
    }
  };

  const handleDisassemblySlider = (val: number) => {
    onChangeConfig({
      starkModeEnabled: true,
      starkSeparationAmount: val,
    });
    if (audioEnabled && Math.random() > 0.6) {
      holoAudio.playHoloExpand(0.8 + val * 0.4);
    }
  };

  const handlePresetSelect = (preset: 'radial_all' | 'optics_stack' | 'power_core' | 'logic_board' | 'chassis_orbit') => {
    onChangeConfig({
      starkModeEnabled: true,
      starkSeparationPreset: preset,
      starkSeparationAmount: 1.3,
    });
    if (audioEnabled) {
      holoAudio.playMagneticLock();
    }
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.1 } });
  };

  const selectedObj = objects.find(o => o.id === selectedObjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-blue-500/40 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Futuristic Top Glowing Border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  Holographic Exploded View & Disassembly Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  MARK-VII Hologram Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Multi-axis radial levitation, automated step sequence playback, and real-time subsystem telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                holoAudio.setMuted(!next);
              }}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                audioEnabled
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title={audioEnabled ? 'Holographic Audio Active' : 'Muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onOpenSnapshotStudio && (
              <button
                onClick={onOpenSnapshotStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/60">
          {/* Main Disassembly Vector & Levitation Master Controls */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Holographic Radial Disassembly Vector
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-blue-400 font-semibold">
                  {(separationAmt * 100).toFixed(0)}% Expansion
                </span>
                <button
                  onClick={() => {
                    onChangeConfig({
                      starkModeEnabled: true,
                      starkSeparationAmount: 0,
                    });
                    if (audioEnabled) holoAudio.playMagneticLock();
                  }}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                >
                  Snap Reassemble
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={separationAmt}
              onChange={e => handleDisassemblySlider(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            {/* Quick Subsystem Presets */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1 text-xs">
              <button
                onClick={() => handlePresetSelect('radial_all')}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 text-zinc-200 text-left transition-all"
              >
                <div className="font-semibold text-blue-400 mb-0.5">Full Radial</div>
                <div className="text-[10px] text-zinc-500">All 3D axes expanded</div>
              </button>
              <button
                onClick={() => handlePresetSelect('optics_stack')}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 text-zinc-200 text-left transition-all"
              >
                <div className="font-semibold text-blue-400 mb-0.5">Optics Stack</div>
                <div className="text-[10px] text-zinc-500">Periscope lens array</div>
              </button>
              <button
                onClick={() => handlePresetSelect('power_core')}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 text-zinc-200 text-left transition-all"
              >
                <div className="font-semibold text-blue-400 mb-0.5">Power Cell</div>
                <div className="text-[10px] text-zinc-500">Battery lateral ejection</div>
              </button>
              <button
                onClick={() => handlePresetSelect('logic_board')}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 text-zinc-200 text-left transition-all"
              >
                <div className="font-semibold text-blue-400 mb-0.5">Neural SoC</div>
                <div className="text-[10px] text-zinc-500">Motherboard hover</div>
              </button>
              <button
                onClick={() => handlePresetSelect('chassis_orbit')}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 text-zinc-200 text-left transition-all"
              >
                <div className="font-semibold text-blue-400 mb-0.5">Chassis Orbit</div>
                <div className="text-[10px] text-zinc-500">Curved outer shells</div>
              </button>
            </div>
          </div>

          {/* STEP-BY-STEP ASSEMBLY SEQUENCE TIMELINE */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Interactive Assembly Sequence Timeline
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause Sequence' : 'Play Timeline'}</span>
                </button>
              </div>
            </div>

            {/* Timeline Steps Indicator */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {STEPS.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(idx)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-blue-500/15 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                        STEP 0{step.stepNumber}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-xs font-semibold text-zinc-200 truncate">{step.title}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{step.subsystem}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Detailed Card */}
            {currentStepData && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase font-mono">
                      Step {currentStepData.stepNumber}: {currentStepData.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                    {currentStepData.targetObjectIds.length} Associated CAD Parts
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{currentStepData.description}</p>
                <div className="flex flex-wrap gap-4 pt-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-800">
                  <span>Tooling: <strong className="text-zinc-200">{currentStepData.toolingRequired}</strong></span>
                  <span>Torque: <strong className="text-zinc-200">{currentStepData.estimatedTorqueNm} N⋅m</strong></span>
                  <span>Trajectory: <strong className="text-blue-400">[{currentStepData.offsetVector.join(', ')}]</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* JARVIS / STARK HUD TELEMETRY & SELECTED PART INSPECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Hologram Display Settings */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Hologram Projection Matrix Settings
              </span>
              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span>Harmonic Levitation Oscillation</span>
                  <input
                    type="checkbox"
                    checked={config.starkLevitationActive ?? true}
                    onChange={e => onChangeConfig({ starkLevitationActive: e.target.checked })}
                    className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-0 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span>Holographic Laser Guide Tracks</span>
                  <input
                    type="checkbox"
                    checked={config.starkHologramGlow ?? true}
                    onChange={e => onChangeConfig({ starkHologramGlow: e.target.checked })}
                    className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right: Selected Component Live Telemetry */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                Component Telemetry: {selectedObj ? selectedObj.name : 'Hover / Select Part'}
              </span>
              {selectedObj ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <div className="text-zinc-500">Category</div>
                    <div className="text-zinc-200 uppercase font-semibold">{selectedObj.category}</div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <div className="text-zinc-500">Material</div>
                    <div className="text-blue-400 font-semibold">{selectedObj.material.name}</div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <div className="text-zinc-500">Primitive</div>
                    <div className="text-zinc-200 font-semibold">{selectedObj.primitive}</div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <div className="text-zinc-500">Roughness / Metal</div>
                    <div className="text-zinc-200 font-semibold">
                      {selectedObj.material.roughness.toFixed(2)} / {selectedObj.material.metalness.toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 p-4 text-center bg-zinc-900 rounded-lg border border-zinc-850">
                  Select any floating component in the viewport to inspect its material & physical telemetry.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Hologram State: <strong>STARK SEPARATION ACTIVE</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Done & Return to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
