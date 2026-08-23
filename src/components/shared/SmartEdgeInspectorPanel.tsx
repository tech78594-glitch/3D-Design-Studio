import React, { useState } from 'react';
import { CADEdge, SelectedEdgeInfo } from '../../types/cad';
import {
  Maximize2,
  Minimize2,
  X,
  Compass,
  Ruler,
  Layers,
  Sparkles,
  Scissors,
  Download,
  Check,
  Zap,
} from 'lucide-react';

interface SmartEdgeInspectorPanelProps {
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  selectedEdges: CADEdge[];
  onClearSelection: () => void;
  onSelectLoop: () => void;
  onApplyFillet?: (radiusMm: number) => void;
  onApplyChamfer?: (distanceMm: number) => void;
}

export const SmartEdgeInspectorPanel: React.FC<SmartEdgeInspectorPanelProps> = ({
  isActive,
  onToggleActive,
  selectedEdges,
  onClearSelection,
  onSelectLoop,
  onApplyFillet,
  onApplyChamfer,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [filletRadius, setFilletRadius] = useState(2.0);
  const [chamferDistance, setChamferDistance] = useState(1.5);
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isActive) return null;

  const totalLengthMm = selectedEdges.reduce((sum, e) => sum + e.lengthMm, 0);
  const primaryEdge = selectedEdges[0] || null;

  const handleExportEdgePathSVG = () => {
    if (selectedEdges.length === 0) return;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="400" height="400">\n`;
    svg += `  <style>line { stroke: #38bdf8; stroke-width: 2; stroke-linecap: round; }</style>\n`;
    svg += `  <rect x="-100" y="-100" width="200" height="200" fill="#09090b"/>\n`;

    selectedEdges.forEach(edge => {
      svg += `  <line x1="${edge.vertexA[0].toFixed(2)}" y1="${(-edge.vertexA[1]).toFixed(2)}" x2="${edge.vertexB[0].toFixed(2)}" y2="${(-edge.vertexB[1]).toFixed(2)}" />\n`;
    });

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAD_Edge_Path_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCoordinates = () => {
    if (!primaryEdge) return;
    const text = `Start: [${primaryEdge.vertexA.join(', ')}]\nEnd: [${primaryEdge.vertexB.join(', ')}]\nLength: ${primaryEdge.lengthMm} mm`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="absolute bottom-6 right-6 z-40 w-80 bg-zinc-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 animate-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-cyan-300">Smart Edge Inspector</h3>
            <p className="text-[10px] text-zinc-400">
              {selectedEdges.length === 0
                ? 'Hover & click any 3D model edge'
                : `${selectedEdges.length} edge${selectedEdges.length > 1 ? 's' : ''} selected`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onToggleActive(false)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title="Close Edge Selection Mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3.5 text-xs">
          {selectedEdges.length === 0 ? (
            <div className="text-center py-4 space-y-2 text-zinc-400">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-zinc-300">Edge Selection Mode Active</p>
              <p className="text-[11px] text-zinc-500 max-w-[220px] mx-auto">
                Move your cursor across the CAD model in the viewport. Sharp feature edges highlight in real-time.
              </p>
            </div>
          ) : (
            <>
              {/* Primary Edge Metrics */}
              <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="font-bold text-cyan-400">{primaryEdge?.objectName}</span>
                  <span className="capitalize font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {primaryEdge?.edgeType.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-zinc-400">Total Edge Length:</span>
                  <span className="text-base font-black text-cyan-300 font-mono">
                    {totalLengthMm.toFixed(2)} mm
                  </span>
                </div>

                {primaryEdge && (
                  <div className="text-[10px] font-mono text-zinc-500 space-y-0.5 border-t border-zinc-800/80 pt-1.5">
                    <div className="flex justify-between">
                      <span>Start [X, Y, Z]:</span>
                      <span className="text-zinc-300">[{primaryEdge.vertexA.join(', ')}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End [X, Y, Z]:</span>
                      <span className="text-zinc-300">[{primaryEdge.vertexB.join(', ')}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dihedral Angle:</span>
                      <span className="text-zinc-300">~{primaryEdge.dihedralAngleDeg ?? 90}°</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Edge Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onSelectLoop}
                    className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                    title="Select continuous edge loop"
                  >
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>Select Loop</span>
                  </button>

                  <button
                    onClick={handleCopyCoordinates}
                    className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    {copiedNotification ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Ruler className="w-3 h-3 text-amber-400" />
                    )}
                    <span>{copiedNotification ? 'Copied!' : 'Copy Coords'}</span>
                  </button>
                </div>

                {/* Fillet / Chamfer Quick Controls */}
                <div className="p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                    <span>Edge Fillet / Chamfer Tool</span>
                    <Scissors className="w-3 h-3 text-cyan-400" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-zinc-500 font-mono">R:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="8.0"
                        step="0.5"
                        value={filletRadius}
                        onChange={e => setFilletRadius(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-cyan-300 w-8">{filletRadius}mm</span>
                    </div>

                    {onApplyFillet && (
                      <button
                        onClick={() => onApplyFillet(filletRadius)}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 rounded text-[10px] font-bold transition-colors"
                      >
                        Fillet
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-zinc-500 font-mono">C:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="8.0"
                        step="0.5"
                        value={chamferDistance}
                        onChange={e => setChamferDistance(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-amber-300 w-8">{chamferDistance}mm</span>
                    </div>

                    {onApplyChamfer && (
                      <button
                        onClick={() => onApplyChamfer(chamferDistance)}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded text-[10px] font-bold transition-colors"
                      >
                        Chamfer
                      </button>
                    )}
                  </div>
                </div>

                {/* SVG Export & Clear */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleExportEdgePathSVG}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export 2D Path (SVG)</span>
                  </button>

                  <button
                    onClick={onClearSelection}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
