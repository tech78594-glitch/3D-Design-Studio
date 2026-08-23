/**
 * Component Hierarchy Tree (CAD Assembly Outliner)
 * Subassembly parent-child relationships, grouping, part isolation,
 * visibility/lock toggles, inline renaming, category filters, and batch controls.
 */

import React, { useState, useMemo } from 'react';
import { CADObject } from '../../types/cad';
import {
  Folder,
  FolderOpen,
  Box,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Search,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Link,
  Unlink,
  Check,
  X,
  Filter,
  CheckSquare,
  Shield,
  Cpu,
  Zap,
} from 'lucide-react';
import { holoAudio } from '../../utils/hologramAudio';

interface ComponentHierarchyTreeProps {
  objects: CADObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (updated: CADObject) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (obj: CADObject) => void;
  onOpenMaterialLibrary?: () => void;
}

export const ComponentHierarchyTree: React.FC<ComponentHierarchyTreeProps> = ({
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onOpenMaterialLibrary,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');
  const [isReparentingId, setIsReparentingId] = useState<string | null>(null);

  // Group objects by category or parent-child hierarchy
  const categories = useMemo(() => {
    const cats = new Set<string>();
    objects.forEach(o => cats.add(o.category));
    return ['all', ...Array.from(cats)];
  }, [objects]);

  const filteredObjects = useMemo(() => {
    return objects.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            o.primitive.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            o.material.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || o.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [objects, searchTerm, selectedCategory]);

  // Group by subsystem category
  const groupedObjects = useMemo(() => {
    const map: Record<string, CADObject[]> = {};
    filteredObjects.forEach(obj => {
      const cat = obj.category.toUpperCase();
      if (!map[cat]) map[cat] = [];
      map[cat].push(obj);
    });
    return map;
  }, [filteredObjects]);

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Toggle Visibility
  const toggleVisibility = (obj: CADObject, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateObject({ ...obj, visible: !obj.visible });
    holoAudio.playHudSelect();
  };

  // Toggle Lock
  const toggleLock = (obj: CADObject, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateObject({ ...obj, locked: !obj.locked });
    holoAudio.playHudSelect();
  };

  // Isolate Component (Hide all others)
  const handleIsolateObject = (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isOnlyVisible = objects.every(o => (o.id === targetId ? o.visible : !o.visible));
    
    // If already isolated, unhide all. Otherwise, hide all except target.
    objects.forEach(o => {
      onUpdateObject({
        ...o,
        visible: isOnlyVisible ? true : o.id === targetId,
      });
    });
    holoAudio.playHudSelect();
  };

  // Show All
  const handleShowAll = () => {
    objects.forEach(o => {
      if (!o.visible) onUpdateObject({ ...o, visible: true });
    });
  };

  // Inline Rename
  const handleStartRename = (obj: CADObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(obj.id);
    setEditNameText(obj.name);
  };

  const handleSaveRename = (obj: CADObject) => {
    if (editNameText.trim()) {
      onUpdateObject({ ...obj, name: editNameText.trim() });
    }
    setEditingId(null);
  };

  // Assign Parent ID
  const handleAssignParent = (childObj: CADObject, parentId: string | undefined) => {
    onUpdateObject({
      ...childObj,
      parentId: parentId || undefined,
    });
    setIsReparentingId(null);
    holoAudio.playMagneticLock();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-200 select-none">
      {/* Top Controls Header */}
      <div className="p-3 border-b border-zinc-800 space-y-2.5 bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Assembly Hierarchy Tree
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            {objects.length} parts
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter components, materials..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-medium'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Batch Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[11px]">
          <button
            onClick={handleShowAll}
            className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:underline"
          >
            <Eye className="w-3 h-3 text-blue-400" />
            <span>Show All</span>
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={() => {
              const allCollapsed = Object.values(collapsedGroups).some(v => !v);
              const next: Record<string, boolean> = {};
              Object.keys(groupedObjects).forEach(k => {
                next[k] = allCollapsed;
              });
              setCollapsedGroups(next);
            }}
            className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:underline"
          >
            <Folder className="w-3 h-3 text-amber-400" />
            <span>Collapse/Expand All</span>
          </button>
        </div>
      </div>

      {/* Tree View List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {Object.keys(groupedObjects).length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No components match &quot;{searchTerm}&quot;
          </div>
        ) : (
          (Object.entries(groupedObjects) as [string, CADObject[]][]).map(([groupName, groupItems]) => {
            const isCollapsed = !!collapsedGroups[groupName];
            return (
              <div key={groupName} className="rounded-xl bg-zinc-950/40 border border-zinc-800/80 overflow-hidden">
                {/* Subassembly Group Header */}
                <div
                  onClick={() => toggleGroupCollapse(groupName)}
                  className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 hover:bg-zinc-850 cursor-pointer text-xs font-semibold text-zinc-300 border-b border-zinc-800/60"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    {isCollapsed ? (
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{groupName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                    {groupItems.length}
                  </span>
                </div>

                {/* Subassembly Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-zinc-850/60">
                    {groupItems.map(obj => {
                      const isSelected = selectedObjectId === obj.id;
                      const isEditing = editingId === obj.id;
                      const isReparenting = isReparentingId === obj.id;

                      return (
                        <div
                          key={obj.id}
                          onClick={() => {
                            onSelectObject(obj.id);
                            holoAudio.playHudSelect();
                          }}
                          className={`px-3 py-2 flex items-center justify-between text-xs transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-blue-500/15 border-l-2 border-blue-500 text-zinc-100 font-medium'
                              : 'hover:bg-zinc-900/80 text-zinc-300'
                          } ${!obj.visible ? 'opacity-40' : ''}`}
                        >
                          {/* Left: Icon, Name & Parent Badge */}
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-black/40"
                              style={{ backgroundColor: obj.material.color }}
                              title={`Material: ${obj.material.name}`}
                            />

                            {isEditing ? (
                              <div
                                className="flex items-center gap-1 flex-1"
                                onClick={e => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editNameText}
                                  onChange={e => setEditNameText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveRename(obj);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className="w-full bg-zinc-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveRename(obj)}
                                  className="p-1 text-emerald-400 hover:text-emerald-300"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate">{obj.name}</span>
                                  {obj.parentId && (
                                    <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-blue-300 border border-zinc-700">
                                      child
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono truncate">
                                  {obj.primitive} • {obj.material.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right: Actions (Visibility, Lock, Isolate, Parent, Duplicate, Delete) */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                            {/* Isolate Button */}
                            <button
                              onClick={e => handleIsolateObject(obj.id, e)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400"
                              title="Isolate this component"
                            >
                              <Shield className="w-3 h-3" />
                            </button>

                            {/* Visibility Toggle */}
                            <button
                              onClick={e => toggleVisibility(obj, e)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                              title={obj.visible ? 'Hide component' : 'Show component'}
                            >
                              {obj.visible ? (
                                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </button>

                            {/* Lock Toggle */}
                            <button
                              onClick={e => toggleLock(obj, e)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                              title={obj.locked ? 'Unlock transform' : 'Lock transform'}
                            >
                              {obj.locked ? (
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-zinc-500" />
                              )}
                            </button>

                            {/* Inline Rename */}
                            <button
                              onClick={e => handleStartRename(obj, e)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"
                              title="Rename component"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onDuplicateObject(obj);
                              }}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"
                              title="Duplicate component"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Component Quick Summary Footer */}
      {selectedObjectId && (
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-200 font-medium truncate max-w-[180px]">
              {objects.find(o => o.id === selectedObjectId)?.name}
            </span>
          </div>
          {onOpenMaterialLibrary && (
            <button
              onClick={onOpenMaterialLibrary}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
            >
              Change Material →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
