import React, { useState } from 'react';
import { CADObject, CADMaterial } from '../../types/cad';
import { generateAutoTexture, TextureGenerationOptions } from '../../utils/autoTexture';
import {
  X,
  Paintbrush,
  Sparkles,
  Layers,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AutoTextureModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObject: CADObject | null;
  onApplyMaterial: (objectId: string, material: CADMaterial) => void;
}

export const AutoTextureModal: React.FC<AutoTextureModalProps> = ({
  isOpen,
  onClose,
  selectedObject,
  onApplyMaterial,
}) => {
  const [prompt, setPrompt] = useState('High-performance forged carbon fiber with subtle metallic weave');
  const [presetStyle, setPresetStyle] = useState<TextureGenerationOptions['presetStyle']>('carbon');
  const [roughness, setRoughness] = useState(0.3);
  const [metalness, setMetalness] = useState(0.6);
  const [colorHex, setColorHex] = useState('#38bdf8');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [lastGeneratedMaterial, setLastGeneratedMaterial] = useState<CADMaterial | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAutoTexture(
        {
          prompt,
          presetStyle,
          roughness,
          metalness,
          colorHex,
        },
        apiKey
      );

      setGeneratedPreviewUrl(result.textureDataUrl);
      setLastGeneratedMaterial(result.material);

      if (selectedObject) {
        onApplyMaterial(selectedObject.id, result.material);
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.1 } });
      }
    } catch (err) {
      console.error('Texture Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-purple-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Automatic AI PBR Texture Generator
                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full font-mono">
                  Hugging Face & Procedural
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synthesize custom metallic, carbon, wood, or PCB bump maps and apply them to CAD geometry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Part Banner */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">Target CAD Object:</span>
              <span className="font-bold text-slate-200">
                {selectedObject ? selectedObject.name : 'All Assembly Meshes'}
              </span>
            </div>
            <span className="text-[11px] text-purple-300 font-mono">PBR Texture Synthesis</span>
          </div>

          {/* Prompt Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI Material Texture Prompt
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe surface finish, micro-details, fiber weaves, brushed direction..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Preset Styles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Surface Texture Pattern Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'carbon', label: 'Carbon Weave' },
                { id: 'brushed_metal', label: 'Brushed Alloy' },
                { id: 'wood_grain', label: 'Wood Grain' },
                { id: 'pcb_grid', label: 'PCB Traces' },
                { id: 'cyber_hex', label: 'Cyber Hex Grid' },
                { id: 'anodized', label: 'Anodized Matte' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPresetStyle(p.id as any)}
                  className={`p-2.5 rounded-lg border text-center text-xs transition ${
                    presetStyle === p.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roughness, Metalness & Color Controls */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex justify-between">
                <span>Roughness</span>
                <span className="font-mono text-purple-300">{roughness.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={roughness}
                onChange={e => setRoughness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex justify-between">
                <span>Metalness</span>
                <span className="font-mono text-purple-300">{metalness.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={metalness}
                onChange={e => setMetalness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400">Base Albedo Color</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={e => setColorHex(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 uppercase">{colorHex}</span>
              </div>
            </div>
          </div>

          {/* Optional Hugging Face Token */}
          <div className="space-y-1 pt-2">
            <label className="text-[11px] text-slate-400">Optional Hugging Face Token (for LLM PBR tuning)</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Hugging Face token (leave blank to use the app's configured token, or for instant local Canvas synthesis)"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Preview Image if generated */}
          {generatedPreviewUrl && (
            <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/30 flex items-center space-x-4">
              <img
                src={generatedPreviewUrl}
                alt="Generated PBR Canvas"
                className="w-16 h-16 rounded-lg object-cover border border-purple-500/40"
              />
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Baked PBR Texture Map Ready
                </div>
                <div className="text-slate-400">Applied to material map successfully.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <span className="text-xs text-slate-400">512x512 Seamless PBR Map</span>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Baking Texture...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bake & Apply Texture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
