import React, { useState, useMemo } from 'react';
import { CADObject, AdvancedClashItem, ClashDetectionSettings, ClashSeverity } from '../../types/cad';
import { runAssemblyClashScan, autoResolveClash, DEFAULT_CLASH_SETTINGS } from '../../utils/clashDetection';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Wrench,
  Eye,
  FileText,
  X,
  Target,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';

interface ClashDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  onUpdateObjects: (updated: CADObject[]) => void;
  onSelectObject?: (id: string | null) => void;
  onFocusCoordinates?: (coords: [number, number, number]) => void;
}

export const ClashDetectionModal: React.FC<ClashDetectionModalProps> = ({
  isOpen,
  onClose,
  objects,
  onUpdateObjects,
  onSelectObject,
  onFocusCoordinates,
}) => {
  const [settings, setSettings] = useState<ClashDetectionSettings>(DEFAULT_CLASH_SETTINGS);
  const [selectedClashId, setSelectedClashId] = useState<string | null>(null);
  const [ignoredClashes, setIgnoredClashes] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resolveFeedback, setResolveFeedback] = useState<string | null>(null);

  // Compute live clash items
  const clashResults = useMemo(() => {
    return runAssemblyClashScan(objects, settings);
  }, [objects, settings]);

  const activeClashes = clashResults.filter(c => !ignoredClashes[c.id]);
  const criticalCount = activeClashes.filter(c => c.severity === 'critical_clash').length;
  const interferenceCount = activeClashes.filter(c => c.severity === 'soft_interference').length;
  const clearanceCount = activeClashes.filter(c => c.severity === 'clearance_touch').length;

  const filteredClashes = clashResults.filter(c => {
    const matchesSearch =
      c.partAName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partBName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const selectedClash = clashResults.find(c => c.id === selectedClashId) || filteredClashes[0];

  const handleResolve = (clash: AdvancedClashItem) => {
    const updated = autoResolveClash(objects, clash, settings.clearanceToleranceMm);
    onUpdateObjects(updated);
    setResolveFeedback(`Resolved clash between ${clash.partAName} & ${clash.partBName}`);
    setTimeout(() => setResolveFeedback(null), 3000);
  };

  const handleResolveAll = () => {
    let currentObjects = [...objects];
    for (const clash of activeClashes) {
      if (clash.severity === 'critical_clash' || clash.severity === 'soft_interference') {
        currentObjects = autoResolveClash(currentObjects, clash, settings.clearanceToleranceMm);
      }
    }
    onUpdateObjects(currentObjects);
    setResolveFeedback(`Auto-resolved ${activeClashes.length} assembly clashes!`);
    setTimeout(() => setResolveFeedback(null), 3000);
  };

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalComponents: objects.length,
      clashCount: activeClashes.length,
      settings,
      clashes: activeClashes,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAD_Assembly_Clash_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[88vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Clash & Volumetric Interference Detection
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  ISO 10303 CAD Validated
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Automated 3D intersection testing, clearance verification, and contact envelope analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700"
              title="Export Full JSON Engineering Report"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Export Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status KPI Banner */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-zinc-950/40 border-b border-zinc-800/60 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block text-[11px]">Total Scanned Parts</span>
              <span className="text-lg font-bold text-zinc-100 font-mono">{objects.length}</span>
            </div>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>

          <div
            className={`p-3 rounded-2xl border flex items-center justify-between ${
              criticalCount > 0
                ? 'bg-red-950/40 border-red-800/80 text-red-300'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
            }`}
          >
            <div>
              <span className="block text-[11px]">Critical Hard Clashes</span>
              <span className="text-lg font-bold font-mono">{criticalCount}</span>
            </div>
            <ShieldAlert className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-600'}`} />
          </div>

          <div
            className={`p-3 rounded-2xl border flex items-center justify-between ${
              interferenceCount > 0
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
            }`}
          >
            <div>
              <span className="block text-[11px]">Soft Interferences</span>
              <span className="text-lg font-bold font-mono">{interferenceCount}</span>
            </div>
            <AlertTriangle className={`w-5 h-5 ${interferenceCount > 0 ? 'text-amber-400' : 'text-zinc-600'}`} />
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block text-[11px]">Clearance Proximities</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{clearanceCount}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Notification Feedback */}
        {resolveFeedback && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-600/60 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{resolveFeedback}</span>
          </div>
        )}

        {/* Main Content Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Settings & Filter & Clash List */}
          <div className="w-1/2 border-r border-zinc-800/80 flex flex-col bg-zinc-950/20">
            {/* Scan Controls */}
            <div className="p-4 border-b border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Clearance Tolerance Threshold
                </span>
                <span className="font-mono text-xs text-blue-400 font-bold">
                  {settings.clearanceToleranceMm} mm
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={settings.clearanceToleranceMm}
                onChange={e =>
                  setSettings(prev => ({ ...prev, clearanceToleranceMm: parseFloat(e.target.value) }))
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search clashing parts..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {criticalCount > 0 && (
                  <button
                    onClick={handleResolveAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-md shrink-0"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Auto-Resolve All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clash Table List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredClashes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-zinc-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                  <p className="text-sm font-semibold text-zinc-300">No Interference Detected</p>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">
                    All components satisfy minimum {settings.clearanceToleranceMm}mm clearance and pass kinematic envelope checks.
                  </p>
                </div>
              ) : (
                filteredClashes.map(clash => {
                  const isSelected = selectedClash?.id === clash.id;
                  const isIgnored = !!ignoredClashes[clash.id];

                  let badgeColor = 'bg-red-500/20 text-red-400 border-red-500/40';
                  let badgeText = 'HARD CLASH';
                  if (clash.severity === 'soft_interference') {
                    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                    badgeText = 'INTERFERENCE';
                  } else if (clash.severity === 'clearance_touch') {
                    badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
                    badgeText = 'PROXIMITY';
                  }

                  return (
                    <div
                      key={clash.id}
                      onClick={() => setSelectedClashId(clash.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800/90 border-blue-500 shadow-md shadow-blue-950/50'
                          : 'bg-zinc-900/60 hover:bg-zinc-800/50 border-zinc-800'
                      } ${isIgnored ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {clash.overlapVolumeMm3 > 0
                            ? `Overlap: ${clash.overlapVolumeMm3} mm³`
                            : `Dist: ${clash.minClearanceDistanceMm} mm`}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-zinc-200">
                        {clash.partAName} <span className="text-zinc-500 font-normal">↔</span> {clash.partBName}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                        <span>Penetration: {clash.penetrationDepthMm} mm</span>
                        <span className="font-mono text-zinc-500">
                          [{clash.clashCenterPoint.map(v => v.toFixed(0)).join(', ')}]
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Clash Inspector & Diagnostics */}
          <div className="w-1/2 p-6 flex flex-col justify-between bg-zinc-900/30 overflow-y-auto">
            {selectedClash ? (
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Interference Geometry Telemetry
                  </span>
                  <h3 className="text-base font-bold text-zinc-100 mt-1">
                    {selectedClash.partAName} <span className="text-red-400">vs</span> {selectedClash.partBName}
                  </h3>
                </div>

                {/* Clash Diagnostic Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">Penetration Depth</span>
                    <span className="text-base font-bold font-mono text-red-400">
                      {selectedClash.penetrationDepthMm} mm
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">Volumetric Overlap</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {selectedClash.overlapVolumeMm3} mm³
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">3D Clash Center Datum</span>
                    <span className="text-xs font-bold font-mono text-cyan-400">
                      X: {selectedClash.clashCenterPoint[0].toFixed(1)}, Y: {selectedClash.clashCenterPoint[1].toFixed(1)}, Z: {selectedClash.clashCenterPoint[2].toFixed(1)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">Clearance Violation</span>
                    <span className="text-xs font-bold font-mono text-zinc-300">
                      {selectedClash.minClearanceDistanceMm > 0
                        ? `${selectedClash.minClearanceDistanceMm} mm (Under ${settings.clearanceToleranceMm}mm)`
                        : 'Direct Contact Collision'}
                    </span>
                  </div>
                </div>

                {/* Interactive Action Bar */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-200">Mitigation & Engineering Actions</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleResolve(selectedClash)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Nudge Apart</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onFocusCoordinates) onFocusCoordinates(selectedClash.clashCenterPoint);
                        if (onSelectObject) onSelectObject(selectedClash.partBId);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700"
                    >
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>Focus 3D Viewport</span>
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setIgnoredClashes(prev => ({
                        ...prev,
                        [selectedClash.id]: !prev[selectedClash.id],
                      }))
                    }
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800/80 transition-colors"
                  >
                    {ignoredClashes[selectedClash.id]
                      ? 'Re-activate Clash in Reports'
                      : 'Ignore & Acknowledge as Intentional Interference'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                <Target className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs">Select a clash from the list to inspect CAD bounding metrics</p>
              </div>
            )}

            {/* Bottom Footer Actions */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Collision Engine: Precise Oriented AABB & Minkowski Difference</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
