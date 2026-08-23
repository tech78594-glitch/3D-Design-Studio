import React, { useState } from 'react';
import { CADMaterial, CADObject } from '../../types/cad';
import {
  MATERIAL_PRESETS,
  MATERIAL_CATEGORIES,
  MaterialCategory,
} from '../../utils/materials';
import {
  X,
  Search,
  Sparkles,
  Check,
  Layers,
  Sliders,
  Paintbrush,
  Copy,
  Zap,
  Info,
  Shield,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface MaterialLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObject: CADObject | null;
  onApplyMaterial: (material: CADMaterial, scope: 'selected' | 'category' | 'all') => void;
}

export const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({
  isOpen,
  onClose,
  selectedObject,
  onApplyMaterial,
}) => {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [justAppliedId, setJustAppliedId] = useState<string | null>(null);

  // Custom material builder state
  const [customMaterial, setCustomMaterial] = useState<CADMaterial>({
    id: `mat_custom_${Date.now()}`,
    name: 'Custom Engineered Alloy',
    type: 'polished_metal',
    color: '#3b82f6',
    roughness: 0.25,
    metalness: 0.85,
    clearcoat: 0.2,
    transmission: 0,
    opacity: 1,
    transparent: false,
    emissive: '#000000',
    emissiveIntensity: 0,
    wireframe: false,
  });

  if (!isOpen) return null;

  // Filter materials based on category and search query
  const categoryDef = MATERIAL_CATEGORIES.find(c => c.key === activeCategory);
  const candidateIds = categoryDef ? categoryDef.ids : Object.keys(MATERIAL_PRESETS);

  const filteredMaterials = candidateIds
    .map(id => MATERIAL_PRESETS[id])
    .filter(Boolean)
    .filter(mat => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        mat.name.toLowerCase().includes(q) ||
        mat.type.toLowerCase().includes(q) ||
        mat.color.toLowerCase().includes(q)
      );
    });

  const handleApply = (mat: CADMaterial, scope: 'selected' | 'category' | 'all') => {
    onApplyMaterial(mat, scope);
    setJustAppliedId(mat.id);
    setTimeout(() => setJustAppliedId(null), 1800);
  };

  return (
    <div
      id="material_library_backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="material_library_modal"
        className="w-full max-w-4xl max-h-[88vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 text-blue-400 border border-zinc-700/80">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">CAD Material Library</h2>
                <span className="text-[10px] font-semibold bg-zinc-800 text-blue-400 border border-zinc-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PBR Shaders
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {selectedObject
                  ? `Active Target: ${selectedObject.name} (${selectedObject.category})`
                  : 'Select any part to apply or apply to entire assemblies'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('presets')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'presets'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Material Presets
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'custom'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Custom Shader Studio
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'presets' ? (
          <>
            {/* Search & Category Filter Bar */}
            <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {MATERIAL_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.key
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative shrink-0 w-full md:w-60">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Material Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {filteredMaterials.map(mat => {
                  const isCurrent = selectedObject?.material.id === mat.id;
                  const isJustApplied = justAppliedId === mat.id;

                  return (
                    <div
                      key={mat.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                        isCurrent
                          ? 'bg-zinc-800/90 border-blue-500/80 shadow-md shadow-zinc-950/50'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            {/* Color / Shader Preview Sphere Swatch */}
                            <div
                              className="w-7 h-7 rounded-lg border border-black/30 shadow-inner relative flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: mat.color,
                                boxShadow: mat.emissive && mat.emissive !== '#000000'
                                  ? `0 0 12px ${mat.emissive}88`
                                  : undefined,
                              }}
                            >
                              {mat.transparent && (
                                <span className="text-[9px] font-bold text-white drop-shadow">T</span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                                {mat.name}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono uppercase">
                                {mat.type.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>

                          {isJustApplied && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> Applied
                            </span>
                          )}
                        </div>

                        {/* PBR Attributes Bar */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono bg-zinc-900/90 p-2 rounded-lg border border-zinc-800 mb-3">
                          <div>
                            <span className="text-zinc-500 block">Roughness</span>
                            <span className="text-zinc-200">{(mat.roughness * 100).toFixed(0)}%</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Metalness</span>
                            <span className="text-zinc-200">{(mat.metalness * 100).toFixed(0)}%</span>
                          </div>
                          {mat.clearcoat ? (
                            <div>
                              <span className="text-zinc-500 block">Clearcoat</span>
                              <span className="text-zinc-200">{(mat.clearcoat * 100).toFixed(0)}%</span>
                            </div>
                          ) : null}
                          {mat.emissive && mat.emissive !== '#000000' ? (
                            <div>
                              <span className="text-zinc-500 block">Emissive</span>
                              <span className="text-blue-400 font-semibold">{mat.emissiveIntensity || 1}x</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-800/80">
                        <button
                          onClick={() => handleApply(mat, 'selected')}
                          disabled={!selectedObject}
                          className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                          title="Apply to currently selected CAD part"
                        >
                          Target
                        </button>
                        <button
                          onClick={() => handleApply(mat, 'category')}
                          disabled={!selectedObject}
                          className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors truncate"
                          title="Apply to all parts in this category"
                        >
                          Category
                        </button>
                        <button
                          onClick={() => handleApply(mat, 'all')}
                          className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                          title="Apply to all visible objects"
                        >
                          All
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* ================= CUSTOM SHADER STUDIO TAB ================= */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Shader Parameters */}
              <div className="space-y-4">
                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                    Material Identity
                  </span>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Shader Name</label>
                    <input
                      type="text"
                      value={customMaterial.name}
                      onChange={e => setCustomMaterial({ ...customMaterial, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">Base Surface Color</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-300 uppercase">
                        {customMaterial.color}
                      </span>
                      <input
                        type="color"
                        value={customMaterial.color}
                        onChange={e => setCustomMaterial({ ...customMaterial, color: e.target.value })}
                        className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* PBR Reflectance Sliders */}
                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                    PBR Microfacet Optics
                  </span>

                  {/* Roughness */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Roughness (Matte vs Gloss)</span>
                      <span className="font-mono text-zinc-300">{customMaterial.roughness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={customMaterial.roughness}
                      onChange={e => setCustomMaterial({ ...customMaterial, roughness: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>

                  {/* Metalness */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Metalness (Dielectric vs Conductor)</span>
                      <span className="font-mono text-zinc-300">{customMaterial.metalness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={customMaterial.metalness}
                      onChange={e => setCustomMaterial({ ...customMaterial, metalness: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>

                  {/* Clearcoat */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Clearcoat Lacquer</span>
                      <span className="font-mono text-zinc-300">{(customMaterial.clearcoat || 0).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={customMaterial.clearcoat || 0}
                      onChange={e => setCustomMaterial({ ...customMaterial, clearcoat: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Emissive & Glow */}
                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                    Emissive Laser / LED Glow
                  </span>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Emissive Color</span>
                    <input
                      type="color"
                      value={customMaterial.emissive || '#000000'}
                      onChange={e => setCustomMaterial({ ...customMaterial, emissive: e.target.value })}
                      className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Glow Intensity</span>
                      <span className="font-mono text-zinc-300">{(customMaterial.emissiveIntensity || 0).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={customMaterial.emissiveIntensity || 0}
                      onChange={e => setCustomMaterial({ ...customMaterial, emissiveIntensity: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Preview Swatch & Apply */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="bg-zinc-950/60 border border-zinc-800 p-6 rounded-xl space-y-4 text-center flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Real-Time Material Shader Sphere
                  </span>

                  <div
                    className="w-32 h-32 rounded-2xl border border-zinc-700/80 shadow-2xl transition-all flex items-center justify-center relative overflow-hidden"
                    style={{
                      backgroundColor: customMaterial.color,
                      boxShadow: customMaterial.emissive && customMaterial.emissive !== '#000000'
                        ? `0 0 30px ${customMaterial.emissive}aa, inset 0 0 20px ${customMaterial.emissive}55`
                        : 'inset 0 10px 20px rgba(255,255,255,0.2), inset 0 -10px 20px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="text-xs font-mono font-bold text-white/90 drop-shadow">
                      {customMaterial.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full text-xs font-mono text-zinc-300">
                    <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block">Rough</span>
                      <span>{customMaterial.roughness.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block">Metal</span>
                      <span>{customMaterial.metalness.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block">Coat</span>
                      <span>{(customMaterial.clearcoat || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                    Deploy Custom Material
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleApply(customMaterial, 'selected')}
                      disabled={!selectedObject}
                      className="p-2.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium transition-colors"
                    >
                      Apply Target
                    </button>
                    <button
                      onClick={() => handleApply(customMaterial, 'category')}
                      disabled={!selectedObject}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium transition-colors"
                    >
                      Apply Category
                    </button>
                    <button
                      onClick={() => handleApply(customMaterial, 'all')}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors"
                    >
                      Apply All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Materials automatically compile to WebGL PBR MeshPhysicalMaterial & MeshStandardMaterial shaders.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
