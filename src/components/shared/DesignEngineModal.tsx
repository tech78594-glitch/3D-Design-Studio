import React, { useState } from 'react';
import { CADObject, DesignSection } from '../../types/cad';
import { generateGenerativeDesign, DesignEngineRequest } from '../../utils/designEngine';
import {
  X,
  Sparkles,
  Cpu,
  Box,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DesignEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: DesignSection;
  onGenerateDesign: (newObjects: CADObject[]) => void;
}

export const DesignEngineModal: React.FC<DesignEngineModalProps> = ({
  isOpen,
  onClose,
  section,
  onGenerateDesign,
}) => {
  const [prompt, setPrompt] = useState('High-performance cooling heatsink module with copper heatpipes and extruded aluminum fins');
  const [category, setCategory] = useState<DesignEngineRequest['category']>('heatsink');
  const [targetWidth, setTargetWidth] = useState(80);
  const [targetHeight, setTargetHeight] = useState(140);
  const [targetDepth, setTargetDepth] = useState(16);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSynthesize = async () => {
    setIsGenerating(true);
    try {
      const result = await generateGenerativeDesign({
        prompt,
        category,
        targetWidthMm: targetWidth,
        targetHeightMm: targetHeight,
        targetDepthMm: targetDepth,
        section,
      });

      onGenerateDesign(result.objects);
      setLastSummary(`${result.title} — ${result.description} (${result.objects.length} CAD components generated via ${result.generatedBy})`);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.1 } });
    } catch (err) {
      console.error('Design Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Parametric CAD Design Engine
                <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 rounded-full font-mono">
                  Algorithmic
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synthesize complete 3D assemblies, cooling modules, brackets, or enclosure shells from parametric templates.
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
          {/* Natural Language Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              CAD Assembly Natural Language Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe assembly, materials, internal components, cooling fins, structural ribs..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Component Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Parametric Component Category</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'heatsink', label: 'Cooling Heat Sink' },
                { id: 'drone_arm', label: 'Drone Arm & Motor Mount' },
                { id: 'enclosure', label: 'Device Chassis Shell' },
                { id: 'bracket', label: 'Mounting L-Bracket' },
                { id: 'electronics', label: 'PCB Logic & Port Stack' },
                { id: 'architectural_frame', label: 'Structural Steel Frame' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`p-2.5 rounded-lg border text-center text-xs transition ${
                    category === cat.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Dimensions */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex justify-between">
                <span>Target Width</span>
                <span className="font-mono text-amber-400">{targetWidth}mm</span>
              </span>
              <input
                type="range"
                min="20"
                max="250"
                step="5"
                value={targetWidth}
                onChange={e => setTargetWidth(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex justify-between">
                <span>Target Height</span>
                <span className="font-mono text-amber-400">{targetHeight}mm</span>
              </span>
              <input
                type="range"
                min="20"
                max="300"
                step="5"
                value={targetHeight}
                onChange={e => setTargetHeight(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex justify-between">
                <span>Target Depth</span>
                <span className="font-mono text-amber-400">{targetDepth}mm</span>
              </span>
              <input
                type="range"
                min="5"
                max="100"
                step="2"
                value={targetDepth}
                onChange={e => setTargetDepth(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {lastSummary && (
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 text-xs text-slate-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{lastSummary}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <span className="text-xs text-slate-400">Generative CAD Geometry Pipeline</span>
          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing 3D Geometry...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate 3D CAD Assembly</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
