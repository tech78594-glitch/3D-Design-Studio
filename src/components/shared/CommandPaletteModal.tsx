/**
 * Quick Commands & Global Search Palette Modal
 * Spotlight-like modal triggered via Cmd+K / Ctrl+K or Header search.
 * Searches all assembly parts, studios, tools, presets, render modes, lighting, themes, and actions.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CADObject,
  DesignSection,
  RenderMode,
  LightingPreset,
  StudioThemeMode,
} from '../../types/cad';
import {
  Search,
  Box,
  Layers,
  Cpu,
  Building2,
  Wrench,
  Camera,
  Paintbrush,
  Sparkles,
  Zap,
  AlignHorizontalJustifyCenter,
  AlertTriangle,
  PlayCircle,
  BarChart3,
  GitBranch,
  FileSpreadsheet,
  Ruler,
  MessageSquare,
  Eye,
  Sun,
  Moon,
  Compass,
  Grid,
  RotateCcw,
  RotateCw,
  Download,
  Save,
  Check,
  Flame,
  Tag,
  ArrowRight,
  Sliders,
  FolderArchive,
  Keyboard,
  PenTool,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'parts' | 'tools' | 'presets' | 'render' | 'lighting' | 'theme' | 'actions';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: DesignSection;
  onSelectSection: (sec: DesignSection) => void;
  objects: CADObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  renderMode: RenderMode;
  onChangeRenderMode: (mode: RenderMode) => void;
  lightingPreset: LightingPreset;
  onChangeLightingPreset: (preset: LightingPreset) => void;
  themeMode: StudioThemeMode;
  onChangeThemeMode: (mode: StudioThemeMode) => void;
  onToggleGrid: () => void;
  gridVisible: boolean;
  onToggleSnap: () => void;
  snapEnabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onForceSave: () => void;
  onOpenMaterialLibrary: () => void;
  onOpenSnapshotStudio: () => void;
  onOpenPBRReview: () => void;
  onOpenHolographicStudio: () => void;
  onOpenAutoAlign: () => void;
  onOpenClashDetection: () => void;
  onOpenKinematics: () => void;
  onOpenLayerTagManager: () => void;
  onOpenDesignAnalytics: () => void;
  onOpenVersionModal: () => void;
  onOpenBOMModal: () => void;
  onOpenMeasuringTool: () => void;
  onOpenCommentsModal: () => void;
  onOpenAutoOrientation?: () => void;
  onOpenBatchExport?: () => void;
  onOpenHotkeyLegend?: () => void;
  onOpenSketchAnnotation?: () => void;
  onLoadPreset: (presetKey: string) => void;
  onExportSTL: () => void;
  onExportOBJ: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  section,
  onSelectSection,
  objects,
  onSelectObject,
  onChangeRenderMode,
  onChangeLightingPreset,
  onChangeThemeMode,
  onToggleGrid,
  gridVisible,
  onToggleSnap,
  snapEnabled,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onForceSave,
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
  onOpenAutoOrientation,
  onOpenBatchExport,
  onOpenHotkeyLegend,
  onOpenSketchAnnotation,
  onLoadPreset,
  onExportSTL,
  onExportOBJ,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus on mount
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command catalogue
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // 1. Scene Parts & Hardware Modules
    objects.forEach(obj => {
      list.push({
        id: `part_${obj.id}`,
        category: 'parts',
        title: obj.name,
        subtitle: `${obj.category.toUpperCase()} • ${obj.dimensions.width}×${obj.dimensions.height}×${obj.dimensions.depth}${section === 'technology' ? 'mm' : 'm'} • ${obj.material.name}`,
        badge: obj.visible ? 'Visible' : 'Hidden',
        icon: <Box className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onSelectObject(obj.id);
          onClose();
        },
      });
    });

    // 2. CAD Studios & Tools
    list.push(
      {
        id: 'tool_bom',
        category: 'tools',
        title: 'Bill of Materials (BOM) & Cost Datasheet',
        subtitle: 'Export engineering inventory, mass roll-up, and manufacturing cost breakdown',
        badge: 'BOM',
        shortcut: 'B',
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenBOMModal();
        },
      },
      {
        id: 'tool_versioning',
        category: 'tools',
        title: 'Design Versioning & Revision History',
        subtitle: 'Snapshot versions, compare part differences, and restore milestones',
        badge: 'Git',
        shortcut: 'V',
        icon: <GitBranch className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onClose();
          onOpenVersionModal();
        },
      },
      {
        id: 'tool_measure',
        category: 'tools',
        title: '3D Laser Measuring Calipers',
        subtitle: 'Measure point-to-point clearance, bounding envelopes, and dimensions',
        badge: 'Measure',
        shortcut: 'M',
        icon: <Ruler className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenMeasuringTool();
        },
      },
      {
        id: 'tool_comments',
        category: 'tools',
        title: 'Collaborative 3D Spatial Comments & Pins',
        subtitle: 'Review pin annotations and engineering change requests (ECR)',
        badge: 'Review',
        shortcut: 'C',
        icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          onOpenCommentsModal();
        },
      },
      {
        id: 'tool_clash',
        category: 'tools',
        title: 'Automated Clash Detection System',
        subtitle: 'Scan geometry for mechanical interference and volume overlaps',
        badge: 'Analysis',
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          onOpenClashDetection();
        },
      },
      {
        id: 'tool_pbr',
        category: 'tools',
        title: 'Real-time PBR Material Review & Shaders',
        subtitle: 'Inspect roughness, metallic channels, normal maps, and HDR studio lighting',
        badge: 'Shaders',
        icon: <Eye className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onOpenPBRReview();
        },
      },
      {
        id: 'tool_holo',
        category: 'tools',
        title: 'Holographic Exploded View & Disassembly Studio',
        subtitle: 'Radial/axial separation sequences and interactive timeline player',
        badge: 'Stark Mode',
        shortcut: 'Space',
        icon: <Zap className="w-4 h-4 text-blue-400" />,
        action: () => {
          onClose();
          onOpenHolographicStudio();
        },
      },
      {
        id: 'tool_materials',
        category: 'tools',
        title: 'PBR Material Library & Surface Finishes',
        subtitle: 'Aerospace titanium, anodized aluminum, sapphire glass, carbon fiber',
        badge: 'PBR',
        icon: <Paintbrush className="w-4 h-4 text-pink-400" />,
        action: () => {
          onClose();
          onOpenMaterialLibrary();
        },
      },
      {
        id: 'tool_kinematics',
        category: 'tools',
        title: 'Kinematic Motion Simulator & Mechanical Joints',
        subtitle: 'Simulate revolute hinges, linear sliders, and mechanical linkages',
        badge: 'Motion',
        icon: <PlayCircle className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenKinematics();
        },
      },
      {
        id: 'tool_align',
        category: 'tools',
        title: 'Smart Assembly Auto Align & Mates',
        subtitle: 'Flush, centered, and concentric coordinate alignment',
        badge: 'Align',
        icon: <AlignHorizontalJustifyCenter className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenAutoAlign();
        },
      },
      {
        id: 'tool_layers',
        category: 'tools',
        title: 'CAD Layers & Engineering Tag Manager',
        subtitle: 'Group parts into subsystem layers and search tags',
        badge: 'Layers',
        icon: <Tag className="w-4 h-4 text-yellow-400" />,
        action: () => {
          onClose();
          onOpenLayerTagManager();
        },
      },
      {
        id: 'tool_analytics',
        category: 'tools',
        title: 'Design Analytics & Engineering Telemetry',
        subtitle: 'Total mass roll-up, center of gravity, carbon footprint, and power load',
        badge: 'Telemetry',
        icon: <BarChart3 className="w-4 h-4 text-teal-400" />,
        action: () => {
          onClose();
          onOpenDesignAnalytics();
        },
      },
      {
        id: 'tool_snapshots',
        category: 'tools',
        title: 'Snapshot Studio & High-Res 4K Gallery',
        subtitle: 'Capture photorealistic 4K renders with camera presets and transparent BG',
        badge: 'Render',
        icon: <Camera className="w-4 h-4 text-blue-400" />,
        action: () => {
          onClose();
          onOpenSnapshotStudio();
        },
      },
      {
        id: 'tool_auto_orient',
        category: 'tools',
        title: 'Auto-Orientation & 3D Print DFM Solver',
        subtitle: 'Calculate optimal support volume, print time, and bed adhesion across 6 axes',
        badge: 'DFM',
        shortcut: 'O',
        icon: <Compass className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onOpenAutoOrientation?.();
        },
      },
      {
        id: 'tool_batch_export',
        category: 'tools',
        title: 'Batch Mesh Exporter & ZIP Bundler',
        subtitle: 'Package all scene parts into STL, OBJ, CAD JSON, and BOM in a ZIP archive',
        badge: 'Export',
        shortcut: '⌘E',
        icon: <FolderArchive className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenBatchExport?.();
        },
      },
      {
        id: 'tool_hotkeys',
        category: 'tools',
        title: 'Keyboard Hotkeys & Shortcuts Cheatsheet',
        subtitle: 'Comprehensive visual reference for all viewport, modeling, and tool hotkeys',
        badge: 'Hotkeys',
        shortcut: '?',
        icon: <Keyboard className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          onOpenHotkeyLegend?.();
        },
      },
      {
        id: 'tool_sketch',
        category: 'tools',
        title: '2D & 3D Sketch Markup & Annotations',
        subtitle: 'Draw freehand pen strokes, leader calipers, revision clouds, stamps, notes',
        badge: 'Markup',
        shortcut: 'A',
        icon: <PenTool className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onOpenSketchAnnotation?.();
        },
      }
    );

    // 3. Hardware Presets
    if (section === 'technology') {
      list.push(
        {
          id: 'preset_headphones',
          category: 'presets',
          title: 'Load Preset: Studio Headphones Pro',
          subtitle: 'Over-ear planar drivers, CNC aluminum yokes, memory foam cushions (18 parts)',
          icon: <Cpu className="w-4 h-4 text-purple-400" />,
          action: () => {
            onLoadPreset('headphones_studio_pro');
            onClose();
          },
        },
        {
          id: 'preset_phone',
          category: 'presets',
          title: 'Load Preset: Smartphone Pro Max',
          subtitle: 'Multi-layer OLED, periscope camera bump, CNC frame',
          icon: <Cpu className="w-4 h-4 text-blue-400" />,
          action: () => {
            onLoadPreset('smartphone_pro');
            onClose();
          },
        },
        {
          id: 'preset_drone',
          category: 'presets',
          title: 'Load Preset: Drone Quadcopter Pro',
          subtitle: 'Carbon fiber arms, brushless motors, gimbal 4K sensor',
          icon: <Cpu className="w-4 h-4 text-cyan-400" />,
          action: () => {
            onLoadPreset('drone_quad');
            onClose();
          },
        },
        {
          id: 'preset_vr',
          category: 'presets',
          title: 'Load Preset: VR Spatial Headset',
          subtitle: 'Dual micro-OLED pancake optics, magnesium chassis',
          icon: <Cpu className="w-4 h-4 text-indigo-400" />,
          action: () => {
            onLoadPreset('vr_headset');
            onClose();
          },
        },
        {
          id: 'preset_watch',
          category: 'presets',
          title: 'Load Preset: Smartwatch Ultra',
          subtitle: 'Titanium bezel, heart sensor module, haptic engine',
          icon: <Cpu className="w-4 h-4 text-emerald-400" />,
          action: () => {
            onLoadPreset('smartwatch');
            onClose();
          },
        }
      );
    } else {
      list.push(
        {
          id: 'preset_villa',
          category: 'presets',
          title: 'Load Preset: Modern Luxury Villa',
          subtitle: '2-story cantilevered concrete pavilion with curtain walls',
          icon: <Building2 className="w-4 h-4 text-amber-400" />,
          action: () => {
            onLoadPreset('modern_villa');
            onClose();
          },
        },
        {
          id: 'preset_pavilion',
          category: 'presets',
          title: 'Load Preset: Office Glass Pavilion',
          subtitle: 'Commercial glass facade and open-concept workspace',
          icon: <Building2 className="w-4 h-4 text-cyan-400" />,
          action: () => {
            onLoadPreset('office_pavilion');
            onClose();
          },
        }
      );
    }

    // 4. Render Modes
    list.push(
      {
        id: 'render_shaded',
        category: 'render',
        title: 'Render Mode: Shaded PBR Photoreal',
        subtitle: 'Full PBR materials, dynamic shadows, and reflections',
        icon: <Eye className="w-4 h-4 text-sky-400" />,
        action: () => {
          onChangeRenderMode('shaded');
          onClose();
        },
      },
      {
        id: 'render_wireframe',
        category: 'render',
        title: 'Render Mode: Wireframe Mesh Topology',
        subtitle: 'Geometric edge polygon display',
        icon: <Eye className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onChangeRenderMode('wireframe');
          onClose();
        },
      },
      {
        id: 'render_xray',
        category: 'render',
        title: 'Render Mode: X-Ray Translucent Inspection',
        subtitle: 'Transparent internal component visibility',
        icon: <Eye className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onChangeRenderMode('xray');
          onClose();
        },
      }
    );

    // 5. Lighting Presets
    list.push(
      {
        id: 'light_studio',
        category: 'lighting',
        title: 'Lighting: 3-Point Neutral Studio',
        subtitle: 'Key, fill, and rim lights for industrial presentation',
        icon: <Sun className="w-4 h-4 text-amber-400" />,
        action: () => {
          onChangeLightingPreset('studio');
          onClose();
        },
      },
      {
        id: 'light_cyberpunk',
        category: 'lighting',
        title: 'Lighting: Cyberpunk Neon Cyan & Magenta',
        subtitle: 'Futuristic high-contrast neon illumination',
        icon: <Zap className="w-4 h-4 text-pink-400" />,
        action: () => {
          onChangeLightingPreset('cyberpunk');
          onClose();
        },
      },
      {
        id: 'light_warm',
        category: 'lighting',
        title: 'Lighting: Warm Golden Sunlight',
        subtitle: 'Natural architectural golden hour lighting',
        icon: <Sun className="w-4 h-4 text-yellow-400" />,
        action: () => {
          onChangeLightingPreset('warm_sun');
          onClose();
        },
      }
    );

    // 6. Theme Modes
    list.push(
      {
        id: 'theme_dark',
        category: 'theme',
        title: 'Theme: Studio Carbon Dark',
        subtitle: 'Eye-safe high-contrast dark room CAD workspace',
        icon: <Moon className="w-4 h-4 text-zinc-400" />,
        action: () => {
          onChangeThemeMode('dark');
          onClose();
        },
      },
      {
        id: 'theme_light',
        category: 'theme',
        title: 'Theme: Studio Engineering Light',
        subtitle: 'Clean white engineering drafting interface',
        icon: <Sun className="w-4 h-4 text-amber-500" />,
        action: () => {
          onChangeThemeMode('light');
          onClose();
        },
      },
      {
        id: 'theme_blueprint',
        category: 'theme',
        title: 'Theme: Blueprint Schematic Cyan',
        subtitle: 'Classic architectural cyan and navy grid aesthetic',
        icon: <Compass className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onChangeThemeMode('blueprint');
          onClose();
        },
      }
    );

    // 7. General Actions
    list.push(
      {
        id: 'action_save',
        category: 'actions',
        title: 'Auto-Save: Force Save Session Now',
        subtitle: 'Write full workspace state immediately to local browser storage',
        shortcut: 'Ctrl+S',
        icon: <Save className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onForceSave();
          onClose();
        },
      },
      {
        id: 'action_grid',
        category: 'actions',
        title: gridVisible ? 'Hide Grid Helper' : 'Show Grid Helper',
        subtitle: 'Toggle floor reference grid and world axes',
        shortcut: 'G',
        icon: <Grid className="w-4 h-4 text-zinc-400" />,
        action: () => {
          onToggleGrid();
          onClose();
        },
      },
      {
        id: 'action_snap',
        category: 'actions',
        title: snapEnabled ? 'Disable Grid Snapping' : 'Enable Grid Snapping',
        subtitle: 'Snap coordinates to 1mm / 0.5m increments',
        shortcut: 'S',
        icon: <Sliders className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onToggleSnap();
          onClose();
        },
      },
      {
        id: 'action_undo',
        category: 'actions',
        title: 'Undo Last Action',
        subtitle: canUndo ? 'Step back to previous scene state' : 'No previous actions',
        shortcut: 'Ctrl+Z',
        icon: <RotateCcw className="w-4 h-4 text-zinc-400" />,
        action: () => {
          if (canUndo) onUndo();
          onClose();
        },
      },
      {
        id: 'action_redo',
        category: 'actions',
        title: 'Redo Next Action',
        subtitle: canRedo ? 'Step forward in scene history' : 'No redoable actions',
        shortcut: 'Ctrl+Y',
        icon: <RotateCw className="w-4 h-4 text-zinc-400" />,
        action: () => {
          if (canRedo) onRedo();
          onClose();
        },
      },
      {
        id: 'action_export_stl',
        category: 'actions',
        title: 'Export 3D CAD: STL Binary / ASCII',
        subtitle: 'Standard format for 3D printing and rapid prototyping',
        icon: <Download className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onExportSTL();
          onClose();
        },
      },
      {
        id: 'action_export_obj',
        category: 'actions',
        title: 'Export 3D CAD: Wavefront OBJ',
        subtitle: 'Universal 3D geometry format with material groups',
        icon: <Download className="w-4 h-4 text-blue-400" />,
        action: () => {
          onExportOBJ();
          onClose();
        },
      },
      {
        id: 'action_switch_section',
        category: 'actions',
        title: section === 'technology' ? 'Switch to Architectural CAD Section' : 'Switch to Technology CAD Section',
        subtitle: section === 'technology' ? 'Design buildings, pavilions, and BIM structures' : 'Design consumer hardware, electronics, and devices',
        icon: section === 'technology' ? <Building2 className="w-4 h-4 text-amber-400" /> : <Cpu className="w-4 h-4 text-blue-400" />,
        action: () => {
          onSelectSection(section === 'technology' ? 'building' : 'technology');
          onClose();
        },
      }
    );

    return list;
  }, [
    objects,
    section,
    gridVisible,
    snapEnabled,
    canUndo,
    canRedo,
    onSelectObject,
    onClose,
    onOpenBOMModal,
    onOpenVersionModal,
    onOpenMeasuringTool,
    onOpenCommentsModal,
    onOpenClashDetection,
    onOpenPBRReview,
    onOpenHolographicStudio,
    onOpenMaterialLibrary,
    onOpenKinematics,
    onOpenAutoAlign,
    onOpenLayerTagManager,
    onOpenDesignAnalytics,
    onOpenSnapshotStudio,
    onLoadPreset,
    onChangeRenderMode,
    onChangeLightingPreset,
    onChangeThemeMode,
    onForceSave,
    onToggleGrid,
    onToggleSnap,
    onUndo,
    onRedo,
    onExportSTL,
    onExportOBJ,
    onSelectSection,
  ]);

  // Filter commands by search query and category
  const filteredCommands = useMemo(() => {
    let result = allCommands;

    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category === selectedCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
          (c.badge && c.badge.toLowerCase().includes(q)) ||
          (c.shortcut && c.shortcut.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allCommands, query, selectedCategory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1 < filteredCommands.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[highlightedIndex]) {
          filteredCommands[highlightedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, highlightedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Top Search Bar */}
        <div className="p-3.5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            placeholder="Type a command, search assembly parts, tools, or press ↵ to jump..."
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-800"
            >
              Clear
            </button>
          )}
          <kbd className="bg-zinc-800 text-zinc-400 font-mono text-[10px] px-1.5 py-0.5 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-zinc-800 bg-zinc-950/40 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'all', label: 'All', count: allCommands.length },
            { id: 'parts', label: 'Parts', count: objects.length },
            { id: 'tools', label: 'Studios & Tools', count: 13 },
            { id: 'presets', label: 'Presets', count: section === 'technology' ? 4 : 2 },
            { id: 'render', label: 'Render & Shaders', count: 3 },
            { id: 'lighting', label: 'Lighting', count: 3 },
            { id: 'theme', label: 'Themes', count: 3 },
            { id: 'actions', label: 'Actions', count: 8 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategory(tab.id);
                setHighlightedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70 bg-zinc-800 px-1 rounded">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Command List Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-800/40">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No matching commands or parts found for "{query}"</p>
              <p className="text-xs text-zinc-600 mt-1">Try searching for "OLED", "BOM", "Explode", "Titanium", or "Caliper"</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === highlightedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={idx}
                  onClick={cmd.action}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-zinc-100 shadow-sm'
                      : 'hover:bg-zinc-800/50 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-cyan-950 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{cmd.title}</span>
                        {cmd.badge && (
                          <span className="text-[10px] font-mono uppercase bg-zinc-800 text-cyan-400 px-1.5 py-0.5 rounded border border-zinc-700">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{cmd.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {cmd.shortcut && (
                      <kbd className="bg-zinc-800 text-zinc-300 font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className="w-4 h-4 text-cyan-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Shortcut Guide Footer */}
        <div className="px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono text-[10px]">
                ESC
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="text-zinc-500 font-mono">
            {filteredCommands.length} command{filteredCommands.length === 1 ? '' : 's'} available
          </span>
        </div>
      </div>
    </div>
  );
};
