import React, { useState } from 'react';
import {
  DesignSection,
  RenderMode,
  LightingPreset,
  TransformMode,
  CADObject,
  StudioThemeMode,
} from '../../types/cad';
import { exportSceneToSTL, exportSceneToOBJ, exportSceneTo3MF } from '../../utils/cadEngine';
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
  Search,
  Save,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Trash2,
  FolderArchive,
  Keyboard,
  PenTool,
  HelpCircle,
  Move3d,
  Scale,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuickTooltip } from './QuickTooltip';
import { formatTimeAgo } from '../../utils/autoSave';

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
  onOpenCommandPalette?: () => void;
  onToggleExplodedPlayer?: () => void;
  isExplodedPlayerOpen?: boolean;
  onOpenAutoOrientation?: () => void;
  onOpenBatchExport?: () => void;
  onOpenHotkeyLegend?: () => void;
  onOpenSketchAnnotation?: () => void;
  isSketchAnnotationOpen?: boolean;
  onOpenARPreview?: () => void;
  isARPreviewOpen?: boolean;
  onOpenMassCalculator?: () => void;
  onToggleEdgeSelection?: () => void;
  isEdgeSelectionActive?: boolean;
  autoSaveTime?: number | null;
  isAutoSaving?: boolean;
  onForceSave?: () => void;
  onRestoreAutoSave?: () => void;
  onClearAutoSave?: () => void;
  onExportBackup?: () => void;
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
  onOpenCommandPalette,
  onToggleExplodedPlayer,
  isExplodedPlayerOpen = false,
  onOpenAutoOrientation,
  onOpenBatchExport,
  onOpenHotkeyLegend,
  onOpenSketchAnnotation,
  isSketchAnnotationOpen = false,
  onOpenARPreview,
  isARPreviewOpen = false,
  onOpenMassCalculator,
  onToggleEdgeSelection,
  isEdgeSelectionActive = false,
  autoSaveTime = null,
  isAutoSaving = false,
  onForceSave,
  onRestoreAutoSave,
  onClearAutoSave,
  onExportBackup,
  clashCount = 0,
  versionCount = 2,
  commentCount = 0,
  measurementCount = 0,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isAutoSaveMenuOpen, setIsAutoSaveMenuOpen] = useState(false);

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

  const handleExport3MF = async () => {
    try {
      const blob = await exportSceneTo3MF(objects, `${section}_Assembly`);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${section}_assembly_${Date.now()}.3mf`;
      link.click();
      setIsExportMenuOpen(false);
      confetti({ particleCount: 45, spread: 65, origin: { y: 0.1 } });
    } catch (err) {
      console.error('Error generating 3MF export:', err);
    }
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
      className={`h-14 border-b px-3 sm:px-4 flex items-center justify-between select-none z-20 shrink-0 transition-colors ${
        isLight
          ? 'bg-slate-100/95 border-slate-300 text-slate-900 shadow-sm'
          : isBlueprint
          ? 'bg-[#001733]/95 border-blue-900/80 text-cyan-100 shadow-md'
          : 'bg-zinc-900/95 border-zinc-800 text-zinc-100'
      }`}
    >
      {/* Left: Brand Identity, Section Switcher & Quick Command Search */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-md">
            <Box className="w-4 h-4" />
          </div>
          <div className="hidden md:block">
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

        {/* Primary Two Sections Switcher */}
        <div className={`flex items-center p-0.5 sm:p-1 rounded-lg border shadow-inner ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-zinc-950 border-zinc-800'}`}>
          {/* Technology / Device Design - THE MAJOR SECTION */}
          <button
            id="btn_section_tech"
            onClick={() => onSelectSection('technology')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              section === 'technology'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tech Device CAD</span>
            <span className="sm:hidden">Tech</span>
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
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              section === 'building'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architectural BIM</span>
            <span className="sm:hidden">BIM</span>
          </button>
        </div>

        {/* Quick Commands & Global Search Trigger Bar */}
        {onOpenCommandPalette && (
          <QuickTooltip content="Search Parts, Tools & Commands" shortcut="⌘K / Ctrl+K">
            <button
              id="btn_header_quick_commands"
              onClick={onOpenCommandPalette}
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm'
                  : 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-400">Quick Commands & Search...</span>
              <kbd className="bg-zinc-800/80 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700">
                ⌘K
              </kbd>
            </button>
          </QuickTooltip>
        )}
      </div>

      {/* Middle: Studio Viewport Controls & Feature Studios */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {/* Render Shader Mode Selector */}
        <div className={`hidden 2xl:flex items-center rounded-lg p-0.5 border text-xs ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-zinc-950 border-zinc-800'}`}>
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

        {/* Exploded View Animation Player Toggle */}
        {onToggleExplodedPlayer && (
          <QuickTooltip content="Exploded Animation Player Timeline" shortcut="Space">
            <button
              id="btn_header_exploded_anim_toggle"
              onClick={onToggleExplodedPlayer}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isExplodedPlayerOpen
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm ring-1 ring-cyan-500/50'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-cyan-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-cyan-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden xl:inline">Explode Anim</span>
            </button>
          </QuickTooltip>
        )}

        {/* 1. Design Versioning */}
        {onOpenVersionModal && (
          <QuickTooltip content="Design Versioning & Revision History" shortcut="V">
            <button
              id="btn_header_versioning"
              onClick={onOpenVersionModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-indigo-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-indigo-400'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Versioning</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold">
                {versionCount}
              </span>
            </button>
          </QuickTooltip>
        )}

        {/* 2. BOM Report */}
        {onOpenBOMModal && (
          <QuickTooltip content="Bill of Materials & Cost Analysis" shortcut="B">
            <button
              id="btn_header_bom_report"
              onClick={onOpenBOMModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-emerald-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">BOM</span>
            </button>
          </QuickTooltip>
        )}

        {/* 3. 3D Measuring Tool */}
        {onOpenMeasuringTool && (
          <QuickTooltip content="3D Laser Calipers & Measuring Tool" shortcut="M">
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
            >
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Measure</span>
              {measurementCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                  {measurementCount}
                </span>
              )}
            </button>
          </QuickTooltip>
        )}

        {/* 4. Collaborative Comments */}
        {onOpenCommentsModal && (
          <QuickTooltip content="3D Spatial Review Comments" shortcut="C">
            <button
              id="btn_header_comments"
              onClick={onOpenCommentsModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-indigo-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-indigo-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Comments</span>
              {commentCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold">
                  {commentCount}
                </span>
              )}
            </button>
          </QuickTooltip>
        )}

        {/* Clash Detection System */}
        {onOpenClashDetection && (
          <QuickTooltip content="Interference & Collision Analysis">
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
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${clashCount > 0 ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
              <span className="hidden xl:inline">Clashes</span>
              {clashCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                  {clashCount}
                </span>
              )}
            </button>
          </QuickTooltip>
        )}

        {/* Kinematic Motion Player */}
        {onOpenKinematics && (
          <QuickTooltip content="Kinematic Joint Motion Simulation">
            <button
              id="btn_header_kinematics"
              onClick={onOpenKinematics}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-cyan-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-cyan-400'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Motion</span>
            </button>
          </QuickTooltip>
        )}

        {/* Holographic Exploded Studio Button */}
        {onOpenHolographicStudio && (
          <QuickTooltip content="Holographic Assembly Studio">
            <button
              id="btn_header_holo_studio"
              onClick={onOpenHolographicStudio}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="hidden xl:inline">Holo Studio</span>
            </button>
          </QuickTooltip>
        )}

        {/* Auto-Orientation Button */}
        {onOpenAutoOrientation && (
          <QuickTooltip content="Auto-Orientation & DFM Solver (3D Print)" shortcut="O">
            <button
              id="btn_header_auto_orient"
              onClick={onOpenAutoOrientation}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-sky-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-sky-400'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Auto-Orient</span>
            </button>
          </QuickTooltip>
        )}

        {/* Sketch Annotations Studio Button */}
        {onOpenSketchAnnotation && (
          <QuickTooltip content="2D/3D Sketch Markup & Annotations" shortcut="A">
            <button
              id="btn_header_sketch_annotation"
              onClick={onOpenSketchAnnotation}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isSketchAnnotationOpen
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/50'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-sky-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-sky-400'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Markup</span>
            </button>
          </QuickTooltip>
        )}

        {/* Hotkey Legend Button */}
        {onOpenHotkeyLegend && (
          <QuickTooltip content="Keyboard Shortcuts Cheatsheet" shortcut="?">
            <button
              id="btn_header_hotkey_legend"
              onClick={onOpenHotkeyLegend}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-purple-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-purple-400'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden xl:inline">Hotkeys</span>
            </button>
          </QuickTooltip>
        )}

        {/* AR Preview & Spatial Studio Button */}
        {onOpenARPreview && (
          <QuickTooltip content="AR Preview & Real-World Spatial Mode" shortcut="R">
            <button
              id="btn_header_ar_preview"
              onClick={onOpenARPreview}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                isARPreviewOpen
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/50'
                  : isLight
                  ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700 shadow-sm'
                  : 'bg-sky-950/40 hover:bg-sky-900/50 border-sky-500/40 text-sky-300 hover:text-sky-200'
              }`}
            >
              <Move3d className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span className="hidden xl:inline">AR Preview</span>
            </button>
          </QuickTooltip>
        )}

        {/* Real-Time Mass Calculator Button */}
        {onOpenMassCalculator && (
          <QuickTooltip content="Real-Time Mass, CoG & Inertia Calculator" shortcut="M">
            <button
              id="btn_header_mass_calc"
              onClick={onOpenMassCalculator}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/40 text-amber-300 hover:text-amber-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Mass Calc</span>
            </button>
          </QuickTooltip>
        )}

        {/* Smart Edge Selection Mode Toggle Button */}
        {onToggleEdgeSelection && (
          <QuickTooltip content="Smart Edge Selection & Fillet/Chamfer Inspector" shortcut="E">
            <button
              id="btn_header_smart_edge"
              onClick={onToggleEdgeSelection}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                isEdgeSelectionActive
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/50'
                  : isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
                  : 'bg-cyan-950/30 hover:bg-cyan-900/40 border-cyan-500/40 text-cyan-300 hover:text-cyan-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Smart Edges</span>
            </button>
          </QuickTooltip>
        )}

        {/* Snapshot Studio Button */}
        {onOpenSnapshotStudio && (
          <QuickTooltip content="High-Res Snapshot Gallery" shortcut="4K">
            <button
              id="btn_header_snapshot_studio"
              onClick={onOpenSnapshotStudio}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-blue-600 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-blue-400'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline">Snapshot</span>
            </button>
          </QuickTooltip>
        )}

        {/* Grid Toggle */}
        <QuickTooltip content={gridVisible ? 'Hide Grid' : 'Show Grid'} shortcut="G">
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
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </QuickTooltip>
      </div>

      {/* Right: Auto-Save Status, Theme Switcher, Undo/Redo & Model Export / Import Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Auto-Save Status Badge & Dropdown */}
        <div className="relative">
          <QuickTooltip content="Auto-Save & Persistence Status">
            <button
              id="btn_header_autosave"
              onClick={() => setIsAutoSaveMenuOpen(!isAutoSaveMenuOpen)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                isAutoSaving
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 animate-pulse'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}
            >
              <Save className={`w-3.5 h-3.5 ${isAutoSaving ? 'text-cyan-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">
                {isAutoSaving ? 'Saving...' : autoSaveTime ? `Saved ${formatTimeAgo(autoSaveTime)}` : 'Auto-Saved'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </QuickTooltip>

          {isAutoSaveMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl p-2 space-y-1.5 z-50 text-xs border ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
              }`}
            >
              <div className="px-2 py-1 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Auto-Save Active
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {autoSaveTime ? formatTimeAgo(autoSaveTime) : 'Ready'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  All CAD models, joints, constraints, measurements & versions are persisted to browser storage.
                </p>
              </div>

              {onForceSave && (
                <button
                  onClick={() => {
                    onForceSave();
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 text-left"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-medium">Force Save Now</div>
                    <div className="text-[10px] text-zinc-400">Write instant snapshot</div>
                  </div>
                </button>
              )}

              {onRestoreAutoSave && (
                <button
                  onClick={() => {
                    onRestoreAutoSave();
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <div className="font-medium">Restore Last Saved Session</div>
                    <div className="text-[10px] text-zinc-400">Reload cached assembly</div>
                  </div>
                </button>
              )}

              {onExportBackup && (
                <button
                  onClick={() => {
                    onExportBackup();
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 text-left"
                >
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-medium">Download Backup File</div>
                    <div className="text-[10px] text-zinc-400">Export full JSON archive</div>
                  </div>
                </button>
              )}

              {onClearAutoSave && (
                <button
                  onClick={() => {
                    onClearAutoSave();
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-300 text-left border-t border-zinc-800/80 pt-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <div>
                    <div className="font-medium">Clear Local Storage Cache</div>
                    <div className="text-[10px] text-rose-400/80">Reset persisted state</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <div className="relative">
          <QuickTooltip content="Switch Studio Theme">
            <button
              id="btn_theme_toggle"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                  : isBlueprint
                  ? 'bg-blue-950/80 hover:bg-blue-900 border-blue-600/60 text-cyan-200'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-200'
              }`}
            >
              {themeMode === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : themeMode === 'blueprint' ? (
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="capitalize hidden md:inline">{themeMode}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </QuickTooltip>

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
          <QuickTooltip content="Undo Action" shortcut="Ctrl+Z">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </QuickTooltip>

          <QuickTooltip content="Redo Action" shortcut="Ctrl+Y">
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-md transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </QuickTooltip>
        </div>

        {/* Import JSON Project */}
        <QuickTooltip content="Import CAD JSON Project">
          <label
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </QuickTooltip>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            id="btn_export_dropdown"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
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
                onClick={handleExport3MF}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/80 text-zinc-200 transition-colors text-left font-medium bg-amber-950/20 border border-amber-500/30"
              >
                <Box className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>Export 3MF Package</span>
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">NEW</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Bambu, Prusa, Cura, Fusion 360</div>
                </div>
              </button>

              {onOpenBatchExport && (
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onOpenBatchExport();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-800/80 text-zinc-200 transition-colors text-left font-medium bg-emerald-950/20 border border-emerald-500/30"
                >
                  <FolderArchive className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-emerald-300">Batch ZIP Bundle</div>
                    <div className="text-[10px] text-zinc-400">All Parts (STL, OBJ, JSON, BOM)</div>
                  </div>
                </button>
              )}

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
