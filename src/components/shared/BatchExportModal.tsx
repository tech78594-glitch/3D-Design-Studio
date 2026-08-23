/**
 * Batch 3D CAD Export Modal
 * Configures multi-format exports (STL, OBJ/MTL, JSON), folder grouping,
 * scale conversion, and automatic ZIP archive compilation.
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  FolderArchive,
  Download,
  FileCode,
  Layers,
  Palette,
  CheckSquare,
  Square,
  Scale,
  Sparkles,
  X,
  FileText,
  CheckCircle2,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { CADObject, BatchExportConfig, BatchExportFormat, BatchPartGrouping } from '../../types/cad';
import { executeBatchExport } from '../../utils/batchExport';
import { holoAudio } from '../../utils/hologramAudio';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  selectedObjectId?: string | null;
  assemblyName?: string;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  objects,
  selectedObjectId,
  assemblyName = 'CAD_Studio_Hardware_Assembly',
}) => {
  const [formats, setFormats] = useState<BatchExportFormat[]>(['stl_ascii', 'obj_mtl', 'cad_json']);
  const [grouping, setGrouping] = useState<BatchPartGrouping>('individual_files');
  const [includeBOM, setIncludeBOM] = useState<boolean>(true);
  const [includeSpecs, setIncludeSpecs] = useState<boolean>(true);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0); // 1.0 = mm
  const [selectedOnly, setSelectedOnly] = useState<boolean>(false);
  const [zipName, setZipName] = useState<string>(
    `${assemblyName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Bundle_${new Date().toISOString().slice(0, 10)}`
  );

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [completed, setCompleted] = useState<boolean>(false);

  const targetObjects = useMemo(() => {
    if (selectedOnly && selectedObjectId) {
      return objects.filter(o => o.id === selectedObjectId);
    }
    return objects;
  }, [objects, selectedOnly, selectedObjectId]);

  const toggleFormat = (fmt: BatchExportFormat) => {
    setFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    );
  };

  const estimatedFileCount = useMemo(() => {
    let count = targetObjects.length * formats.length;
    if (formats.includes('obj_mtl')) count += targetObjects.length; // MTL files
    if (includeBOM) count += 1;
    if (includeSpecs) count += 1;
    return count;
  }, [targetObjects, formats, includeBOM, includeSpecs]);

  const estimatedUncompressedSizeMb = useMemo(() => {
    // Approx 25KB per part per format
    return ((estimatedFileCount * 32) / 1024).toFixed(2);
  }, [estimatedFileCount]);

  const handleStartExport = async () => {
    if (formats.length === 0) return;
    setIsExporting(true);
    setExportProgress(5);
    setProgressStatus('Initializing ZIP compiler...');
    holoAudio.playStartupTone();

    try {
      const config: BatchExportConfig = {
        formats,
        grouping,
        namingPattern: '{name}',
        includeBOMJson: includeBOM,
        includeSpecsTxt: includeSpecs,
        includeLayersList: true,
        scaleMultiplier,
        selectedPartsOnly: selectedOnly,
        activeLayerOnly: false,
        zipArchiveName: zipName,
        fileCountEstimate: estimatedFileCount,
        byteSizeEstimate: Number(estimatedUncompressedSizeMb) * 1024 * 1024,
      };

      await executeBatchExport(
        targetObjects,
        config,
        assemblyName,
        (percent, status) => {
          setExportProgress(percent);
          setProgressStatus(status);
        }
      );

      holoAudio.playAssemblySnap();
      setCompleted(true);
      setTimeout(() => {
        setIsExporting(false);
        setCompleted(false);
      }, 3000);
    } catch (err) {
      console.error('Batch export failed:', err);
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Batch Export & ZIP Bundler</h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  JSZip Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Package the entire 3D CAD assembly into individual meshes (.STL, .OBJ/MTL, .JSON) with organized folder hierarchies.
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
          {/* Target Parts & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">Export Scope</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOnly(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                    !selectedOnly
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> All Parts ({objects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOnly(true)}
                  disabled={!selectedObjectId}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                    selectedOnly
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40'
                  }`}
                >
                  Selected Part Only
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">Scale & Measurement Units</label>
              <select
                value={scaleMultiplier}
                onChange={e => setScaleMultiplier(Number(e.target.value))}
                className="w-full bg-zinc-800 text-white text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500"
              >
                <option value={1.0}>1:1 Millimeters (mm) - Standard CAD</option>
                <option value={10.0}>1:10 Centimeters (cm)</option>
                <option value={0.001}>1:1000 Meters (m) - Architectural</option>
                <option value={0.03937}>Inches (in) - Imperial</option>
              </select>
            </div>
          </div>

          {/* Export Formats Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Mesh & Data Formats to Generate
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* STL ASCII */}
              <div
                onClick={() => toggleFormat('stl_ascii')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  formats.includes('stl_ascii')
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">.STL (3D Mesh)</span>
                  {formats.includes('stl_ascii') ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Standard triangulated surface mesh for 3D printing and CNC slicers.
                </p>
              </div>

              {/* 3MF Package */}
              <div
                onClick={() => toggleFormat('cad_3mf')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  formats.includes('cad_3mf')
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300">.3MF (Manufacturing)</span>
                  {formats.includes('cad_3mf') ? (
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Next-gen 3D Manufacturing format for Bambu Studio, PrusaSlicer & Cura.
                </p>
              </div>

              {/* OBJ + MTL */}
              <div
                onClick={() => toggleFormat('obj_mtl')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  formats.includes('obj_mtl')
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">.OBJ + .MTL</span>
                  {formats.includes('obj_mtl') ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Wavefront 3D mesh with companion PBR material definitions.
                </p>
              </div>

              {/* JSON CAD Schema */}
              <div
                onClick={() => toggleFormat('cad_json')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  formats.includes('cad_json')
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">.JSON (Parametric)</span>
                  {formats.includes('cad_json') ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Full parametric geometry, dimensions, material, and electrical metadata.
                </p>
              </div>
            </div>
          </div>

          {/* Folder Hierarchy Grouping */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              ZIP Folder Organization
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label
                onClick={() => setGrouping('individual_files')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                  grouping === 'individual_files'
                    ? 'bg-zinc-800 border-emerald-500 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="grouping"
                  checked={grouping === 'individual_files'}
                  onChange={() => setGrouping('individual_files')}
                  className="hidden"
                />
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Flat Root Folder</span>
              </label>

              <label
                onClick={() => setGrouping('by_layer_folders')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                  grouping === 'by_layer_folders'
                    ? 'bg-zinc-800 border-emerald-500 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="grouping"
                  checked={grouping === 'by_layer_folders'}
                  onChange={() => setGrouping('by_layer_folders')}
                  className="hidden"
                />
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Subfolders by CAD Layer</span>
              </label>

              <label
                onClick={() => setGrouping('by_material_folders')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                  grouping === 'by_material_folders'
                    ? 'bg-zinc-800 border-emerald-500 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="grouping"
                  checked={grouping === 'by_material_folders'}
                  onChange={() => setGrouping('by_material_folders')}
                  className="hidden"
                />
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Subfolders by Material</span>
              </label>
            </div>
          </div>

          {/* Auxiliary Manifests & Output Archive Name */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-4">
            <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBOM}
                  onChange={e => setIncludeBOM(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0"
                />
                <span>Include BOM Manifest JSON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpecs}
                  onChange={e => setIncludeSpecs(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0"
                />
                <span>Include Engineering Specs TXT</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 block">ZIP File Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={zipName}
                  onChange={e => setZipName(e.target.value)}
                  className="flex-1 bg-zinc-800 text-white font-mono text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-zinc-500 font-mono">.zip</span>
              </div>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          {isExporting && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2 animate-in fade-in">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  {progressStatus}
                </span>
                <span className="font-mono text-emerald-400 font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="text-xs font-mono text-zinc-400">
            <span>Payload: </span>
            <strong className="text-white">{estimatedFileCount} files</strong>
            <span> (~{estimatedUncompressedSizeMb} MB)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              disabled={isExporting || formats.length === 0}
              className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" /> Download Complete!
                </>
              ) : isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Packaging ZIP...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download ZIP Bundle
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
