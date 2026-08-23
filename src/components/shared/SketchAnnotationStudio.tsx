/**
 * 2D & 3D Interactive Sketch Annotations & Engineering Markup Studio
 * Enables freehand pen markup, arrow callouts, dimension leaders, revision clouds,
 * text notes, and engineering status stamps directly overlaid on the 3D CAD canvas.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  MoveUpRight,
  Ruler,
  Square,
  Circle,
  Cloud,
  Type,
  Stamp,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Palette,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  SketchToolType,
  SketchStroke,
  SketchPoint,
  EngineeringStampType,
} from '../../types/cad';
import { holoAudio } from '../../utils/hologramAudio';

interface SketchAnnotationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  viewportCanvasSelector?: string;
}

const MARKUP_COLORS = [
  { name: 'Cyber Cyan', hex: '#38bdf8' },
  { name: 'Neon Green', hex: '#10b981' },
  { name: 'Warning Amber', hex: '#f59e0b' },
  { name: 'CAD Crimson', hex: '#ef4444' },
  { name: 'Electric Purple', hex: '#a855f7' },
  { name: 'Pure White', hex: '#ffffff' },
];

const STAMPS: EngineeringStampType[] = [
  'APPROVED',
  'REVISE',
  'TOLERANCE ±0.05',
  'CRITICAL CLASH',
  'DFM ISSUE',
  'SAMPLE OK',
];

export const SketchAnnotationStudio: React.FC<SketchAnnotationStudioProps> = ({
  isOpen,
  onClose,
  viewportCanvasSelector = 'canvas',
}) => {
  const [activeTool, setActiveTool] = useState<SketchToolType>('pen');
  const [activeColor, setActiveColor] = useState<string>('#38bdf8');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [selectedStamp, setSelectedStamp] = useState<EngineeringStampType>('APPROVED');
  const [textInputVal, setTextInputVal] = useState<string>('Ref: Fillet R2.5mm');
  const [visible, setVisible] = useState<boolean>(true);

  // Stroke stacks for Undo / Redo
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Drawing state refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<SketchPoint[]>([]);

  // Push new stroke to history
  const addStroke = useCallback(
    (newStroke: SketchStroke) => {
      setStrokes(prev => [...prev.slice(0, historyIndex + 1), newStroke]);
      setHistoryIndex(prev => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex >= 0) {
      setHistoryIndex(prev => prev - 1);
      holoAudio.playSelectTone();
    }
  };

  const handleRedo = () => {
    if (historyIndex < strokes.length - 1) {
      setHistoryIndex(prev => prev + 1);
      holoAudio.playSelectTone();
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setHistoryIndex(-1);
    holoAudio.playSelectTone();
  };

  // Re-draw canvas whenever strokes or historyIndex change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas resolution to display size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!visible) return;

    const visibleStrokes = strokes.slice(0, historyIndex + 1);

    for (const s of visibleStrokes) {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.tool === 'pen' && s.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      } else if (s.tool === 'arrow' && s.points.length >= 2) {
        const start = s.points[0];
        const end = s.points[s.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 14;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (s.tool === 'dimension_leader' && s.points.length >= 2) {
        const start = s.points[0];
        const end = s.points[s.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Calculate distance in virtual mm
        const pxDist = Math.hypot(end.x - start.x, end.y - start.y);
        const mmDist = (pxDist * 0.25).toFixed(1);

        // Draw dimension text badge
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.font = 'bold 12px monospace';
        const textWidth = ctx.measureText(`${mmDist} mm`).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 14, textWidth + 8, 18);
        ctx.strokeStyle = s.color;
        ctx.strokeRect(midX - textWidth / 2 - 4, midY - 14, textWidth + 8, 18);
        ctx.fillStyle = s.color;
        ctx.fillText(`${mmDist} mm`, midX - textWidth / 2, midY);
      } else if (s.tool === 'rectangle' && s.points.length >= 2) {
        const start = s.points[0];
        const end = s.points[s.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (s.tool === 'circle' && s.points.length >= 2) {
        const start = s.points[0];
        const end = s.points[s.points.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (s.tool === 'cloud' && s.points.length >= 2) {
        const start = s.points[0];
        const end = s.points[s.points.length - 1];
        ctx.save();
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.restore();
      } else if (s.tool === 'text_note' && s.points.length >= 1) {
        const pt = s.points[0];
        ctx.font = '13px monospace';
        const txt = s.text || 'Note';
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(pt.x, pt.y - 18, tw + 12, 24);
        ctx.strokeStyle = s.color;
        ctx.strokeRect(pt.x, pt.y - 18, tw + 12, 24);
        ctx.fillStyle = s.color;
        ctx.fillText(txt, pt.x + 6, pt.y);
      } else if (s.tool === 'stamp' && s.points.length >= 1) {
        const pt = s.points[0];
        const stampText = s.stamp || 'APPROVED';
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(-0.15);
        ctx.font = 'bold 15px sans-serif';
        const tw = ctx.measureText(stampText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(-tw / 2 - 8, -14, tw + 16, 28);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-tw / 2 - 8, -14, tw + 16, 28);
        ctx.fillStyle = s.color;
        ctx.fillText(stampText, -tw / 2, 6);
        ctx.restore();
      }
    }
  }, [strokes, historyIndex, visible]);

  // Pointer event handlers on the annotation canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    currentPointsRef.current = [{ x, y }];

    if (activeTool === 'stamp') {
      addStroke({
        id: `stroke_${Date.now()}`,
        tool: 'stamp',
        points: [{ x, y }],
        color: activeColor,
        strokeWidth: 2,
        stamp: selectedStamp,
        createdAt: Date.now(),
      });
      isDrawingRef.current = false;
      holoAudio.playAssemblySnap();
    } else if (activeTool === 'text_note') {
      addStroke({
        id: `stroke_${Date.now()}`,
        tool: 'text_note',
        points: [{ x, y }],
        color: activeColor,
        strokeWidth: 2,
        text: textInputVal,
        createdAt: Date.now(),
      });
      isDrawingRef.current = false;
      holoAudio.playSelectTone();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pen') {
      currentPointsRef.current.push({ x, y });
      // Live draw current stroke
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const pts = currentPointsRef.current;
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else {
      currentPointsRef.current = [currentPointsRef.current[0], { x, y }];
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      addStroke({
        id: `stroke_${Date.now()}`,
        tool: activeTool,
        points: [...currentPointsRef.current],
        color: activeColor,
        strokeWidth,
        createdAt: Date.now(),
      });
      currentPointsRef.current = [];
    }
  };

  // Export merged annotated snapshot (WebGL canvas + 2D markup)
  const handleExportAnnotatedSnapshot = () => {
    const markupCanvas = canvasRef.current;
    if (!markupCanvas) return;

    // Find the 3D WebGL Canvas
    const webglCanvas = document.querySelector('canvas') as HTMLCanvasElement;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = markupCanvas.width;
    exportCanvas.height = markupCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background 3D WebGL render
    if (webglCanvas) {
      ctx.drawImage(webglCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    } else {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // Draw 2D Annotations overlay
    ctx.drawImage(markupCanvas, 0, 0);

    // Trigger download
    const url = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAD_Markup_Annotation_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    holoAudio.playStartupTone();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between">
      {/* Interactive Drawing Canvas Layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair z-10"
      />

      {/* Floating Top Floating Toolbar Dock */}
      <div className="pointer-events-auto mt-16 mx-auto z-20 flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3">
        {/* Tool Selector Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTool('pen')}
            title="Freehand Pen"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'pen'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('arrow')}
            title="Directional Arrow"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'arrow'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <MoveUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('dimension_leader')}
            title="Dimension Leader Caliper"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'dimension_leader'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('rectangle')}
            title="Bounding Box"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'rectangle'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('circle')}
            title="Bounding Circle"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'circle'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('cloud')}
            title="Revision Cloud"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'cloud'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('text_note')}
            title="Text Note Callout"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'text_note'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('stamp')}
            title="Engineering Stamp"
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'stamp'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Stamp className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1 bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-800">
          {MARKUP_COLORS.map(col => (
            <button
              key={col.hex}
              onClick={() => setActiveColor(col.hex)}
              title={col.name}
              className={`w-5 h-5 rounded-full transition-transform ${
                activeColor === col.hex ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: col.hex }}
            />
          ))}
        </div>

        {/* Stroke Width Slider */}
        <div className="flex items-center gap-2 px-2 text-xs text-zinc-400">
          <span>Width</span>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={e => setStrokeWidth(Number(e.target.value))}
            className="w-16 accent-sky-400"
          />
        </div>

        {/* Contextual Options: Stamp or Text Note Input */}
        {activeTool === 'stamp' && (
          <select
            value={selectedStamp}
            onChange={e => setSelectedStamp(e.target.value as EngineeringStampType)}
            className="bg-zinc-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 focus:outline-none"
          >
            {STAMPS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {activeTool === 'text_note' && (
          <input
            type="text"
            value={textInputVal}
            onChange={e => setTextInputVal(e.target.value)}
            placeholder="Type engineering note..."
            className="bg-zinc-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 w-44 focus:outline-none focus:border-sky-500"
          />
        )}

        {/* Undo / Redo & Clear Actions */}
        <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
          <button
            onClick={handleUndo}
            disabled={historyIndex < 0}
            title="Undo Stroke"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= strokes.length - 1}
            title="Redo Stroke"
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setVisible(!visible)}
            title={visible ? 'Hide Annotations' : 'Show Annotations'}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={handleClear}
            title="Clear Canvas"
            className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Export & Close Actions */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <button
            onClick={handleExportAnnotatedSnapshot}
            className="px-3 py-1.5 text-xs font-medium text-zinc-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export PNG
          </button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
