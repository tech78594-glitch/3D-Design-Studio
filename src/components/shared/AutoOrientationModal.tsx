/**
 * Auto-Orientation & DFM (Design For Manufacturing) Modal
 * Optimizes 3D CAD part orientation for minimal support volume, fastest print speed,
 * maximum bed adhesion, and mechanical layer line strength.
 */

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  Compass,
  Zap,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Maximize2,
  ArrowRight,
  TrendingDown,
  X,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { CADObject, OrientationCandidate, AutoOrientationObjective } from '../../types/cad';
import { computeAutoOrientation } from '../../utils/autoOrientation';
import { holoAudio } from '../../utils/hologramAudio';

interface AutoOrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  selectedObjectId: string | null;
  onUpdateObjects: (updated: CADObject[]) => void;
  onSelectObject?: (id: string) => void;
}

export const AutoOrientationModal: React.FC<AutoOrientationModalProps> = ({
  isOpen,
  onClose,
  objects,
  selectedObjectId,
  onUpdateObjects,
  onSelectObject,
}) => {
  const [activePartId, setActivePartId] = useState<string>(
    selectedObjectId || (objects.length > 0 ? objects[0].id : '')
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand_min_support');
  const [applyingAll, setApplyingAll] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Synchronize active part with props
  React.useEffect(() => {
    if (selectedObjectId) {
      setActivePartId(selectedObjectId);
    } else if (objects.length > 0 && !activePartId) {
      setActivePartId(objects[0].id);
    }
  }, [selectedObjectId, objects]);

  const targetObject = useMemo(() => {
    return objects.find(o => o.id === activePartId) || objects[0] || null;
  }, [objects, activePartId]);

  const report = useMemo(() => {
    if (!targetObject) return null;
    return computeAutoOrientation(targetObject);
  }, [targetObject]);

  if (!isOpen || !targetObject || !report) return null;

  const activeCandidate =
    report.candidates.find(c => c.id === selectedCandidateId) || report.candidates[0];

  const handleApplyCandidate = (candidate: OrientationCandidate, applyToAll = false) => {
    holoAudio.playAssemblySnap();
    if (applyToAll) {
      const updated = objects.map(obj => {
        const objReport = computeAutoOrientation(obj);
        const match =
          objReport.candidates.find(c => c.objective === candidate.objective) ||
          objReport.candidates[0];
        return {
          ...obj,
          rotation: [
            obj.rotation[0] + match.rotationEuler[0],
            obj.rotation[1] + match.rotationEuler[1],
            obj.rotation[2] + match.rotationEuler[2],
          ] as [number, number, number],
        };
      });
      onUpdateObjects(updated);
    } else {
      const updated = objects.map(obj => {
        if (obj.id === targetObject.id) {
          return {
            ...obj,
            rotation: [
              obj.rotation[0] + candidate.rotationEuler[0],
              obj.rotation[1] + candidate.rotationEuler[1],
              obj.rotation[2] + candidate.rotationEuler[2],
            ] as [number, number, number],
          };
        }
        return obj;
      });
      onUpdateObjects(updated);
    }

    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2400);
  };

  const getObjectiveIcon = (obj: AutoOrientationObjective) => {
    switch (obj) {
      case 'minimal_support':
        return <TrendingDown className="w-4 h-4 text-sky-400" />;
      case 'fastest_print_height':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'max_bed_contact':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'mechanical_strength':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Compass className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Auto-Orientation & DFM Solver</h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                  3D Print Optimizer
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Algorithmically computes optimal build plate orientations to minimize support structures, build height, and print cost.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Part Selection Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Boxes className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-xs font-medium text-zinc-400">Target CAD Component:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={activePartId}
                    onChange={e => {
                      setActivePartId(e.target.value);
                      if (onSelectObject) onSelectObject(e.target.value);
                    }}
                    className="bg-zinc-800 text-white font-medium text-sm px-3 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-sky-500"
                  >
                    {objects.map(obj => (
                      <option key={obj.id} value={obj.id}>
                        {obj.name} ({obj.dimensions.width}×{obj.dimensions.height}×{obj.dimensions.depth}mm)
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-zinc-500 font-mono">
                    [{targetObject.category.toUpperCase()}]
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics of Part */}
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-300">
              <div className="text-right">
                <span className="text-zinc-500 block">Dimensions</span>
                <span>{targetObject.dimensions.width}×{targetObject.dimensions.height}×{targetObject.dimensions.depth} mm</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block">Est. Mass</span>
                <span>{((targetObject.dimensions.width * targetObject.dimensions.height * targetObject.dimensions.depth * 1.25) / 1000).toFixed(1)} g</span>
              </div>
            </div>
          </div>

          {/* Orientation Candidate Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Algorithmically Computed Orientation Profiles
              </h3>
              <span className="text-xs text-zinc-500">Select a candidate to preview and apply</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.candidates.map(candidate => {
                const isSelected = selectedCandidateId === candidate.id;
                return (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      setSelectedCandidateId(candidate.id);
                      holoAudio.playSelectTone();
                    }}
                    className={`relative cursor-pointer p-4 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-sky-950/30 border-sky-500 ring-1 ring-sky-500/50'
                        : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70 hover:border-zinc-600'
                    }`}
                  >
                    {candidate.recommended && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Recommended
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      {getObjectiveIcon(candidate.objective)}
                      <h4 className="text-sm font-semibold text-white">{candidate.name}</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-mono">
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Support Vol</span>
                        <span className={candidate.supportVolumeCm3 <= 2 ? 'text-emerald-400 font-bold' : 'text-zinc-200'}>
                          {candidate.supportVolumeCm3} cm³
                        </span>
                      </div>
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Build Height</span>
                        <span className="text-zinc-200">{candidate.buildHeightMm} mm</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Print Time</span>
                        <span className="text-zinc-200">{candidate.printTimeHours} hrs</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                      <span>Rotation: <strong className="text-sky-300">{candidate.rotationDeg.join('°, ')}°</strong></span>
                      <span className="flex items-center gap-1 text-emerald-400 font-mono">
                        <DollarSign className="w-3 h-3" />${candidate.estimatedCostUsd}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Candidate Deep Dive Telemetry */}
          {activeCandidate && (
            <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-sky-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  Selected Solution: {activeCandidate.name}
                </h4>
                <span className="text-xs font-mono text-sky-300">
                  Stability Score: {activeCandidate.stabilityScore}/100
                </span>
              </div>

              {/* Progress bars comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Overhang Area (&gt;45°)</span>
                    <span className="font-mono text-sky-300">{activeCandidate.overhangAreaPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, activeCandidate.overhangAreaPercent * 2)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Bed Contact Adhesion</span>
                    <span className="font-mono text-emerald-400">{activeCandidate.bedContactAreaCm2} cm²</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (activeCandidate.bedContactAreaCm2 / 40) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            {appliedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Orientation applied successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleApplyCandidate(activeCandidate, true)}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700 flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Apply to All Parts in Assembly
            </button>
            <button
              onClick={() => handleApplyCandidate(activeCandidate, false)}
              className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply Selected Orientation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
