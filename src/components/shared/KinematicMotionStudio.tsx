import React, { useState, useEffect, useRef } from 'react';
import { CADObject, KinematicJoint, KinematicSimulationState, KinematicJointType } from '../../types/cad';
import {
  SAMPLE_KINEMATIC_JOINTS,
  calculateJointValueAtTime,
  DEFAULT_KINEMATIC_STATE,
} from '../../utils/kinematics';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  Activity,
  Layers,
  Repeat,
  Compass,
  Check,
  X,
  Eye,
} from 'lucide-react';

interface KinematicMotionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  joints: KinematicJoint[];
  onUpdateJoints: (joints: KinematicJoint[]) => void;
  simulationState: KinematicSimulationState;
  onUpdateSimulationState: (state: Partial<KinematicSimulationState>) => void;
  onSelectObject?: (id: string | null) => void;
}

export const KinematicMotionStudio: React.FC<KinematicMotionStudioProps> = ({
  isOpen,
  onClose,
  objects,
  joints,
  onUpdateJoints,
  simulationState,
  onUpdateSimulationState,
  onSelectObject,
}) => {
  const [selectedJointId, setSelectedJointId] = useState<string>(joints[0]?.id || '');
  const [isAddingJoint, setIsAddingJoint] = useState(false);

  // New Joint Form State
  const [newJointName, setNewJointName] = useState('New Kinematic Joint');
  const [newJointType, setNewJointType] = useState<KinematicJointType>('revolute');
  const [newParentId, setNewParentId] = useState(objects[0]?.id || '');
  const [newChildId, setNewChildId] = useState(objects[1]?.id || '');
  const [newAxis, setNewAxis] = useState<'x' | 'y' | 'z'>('z');
  const [newMinLimit, setNewMinLimit] = useState(0);
  const [newMaxLimit, setNewMaxLimit] = useState(90);
  const [newSpeed, setNewSpeed] = useState(45);

  const selectedJoint = joints.find(j => j.id === selectedJointId) || joints[0];

  const handleCreateJoint = (e: React.FormEvent) => {
    e.preventDefault();
    const axisVec: [number, number, number] =
      newAxis === 'x' ? [1, 0, 0] : newAxis === 'y' ? [0, 1, 0] : [0, 0, 1];

    const newJoint: KinematicJoint = {
      id: `joint_${Date.now()}`,
      name: newJointName,
      type: newJointType,
      parentPartId: newParentId,
      childPartId: newChildId,
      anchorPoint: [0, 0, 0],
      axisVector: axisVec,
      currentValue: newMinLimit,
      minLimit: newMinLimit,
      maxLimit: newMaxLimit,
      speed: newSpeed,
      direction: 1,
      cycleType: 'oscillate',
      active: true,
      trajectoryColor: '#38bdf8',
      mechanicalRatio: 1.0,
    };

    onUpdateJoints([...joints, newJoint]);
    setSelectedJointId(newJoint.id);
    setIsAddingJoint(false);
  };

  const handleDeleteJoint = (id: string) => {
    const remaining = joints.filter(j => j.id !== id);
    onUpdateJoints(remaining);
    if (selectedJointId === id) {
      setSelectedJointId(remaining[0]?.id || '');
    }
  };

  const handleToggleJoint = (id: string) => {
    onUpdateJoints(
      joints.map(j => (j.id === id ? { ...j, active: !j.active } : j))
    );
  };

  const handleUpdateJointProp = (id: string, updates: Partial<KinematicJoint>) => {
    onUpdateJoints(
      joints.map(j => (j.id === id ? { ...j, ...updates } : j))
    );
  };

  const handleLoadSampleMechanism = (preset: 'camera' | 'hinge' | 'motor') => {
    if (preset === 'camera') {
      onUpdateJoints(SAMPLE_KINEMATIC_JOINTS);
    } else if (preset === 'hinge') {
      const hingeJoint: KinematicJoint = {
        id: 'joint_hinge_demo',
        name: 'Folding Dual-Axis Hinge',
        type: 'revolute',
        parentPartId: objects[0]?.id || '',
        childPartId: objects[1]?.id || '',
        anchorPoint: [0, 0, 0],
        axisVector: [1, 0, 0],
        currentValue: 0,
        minLimit: 0,
        maxLimit: 135,
        speed: 45,
        direction: 1,
        cycleType: 'oscillate',
        active: true,
        trajectoryColor: '#a855f7',
      };
      onUpdateJoints([hingeJoint]);
    } else {
      const motorJoint: KinematicJoint = {
        id: 'joint_motor_demo',
        name: 'High-RPM Rotor & Drive Spindle',
        type: 'revolute',
        parentPartId: objects[0]?.id || '',
        childPartId: objects[2]?.id || objects[1]?.id || '',
        anchorPoint: [0, 0, 0],
        axisVector: [0, 1, 0],
        currentValue: 0,
        minLimit: 0,
        maxLimit: 360,
        speed: 720,
        direction: 1,
        cycleType: 'continuous',
        active: true,
        trajectoryColor: '#34d399',
      };
      onUpdateJoints([motorJoint]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[88vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Kinematic Motion & Physics Simulator
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono">
                  60 FPS Forward Kinematics
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Multi-degree-of-freedom revolute, prismatic, and mechanical linkage motion analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Kinematic Transport & Timeline Control Bar */}
        <div className="px-6 py-3.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between gap-4">
          {/* Play/Pause & Scrub Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateSimulationState({ isPlaying: !simulationState.isPlaying })
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                simulationState.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
              }`}
            >
              {simulationState.isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Motion</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Simulate Kinematics</span>
                </>
              )}
            </button>

            <button
              onClick={() => onUpdateSimulationState({ timeSeconds: 0 })}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
              title="Reset Timeline to 0s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 p-1 text-xs">
              {[0.5, 1.0, 2.0].map(multiplier => (
                <button
                  key={multiplier}
                  onClick={() => onUpdateSimulationState({ speedMultiplier: multiplier })}
                  className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-all ${
                    simulationState.speedMultiplier === multiplier
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {multiplier}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 flex items-center gap-3 max-w-md">
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">
              Time: {simulationState.timeSeconds.toFixed(2)}s
            </span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.05"
              value={simulationState.timeSeconds % 10}
              onChange={e =>
                onUpdateSimulationState({ timeSeconds: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Toggles: Trajectories & Presets */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateSimulationState({
                  showTrajectories: !simulationState.showTrajectories,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                simulationState.showTrajectories
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title="Show 3D Motion Trajectory Vector Trails"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Motion Trails</span>
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Joint Mechanism Manager */}
          <div className="w-1/2 border-r border-zinc-800/80 flex flex-col bg-zinc-950/20">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">Active Joint Mechanisms</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  {joints.length}
                </span>
              </div>
              <button
                onClick={() => setIsAddingJoint(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Kinematic Joint</span>
              </button>
            </div>

            {/* Mechanism Presets Banner */}
            <div className="p-3 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] text-zinc-500 font-medium shrink-0">Presets:</span>
              <button
                onClick={() => handleLoadSampleMechanism('camera')}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs transition-colors shrink-0"
              >
                Periscope Zoom
              </button>
              <button
                onClick={() => handleLoadSampleMechanism('hinge')}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs transition-colors shrink-0"
              >
                Folding Hinge
              </button>
              <button
                onClick={() => handleLoadSampleMechanism('motor')}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs transition-colors shrink-0"
              >
                Rotor Turbine
              </button>
            </div>

            {/* Joints List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {joints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-zinc-500">
                  <Activity className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-300">No Active Kinematic Joints</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Click &quot;Add Kinematic Joint&quot; or choose a preset above to animate mechanical degrees of freedom.
                  </p>
                </div>
              ) : (
                joints.map(joint => {
                  const isSelected = selectedJoint?.id === joint.id;
                  const parentObj = objects.find(o => o.id === joint.parentPartId);
                  const childObj = objects.find(o => o.id === joint.childPartId);
                  const currentVal = calculateJointValueAtTime(joint, simulationState.timeSeconds);

                  return (
                    <div
                      key={joint.id}
                      onClick={() => setSelectedJointId(joint.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800/90 border-purple-500 shadow-md shadow-purple-950/40'
                          : 'bg-zinc-900/60 hover:bg-zinc-800/50 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleJoint(joint.id);
                            }}
                            className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                              joint.active
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {joint.active && <Check className="w-3 h-3" />}
                          </button>
                          <span className="text-xs font-bold text-zinc-200">{joint.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-purple-300 border border-zinc-700 uppercase">
                          {joint.type}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                        <span>{parentObj?.name || 'Chassis'}</span>
                        <span className="text-purple-400">➔</span>
                        <span className="font-semibold text-zinc-300">{childObj?.name || 'Target'}</span>
                      </div>

                      {/* Live Pose Metric Bar */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500 font-mono">
                          Live: {currentVal.toFixed(1)} {joint.type === 'prismatic' ? 'mm' : '°'}
                        </span>
                        <span className="text-zinc-500">
                          Limits: [{joint.minLimit} - {joint.maxLimit}]
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Joint Inspector & Dynamic Slider */}
          <div className="w-1/2 p-6 flex flex-col justify-between bg-zinc-900/30 overflow-y-auto">
            {selectedJoint ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                      Kinematic Joint Configuration
                    </span>
                    <h3 className="text-base font-bold text-zinc-100 mt-1">{selectedJoint.name}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteJoint(selectedJoint.id)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/60 transition-colors"
                    title="Delete Joint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Manual Slider for Instant Joint Posing */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      Manual Joint Pose Slider
                    </span>
                    <span className="font-mono text-purple-400 font-bold">
                      {selectedJoint.currentValue.toFixed(1)}{' '}
                      {selectedJoint.type === 'prismatic' ? 'mm' : 'deg'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedJoint.minLimit}
                    max={selectedJoint.maxLimit}
                    step={selectedJoint.type === 'prismatic' ? 0.1 : 1}
                    value={selectedJoint.currentValue}
                    onChange={e =>
                      handleUpdateJointProp(selectedJoint.id, {
                        currentValue: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Motion Cycle Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Kinematic Cycle Behavior</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                    {(['oscillate', 'continuous', 'pingpong'] as const).map(cycle => (
                      <button
                        key={cycle}
                        onClick={() => handleUpdateJointProp(selectedJoint.id, { cycleType: cycle })}
                        className={`py-1.5 px-2 rounded-lg font-medium capitalize transition-all ${
                          selectedJoint.cycleType === cycle
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {cycle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed & Travel Limits */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 block">Min Travel Limit</span>
                    <input
                      type="number"
                      value={selectedJoint.minLimit}
                      onChange={e =>
                        handleUpdateJointProp(selectedJoint.id, {
                          minLimit: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 block">Max Travel Limit</span>
                    <input
                      type="number"
                      value={selectedJoint.maxLimit}
                      onChange={e =>
                        handleUpdateJointProp(selectedJoint.id, {
                          maxLimit: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 block">Velocity Speed</span>
                    <input
                      type="number"
                      value={selectedJoint.speed}
                      onChange={e =>
                        handleUpdateJointProp(selectedJoint.id, {
                          speed: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                </div>

                {/* Trajectory Trail Color */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-xs text-zinc-300 font-medium">Trajectory Trail Vector Color</span>
                  <div className="flex items-center gap-1.5">
                    {['#38bdf8', '#a855f7', '#34d399', '#f59e0b', '#ec4899'].map(color => (
                      <button
                        key={color}
                        onClick={() =>
                          handleUpdateJointProp(selectedJoint.id, { trajectoryColor: color })
                        }
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedJoint.trajectoryColor === color
                            ? 'border-white scale-110 shadow-sm'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center">
                <Compass className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs">Select a kinematic joint to inspect DOF properties</p>
              </div>
            )}

            {/* Bottom Close Action */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Mechanical Solver: Rigid Body Forward Kinematics</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>

        {/* Add Joint Modal Overlay */}
        {isAddingJoint && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <form
              onSubmit={handleCreateJoint}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-100">Create Kinematic Joint</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingJoint(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Joint Name</label>
                  <input
                    type="text"
                    value={newJointName}
                    onChange={e => setNewJointName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Joint Mechanism Type</label>
                  <select
                    value={newJointType}
                    onChange={e => setNewJointType(e.target.value as KinematicJointType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="revolute">Revolute (Hinge / Angular Rotation)</option>
                    <option value="prismatic">Prismatic (Linear Slider / Stroke)</option>
                    <option value="cylindrical">Cylindrical (Screw / Combined)</option>
                    <option value="four_bar">Four-Bar Planar Linkage</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Parent (Fixed) Part</label>
                    <select
                      value={newParentId}
                      onChange={e => setNewParentId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 focus:outline-none"
                    >
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.id}>
                          {obj.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Child (Moving) Part</label>
                    <select
                      value={newChildId}
                      onChange={e => setNewChildId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 focus:outline-none"
                    >
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.id}>
                          {obj.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Motion Axis Vector</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map(ax => (
                      <button
                        type="button"
                        key={ax}
                        onClick={() => setNewAxis(ax)}
                        className={`py-1.5 rounded-xl uppercase font-bold font-mono transition-all ${
                          newAxis === ax
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {ax}-Axis
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Min Limit</label>
                    <input
                      type="number"
                      value={newMinLimit}
                      onChange={e => setNewMinLimit(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Max Limit</label>
                    <input
                      type="number"
                      value={newMaxLimit}
                      onChange={e => setNewMaxLimit(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Speed</label>
                    <input
                      type="number"
                      value={newSpeed}
                      onChange={e => setNewSpeed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddingJoint(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  Create Joint
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
