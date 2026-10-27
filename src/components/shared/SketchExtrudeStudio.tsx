/**
 * AutoCAD/Fusion-style 2D Sketch -> Extrude/Revolve Solid Studio.
 *
 * Draw a 2D profile (click points, each one snapping to the active grid the same way
 * AutoCAD's SNAP does) on a work plane, then turn it into a real 3D solid with Extrude
 * (push the profile into a prism, like AutoCAD's PRESSPULL / EXTRUDE) or Revolve (spin it
 * around the vertical axis, like REVOLVE) — instead of only placing fixed preset shapes.
 */

import React, { useMemo, useRef, useState } from 'react';
import { CADObject, CADPrecisionSettings, DesignSection, SketchPlane } from '../../types/cad';
import { MATERIAL_PRESETS } from '../../utils/materials';
import {
  X,
  PenSquare,
  Undo2,
  Trash2,
  Box,
  CircleDot,
  Grid3x3,
  Info,
  Plus,
  CheckCircle2,
} from 'lucide-react';

interface SketchExtrudeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  section: DesignSection;
  precisionSettings: CADPrecisionSettings;
  onCreateObject: (obj: CADObject) => void;
}

const CANVAS_SIZE = 480;

export const SketchExtrudeStudio: React.FC<SketchExtrudeStudioProps> = ({
  isOpen,
  onClose,
  section,
  precisionSettings,
  onCreateObject,
}) => {
  const [plane, setPlane] = useState<SketchPlane>('xy');
  const [points, setPoints] = useState<[number, number][]>([]);
  const [pxPerUnit, setPxPerUnit] = useState<number>(4); // canvas pixels per mm (or per meter for building)
  const [extrudeDepth, setExtrudeDepth] = useState<number>(10);
  const [revolveAngle, setRevolveAngle] = useState<number>(360);
  const [revolveSegments, setRevolveSegments] = useState<number>(32);
  const [snapOverride, setSnapOverride] = useState<boolean>(true);
  const [manualX, setManualX] = useState<string>('0');
  const [manualY, setManualY] = useState<string>('0');
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const unit = section === 'technology' ? 'mm' : 'm';
  const gridSize = precisionSettings.gridSizeMm || 1;
  const effectiveSnap = snapOverride && precisionSettings.gridSnapEnabled;

  const toMm = (px: number) => (px - CANVAS_SIZE / 2) / pxPerUnit;
  const toPx = (mm: number) => mm * pxPerUnit + CANVAS_SIZE / 2;

  const snapVal = (v: number) => (effectiveSnap ? Math.round(v / gridSize) * gridSize : Math.round(v * 100) / 100);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // SVG Y grows downward; sketch Y should grow upward to match a conventional CAD plane.
    const x = snapVal(toMm(px));
    const y = snapVal(-toMm(py));
    setPoints(prev => [...prev, [x, y]]);
  };

  const handleAddManualPoint = () => {
    const x = snapVal(parseFloat(manualX) || 0);
    const y = snapVal(parseFloat(manualY) || 0);
    setPoints(prev => [...prev, [x, y]]);
  };

  const handleUndoPoint = () => setPoints(prev => prev.slice(0, -1));
  const handleClear = () => setPoints([]);

  // Bounding box of the current profile — used to give the resulting CADObject sensible
  // width/height/depth values for the rest of the app (BOM, mass calc, clash detection all
  // read dimensions.width/height/depth for their estimates even on parametric-sketch solids).
  const bbox = useMemo(() => {
    if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 10, height: 10 };
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY, width: Math.max(0.1, maxX - minX), height: Math.max(0.1, maxY - minY) };
  }, [points]);

  // All hooks must run unconditionally above this point (Rules of Hooks) — only after
  // every useState/useRef/useMemo call has executed is it safe to bail out early.
  if (!isOpen) return null;

  const canExtrude = points.length >= 3;
  const canRevolve = points.length >= 2;

  const baseMaterial = MATERIAL_PRESETS['matte_black_polycarbonate'] || Object.values(MATERIAL_PRESETS)[0];

  const handleCreateExtrude = () => {
    if (!canExtrude) return;
    // Center the profile on its own centroid so the resulting solid's `position` is the
    // part's true center, same convention every other primitive in this app follows.
    const cx = (bbox.minX + bbox.maxX) / 2;
    const cy = (bbox.minY + bbox.maxY) / 2;
    const centeredPoints: [number, number][] = points.map(([x, y]) => [x - cx, y - cy]);

    const newObj: CADObject = {
      id: `sketch_extrude_${Date.now()}`,
      name: `Sketch Extrude Solid ${new Date().toLocaleTimeString()}`,
      category: 'custom',
      section,
      primitive: 'custom_extrude',
      position: planeOrigin(plane, [cx, cy]),
      rotation: planeRotation(plane),
      scale: [1, 1, 1],
      dimensions: {
        width: bbox.width,
        height: bbox.height,
        depth: extrudeDepth,
      },
      sketchProfile: { points: centeredPoints, closed: true },
      material: { ...baseMaterial, id: `mat_sketch_${Date.now()}` },
      visible: true,
      locked: false,
    };

    onCreateObject(newObj);
    setJustCreated(`Created extrude solid (${points.length} points, ${extrudeDepth}${unit} deep).`);
    setTimeout(() => setJustCreated(null), 3000);
  };

  const handleCreateRevolve = () => {
    if (!canRevolve) return;
    // Revolve profiles are relative to the revolve (Y) axis, so they are NOT re-centered
    // on X the way extrude profiles are — X=0 is the axis of revolution. Only re-center
    // vertically for a sane pivot.
    const cy = (bbox.minY + bbox.maxY) / 2;
    const centeredPoints: [number, number][] = points.map(([x, y]) => [Math.max(0, x), y - cy]);
    const maxRadius = Math.max(...centeredPoints.map(p => p[0]), 0.1);

    const newObj: CADObject = {
      id: `sketch_revolve_${Date.now()}`,
      name: `Sketch Revolve Solid ${new Date().toLocaleTimeString()}`,
      category: 'custom',
      section,
      primitive: 'custom_revolve',
      position: planeOrigin(plane, [0, cy]),
      rotation: planeRotation(plane),
      scale: [1, 1, 1],
      dimensions: {
        width: maxRadius * 2,
        height: bbox.height,
        depth: maxRadius * 2,
        radius: maxRadius,
        segments: revolveSegments,
      },
      sketchProfile: { points: centeredPoints, closed: false, revolveAngleDeg: revolveAngle },
      material: { ...baseMaterial, id: `mat_sketch_${Date.now()}` },
      visible: true,
      locked: false,
    };

    onCreateObject(newObj);
    setJustCreated(`Created revolve solid (${revolveAngle}°, ${revolveSegments} segments).`);
    setTimeout(() => setJustCreated(null), 3000);
  };

  // Converts a 2D sketch-plane point + depth offset into a 3D world position. Kept simple
  // (sketch origin == world origin on the chosen plane) since parts get repositioned via
  // the Inspector after creation anyway, same as any freshly-added preset part.
  function planeOrigin(p: SketchPlane, centerXY: [number, number]): [number, number, number] {
    const [cx, cy] = centerXY;
    if (p === 'xy') return [cx, cy, 0];
    if (p === 'xz') return [cx, 0, cy];
    return [0, cx, cy];
  }

  function planeRotation(p: SketchPlane): [number, number, number] {
    if (p === 'xy') return [0, 0, 0];
    if (p === 'xz') return [Math.PI / 2, 0, 0];
    return [0, Math.PI / 2, 0];
  }

  const gridLines: number[] = [];
  for (let g = -CANVAS_SIZE / 2; g <= CANVAS_SIZE / 2; g += Math.max(4, gridSize * pxPerUnit)) {
    gridLines.push(g + CANVAS_SIZE / 2);
  }

  const pathD =
    points.length > 0
      ? `M ${points.map(([x, y]) => `${toPx(x)} ${toPx(-y)}`).join(' L ')}` + (points.length >= 3 ? ' Z' : '')
      : '';

  return (
    <div
      id="sketch_extrude_backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="sketch_extrude_modal"
        className="w-full max-w-5xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-900/30 text-violet-400 border border-violet-700/50">
              <PenSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Sketch & Solid Studio</h2>
              <p className="text-[11px] text-zinc-400">
                Draw a 2D profile, then Extrude or Revolve it into a real 3D solid
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Sketch Canvas */}
          <div className="p-5 border-r border-zinc-800 flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {(['xy', 'xz', 'yz'] as SketchPlane[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlane(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border transition-colors ${
                      plane === p
                        ? 'bg-violet-950/80 border-violet-500/60 text-violet-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {p} Plane
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSnapOverride(!snapOverride)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                  effectiveSnap
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                <Grid3x3 className="w-3 h-3" />
                <span>Snap: {effectiveSnap ? `${gridSize}${unit}` : 'Off'}</span>
              </button>
            </div>

            <svg
              ref={svgRef}
              id="sketch_canvas_svg"
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="bg-zinc-950 rounded-xl border border-zinc-800 cursor-crosshair"
              onClick={handleCanvasClick}
            >
              {gridLines.map((g, i) => (
                <React.Fragment key={i}>
                  <line x1={g} y1={0} x2={g} y2={CANVAS_SIZE} stroke="#27272a" strokeWidth={1} />
                  <line x1={0} y1={g} x2={CANVAS_SIZE} y2={g} stroke="#27272a" strokeWidth={1} />
                </React.Fragment>
              ))}
              {/* Axes */}
              <line x1={CANVAS_SIZE / 2} y1={0} x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke="#52525b" strokeWidth={1.5} />
              <line x1={0} y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke="#52525b" strokeWidth={1.5} />

              {pathD && (
                <path
                  d={pathD}
                  fill={points.length >= 3 ? 'rgba(167,139,250,0.25)' : 'none'}
                  stroke="#a78bfa"
                  strokeWidth={2}
                />
              )}

              {points.map(([x, y], i) => (
                <circle key={i} cx={toPx(x)} cy={toPx(-y)} r={4} fill={i === 0 ? '#34d399' : '#a78bfa'} />
              ))}
            </svg>

            <div className="w-full flex items-center gap-2 text-xs">
              <button
                onClick={handleUndoPoint}
                disabled={points.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-zinc-700 text-zinc-200"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Point
              </button>
              <button
                onClick={handleClear}
                disabled={points.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-zinc-700 text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
              <span className="ml-auto text-zinc-500">{points.length} point{points.length === 1 ? '' : 's'}</span>
            </div>

            {/* Precise coordinate entry — AutoCAD-style typed point input */}
            <div className="w-full flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 shrink-0">Add Point:</span>
              <input
                type="number"
                value={manualX}
                onChange={e => setManualX(e.target.value)}
                placeholder="X"
                className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono"
              />
              <input
                type="number"
                value={manualY}
                onChange={e => setManualY(e.target.value)}
                placeholder="Y"
                className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono"
              />
              <button
                onClick={handleAddManualPoint}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>

          {/* Solid Creation Panel */}
          <div className="p-5 space-y-5">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
              <span>
                Click in the sketch area to place points (snaps to the active grid). A profile needs 3+ points
                to Extrude, or 2+ points to Revolve around the vertical axis.
              </span>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-violet-400" />
                Extrude
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 shrink-0">Depth ({unit})</span>
                <input
                  type="number"
                  min={0.1}
                  value={extrudeDepth}
                  onChange={e => setExtrudeDepth(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono text-right"
                />
              </div>
              <button
                id="btn_create_extrude_solid"
                onClick={handleCreateExtrude}
                disabled={!canExtrude}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
              >
                <Box className="w-3.5 h-3.5" />
                Create Extrude Solid
              </button>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-violet-400" />
                Revolve
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 shrink-0 w-20">Angle (°)</span>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={revolveAngle}
                  onChange={e => setRevolveAngle(Math.min(360, Math.max(1, parseFloat(e.target.value) || 360)))}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono text-right"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 shrink-0 w-20">Segments</span>
                <input
                  type="number"
                  min={3}
                  max={128}
                  value={revolveSegments}
                  onChange={e => setRevolveSegments(Math.min(128, Math.max(3, parseInt(e.target.value) || 32)))}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono text-right"
                />
              </div>
              <button
                id="btn_create_revolve_solid"
                onClick={handleCreateRevolve}
                disabled={!canRevolve}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
              >
                <CircleDot className="w-3.5 h-3.5" />
                Create Revolve Solid
              </button>
            </div>

            {justCreated && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{justCreated}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
