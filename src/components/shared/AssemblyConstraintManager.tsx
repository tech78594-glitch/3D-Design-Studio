/**
 * Assembly Constraint & Kinematic Mate Manager
 * Geometric mates: Coincident, Concentric/Axial, Distance Offset, Parallel, Perpendicular, Tangent, Angle.
 * Live mathematical constraint solver, collision interference checker, and kinematic motion preview.
 */

import React, { useState } from 'react';
import {
  CADConstraint,
  CADObject,
  ConstraintType,
  InterferenceResult,
} from '../../types/cad';
import {
  solveAssemblyConstraints,
  calculateInterferences,
} from '../../utils/constraintSolver';
import { holoAudio } from '../../utils/hologramAudio';
import {
  Link2,
  Unlink2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Box,
  Compass,
  Maximize2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssemblyConstraintManagerProps {
  objects: CADObject[];
  constraints: CADConstraint[];
  onUpdateConstraints: (constraints: CADConstraint[]) => void;
  onUpdateObjects: (objects: CADObject[]) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
}

export const AssemblyConstraintManager: React.FC<AssemblyConstraintManagerProps> = ({
  objects,
  constraints,
  onUpdateConstraints,
  onUpdateObjects,
  selectedObjectId,
  onSelectObject,
}) => {
  const [activeTab, setActiveTab] = useState<'constraints' | 'interference'>('constraints');
  const [isAddingConstraint, setIsAddingConstraint] = useState(false);

  // New Constraint Form State
  const [newType, setNewType] = useState<ConstraintType>('coincident');
  const [newPartA, setNewPartA] = useState<string>(objects[0]?.id || '');
  const [newPartB, setNewPartB] = useState<string>(objects[1]?.id || '');
  const [newAxis, setNewAxis] = useState<'x' | 'y' | 'z'>('z');
  const [newOffset, setNewOffset] = useState<number>(0);
  const [newAlignment, setNewAlignment] = useState<'aligned' | 'anti_aligned'>('aligned');

  // Interference Check Results
  const interferences = calculateInterferences(objects);
  const clashesCount = interferences.filter(i => i.type === 'clash').length;

  // Execute mathematical constraint solver
  const handleSolveAssembly = () => {
    const { updatedObjects, updatedConstraints } = solveAssemblyConstraints(objects, constraints);
    onUpdateObjects(updatedObjects);
    onUpdateConstraints(updatedConstraints);
    holoAudio.playConstraintSolved();
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.1 } });
  };

  // Add new constraint
  const handleAddConstraint = () => {
    if (!newPartA || !newPartB || newPartA === newPartB) return;

    const partAObj = objects.find(o => o.id === newPartA);
    const partBObj = objects.find(o => o.id === newPartB);

    const newC: CADConstraint = {
      id: `constraint_${Date.now()}`,
      name: `${newType.toUpperCase()}: ${partAObj?.name || 'Part A'} ➔ ${partBObj?.name || 'Part B'}`,
      type: newType,
      partAId: newPartA,
      partBId: newPartB,
      axis: newAxis,
      offset: newOffset,
      alignment: newAlignment,
      active: true,
      status: 'satisfied',
    };

    const nextConstraints = [...constraints, newC];
    onUpdateConstraints(nextConstraints);

    // Solve immediately
    const { updatedObjects, updatedConstraints } = solveAssemblyConstraints(objects, nextConstraints);
    onUpdateObjects(updatedObjects);
    onUpdateConstraints(updatedConstraints);

    setIsAddingConstraint(false);
    holoAudio.playMagneticLock();
  };

  // Delete constraint
  const handleDeleteConstraint = (id: string) => {
    onUpdateConstraints(constraints.filter(c => c.id !== id));
  };

  // Toggle active constraint
  const handleToggleActive = (c: CADConstraint) => {
    const updated = constraints.map(item =>
      item.id === c.id ? { ...item, active: !item.active } : item
    );
    onUpdateConstraints(updated);
    if (!c.active) {
      const { updatedObjects, updatedConstraints } = solveAssemblyConstraints(objects, updated);
      onUpdateObjects(updatedObjects);
      onUpdateConstraints(updatedConstraints);
    }
  };

  // Kinematic Motion Offset Update Slider
  const handleOffsetChange = (c: CADConstraint, newOffsetVal: number) => {
    const updated = constraints.map(item =>
      item.id === c.id ? { ...item, offset: newOffsetVal } : item
    );
    onUpdateConstraints(updated);
    const { updatedObjects, updatedConstraints } = solveAssemblyConstraints(objects, updated);
    onUpdateObjects(updatedObjects);
    onUpdateConstraints(updatedConstraints);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-200 select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-zinc-800 space-y-2 bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Assembly Constraints
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                clashesCount > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {clashesCount > 0 ? `${clashesCount} Clashes` : 'Zero Clash'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Solve All & Add Mate */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleSolveAssembly}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Solve & Snap</span>
          </button>
          <button
            onClick={() => setIsAddingConstraint(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 font-medium text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Constraint</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 pt-1 text-xs">
          <button
            onClick={() => setActiveTab('constraints')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-all ${
              activeTab === 'constraints'
                ? 'bg-zinc-800 text-blue-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active Mates ({constraints.length})
          </button>
          <button
            onClick={() => setActiveTab('interference')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-all ${
              activeTab === 'interference'
                ? 'bg-zinc-800 text-blue-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Interference ({interferences.length})
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ADD CONSTRAINT MODAL / FORM INLINE */}
        {isAddingConstraint && (
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-blue-500/50 space-y-3 shadow-xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Define Geometric Mate
              </span>
              <button
                onClick={() => setIsAddingConstraint(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {/* Mate Type */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Mate Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as ConstraintType)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="coincident">Coincident (Surface to Surface)</option>
                <option value="concentric">Concentric / Axial (Centerline Lock)</option>
                <option value="distance">Distance Offset (Fixed Clearance)</option>
                <option value="parallel">Parallel Orientation</option>
                <option value="perpendicular">Perpendicular 90° Lock</option>
                <option value="tangent">Tangent Curved Contact</option>
                <option value="angle">Angular Kinematic Joint</option>
              </select>
            </div>

            {/* Reference Component A */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Reference Part A (Anchor)</label>
              <select
                value={newPartA}
                onChange={e => setNewPartA(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                {objects.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Component B */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Target Part B (Constrained)</label>
              <select
                value={newPartB}
                onChange={e => setNewPartB(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                {objects.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Axis & Alignment */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Alignment Axis</label>
                <select
                  value={newAxis}
                  onChange={e => setNewAxis(e.target.value as 'x' | 'y' | 'z')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200"
                >
                  <option value="x">X Axis (Lateral)</option>
                  <option value="y">Y Axis (Vertical)</option>
                  <option value="z">Z Axis (Normal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Offset (mm / deg)</label>
                <input
                  type="number"
                  value={newOffset}
                  onChange={e => setNewOffset(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200"
                />
              </div>
            </div>

            <button
              onClick={handleAddConstraint}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Create & Enforce Mate
            </button>
          </div>
        )}

        {/* TAB 1: CONSTRAINTS LIST */}
        {activeTab === 'constraints' && (
          <div className="space-y-2.5">
            {constraints.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-800 space-y-2">
                <Link2 className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-xs font-semibold text-zinc-300">No Active Constraints</h4>
                <p className="text-[11px] text-zinc-500">
                  Add geometric mating constraints to align parts automatically and lock kinematic degrees of freedom.
                </p>
                <button
                  onClick={() => setIsAddingConstraint(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium pt-1"
                >
                  + Add First Constraint
                </button>
              </div>
            ) : (
              constraints.map(c => {
                const partA = objects.find(o => o.id === c.partAId);
                const partB = objects.find(o => o.id === c.partBId);

                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      c.active
                        ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        : 'bg-zinc-950/20 border-zinc-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={() => handleToggleActive(c)}
                          className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-200 capitalize">
                              {c.type} Mate
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                              Axis: {c.axis}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {partA?.name || 'Part A'} ➔ {partB?.name || 'Part B'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {c.status === 'satisfied' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" title="Mate Satisfied" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Warning" />
                        )}
                        <button
                          onClick={() => handleDeleteConstraint(c.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-850"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Kinematic Offset Slider */}
                    {c.active && (
                      <div className="pt-1.5 border-t border-zinc-850/80 space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Kinematic Offset:</span>
                          <span className="text-blue-400 font-semibold">{c.offset} {c.type === 'angle' ? 'deg' : 'mm'}</span>
                        </div>
                        <input
                          type="range"
                          min={c.type === 'angle' ? 0 : -50}
                          max={c.type === 'angle' ? 180 : 50}
                          step={c.type === 'angle' ? 5 : 0.5}
                          value={c.offset}
                          onChange={e => handleOffsetChange(c, parseFloat(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: INTERFERENCE & CLEARANCE */}
        {activeTab === 'interference' && (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Volumetric Clash Engine</span>
              <span className="font-mono text-zinc-400">{interferences.length} Contacts</span>
            </div>

            {interferences.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-800">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-zinc-200">No Physical Clashes</h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  All components satisfy physical assembly clearance tolerances.
                </p>
              </div>
            ) : (
              interferences.map((inf, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-1 text-xs ${
                    inf.type === 'clash'
                      ? 'bg-red-500/10 border-red-500/30 text-red-200'
                      : inf.type === 'touching'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{inf.partAName} ↔ {inf.partBName}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        inf.type === 'clash'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {inf.type}
                    </span>
                  </div>
                  {inf.overlapVolumeMm3 > 0 ? (
                    <div className="text-[11px] font-mono text-zinc-400">
                      Overlap Volume: <strong className="text-red-400">{inf.overlapVolumeMm3} mm³</strong>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-zinc-400">
                      Clearance Gap: <strong className="text-emerald-400">{inf.minDistanceMm} mm</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
