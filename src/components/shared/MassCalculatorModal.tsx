import React, { useState, useMemo } from 'react';
import {
  CADObject,
  CADMassProperties,
  PartMassItem,
} from '../../types/cad';
import {
  calculateAssemblyMassProperties,
  MATERIAL_DENSITY_DATABASE,
  generateMassReportMarkdown,
  generateMassReportCSV,
} from '../../utils/massCalculator';
import {
  Scale,
  X,
  Download,
  Crosshair,
  Layers,
  Sparkles,
  Search,
  DollarSign,
  Box,
  RotateCw,
  Sliders,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';

interface MassCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  assemblyName?: string;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  showCoGInViewport?: boolean;
  onToggleCoGInViewport?: (show: boolean) => void;
}

export const MassCalculatorModal: React.FC<MassCalculatorModalProps> = ({
  isOpen,
  onClose,
  objects,
  assemblyName = 'Hardware Assembly',
  selectedObjectId,
  onSelectObject,
  showCoGInViewport = false,
  onToggleCoGInViewport,
}) => {
  const [densityOverrides, setDensityOverrides] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'breakdown' | 'tensor' | 'density_matrix'>('breakdown');
  const [unitSystem, setUnitSystem] = useState<'metric_g' | 'metric_kg' | 'imperial_lbs'>('metric_g');

  // Compute real-time mass properties
  const massProps: CADMassProperties = useMemo(() => {
    return calculateAssemblyMassProperties(objects, densityOverrides);
  }, [objects, densityOverrides]);

  if (!isOpen) return null;

  const filteredParts = massProps.parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.materialName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    return true;
  });

  const handleUpdateDensity = (partId: string, newDensity: number) => {
    setDensityOverrides(prev => ({
      ...prev,
      [partId]: newDensity,
    }));
  };

  const handleResetDensity = (partId: string) => {
    setDensityOverrides(prev => {
      const copy = { ...prev };
      delete copy[partId];
      return copy;
    });
  };

  const handleResetAllDensities = () => {
    setDensityOverrides({});
  };

  const handleDownloadMarkdown = () => {
    const md = generateMassReportMarkdown(massProps, assemblyName);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assemblyName.replace(/\s+/g, '_')}_Mass_Properties_Report.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csv = generateMassReportCSV(massProps);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assemblyName.replace(/\s+/g, '_')}_Mass_BOM.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatMassValue = (grams: number) => {
    if (unitSystem === 'metric_kg') {
      return `${(grams / 1000).toFixed(3)} kg`;
    }
    if (unitSystem === 'imperial_lbs') {
      return `${(grams * 0.00220462).toFixed(3)} lbs`;
    }
    return `${grams.toFixed(1)} g`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Real-time Mass & Physical Properties Calculator
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LIVE DYNAMICS
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Mesh tetrahedral signed volume integration &bull; CoG tracking &bull; Moment of Inertia tensor
              </p>
            </div>
          </div>

          {/* Unit Toggle & Close */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700 text-xs">
              <button
                onClick={() => setUnitSystem('metric_g')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  unitSystem === 'metric_g' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Grams (g)
              </button>
              <button
                onClick={() => setUnitSystem('metric_kg')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  unitSystem === 'metric_kg' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Kilograms (kg)
              </button>
              <button
                onClick={() => setUnitSystem('imperial_lbs')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  unitSystem === 'imperial_lbs' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pounds (lbs)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-zinc-950/40 border-b border-zinc-800/80">
          <div className="p-3 bg-zinc-850/90 rounded-xl border border-amber-500/30 shadow-inner">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span className="font-semibold text-amber-300">TOTAL ASSEMBLY MASS</span>
              <Scale className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {formatMassValue(massProps.totalMassGrams)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {massProps.totalMassKg} kg &bull; {massProps.totalMassLbs} lbs
            </div>
          </div>

          <div className="p-3 bg-zinc-850/90 rounded-xl border border-zinc-800 shadow-inner">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span>CENTER OF GRAVITY (X, Y, Z)</span>
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-sm font-bold text-sky-300 font-mono truncate">
              [{massProps.centerOfGravity[0]}, {massProps.centerOfGravity[1]}, {massProps.centerOfGravity[2]}] mm
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Principal centroid in CAD world space
            </div>
          </div>

          <div className="p-3 bg-zinc-850/90 rounded-xl border border-zinc-800 shadow-inner">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span>TOTAL VOLUME</span>
              <Box className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {massProps.totalVolumeCm3.toLocaleString()} cm³
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Surface: {massProps.totalSurfaceAreaCm2.toLocaleString()} cm²
            </div>
          </div>

          <div className="p-3 bg-zinc-850/90 rounded-xl border border-zinc-800 shadow-inner">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span>RAW MATERIAL COST</span>
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="text-sm font-bold text-green-400 font-mono">
              ${massProps.estimatedMaterialCostUsd.toFixed(2)} USD
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Stock estimate ({massProps.parts.length} parts)
            </div>
          </div>

          <div className="p-3 bg-zinc-850/90 rounded-xl border border-zinc-800 shadow-inner col-span-2 md:col-span-1 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span>VIEWPORT COG GIZMO</span>
            </div>
            {onToggleCoGInViewport ? (
              <button
                onClick={() => onToggleCoGInViewport(!showCoGInViewport)}
                className={`w-full py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  showCoGInViewport
                    ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{showCoGInViewport ? 'CoG Visible' : 'Show CoG'}</span>
              </button>
            ) : (
              <span className="text-xs text-zinc-500">CoG Tracker Ready</span>
            )}
          </div>
        </div>

        {/* Visual Weight Distribution Stacked Bar */}
        <div className="px-6 py-2.5 bg-zinc-900 border-b border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span>Assembly Weight Distribution (% of Total Mass)</span>
            <span className="text-amber-400 font-mono text-[10px]">
              Top 6 contributors shown
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
            {massProps.parts.slice(0, 8).map((part, idx) => {
              const colors = ['#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#ec4899', '#f97316', '#6366f1', '#14b8a6'];
              const col = colors[idx % colors.length];
              return (
                <div
                  key={part.id}
                  style={{ width: `${Math.max(1, part.percentageOfTotal)}%`, backgroundColor: col }}
                  title={`${part.name}: ${part.percentageOfTotal.toFixed(1)}% (${formatMassValue(part.massGrams)})`}
                  className="h-full transition-all hover:brightness-125 cursor-pointer"
                />
              );
            })}
          </div>
        </div>

        {/* Tabs Bar & Actions */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-zinc-800 bg-zinc-950/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'breakdown'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Parts Mass Breakdown ({filteredParts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tensor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'tensor'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Moment of Inertia Tensor (3x3)</span>
            </button>
            <button
              onClick={() => setActiveTab('density_matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'density_matrix'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Material Density Overrides</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {Object.keys(densityOverrides).length > 0 && (
              <button
                onClick={handleResetAllDensities}
                className="px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/20"
              >
                Reset All Overrides ({Object.keys(densityOverrides).length})
              </button>
            )}
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition-colors"
              title="Export Bill of Materials Mass CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Export Full Engineering Report in Markdown"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-950" />
              <span>Engineering Report</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Parts Mass Breakdown */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search component by name or material..."
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-xs text-zinc-400">
                  Showing <span className="text-amber-400 font-bold">{filteredParts.length}</span> components
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Component</th>
                      <th className="py-2.5 px-3">Material Presets</th>
                      <th className="py-2.5 px-3 text-right">Density</th>
                      <th className="py-2.5 px-3 text-right">Volume</th>
                      <th className="py-2.5 px-3 text-right">Mass</th>
                      <th className="py-2.5 px-3 text-right">% Assembly</th>
                      <th className="py-2.5 px-3 text-center">CoG (X, Y, Z)</th>
                      <th className="py-2.5 px-3 text-right">Material Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredParts.map(part => {
                      const isSelected = selectedObjectId === part.id;
                      return (
                        <tr
                          key={part.id}
                          onClick={() => onSelectObject?.(part.id)}
                          className={`hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-500/10 text-amber-200' : 'text-zinc-200'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isSelected ? 'bg-amber-400 animate-ping' : 'bg-zinc-500'
                                }`}
                              />
                              <span className="font-semibold text-white">{part.name}</span>
                              {part.isCustomDensity && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  MOD
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {part.materialName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                            {part.densityGcm3.toFixed(2)} g/cm³
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                            {part.volumeCm3.toFixed(2)} cm³
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                            {formatMassValue(part.massGrams)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                            {part.percentageOfTotal.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-zinc-400 text-[11px]">
                            [{part.centerOfGravity[0]}, {part.centerOfGravity[1]}, {part.centerOfGravity[2]}]
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-green-400 font-medium">
                            ${part.costUsd.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Moment of Inertia Tensor (3x3 Matrix) */}
          {activeTab === 'tensor' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-zinc-950/80 p-5 rounded-2xl border border-sky-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <RotateCw className="w-4 h-4" />
                    <span>Moments of Inertia Tensor (Calculated at Center of Mass)</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">Unit: g &bull; mm²</span>
                </div>

                <p className="text-xs text-zinc-400">
                  The rotational inertia tensor matrix characterizes the resistance of the entire multi-body CAD assembly to angular acceleration about its principal axes.
                </p>

                <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800 font-mono text-sm">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-sky-500/20 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Ixx (Roll)</span>
                    <span className="font-bold text-sky-300">{massProps.inertiaTensor.Ixx.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Ixy (Cross)</span>
                    <span className="text-zinc-400">{massProps.inertiaTensor.Ixy.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Ixz (Cross)</span>
                    <span className="text-zinc-400">{massProps.inertiaTensor.Izx.toLocaleString()}</span>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Iyx (Cross)</span>
                    <span className="text-zinc-400">{massProps.inertiaTensor.Ixy.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-sky-500/20 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Iyy (Pitch)</span>
                    <span className="font-bold text-sky-300">{massProps.inertiaTensor.Iyy.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Iyz (Cross)</span>
                    <span className="text-zinc-400">{massProps.inertiaTensor.Iyz.toLocaleString()}</span>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Izx (Cross)</span>
                    <span className="text-zinc-400">{massProps.inertiaTensor.Izx.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Izy (Cross)</span>
                    <span className="text-zinc-400">{massProps.inertiaTensor.Iyz.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-sky-500/20 text-center">
                    <span className="text-[10px] text-zinc-500 block mb-1">Izz (Yaw)</span>
                    <span className="font-bold text-sky-300">{massProps.inertiaTensor.Izz.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex items-center justify-between">
                  <span>Bounding Box Dimensions:</span>
                  <span className="font-mono text-zinc-200 font-semibold">
                    {massProps.boundingBoxMm.width} mm (W) &times; {massProps.boundingBoxMm.height} mm (H) &times; {massProps.boundingBoxMm.depth} mm (D)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Material Density Overrides */}
          {activeTab === 'density_matrix' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-950/70 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>
                    Select any part to assign high-precision material densities from the engineering database.
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {MATERIAL_DENSITY_DATABASE.length} Materials Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {objects.map(obj => {
                  const currentDensity = densityOverrides[obj.id] ?? calculateAssemblyMassProperties([obj]).parts[0]?.densityGcm3 ?? 2.70;
                  return (
                    <div
                      key={obj.id}
                      className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">{obj.name}</span>
                        {densityOverrides[obj.id] !== undefined && (
                          <button
                            onClick={() => handleResetDensity(obj.id)}
                            className="text-[10px] text-amber-400 hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <select
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateDensity(obj.id, val);
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">Choose preset...</option>
                          {MATERIAL_DENSITY_DATABASE.map(mat => (
                            <option key={mat.id} value={mat.densityGcm3}>
                              {mat.name} ({mat.densityGcm3} g/cm³)
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0.1"
                            max="30"
                            value={currentDensity}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) handleUpdateDensity(obj.id, val);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-[10px] text-zinc-500 font-mono">g/cm³</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Updated synchronously with 3D model transforms and CAD geometry</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
