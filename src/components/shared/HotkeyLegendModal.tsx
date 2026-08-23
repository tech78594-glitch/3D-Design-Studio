/**
 * Studio Hotkey Legend & Keyboard Shortcuts Cheatsheet Modal
 * Displays all active CAD navigation, modeling, shading, exploded view,
 * and tooling shortcuts with instant search filtering.
 */

import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  Search,
  X,
  Compass,
  Move,
  Eye,
  Sliders,
  Sparkles,
  Command,
  HelpCircle,
} from 'lucide-react';
import { HotkeyItem } from '../../types/cad';
import { holoAudio } from '../../utils/hologramAudio';

interface HotkeyLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionId: string) => void;
}

const DEFAULT_HOTKEYS: HotkeyItem[] = [
  // 1. Viewport & Navigation
  {
    id: 'hk_orbit',
    keys: ['Left Click', 'Drag'],
    description: 'Orbit 3D camera around target pivot',
    category: 'viewport',
  },
  {
    id: 'hk_pan',
    keys: ['Right Click', 'Drag'],
    description: 'Pan camera laterally across viewport plane',
    category: 'viewport',
  },
  {
    id: 'hk_zoom',
    keys: ['Scroll Wheel'],
    description: 'Zoom in / out on cursor location',
    category: 'viewport',
  },
  {
    id: 'hk_focus',
    keys: ['F'],
    description: 'Frame and focus camera on selected CAD component',
    category: 'viewport',
  },
  {
    id: 'hk_grid',
    keys: ['G'],
    description: 'Toggle viewport millimeter ground grid',
    category: 'viewport',
  },

  // 2. Modeling & Transforms
  {
    id: 'hk_select_mode',
    keys: ['Q'],
    description: 'Switch to standard Selection Mode',
    category: 'modeling',
  },
  {
    id: 'hk_translate_mode',
    keys: ['W'],
    description: 'Switch to 3D Translation Gizmo Mode',
    category: 'modeling',
  },
  {
    id: 'hk_rotate_mode',
    keys: ['E'],
    description: 'Switch to 3D Rotation Gizmo Mode',
    category: 'modeling',
  },
  {
    id: 'hk_scale_mode',
    keys: ['R'],
    description: 'Switch to 3D Scale Gizmo Mode',
    category: 'modeling',
  },
  {
    id: 'hk_measure_mode',
    keys: ['M'],
    description: 'Toggle 3D Precision Caliper & Measuring Tool',
    category: 'modeling',
  },

  // 3. Shading & Visualization
  {
    id: 'hk_render_shaded',
    keys: ['1'],
    description: 'PBR Shaded & Textured Render Mode',
    category: 'shading',
  },
  {
    id: 'hk_render_wireframe',
    keys: ['2'],
    description: 'Technical Wireframe Mesh Mode',
    category: 'shading',
  },
  {
    id: 'hk_render_thermal',
    keys: ['3'],
    description: 'FLIR Thermal Heat Dissipation Simulation',
    category: 'shading',
  },
  {
    id: 'hk_render_xray',
    keys: ['4'],
    description: 'Semi-transparent X-Ray Internal Diagnostic Mode',
    category: 'shading',
  },

  // 4. Assembly & Kinematics
  {
    id: 'hk_explode_player',
    keys: ['Space'],
    description: 'Toggle Exploded View Animation Timeline Player',
    category: 'assembly',
  },
  {
    id: 'hk_step_next',
    keys: [']'],
    description: 'Step forward to next assembly sequence state',
    category: 'assembly',
  },
  {
    id: 'hk_step_prev',
    keys: ['['],
    description: 'Step backward to previous assembly sequence state',
    category: 'assembly',
  },

  // 5. Tools & Management
  {
    id: 'hk_command_palette',
    keys: ['⌘', 'K'],
    description: 'Open Global Quick Command & Search Palette',
    category: 'tools',
    contextNote: 'or Ctrl+K on Windows/Linux',
  },
  {
    id: 'hk_quick_save',
    keys: ['⌘', 'S'],
    description: 'Trigger immediate local session auto-save & snapshot',
    category: 'tools',
    contextNote: 'or Ctrl+S',
  },
  {
    id: 'hk_batch_export',
    keys: ['⌘', 'E'],
    description: 'Open Batch Mesh Exporter & ZIP Bundler',
    category: 'tools',
  },
  {
    id: 'hk_bom_modal',
    keys: ['B'],
    description: 'Open Bill of Materials (BOM) & Cost Analysis',
    category: 'tools',
  },
  {
    id: 'hk_version_modal',
    keys: ['V'],
    description: 'Open Design Version & Revision History Manager',
    category: 'tools',
  },
  {
    id: 'hk_comments_modal',
    keys: ['C'],
    description: 'Open Collaborative 3D Spatial Comments & Pins',
    category: 'tools',
  },
  {
    id: 'hk_legend_modal',
    keys: ['?'],
    description: 'Open Keyboard Shortcuts Cheatsheet',
    category: 'tools',
  },
];

export const HotkeyLegendModal: React.FC<HotkeyLegendModalProps> = ({
  isOpen,
  onClose,
  onTriggerAction,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredHotkeys = useMemo(() => {
    return DEFAULT_HOTKEYS.filter(hk => {
      const matchesCategory =
        selectedCategory === 'all' || hk.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        hk.description.toLowerCase().includes(q) ||
        hk.keys.some(k => k.toLowerCase().includes(q)) ||
        (hk.contextNote && hk.contextNote.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Shortcuts' },
    { id: 'viewport', label: 'Viewport' },
    { id: 'modeling', label: 'Modeling & Gizmos' },
    { id: 'shading', label: 'Shading & Modes' },
    { id: 'assembly', label: 'Assembly & Explode' },
    { id: 'tools', label: 'Studio Tools' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Keyboard Hotkeys & Legend</h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                  Shortcut Reference
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Accelerate your CAD workflow with precision hotkeys and single-key tool toggles.
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

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shortcut or key name (e.g., 'Space', 'Measure', 'Save', 'W')..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/90 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-purple-500 placeholder:text-zinc-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  holoAudio.playSelectTone();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredHotkeys.map(hk => (
              <div
                key={hk.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/30 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
              >
                <div className="pr-3">
                  <span className="text-xs font-medium text-zinc-200 block">{hk.description}</span>
                  {hk.contextNote && (
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{hk.contextNote}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {hk.keys.map((key, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[11px] font-mono text-zinc-200 shadow-sm shadow-black/40 min-w-[24px] text-center"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredHotkeys.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No shortcuts found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-purple-400" />
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] border border-zinc-700">?</kbd> anywhere to toggle this legend
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
