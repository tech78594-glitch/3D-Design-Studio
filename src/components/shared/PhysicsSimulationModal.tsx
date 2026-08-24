import React, { useState, useEffect } from 'react';
import { CADObject } from '../../types/cad';
import { CADPhysicsEngine, PhysicsBody } from '../../utils/physicsEngine';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Box,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface PhysicsSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  onUpdateObjectPositions?: (updatedMap: Map<string, { position: [number, number, number]; rotation: [number, number, number] }>) => void;
}

export const PhysicsSimulationModal: React.FC<PhysicsSimulationModalProps> = ({
  isOpen,
  onClose,
  objects,
  onUpdateObjectPositions,
}) => {
  const [gravity, setGravity] = useState(9.81);
  const [dropHeight, setDropHeight] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [engine] = useState(() => new CADPhysicsEngine({ gravity }));
  const [bodies, setBodies] = useState<Map<string, PhysicsBody>>(new Map());

  useEffect(() => {
    if (isOpen) {
      engine.initFromCADObjects(objects, dropHeight);
      setBodies(new Map(engine.getBodies()));
    }
  }, [isOpen, objects, dropHeight]);

  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const step = () => {
        const updatedBodies = engine.stepSimulation(0.016);
        setBodies(new Map(updatedBodies));

        if (onUpdateObjectPositions) {
          const transformMap = new Map<string, { position: [number, number, number]; rotation: [number, number, number] }>();
          updatedBodies.forEach((b, id) => {
            transformMap.set(id, {
              position: [b.position.x, b.position.y, b.position.z],
              rotation: [b.rotation.x, b.rotation.y, b.rotation.z],
            });
          });
          onUpdateObjectPositions(transformMap);
        }

        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, engine, onUpdateObjectPositions]);

  if (!isOpen) return null;

  const handleReset = () => {
    setIsPlaying(false);
    engine.initFromCADObjects(objects, dropHeight);
    setBodies(new Map(engine.getBodies()));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-emerald-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                3D Rigid Body Physics Simulation Studio
                <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full font-mono">
                  Gravity & Collisions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulate drop tests, mass momentum, ground impact restitution, and structural drop resilience.
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

        {/* Content Controls & Live Telemetry */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Main Simulation Control Buttons */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Simulation' : 'Start Drop Test'}</span>
              </button>

              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Objects</span>
              </button>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isPlaying ? 'Simulating Real-Time Gravity' : 'Ready'}
              </div>
            </div>
          </div>

          {/* Environmental Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Gravity Acceleration (g)</span>
                <span className="text-emerald-400 font-mono">{gravity.toFixed(2)} m/s²</span>
              </span>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={gravity}
                onChange={e => setGravity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (Zero-G)</span>
                <span>9.81 (Earth)</span>
                <span>24.7 (Jupiter)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Initial Drop Altitude</span>
                <span className="text-emerald-400 font-mono">{dropHeight} mm</span>
              </span>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={dropHeight}
                onChange={e => setDropHeight(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10mm</span>
                <span>150mm</span>
                <span>300mm</span>
              </div>
            </div>
          </div>

          {/* Telemetry Body State Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-400" />
              Rigid Body Dynamics Telemetry
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Array.from(bodies.values()).map(b => (
                <div key={b.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{b.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Mass: {(b.massKg * 1000).toFixed(1)}g | Restitution: {(b.restitution * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px]">
                    <div className="text-emerald-400">
                      Y-Vel: {b.velocity.y.toFixed(0)} mm/s
                    </div>
                    <div className="text-slate-400">
                      Pos: [{b.position.x.toFixed(0)}, {b.position.y.toFixed(0)}, {b.position.z.toFixed(0)}]
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
          <span>60 FPS Euler Physics Integrator</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
