import React from 'react';
import { CADObject, DesignSection, CADMaterial } from '../../types/cad';
import { MATERIAL_PRESETS } from '../../utils/materials';
import {
  Sliders,
  Move,
  RotateCw,
  Maximize2,
  Paintbrush,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Zap,
  Info,
  Sparkles,
  Layers,
  Compass,
  Move3d,
} from 'lucide-react';

interface InspectorPanelProps {
  selectedObject: CADObject | null;
  onUpdateObject: (updated: CADObject) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (obj: CADObject) => void;
  section: DesignSection;
  onOpenMaterialLibrary?: () => void;
  onOpenAutoOrientation?: () => void;
  onOpenARPreview?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  section,
  onOpenMaterialLibrary,
  onOpenAutoOrientation,
  onOpenARPreview,
}) => {
  if (!selectedObject) {
    return (
      <div id="inspector_empty_panel" className="h-full bg-zinc-900 text-zinc-400 p-5 flex flex-col justify-between border-l border-zinc-800">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs uppercase tracking-wider pb-2 border-b border-zinc-800">
            <Info className="w-4 h-4 text-blue-400" />
            Properties Inspector
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2 text-xs shadow-sm">
            <span className="font-medium text-zinc-200 block">No Component Selected</span>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Click on any 3D mesh in the viewport or select a part from the hierarchy to inspect and modify dimensions, position, materials, and physics.
            </p>
          </div>

          {/* Quick 3D Viewport Navigation Guide */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-2.5 text-xs">
            <span className="font-medium text-zinc-300 block text-[11px] uppercase tracking-wider">
              Navigation Controls
            </span>
            <div className="space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Orbit Rotate:</span>
                <strong className="text-zinc-200 font-mono">Left Click + Drag</strong>
              </div>
              <div className="flex justify-between">
                <span>Pan Camera:</span>
                <strong className="text-zinc-200 font-mono">Right Click + Drag</strong>
              </div>
              <div className="flex justify-between">
                <span>Zoom In/Out:</span>
                <strong className="text-zinc-200 font-mono">Scroll Wheel</strong>
              </div>
              <div className="flex justify-between">
                <span>Select Object:</span>
                <strong className="text-zinc-200 font-mono">Left Click Mesh</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Real-time parametric CAD updates 60fps</span>
        </div>
      </div>
    );
  }

  const handlePositionChange = (axisIndex: 0 | 1 | 2, val: number) => {
    const newPos: [number, number, number] = [
      selectedObject.position[0],
      selectedObject.position[1],
      selectedObject.position[2],
    ];
    newPos[axisIndex] = val;
    onUpdateObject({ ...selectedObject, position: newPos });
  };

  const handleRotationChange = (axisIndex: 0 | 1 | 2, degVal: number) => {
    const newRot: [number, number, number] = [
      selectedObject.rotation[0],
      selectedObject.rotation[1],
      selectedObject.rotation[2],
    ];
    newRot[axisIndex] = (degVal * Math.PI) / 180;
    onUpdateObject({ ...selectedObject, rotation: newRot });
  };

  const handleDimensionChange = (dimKey: 'width' | 'height' | 'depth' | 'radius', val: number) => {
    onUpdateObject({
      ...selectedObject,
      dimensions: {
        ...selectedObject.dimensions,
        [dimKey]: Math.max(0.1, val),
      },
    });
  };

  const handleMaterialPropChange = (propKey: keyof CADMaterial, val: any) => {
    onUpdateObject({
      ...selectedObject,
      material: {
        ...selectedObject.material,
        [propKey]: val,
      },
    });
  };

  return (
    <div id="inspector_panel" className="h-full bg-zinc-900 text-zinc-200 p-4 space-y-4 overflow-y-auto border-l border-zinc-800">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-blue-400 border border-zinc-700/60 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="truncate">
            <input
              type="text"
              value={selectedObject.name}
              onChange={e => onUpdateObject({ ...selectedObject, name: e.target.value })}
              className="bg-transparent text-xs font-semibold text-zinc-100 focus:outline-none focus:bg-zinc-800 px-1 py-0.5 rounded border border-transparent focus:border-zinc-700 truncate w-full"
            />
            <div className="text-[10px] text-zinc-500 font-mono uppercase px-1">
              {selectedObject.primitive} • {selectedObject.category}
            </div>
          </div>
        </div>

        {/* Action icons: Vis, Lock, Copy, Delete */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenARPreview && (
            <button
              onClick={onOpenARPreview}
              className="p-1 text-zinc-400 hover:text-sky-400 rounded hover:bg-zinc-800 transition-colors"
              title="Preview in AR Spatial Mode"
            >
              <Move3d className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenAutoOrientation && (
            <button
              onClick={onOpenAutoOrientation}
              className="p-1 text-zinc-400 hover:text-sky-400 rounded hover:bg-zinc-800 transition-colors"
              title="Auto-Orient Part for 3D Printing"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onUpdateObject({ ...selectedObject, visible: !selectedObject.visible })}
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
            title={selectedObject.visible ? 'Hide Object' : 'Show Object'}
          >
            {selectedObject.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
          </button>
          <button
            onClick={() => onDuplicateObject(selectedObject)}
            className="p-1 text-zinc-400 hover:text-blue-400 rounded hover:bg-zinc-800 transition-colors"
            title="Duplicate Part"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteObject(selectedObject.id)}
            className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
            title="Delete Part"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Transform Position */}
      <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl space-y-2 shadow-sm">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-blue-400" />
          Position ({section === 'technology' ? 'mm' : 'm'})
        </span>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis} className="bg-zinc-900 rounded-lg p-1.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">{axis}</span>
              <input
                type="number"
                step={section === 'technology' ? '1' : '0.1'}
                value={selectedObject.position[i]}
                onChange={e => handlePositionChange(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-zinc-200 font-medium focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Transform Rotation (Degrees) */}
      <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl space-y-2 shadow-sm">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5 text-blue-400" />
          Rotation (Degrees)
        </span>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis} className="bg-zinc-900 rounded-lg p-1.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">{axis}°</span>
              <input
                type="number"
                step="5"
                value={Math.round((selectedObject.rotation[i] * 180) / Math.PI)}
                onChange={e => handleRotationChange(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-zinc-200 font-medium focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Parametric Dimensions */}
      <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl space-y-2 shadow-sm">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          Dimensions ({section === 'technology' ? 'mm' : 'm'})
        </span>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-zinc-900 rounded-lg p-1.5 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Width</span>
            <input
              type="number"
              step={section === 'technology' ? '1' : '0.1'}
              value={selectedObject.dimensions.width}
              onChange={e => handleDimensionChange('width', parseFloat(e.target.value) || 1)}
              className="w-full bg-transparent text-zinc-200 font-medium focus:outline-none"
            />
          </div>
          <div className="bg-zinc-900 rounded-lg p-1.5 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Height</span>
            <input
              type="number"
              step={section === 'technology' ? '1' : '0.1'}
              value={selectedObject.dimensions.height}
              onChange={e => handleDimensionChange('height', parseFloat(e.target.value) || 1)}
              className="w-full bg-transparent text-zinc-200 font-medium focus:outline-none"
            />
          </div>
          <div className="bg-zinc-900 rounded-lg p-1.5 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Depth</span>
            <input
              type="number"
              step={section === 'technology' ? '1' : '0.1'}
              value={selectedObject.dimensions.depth}
              onChange={e => handleDimensionChange('depth', parseFloat(e.target.value) || 1)}
              className="w-full bg-transparent text-zinc-200 font-medium focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. PBR Material Properties */}
      <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
            PBR Material Shader
          </span>
          {onOpenMaterialLibrary && (
            <button
              onClick={onOpenMaterialLibrary}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 transition-colors"
            >
              Browse Library →
            </button>
          )}
        </div>

        {/* Color Picker */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Surface Base Color</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-zinc-300 uppercase">
              {selectedObject.material.color}
            </span>
            <input
              type="color"
              value={selectedObject.material.color}
              onChange={e => handleMaterialPropChange('color', e.target.value)}
              className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Roughness */}
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Roughness (Matte vs Gloss)</span>
            <span className="font-mono text-zinc-300">{selectedObject.material.roughness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={selectedObject.material.roughness}
            onChange={e => handleMaterialPropChange('roughness', parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
        </div>

        {/* Metalness */}
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Metalness (Dielectric vs Metal)</span>
            <span className="font-mono text-zinc-300">{selectedObject.material.metalness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={selectedObject.material.metalness}
            onChange={e => handleMaterialPropChange('metalness', parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
        </div>

        {/* Wireframe toggle */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-zinc-400">CAD Wireframe Mesh</span>
          <input
            type="checkbox"
            checked={!!selectedObject.material.wireframe}
            onChange={e => handleMaterialPropChange('wireframe', e.target.checked)}
            className="accent-blue-500 w-4 h-4 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* 5. Electronics & Thermal Props (If Technology Section) */}
      {section === 'technology' && selectedObject.electricalProps && (
        <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl space-y-2 shadow-sm">
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Electrical & Thermal Specs
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">Thermal Wattage</span>
              <span className="text-amber-400 font-semibold">
                {selectedObject.electricalProps.heatWattage || 0} W
              </span>
            </div>
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">Operating Temp</span>
              <span className="text-orange-400 font-semibold">
                {selectedObject.electricalProps.temperatureC || 25} °C
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
