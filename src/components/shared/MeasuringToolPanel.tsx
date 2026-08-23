import React, { useState } from 'react';
import { CADMeasurement, MeasureMode, CADObject } from '../../types/cad';
import {
  Ruler,
  Compass,
  Box,
  Maximize2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Plus,
  RotateCcw,
  Sparkles,
  X,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface MeasuringToolPanelProps {
  objects: CADObject[];
  selectedObjectId: string | null;
  measurements: CADMeasurement[];
  onUpdateMeasurements: (measurements: CADMeasurement[]) => void;
  activeMeasureMode: MeasureMode;
  onSetMeasureMode: (mode: MeasureMode) => void;
  onClearAllMeasurements: () => void;
  onClose?: () => void;
}

export const MeasuringToolPanel: React.FC<MeasuringToolPanelProps> = ({
  objects,
  selectedObjectId,
  measurements,
  onUpdateMeasurements,
  activeMeasureMode,
  onSetMeasureMode,
  onClearAllMeasurements,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedObject = objects.find(o => o.id === selectedObjectId);

  // Quick Measure Bounding Box of selected part
  const handleMeasureSelectedBox = () => {
    if (!selectedObject) return;

    const dim = selectedObject.dimensions;
    const pos = selectedObject.position;
    const w = dim?.width ?? 10;
    const h = dim?.height ?? 10;
    const d = dim?.depth ?? 10;

    const newM: CADMeasurement = {
      id: `meas_${Date.now()}`,
      name: `${selectedObject.name} Outer Caliper`,
      mode: 'bounding_box',
      pointA: [pos[0] - w / 2, pos[1] - h / 2, pos[2] - d / 2],
      pointB: [pos[0] + w / 2, pos[1] + h / 2, pos[2] + d / 2],
      distanceMm: parseFloat(Math.sqrt(w * w + h * h + d * d).toFixed(2)),
      deltaX: w,
      deltaY: h,
      deltaZ: d,
      color: '#38bdf8',
      visible: true,
      notes: `Bounds: ${w.toFixed(1)}W × ${h.toFixed(1)}H × ${d.toFixed(1)}D mm`,
      createdAt: new Date().toLocaleTimeString(),
    };

    onUpdateMeasurements([...measurements, newM]);
  };

  // Toggle Measurement Visibility
  const handleToggleVisible = (id: string) => {
    onUpdateMeasurements(
      measurements.map(m => (m.id === id ? { ...m, visible: !m.visible } : m))
    );
  };

  // Delete Measurement
  const handleDeleteMeasurement = (id: string) => {
    onUpdateMeasurements(measurements.filter(m => m.id !== id));
  };

  const handleCopyMeasurement = (m: CADMeasurement) => {
    const text = `${m.name}: ${m.distanceMm}mm (ΔX: ${m.deltaX.toFixed(1)}mm, ΔY: ${m.deltaY.toFixed(1)}mm, ΔZ: ${m.deltaZ.toFixed(1)}mm)`;
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Mode', 'Distance (mm)', 'Delta X (mm)', 'Delta Y (mm)', 'Delta Z (mm)', 'Angle (deg)', 'Notes'];
    const rows = measurements.map(m => [
      `"${m.name}"`,
      m.mode,
      m.distanceMm,
      m.deltaX,
      m.deltaY,
      m.deltaZ,
      m.angleDeg || '',
      `"${m.notes || ''}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAD_Measurements_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              3D Digital Caliper & Dimension Inspector
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                {measurements.length} Active
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Interactive Euclidean caliper, vertex snapping, delta X/Y/Z tolerances, and 3-point angular verification
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Selector */}
      <div className="p-4 bg-zinc-950/40 border-b border-zinc-800 space-y-3">
        <div className="text-[11px] font-bold text-zinc-300">Measurement Mode</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSetMeasureMode('point_to_point')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeMeasureMode === 'point_to_point'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Ruler className="w-4 h-4 text-cyan-400" />
            <span>Point-to-Point</span>
          </button>

          <button
            onClick={() => onSetMeasureMode('vertex_snap')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeMeasureMode === 'vertex_snap'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Maximize2 className="w-4 h-4 text-indigo-400" />
            <span>Vertex Snap</span>
          </button>

          <button
            onClick={() => onSetMeasureMode('angle_3point')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeMeasureMode === 'angle_3point'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>3-Point Angle</span>
          </button>
        </div>

        {/* Part Auto Dimension Shortcut */}
        {selectedObject && (
          <button
            onClick={handleMeasureSelectedBox}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span>Measure Bounds of "{selectedObject.name}"</span>
          </button>
        )}
      </div>

      {/* Measurement List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-1">
          <span>Active Measurements ({measurements.length})</span>
          {measurements.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onClearAllMeasurements}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {measurements.map(m => (
          <div
            key={m.id}
            className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-2 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span className="font-semibold text-zinc-100">{m.name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyMeasurement(m)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  title="Copy readouts"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleToggleVisible(m.id)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  {m.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
                </button>
                <button
                  onClick={() => handleDeleteMeasurement(m.id)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Readout Values */}
            <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 font-mono text-[11px]">
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">Distance</span>
                <span className="font-bold text-cyan-400">{m.distanceMm.toFixed(2)}mm</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">ΔX</span>
                <span className="text-zinc-200">{m.deltaX.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">ΔY</span>
                <span className="text-zinc-200">{m.deltaY.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">ΔZ</span>
                <span className="text-zinc-200">{m.deltaZ.toFixed(1)}</span>
              </div>
            </div>

            {m.angleDeg !== undefined && (
              <div className="text-[11px] font-mono text-amber-400">
                Angular Incline: <strong>{m.angleDeg.toFixed(1)}°</strong>
              </div>
            )}
          </div>
        ))}

        {measurements.length === 0 && (
          <div className="p-8 text-center text-zinc-500 text-xs space-y-2">
            <Ruler className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>No active measurements in workspace.</p>
            <p className="text-[11px] text-zinc-600">
              Click two points or vertices in the 3D viewport to measure Euclidean distance and delta dimensions.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
        <span>Accuracy: ±0.01mm Precision Coordinate Space</span>
      </div>
    </div>
  );
};
