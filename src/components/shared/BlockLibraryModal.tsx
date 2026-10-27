/**
 * AutoCAD BLOCK / INSERT-style reusable component library.
 *
 * Save the currently selected part as a named, reusable "block" definition, then insert
 * fresh copies of it anywhere in the scene — the same workflow AutoCAD uses for repeated
 * hardware like screws, connectors, or standard fittings, instead of re-building the part
 * (or copy/pasting it) every time it's needed again.
 */

import React, { useState } from 'react';
import { CADObject, CADBlockDefinition, DesignSection } from '../../types/cad';
import { X, Component, Save, PlusSquare, Trash2, Package, Info } from 'lucide-react';

interface BlockLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: DesignSection;
  selectedObject: CADObject | null;
  blocks: CADBlockDefinition[];
  onCreateBlock: (block: CADBlockDefinition) => void;
  onDeleteBlock: (blockId: string) => void;
  onInsertBlock: (block: CADBlockDefinition) => void;
}

export const BlockLibraryModal: React.FC<BlockLibraryModalProps> = ({
  isOpen,
  onClose,
  section,
  selectedObject,
  blocks,
  onCreateBlock,
  onDeleteBlock,
  onInsertBlock,
}) => {
  const [blockName, setBlockName] = useState('');
  const [justInsertedId, setJustInsertedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const sectionBlocks = blocks.filter(b => b.section === section);

  const handleCreateBlock = () => {
    if (!selectedObject || !blockName.trim()) return;

    // Store the object with its position recentered to the block's own local origin
    // (0,0,0) so every insertion starts fresh and can be repositioned independently via
    // the Inspector, the same way AutoCAD's BLOCK command re-bases geometry to a base point.
    const localObject: CADObject = {
      ...selectedObject,
      id: 'block_part',
      position: [0, 0, 0],
    };

    const block: CADBlockDefinition = {
      id: `block_${Date.now()}`,
      name: blockName.trim(),
      section,
      objects: [localObject],
      partCount: 1,
      createdAt: new Date().toLocaleString(),
      insertCount: 0,
    };

    onCreateBlock(block);
    setBlockName('');
  };

  const handleInsert = (block: CADBlockDefinition) => {
    onInsertBlock(block);
    setJustInsertedId(block.id);
    setTimeout(() => setJustInsertedId(null), 1800);
  };

  return (
    <div
      id="block_library_backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="block_library_modal"
        className="w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-900/30 text-teal-400 border border-teal-700/50">
              <Component className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                Block Library
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 font-mono font-bold align-middle">
                  {sectionBlocks.length} Blocks
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Save reusable parts, then insert fresh copies anywhere</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Create new block */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-teal-400" />
              Create Block from Selection
            </div>
            {selectedObject ? (
              <p className="text-xs text-zinc-400">
                Selected part: <strong className="text-zinc-200">{selectedObject.name}</strong>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">Select a part in the viewport or hierarchy tree first.</p>
            )}
            <div className="flex items-center gap-2">
              <input
                id="input_block_name"
                type="text"
                value={blockName}
                onChange={e => setBlockName(e.target.value)}
                placeholder="Block name (e.g. M3 Hex Screw)"
                disabled={!selectedObject}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 disabled:opacity-40"
              />
              <button
                id="btn_create_block"
                onClick={handleCreateBlock}
                disabled={!selectedObject || !blockName.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
              >
                <PlusSquare className="w-3.5 h-3.5" />
                Save Block
              </button>
            </div>
          </div>

          {/* Block list */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-zinc-400">Saved Blocks ({sectionBlocks.length})</div>
            {sectionBlocks.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-xs space-y-2">
                <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                <p>No blocks saved yet in this section.</p>
              </div>
            )}
            {sectionBlocks.map(block => (
              <div
                key={block.id}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-100 truncate">{block.name}</div>
                  <div className="text-[10px] text-zinc-500">
                    {block.partCount} part{block.partCount === 1 ? '' : 's'} &middot; inserted {block.insertCount}x
                    &middot; {block.createdAt}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleInsert(block)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      justInsertedId === block.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-teal-700 hover:bg-teal-600 text-white'
                    }`}
                  >
                    {justInsertedId === block.id ? 'Inserted!' : 'Insert'}
                  </button>
                  <button
                    onClick={() => onDeleteBlock(block.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-[11px] text-zinc-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
            <span>Inserted copies land at the scene origin — move the newly selected copy with the Inspector's Position fields (or Snap to Grid / Snap to Nearest Part) to place it.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
