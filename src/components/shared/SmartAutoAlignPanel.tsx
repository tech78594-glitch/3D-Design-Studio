import React, { useState } from 'react';
import { CADObject, AutoAlignDirection, AutoAlignOptions } from '../../types/cad';
import { executeSmartAutoAlign } from '../../utils/autoAlign';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Layers,
  ArrowDownToLine,
  ArrowUpToLine,
  Minimize2,
  Check,
  Sparkles,
  Sliders,
  Anchor,
  HelpCircle,
  X,
} from 'lucide-react';

interface SmartAutoAlignPanelProps {
  objects: CADObject[];
  selectedObjectId: string | null;
  onUpdateObjects: (updated: CADObject[]) => void;
  onClose?: () => void;
}

export const SmartAutoAlignPanel: React.FC<SmartAutoAlignPanelProps> = ({
  objects,
  selectedObjectId,
  onUpdateObjects,
  onClose,
}) => {
  const [referenceTarget, setReferenceTarget] = useState<'anchor_part' | 'assembly_bbox' | 'origin_ground'>('anchor_part');
  const [anchorPartId, setAnchorPartId] = useState<string>(
    selectedObjectId || objects[0]?.id || ''
  );
  const [spacingOffset, setSpacingOffset] = useState<number>(0);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const selectedObj = objects.find(o => o.id === selectedObjectId);

  const handleAlign = (direction: AutoAlignDirection, actionLabel: string) => {
    // If an object is selected, align that object; otherwise align all objects
    const targetIds = selectedObjectId ? [selectedObjectId] : objects.map(o => o.id);

    const options: AutoAlignOptions = {
      direction,
      referenceTarget,
      anchorPartId: referenceTarget === 'anchor_part' ? anchorPartId : undefined,
      spacingOffsetMm: spacingOffset,
    };

    const updated = executeSmartAutoAlign(objects, targetIds, options);
    onUpdateObjects(updated);
    setLastAction(actionLabel);
    setTimeout(() => setLastAction(null), 2500);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 w-full max-w-md text-zinc-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Smart Assembly Auto-Align</h3>
            <p className="text-[11px] text-zinc-400">
              {selectedObj
                ? `Target: ${selectedObj.name}`
                : 'Target: All Assembly Components'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Target Reference Mode */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Anchor className="w-3.5 h-3.5 text-blue-400" />
          Alignment Reference Datum
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setReferenceTarget('anchor_part')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
              referenceTarget === 'anchor_part'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Anchor Part
          </button>
          <button
            onClick={() => setReferenceTarget('assembly_bbox')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
              referenceTarget === 'assembly_bbox'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Assembly Center
          </button>
          <button
            onClick={() => setReferenceTarget('origin_ground')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
              referenceTarget === 'origin_ground'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ground (Y=0)
          </button>
        </div>

        {referenceTarget === 'anchor_part' && (
          <div className="pt-1">
            <select
              value={anchorPartId}
              onChange={e => setAnchorPartId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} ({obj.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Spacing Offset Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-blue-400" />
            Clearance / Gap Offset
          </span>
          <span className="font-mono text-blue-400 font-semibold">{spacingOffset} mm</span>
        </div>
        <input
          type="range"
          min="-5"
          max="25"
          step="0.5"
          value={spacingOffset}
          onChange={e => setSpacingOffset(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Alignment Action Matrix */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300">Geometric Auto-Align Actions</label>

        {/* Centering Group */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleAlign('center_all', 'Centered 3D (All Axes)')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Center on All Axes (X, Y, Z)"
          >
            <AlignCenter className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Center 3D</span>
          </button>

          <button
            onClick={() => handleAlign('center_x', 'Centered along X Axis')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Center X"
          >
            <AlignHorizontalSpaceAround className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Center X</span>
          </button>

          <button
            onClick={() => handleAlign('center_y', 'Centered along Y Axis')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Center Y"
          >
            <AlignVerticalSpaceAround className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Center Y</span>
          </button>

          <button
            onClick={() => handleAlign('center_z', 'Centered along Z Axis')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Center Z"
          >
            <Minimize2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Center Z</span>
          </button>
        </div>

        {/* Flush Edge Alignment Group */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleAlign('flush_min_x', 'Flush Left (-X)')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Flush Left Edge"
          >
            <AlignLeft className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Flush Left</span>
          </button>

          <button
            onClick={() => handleAlign('flush_max_x', 'Flush Right (+X)')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Flush Right Edge"
          >
            <AlignRight className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Flush Right</span>
          </button>

          <button
            onClick={() => handleAlign('flush_max_y', 'Flush Top (+Y)')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Flush Top Face"
          >
            <ArrowUpToLine className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Flush Top</span>
          </button>

          <button
            onClick={() => handleAlign('flush_min_y', 'Flush Bottom (-Y)')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Flush Bottom Face"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Flush Base</span>
          </button>
        </div>

        {/* Advanced Stacking & Concentric Group */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleAlign('stack_up_y', 'Stacked Vertically (+Y)')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-800/80 hover:bg-amber-600/20 hover:border-amber-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Auto-calculate heights and stack in collision-free order"
          >
            <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Stack Up</span>
          </button>

          <button
            onClick={() => handleAlign('concentric_axial', 'Concentric Axial Mate')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-800/80 hover:bg-purple-600/20 hover:border-purple-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Concentric alignment of X and Z cylindrical centers"
          >
            <Minimize2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Concentric</span>
          </button>

          <button
            onClick={() => handleAlign('ground_to_bottom', 'Grounded to Bottom (Y=0)')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-zinc-800/80 hover:bg-cyan-600/20 hover:border-cyan-500/50 border border-zinc-700/60 text-zinc-200 transition-all text-center gap-1 group"
            title="Drop base surface flush with zero datum plane"
          >
            <ArrowDownToLine className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium leading-tight">Ground Plane</span>
          </button>
        </div>
      </div>

      {/* Confirmation feedback */}
      {lastAction && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>{lastAction} applied successfully!</span>
        </div>
      )}

      {/* Quick Helper Note */}
      <div className="flex items-start gap-1.5 text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-2.5">
        <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
        <span>
          Select a single object to reposition it relative to the anchor, or deselect to align the entire multi-part assembly.
        </span>
      </div>
    </div>
  );
};
