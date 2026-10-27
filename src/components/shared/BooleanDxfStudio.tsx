/**
 * Boolean Solid Operations (Union/Subtract/Intersect) + AutoCAD DXF Import/Export.
 *
 * Boolean ops mirror AutoCAD's SOLIDEDIT/boolean commands for combining or cutting solids.
 * DXF import/export gives real interchange with AutoCAD's own native, open file format —
 * DWG (AutoCAD's proprietary binary format) isn't supported since there's no documented
 * spec or free parser for it; see the note in the DXF tab below.
 */

import React, { useRef, useState } from 'react';
import { CADObject, BooleanOperationType, DesignSection } from '../../types/cad';
import { performBooleanOperation } from '../../utils/booleanOps';
import { exportDesignToDXF, parseDxfEntities, dxfEntitiesToObjects } from '../../utils/dxfInterchange';
import { MATERIAL_PRESETS } from '../../utils/materials';
import {
  X,
  Combine,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface BooleanDxfStudioProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  section: DesignSection;
  onApplyBooleanResult: (resultObject: CADObject, sourceIdA: string, sourceIdB: string) => void;
  onImportObjects: (objects: CADObject[]) => void;
}

export const BooleanDxfStudio: React.FC<BooleanDxfStudioProps> = ({
  isOpen,
  onClose,
  objects,
  section,
  onApplyBooleanResult,
  onImportObjects,
}) => {
  const [activeTab, setActiveTab] = useState<'boolean' | 'dxf'>('boolean');
  const [objAId, setObjAId] = useState<string>('');
  const [objBId, setObjBId] = useState<string>('');
  const [operation, setOperation] = useState<BooleanOperationType>('union');
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const eligibleObjects = objects.filter(o => o.visible);

  const handleRunBoolean = () => {
    const objA = objects.find(o => o.id === objAId);
    const objB = objects.find(o => o.id === objBId);
    if (!objA || !objB) {
      setStatusMsg({ ok: false, text: 'Select two different parts first.' });
      return;
    }
    if (objAId === objBId) {
      setStatusMsg({ ok: false, text: 'Pick two different parts for a boolean operation.' });
      return;
    }

    const result = performBooleanOperation(objA, objB, operation);
    if (result.success && result.object) {
      onApplyBooleanResult(result.object, objA.id, objB.id);
      setStatusMsg({ ok: true, text: result.message });
      setObjAId('');
      setObjBId('');
    } else {
      setStatusMsg({ ok: false, text: result.message });
    }
  };

  const handleExportDXF = () => {
    const dxf = exportDesignToDXF(objects, `CAD_Design_${section}`);
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cad_design_${section}_${Date.now()}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDXFClick = () => fileInputRef.current?.click();

  const handleImportDXFFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const entities = parseDxfEntities(text);
        const baseMaterial = { ...(MATERIAL_PRESETS['matte_black_polycarbonate'] || Object.values(MATERIAL_PRESETS)[0]), id: `mat_dxf_${Date.now()}` };
        const imported = dxfEntitiesToObjects(entities, section, 5, baseMaterial);

        if (imported.length === 0) {
          setImportMsg({ ok: false, text: `Parsed ${entities.length} DXF entities but none were closed polylines/circles this app can convert into solids.` });
          return;
        }

        onImportObjects(imported);
        setImportMsg({ ok: true, text: `Imported ${imported.length} solid${imported.length === 1 ? '' : 's'} from ${file.name}.` });
      } catch (err) {
        setImportMsg({ ok: false, text: `Could not parse that file as DXF: ${err instanceof Error ? err.message : 'unknown error'}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      id="boolean_dxf_backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="boolean_dxf_modal"
        className="w-full max-w-xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-900/30 text-rose-400 border border-rose-700/50">
              <Combine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Boolean Ops & DXF Interchange</h2>
              <p className="text-[11px] text-zinc-400">Union/Subtract/Intersect solids &middot; Import/Export AutoCAD DXF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('boolean')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
              activeTab === 'boolean' ? 'text-rose-300 border-b-2 border-rose-500' : 'text-zinc-500'
            }`}
          >
            Boolean Operations
          </button>
          <button
            onClick={() => setActiveTab('dxf')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
              activeTab === 'dxf' ? 'text-rose-300 border-b-2 border-rose-500' : 'text-zinc-500'
            }`}
          >
            DXF Import / Export
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'boolean' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {(['union', 'subtract', 'intersect'] as BooleanOperationType[]).map(op => (
                  <button
                    key={op}
                    onClick={() => setOperation(op)}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                      operation === op
                        ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Part A {operation === 'subtract' ? '(base)' : ''}</label>
                  <select
                    value={objAId}
                    onChange={e => setObjAId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="">Select a part...</option>
                    {eligibleObjects.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Part B {operation === 'subtract' ? '(to subtract)' : ''}</label>
                  <select
                    value={objBId}
                    onChange={e => setObjBId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="">Select a part...</option>
                    {eligibleObjects.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                id="btn_run_boolean_op"
                onClick={handleRunBoolean}
                disabled={!objAId || !objBId}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
              >
                <Combine className="w-4 h-4" />
                Run {operation.charAt(0).toUpperCase() + operation.slice(1)}
              </button>

              <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-500">
                Both source parts are replaced by the single resulting solid. Works best between watertight
                parametric shapes (box/cylinder/sphere/cone/rounded box); very thin or non-manifold shapes may
                fail to produce a clean result.
              </div>

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    statusMsg.ok
                      ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                  }`}
                >
                  {statusMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}
            </>
          )}

          {activeTab === 'dxf' && (
            <>
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>DWG is not supported.</strong> It's Autodesk's proprietary binary format with no public
                  spec or free parser. DXF is AutoCAD's own open interchange format — AutoCAD opens/saves it
                  natively, so this gives real round-trip compatibility without faking DWG support.
                </span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  Export DXF
                </div>
                <p className="text-[11px] text-zinc-500">
                  Writes each visible part's top-down footprint (a circle for round parts, a rectangle for
                  everything else) to an AutoCAD R12-compatible DXF, one layer per part category.
                </p>
                <button
                  id="btn_export_dxf"
                  onClick={handleExportDXF}
                  disabled={eligibleObjects.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Current Design as DXF
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                  Import DXF
                </div>
                <p className="text-[11px] text-zinc-500">
                  Reads LINE, CIRCLE, and closed LWPOLYLINE entities and converts each into a real 3D solid
                  (extruded to a default 5mm thickness, editable afterward in the Inspector).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dxf"
                  onChange={handleImportDXFFile}
                  className="hidden"
                  id="input_import_dxf_file"
                />
                <button
                  id="btn_import_dxf"
                  onClick={handleImportDXFClick}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                >
                  <FileCode className="w-4 h-4" />
                  Choose DXF File...
                </button>
              </div>

              {importMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    importMsg.ok
                      ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                  }`}
                >
                  {importMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{importMsg.text}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
