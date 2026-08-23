import React, { useState } from 'react';
import { CADObject, CADLayer, CADTag, DEFAULT_CAD_LAYERS, DEFAULT_CAD_TAGS } from '../../types/cad';
import {
  Layers,
  Tag,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Sliders,
  Filter,
  Check,
  Sparkles,
  Box,
  Palette,
  X,
  Radio,
} from 'lucide-react';

interface LayerTagManagerProps {
  objects: CADObject[];
  onUpdateObjects: (updated: CADObject[]) => void;
  layers: CADLayer[];
  onUpdateLayers: (layers: CADLayer[]) => void;
  tags: CADTag[];
  onUpdateTags: (tags: CADTag[]) => void;
  selectedObjectId: string | null;
  activeTagFilter: string | null;
  onSetActiveTagFilter: (tagId: string | null) => void;
  onClose?: () => void;
}

export const LayerTagManager: React.FC<LayerTagManagerProps> = ({
  objects,
  onUpdateObjects,
  layers,
  onUpdateLayers,
  tags,
  onUpdateTags,
  selectedObjectId,
  activeTagFilter,
  onSetActiveTagFilter,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'tags'>('layers');
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState('#38bdf8');
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);

  const selectedObj = objects.find(o => o.id === selectedObjectId);

  // Toggle Visibility for entire layer
  const handleToggleLayerVisibility = (layerId: string) => {
    const targetLayer = layers.find(l => l.id === layerId);
    if (!targetLayer) return;
    const newVis = !targetLayer.visible;

    onUpdateLayers(layers.map(l => (l.id === layerId ? { ...l, visible: newVis } : l)));
    // Sync to objects belonging to this layer
    onUpdateObjects(
      objects.map(o => (o.layerId === layerId ? { ...o, visible: newVis } : o))
    );
  };

  // Toggle Lock for entire layer
  const handleToggleLayerLock = (layerId: string) => {
    const targetLayer = layers.find(l => l.id === layerId);
    if (!targetLayer) return;
    const newLock = !targetLayer.locked;

    onUpdateLayers(layers.map(l => (l.id === layerId ? { ...l, locked: newLock } : l)));
    onUpdateObjects(
      objects.map(o => (o.layerId === layerId ? { ...o, locked: newLock } : o))
    );
  };

  // Solo / Isolate Layer
  const handleSoloLayer = (layerId: string) => {
    onUpdateLayers(
      layers.map(l => ({
        ...l,
        visible: l.id === layerId,
      }))
    );
    onUpdateObjects(
      objects.map(o => ({
        ...o,
        visible: o.layerId === layerId,
      }))
    );
  };

  // Assign Selected Object to Layer
  const handleAssignObjectToLayer = (layerId: string) => {
    if (!selectedObjectId) return;
    onUpdateObjects(
      objects.map(o => (o.id === selectedObjectId ? { ...o, layerId } : o))
    );
  };

  // Toggle Tag on Selected Object
  const handleToggleTagOnSelected = (tagId: string) => {
    if (!selectedObj) return;
    const currentTags = selectedObj.tags || [];
    const hasTag = currentTags.includes(tagId);
    const newTags = hasTag
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];

    onUpdateObjects(
      objects.map(o => (o.id === selectedObjectId ? { ...o, tags: newTags } : o))
    );
  };

  // Create new layer
  const handleCreateLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;

    const newLayer: CADLayer = {
      id: `layer_${Date.now()}`,
      name: newLayerName.trim(),
      color: newLayerColor,
      visible: true,
      locked: false,
      wireframeOnly: false,
      opacity: 1.0,
      order: layers.length,
    };

    onUpdateLayers([...layers, newLayer]);
    setNewLayerName('');
    setIsAddingLayer(false);
  };

  // Create new tag
  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagLabel.trim()) return;

    const newTag: CADTag = {
      id: `tag_${Date.now()}`,
      label: newTagLabel.trim(),
      color: newTagColor,
    };

    onUpdateTags([...tags, newTag]);
    setNewTagLabel('');
    setIsAddingTag(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 w-full max-w-md text-zinc-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">CAD Layers & Metadata Tags</h3>
            <p className="text-[11px] text-zinc-400">
              Multi-layer scene organization & engineering classification
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

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
        <button
          onClick={() => setActiveTab('layers')}
          className={`py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'layers'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers ({layers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'tags'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Tags ({tags.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: LAYERS ================= */}
      {activeTab === 'layers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Active Drawing Layers</span>
            <button
              onClick={() => setIsAddingLayer(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Layer</span>
            </button>
          </div>

          {/* Add Layer Form */}
          {isAddingLayer && (
            <form onSubmit={handleCreateLayer} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <input
                type="text"
                placeholder="Layer Name..."
                value={newLayerName}
                onChange={e => setNewLayerName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {['#38bdf8', '#34d399', '#a78bfa', '#fb923c', '#f472b6', '#94a3b8'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewLayerColor(c)}
                      className={`w-5 h-5 rounded-full border ${
                        newLayerColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingLayer(false)}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Layers List */}
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {layers.map(layer => {
              const partCount = objects.filter(o => o.layerId === layer.id).length;
              const isSelectedObjInLayer = selectedObj?.layerId === layer.id;

              return (
                <div
                  key={layer.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    isSelectedObjInLayer
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm'
                      : 'bg-zinc-950/50 hover:bg-zinc-800/40 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: layer.color }}
                    />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-zinc-200 block truncate">{layer.name}</span>
                      <span className="text-[10px] text-zinc-500">{partCount} parts</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {selectedObj && !isSelectedObjInLayer && (
                      <button
                        onClick={() => handleAssignObjectToLayer(layer.id)}
                        className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-400 text-[10px] font-medium transition-colors"
                        title="Assign selected part to this layer"
                      >
                        Assign
                      </button>
                    )}

                    <button
                      onClick={() => handleSoloLayer(layer.id)}
                      className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
                      title="Solo Isolate Layer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleLayerLock(layer.id)}
                      className={`p-1 rounded-md hover:bg-zinc-800 transition-colors ${
                        layer.locked ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleToggleLayerVisibility(layer.id)}
                      className={`p-1 rounded-md hover:bg-zinc-800 transition-colors ${
                        layer.visible ? 'text-zinc-300' : 'text-zinc-600'
                      }`}
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: TAGS ================= */}
      {activeTab === 'tags' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Engineering Tags & Classifications</span>
            <button
              onClick={() => setIsAddingTag(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Tag</span>
            </button>
          </div>

          {/* Add Tag Form */}
          {isAddingTag && (
            <form onSubmit={handleCreateTag} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <input
                type="text"
                placeholder="Tag Label (e.g. RF Shielded)..."
                value={newTagLabel}
                onChange={e => setNewTagLabel(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {['#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#10b981', '#64748b'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTagColor(c)}
                      className={`w-5 h-5 rounded-full border ${
                        newTagColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Active Viewport Tag Filter */}
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Viewport Filter:
            </span>
            {activeTagFilter ? (
              <button
                onClick={() => onSetActiveTagFilter(null)}
                className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
              >
                <span>Filtered by Tag</span>
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-zinc-500 text-[11px]">Show All Parts</span>
            )}
          </div>

          {/* Tags Cloud / Palette */}
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map(tag => {
              const isAppliedToSelected = selectedObj?.tags?.includes(tag.id);
              const isFilterActive = activeTagFilter === tag.id;

              return (
                <div
                  key={tag.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isFilterActive
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : isAppliedToSelected
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.label}</span>

                  {selectedObj && (
                    <button
                      onClick={() => handleToggleTagOnSelected(tag.id)}
                      className={`ml-1 p-0.5 rounded hover:bg-zinc-700 transition-colors ${
                        isAppliedToSelected ? 'text-emerald-400 font-bold' : 'text-zinc-500'
                      }`}
                      title={isAppliedToSelected ? 'Remove tag from selected part' : 'Apply tag to selected part'}
                    >
                      {isAppliedToSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  )}

                  <button
                    onClick={() => onSetActiveTagFilter(isFilterActive ? null : tag.id)}
                    className="ml-0.5 p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300"
                    title={isFilterActive ? 'Clear Filter' : 'Filter Viewport to this tag'}
                  >
                    <Filter className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
