/**
 * AutoCAD-style Precision Drafting Settings
 * Configures grid snap size, object-snap (OSNAP) target types, snap tolerance, and ortho
 * mode — the same drafting aids AutoCAD exposes on its status bar (SNAP / OSNAP / ORTHO).
 */

import React from 'react';
import { X, Crosshair, Grid3x3, Magnet, Move, Info } from 'lucide-react';

interface PrecisionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridSnapEnabled: boolean;
  onToggleGridSnap: () => void;
  gridSizeMm: number;
  onChangeGridSize: (mm: number) => void;
  objectSnapEnabled: boolean;
  onToggleObjectSnap: () => void;
  snapEndpoint: boolean;
  onToggleSnapEndpoint: () => void;
  snapMidpoint: boolean;
  onToggleSnapMidpoint: () => void;
  snapCenter: boolean;
  onToggleSnapCenter: () => void;
  snapToleranceMm: number;
  onChangeSnapTolerance: (mm: number) => void;
  orthoEnabled: boolean;
  onToggleOrtho: () => void;
}

const ToggleRow: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  id?: string;
}> = ({ label, description, enabled, onToggle, id }) => (
  <button
    id={id}
    onClick={onToggle}
    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors text-left"
  >
    <div>
      <div className="text-xs font-semibold text-zinc-100">{label}</div>
      <div className="text-[11px] text-zinc-500">{description}</div>
    </div>
    <div
      className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
        enabled ? 'bg-cyan-600 justify-end' : 'bg-zinc-700 justify-start'
      }`}
    >
      <div className="w-4 h-4 rounded-full bg-white shadow" />
    </div>
  </button>
);

export const PrecisionSettingsModal: React.FC<PrecisionSettingsModalProps> = ({
  isOpen,
  onClose,
  gridSnapEnabled,
  onToggleGridSnap,
  gridSizeMm,
  onChangeGridSize,
  objectSnapEnabled,
  onToggleObjectSnap,
  snapEndpoint,
  onToggleSnapEndpoint,
  snapMidpoint,
  onToggleSnapMidpoint,
  snapCenter,
  onToggleSnapCenter,
  snapToleranceMm,
  onChangeSnapTolerance,
  orthoEnabled,
  onToggleOrtho,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="precision_settings_backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="precision_settings_modal"
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 max-h-[85vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Precision Drafting Settings</h3>
              <p className="text-[11px] text-zinc-400">AutoCAD-style SNAP / OSNAP / ORTHO drafting aids</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Grid Snap */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Grid3x3 className="w-3.5 h-3.5 text-cyan-400" />
              Grid Snap (SNAP)
            </div>
            <ToggleRow
              id="toggle_grid_snap"
              label="Grid Snap"
              description="Round positions to the nearest grid intersection"
              enabled={gridSnapEnabled}
              onToggle={onToggleGridSnap}
            />
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-xs text-zinc-400 shrink-0">Grid Size (mm)</span>
              <input
                id="input_grid_size_mm"
                type="number"
                min={0.1}
                step={0.5}
                value={gridSizeMm}
                onChange={e => onChangeGridSize(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono text-right"
              />
            </div>
          </div>

          {/* Object Snap */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Magnet className="w-3.5 h-3.5 text-indigo-400" />
              Object Snap (OSNAP)
            </div>
            <ToggleRow
              id="toggle_object_snap"
              label="Object Snap"
              description="Snap to endpoints, midpoints & centers of other parts"
              enabled={objectSnapEnabled}
              onToggle={onToggleObjectSnap}
            />
            {objectSnapEnabled && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onToggleSnapEndpoint}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                    snapEndpoint ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Endpoint
                </button>
                <button
                  onClick={onToggleSnapMidpoint}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                    snapMidpoint ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Midpoint
                </button>
                <button
                  onClick={onToggleSnapCenter}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                    snapCenter ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Center
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-xs text-zinc-400 shrink-0">Snap Tolerance (mm)</span>
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={snapToleranceMm}
                onChange={e => onChangeSnapTolerance(Math.max(0.1, parseFloat(e.target.value) || 3))}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono text-right"
              />
            </div>
          </div>

          {/* Ortho */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-400" />
              Ortho Mode (ORTHO)
            </div>
            <ToggleRow
              id="toggle_ortho"
              label="Ortho Mode"
              description="Constrain Snap-to-Nearest-Part moves to a single axis"
              enabled={orthoEnabled}
              onToggle={onToggleOrtho}
            />
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
            <span>
              Use the <strong className="text-zinc-300">Snap to Grid</strong> and{' '}
              <strong className="text-zinc-300">Snap to Nearest Part</strong> buttons next to Position in the
              Properties Inspector to apply these settings to the selected part. The Sketch & Solid Studio also
              snaps every click to the active grid while drafting a 2D profile.
            </span>
          </div>
        </div>

        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
