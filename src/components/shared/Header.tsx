import React, { useState } from 'react';
import {
  DesignSection,
  RenderMode,
  LightingPreset,
  TransformMode,
  CADObject,
  StudioThemeMode,
} from '../../types/cad';
import { exportSceneToSTL, exportSceneToOBJ } from '../../utils/cadEngine';
import {
  Cpu,
  Building2,
  Box,
  Sun,
  Ruler,
  Download,
  Upload,
  RotateCcw,
  RotateCw,
  Grid,
  Check,
  ChevronDown,
  Printer,
  FileCode,
  FileJson,
  Paintbrush,
  Camera,
  Eye,
  Zap,
  AlignHorizontalJustifyCenter,
  AlertTriangle,
  PlayCircle,
  BarChart3,
  Tag,
  GitBranch,
  FileSpreadsheet,
  MessageSquare,
  Moon,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeaderProps {
  section: DesignSection;
  onSelectSection: (section: DesignSection) => void;
  renderMode: RenderMode;
  onChangeRenderMode: (mode: RenderMode) => void;
  lightingPreset: LightingPreset;
  onChangeLightingPreset: (preset: LightingPreset) => void;
  transformMode: TransformMode;
  onChangeTransformMode: (mode: TransformMode) => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  objects: CADObject[];
  onImportScene: (jsonStr: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  themeMode: StudioThemeMode;
  onChangeThemeMode: (mode: StudioThemeMode) => void;
  onOpenMaterialLibrary?: () => void;
  onOpenSnapshotStudio?: () => void;
  onOpenPBRReview?: () => void;
  onOpenHolographicStudio?: () => void;
  onOpenAutoAlign?: () => void;
  onOpenClashDetection?: () => void;
  onOpenKinematics?: () => void;
  onOpenLayerTagManager?: () => void;
  onOpenDesignAnalytics?: () => void;
  onOpenVersionModal?: () => void;
  onOpenBOMModal?: () => void;
  onOpenMeasuringTool?: () => void;
  onOpenCommentsModal?: () => void;
  clashCount?: number;
  versionCount?: number;
  commentCount?: number;
  measurementCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  section,
  onSelectSection,
  renderMode,
  onChangeRenderMode,
  lightingPreset,
  onChangeLightingPreset,
  transformMode,
  onChangeTransformMode,
  gridVisible,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  objects,
  onImportScene,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  themeMode,
  onChangeThemeMode,
  onOpenMaterialLibrary,
  onOpenSnapshotStudio,
  onOpenPBRReview,
  onOpenHolographicStudio,
  onOpenAutoAlign,
  onOpenClashDetection,
  onOpenKinematics,
  onOpenLayerTagManager,
  onOpenDesignAnalytics,
  onOpenVersionModal,
  onOpenBOMModal,
  onOpenMeasuringTool,
  onOpenCommentsModal,
  clashCount = 0,
  versionCount = 2,
  commentCount = 0,
  measurementCount = 0,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const handleExportSTL = () => {
    const stlData = exportSceneToSTL(objects);
    const blob = new Blob([stlData], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${section}_model_${Date.now()}.stl`;
    link.click();
    setIsExportMenuOpen(false);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.1 } });
  };

  const handleExportOBJ = () => {
    const objData = exportSceneToOBJ(objects);
    const blob = new Blob([objData], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${section}_cad_mesh_${Date.now()}.obj`;
    link.click();
    setIsExportMenuOpen(false);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.1 } });
  };

  const handleExportJSON = () => {
    const projectData = {
      version: '1.0',
      section,
      timestamp: Date.now(),
      objects,
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${section}_project_${Date.now()}.json`;
    link.click();
    setIsExportMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        onImportScene(content);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.1 } });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isLight = themeMode === 'light';
  const isBlueprint = themeMode === 'blueprint';

  return (
    <header
      id="app_header"
      className={`h-14 border-b px-4 flex items-center justify-between select-none z-20 shrink-0 transition-colors ${
        isLight
          ? 'bg-slate-100/95 border-slate-300 text-slate-900 shadow-sm'
          : isBlueprint
          ? 'bg-[#001733]/95 border-blue-900/80 text-cyan-100 shadow-md'
          : 'bg-zinc-900/95 border-zinc-800 text-zinc-100'
      }`}
    >
      {/* Left: Brand Identity & Section Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-md">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span>3D CAD Studio</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </h1>
            <div className={`text-[10px] font-mono flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Real-time Parametric CAD
            </div>
          </div>
        </div>

        {/* ================= PRIMARY TWO SECTIONS SWITCHER ================= */}
        <div className={`flex items-center p-1 rounded-lg border shadow-inner ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-zinc-950 border-zinc-800'}`}>
          {/* Technology / Device Design - THE MAJOR SECTION */}
          <button
            id="btn_section_tech"
            onClick={() => onSelectSection('technology')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              section === 'technology'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tech Device CAD</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold tracking-wide uppercase ${
                section === 'technology'
                  ? 'bg-blue-800/80 text-blue-200 border border-blue-400/40'
                  : 'bg-zinc-800/80 text-zinc-400'
              }`}
            >
              MAJOR
            </span>
          </button>

          {/* Building / Architectural Design - SECONDARY SECTION */}
          <button
            id="btn_section_building"
            onClick={() => onSelectSection('building')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              section === 'building'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Architectural BIM</span>
          </button>
        </div>
      </div>

      {/* Middle: Studio Viewport Controls & Feature Studios */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {/* Render Shader Mode Selector */}
        <div className={`hidden xl:flex items-center rounded-lg p-0.5 border text-xs ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-zinc-950 border-zinc-800'}`}>
          {(
            [
              { key: 'shaded', label: 'PBR' },
              { key: 'wireframe', label: 'Wire' },
              { key: 'clay', label: 'Clay' },
              { key: 'blueprint', label: 'Blueprint' },
              { key: 'xray', label: 'X-Ray' },
            ] as const
          ).map(mode => (
            <button
              key={mode.key}
              onClick={() => onChangeRenderMode(mode.key)}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                renderMode === mode.key
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* 1. Design Versioning */}
        {onOpenVersionModal && (
          <button
            id="btn_header_versioning"
            onClick={onOpenVersionModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-indigo-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-indigo-400'
            }`}
            title="Design Versioning, Revision History & Visual Diff"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Versioning</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold">
              {versionCount}
            </span>
          </button>
        )}

        {/* 2. BOM Report */}
        {onOpenBOMModal && (
          <button
            id="btn_header_bom_report"
            onClick={onOpenBOMModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-emerald-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400'
            }`}
            title="Export Bill of Materials (BOM) Datasheet & Cost Analysis"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>BOM Report</span>
          </button>
        )}

        {/* 3. 3D Measuring Tool */}
        {onOpenMeasuringTool && (
          <button
            id="btn_header_measure_tool"
            onClick={onOpenMeasuringTool}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              transformMode === 'measure'
                ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300 shadow-sm ring-1 ring-cyan-500/50'
                : isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-cyan-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-cyan-400'
            }`}
            title="Open 3D Measuring Tool, Vertex Snapping & Calipers"
          >
            <Ruler className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D Measure</span>
            {measurementCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                {measurementCount}
              </span>
            )}
          </button>
        )}

        {/* 4. Collaborative Comments */}
        {onOpenCommentsModal && (
          <button
            id="btn_header_comments"
            onClick={onOpenCommentsModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-indigo-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-indigo-400'
            }`}
            title="Collaborative 3D Comments & Spatial Markup Pins"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Comments</span>
            {commentCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold">
                {commentCount}
              </span>
            )}
          </button>
        )}

        {/* Auto Align Studio */}
        {onOpenAutoAlign && (
          <button
            id="btn_header_auto_align"
            onClick={onOpenAutoAlign}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-indigo-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-indigo-400'
            }`}
            title="Open Smart Assembly Auto-Align Studio"
          >
            <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto Align</span>
          </button>
        )}

        {/* Clash Detection System */}
        {onOpenClashDetection && (
          <button
            id="btn_header_clash_detect"
            onClick={onOpenClashDetection}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              clashCount > 0
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
                : isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-rose-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-rose-400'
            }`}
            title="Open Interference & Clash Detection Engine"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${clashCount > 0 ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
            <span>Clashes</span>
            {clashCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                {clashCount}
              </span>
            )}
          </button>
        )}

        {/* Kinematic Motion Player */}
        {onOpenKinematics && (
          <button
            id="btn_header_kinematics"
            onClick={onOpenKinematics}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-cyan-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-cyan-400'
            }`}
            title="Open Kinematic Motion Player & Degrees of Freedom"
          >
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kinematics</span>
          </button>
        )}

        {/* Layers & Tags */}
        {onOpenLayerTagManager && (
          <button
            id="btn_header_layers_tags"
            onClick={onOpenLayerTagManager}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-emerald-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400'
            }`}
            title="Open CAD Layer & Metadata Tagging Manager"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Layers</span>
          </button>
        )}

        {/* Design Analytics */}
        {onOpenDesignAnalytics && (
          <button
            id="btn_header_design_analytics"
            onClick={onOpenDesignAnalytics}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-amber-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-amber-400'
            }`}
            title="Open Design Analytics Dashboard & BOM Telemetry"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Analytics</span>
          </button>
        )}

        {/* Holographic Exploded Studio Button */}
        {onOpenHolographicStudio && (
          <button
            id="btn_header_holo_studio"
            onClick={onOpenHolographicStudio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold transition-all shadow-sm"
            title="Open Holographic Exploded View & Timeline Studio"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Holo Explode</span>
          </button>
        )}

        {/* Snapshot Studio Button */}
        {onOpenSnapshotStudio && (
          <button
            id="btn_header_snapshot_studio"
            onClick={onOpenSnapshotStudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-blue-600 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-blue-400'
            }`}
            title="Open High-Res Snapshot Studio & Gallery"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Snapshot</span>
          </button>
        )}

        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded-lg border text-xs transition-all ${
            gridVisible
              ? isLight
                ? 'bg-slate-200 border-slate-400 text-slate-900'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200'
              : isLight
              ? 'bg-white border-slate-300 text-slate-500 hover:text-slate-900'
              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Ground Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Theme Switcher, Undo/Redo & Model Export / Import Menu */}
      <div className="flex items-center gap-2">
        {/* 5. Dark Mode / Theme Toggle */}
        <div className="relative">
          <button
            id="btn_theme_toggle"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                : isBlueprint
                ? 'bg-blue-950/80 hover:bg-blue-900 border-blue-600/60 text-cyan-200'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-200'
            }`}
            title="Toggle Studio Theme (Dark / Light / Blueprint)"
          >
            {themeMode === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : themeMode === 'blueprint' ? (
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="capitalize hidden sm:inline">{themeMode}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isThemeMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl p-1.5 space-y-1 z-50 text-xs border ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
              }`}
            >
              <button
                onClick={() => {
                  onChangeThemeMode('dark');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                  themeMode === 'dark'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <div className="font-semibold">Dark Mode</div>
                    <div className="text-[10px] opacity-75">Titanium High Contrast</div>
                  </div>
                </div>
                {themeMode === 'dark' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  onChangeThemeMode('light');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                  themeMode === 'light'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <div className="font-semibold">Light Mode</div>
                    <div className="text-[10px] opacity-75">Precision White Canvas</div>
                  </div>
                </div>
                {themeMode === 'light' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  onChangeThemeMode('blueprint');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                  themeMode === 'blueprint'
                    ? 'bg-blue-600 text-white font-semibold'
                    : isLight
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-semibold">CAD Blueprint</div>
                    <div className="text-[10px] opacity-75">Cobalt Cyan Technical</div>
                  </div>
                </div>
                {themeMode === 'blueprint' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <div className={`flex items-center rounded-lg border p-0.5 ${isLight ? 'bg-white border-slate-300' : 'bg-zinc-950 border-zinc-800'}`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-md transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-md transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Import JSON Project */}
        <label
          className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-all ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300'
          }`}
          title="Load CAD Project File"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import</span>
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            id="btn_export_dropdown"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isExportMenuOpen && (
            <div
              id="export_menu"
              className={`absolute right-0 mt-2 w-56 border rounded-xl shadow-2xl p-1.5 space-y-1 z-50 text-xs ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
              }`}
            >
              <button
                onClick={handleExportSTL}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/80 text-zinc-200 transition-colors text-left font-medium"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-zinc-100">Export STL Model</div>
                  <div className="text-[10px] text-zinc-400">For 3D Printing & Slicers</div>
                </div>
              </button>

              <button
                onClick={handleExportOBJ}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/80 text-zinc-200 transition-colors text-left font-medium"
              >
                <FileCode className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-zinc-100">Export OBJ Mesh</div>
                  <div className="text-[10px] text-zinc-400">For Blender, CAD & Rhino</div>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/80 text-zinc-200 transition-colors text-left font-medium border-t border-zinc-800/80 mt-1 pt-2"
              >
                <FileJson className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-zinc-100">Save CAD Project JSON</div>
                  <div className="text-[10px] text-zinc-400">Full parametric configuration</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
