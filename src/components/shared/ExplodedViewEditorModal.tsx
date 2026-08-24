import React, { useState } from 'react';
import { CADObject, DeviceConfig } from '../../types/cad';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Move,
  Layers,
  Sparkles,
  Check,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface ExplodedViewEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceConfig: DeviceConfig;
  onChangeDeviceConfig: (updater: (prev: DeviceConfig) => DeviceConfig) => void;
  objects: CADObject[];
  onUpdateObject: (updated: CADObject) => void;
}

export const ExplodedViewEditorModal: React.FC<ExplodedViewEditorModalProps> = ({
  isOpen,
  onClose,
  deviceConfig,
  onChangeDeviceConfig,
  objects,
  onUpdateObject,
}) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string>(objects[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>(deviceConfig.starkSeparationPreset || 'radial');

  if (!isOpen) return null;

  const selectedObj = objects.find(o => o.id === selectedObjectId);

  const handleExplodeAmountChange = (val: number) => {
    onChangeDeviceConfig(prev => ({
      ...prev,
      explodedAmount: val,
      starkSeparationAmount: val,
      starkModeEnabled: val > 0.05,
    }));
  };

  const handlePresetSelect = (preset: 'radial_all' | 'optics_stack' | 'power_core' | 'logic_board' | 'chassis_orbit') => {
    setActivePreset(preset);
    onChangeDeviceConfig(prev => ({
      ...prev,
      starkSeparationPreset: preset as any,
      starkModeEnabled: true,
      explodedAmount: Math.max(0.6, prev.explodedAmount || 0.8),
    }));
  };

  const handleObjectPullChange = (axis: 0 | 1 | 2, val: number) => {
    if (!selectedObj) return;
    const currentPull = deviceConfig.starkPullOffsets?.[selectedObj.id] || [0, 0, 0];
    const newPull: [number, number, number] = [...currentPull];
    newPull[axis] = val;

    onChangeDeviceConfig(prev => ({
      ...prev,
      starkPullOffsets: {
        ...(prev.starkPullOffsets || {}),
        [selectedObj.id]: newPull,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Exploded View & Disassembly Sequence Editor
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 rounded-full font-mono">
                  Interactive
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure keyframed explosion vectors, custom offset trajectories, and step sequences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Controls & Presets */}
          <div className="md:col-span-2 space-y-6">
            {/* Global Explosion Master Slider */}
            <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Move className="w-4 h-4 text-cyan-400" />
                  Master Explode Distance Factor
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {((deviceConfig.explodedAmount || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.05"
                value={deviceConfig.explodedAmount || 0}
                onChange={e => handleExplodeAmountChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>0% (Assembled)</span>
                <span>100% (Standard)</span>
                <span>250% (Expanded Studio)</span>
              </div>
            </div>

            {/* Exploded Disassembly Presets */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Explosion Trajectory Presets
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'radial_all', label: 'Radial Hull Orbit', desc: 'Explode parts outwards in 360 radial vector' },
                  { id: 'optics_stack', label: 'Optics Vertical Stack', desc: 'Isolate camera & lens module vertical offset' },
                  { id: 'power_core', label: 'Power & Heat Ejection', desc: 'Extract battery cell & graphite thermal plates' },
                  { id: 'logic_board', label: 'PCB Component Pull', desc: 'Pull logic board, IC chips, and micro-SMDs' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      activePreset === p.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center justify-between">
                      {p.label}
                      {activePreset === p.id && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Object Vector Tuning */}
            <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Part Offset Vector Override
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-400">Select Part to Fine-Tune Vector</label>
                <select
                  value={selectedObjectId}
                  onChange={e => setSelectedObjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  {objects.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.category})
                    </option>
                  ))}
                </select>
              </div>

              {selectedObj && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {(['X', 'Y', 'Z'] as const).map((axisName, idx) => {
                    const currentOffset = deviceConfig.starkPullOffsets?.[selectedObj.id]?.[idx] || 0;
                    return (
                      <div key={axisName} className="space-y-1">
                        <span className="text-xs font-mono text-slate-400 flex justify-between">
                          <span>Offset {axisName}</span>
                          <span className="text-cyan-400">{currentOffset.toFixed(0)}mm</span>
                        </span>
                        <input
                          type="range"
                          min="-150"
                          max="150"
                          step="2"
                          value={currentOffset}
                          onChange={e => handleObjectPullChange(idx as any, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Part Assembly Sequence Sidebar */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col h-full space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Assembly Sequence Order
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {objects.map((obj, index) => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObjectId(obj.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedObjectId === obj.id
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-medium truncate max-w-[130px]">{obj.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive Explosion Engine Ready</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExplodeAmountChange(0)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-xs font-medium transition"
            >
              Reset to 0% (Collapse)
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Apply Exploded View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
