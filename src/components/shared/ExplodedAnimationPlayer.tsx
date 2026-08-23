/**
 * Exploded View & Stark Holographic Animation Player Dock
 * Provides interactive timeline playback, scrub slider, speed selectors,
 * loop/ping-pong options, turntable auto-orbit, and trajectory presets.
 */

import React, { useState, useEffect, useRef } from 'react';
import { DeviceConfig, CADObject } from '../../types/cad';
import { holoAudio } from '../../utils/hologramAudio';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Zap,
  FastForward,
  Compass,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  ChevronUp,
  ChevronDown,
  X,
  Gauge,
} from 'lucide-react';
import { QuickTooltip } from './QuickTooltip';

interface ExplodedAnimationPlayerProps {
  deviceConfig: DeviceConfig;
  onChangeDeviceConfig: (updated: Partial<DeviceConfig>) => void;
  objects: CADObject[];
  onToggleAutoOrbit?: () => void;
  isAutoOrbiting?: boolean;
}

export const ExplodedAnimationPlayer: React.FC<ExplodedAnimationPlayerProps> = ({
  deviceConfig,
  onChangeDeviceConfig,
  objects,
  onToggleAutoOrbit,
  isAutoOrbiting = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playbackMode, setPlaybackMode] = useState<'pingpong' | 'loop' | 'once'>('pingpong');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const separation = deviceConfig.starkSeparationAmount ?? deviceConfig.explodedAmount ?? 0;
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Handle Play/Pause Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    if (!isMuted) {
      holoAudio.playBoot();
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const rate = 0.45 * playbackSpeed * direction;
      let nextAmount = (deviceConfig.starkSeparationAmount ?? 0) + rate * deltaSec;

      if (nextAmount >= 1.0) {
        if (playbackMode === 'pingpong') {
          nextAmount = 1.0;
          setDirection(-1);
          if (!isMuted) holoAudio.playPulse();
        } else if (playbackMode === 'loop') {
          nextAmount = 0.0;
          if (!isMuted) holoAudio.playPulse();
        } else {
          nextAmount = 1.0;
          setIsPlaying(false);
        }
      } else if (nextAmount <= 0.0) {
        if (playbackMode === 'pingpong') {
          nextAmount = 0.0;
          setDirection(1);
          if (!isMuted) holoAudio.playAssemble();
        } else if (playbackMode === 'loop') {
          nextAmount = 0.0;
        } else {
          nextAmount = 0.0;
          setIsPlaying(false);
        }
      }

      onChangeDeviceConfig({
        starkModeEnabled: true,
        starkSeparationAmount: nextAmount,
        explodedAmount: nextAmount,
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, playbackMode, direction, isMuted, deviceConfig.starkSeparationAmount, onChangeDeviceConfig]);

  // Quick preset separation selection
  const handlePresetSelect = (preset: 'radial_all' | 'optics_stack' | 'power_core' | 'logic_board' | 'chassis_orbit') => {
    if (!isMuted) holoAudio.playSelect();
    onChangeDeviceConfig({
      starkSeparationPreset: preset,
      starkModeEnabled: true,
    });
  };

  const percent = Math.round(separation * 100);

  return (
    <div
      id="exploded_animation_player"
      className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl bg-zinc-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl text-zinc-100 p-3 transition-all animate-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header bar of the player dock */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            Exploded Assembly Animation Player
          </span>
          <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800">
            {percent}% SEPARATED
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mute/Unmute Audio */}
          <QuickTooltip content={isMuted ? 'Unmute Audio' : 'Mute Audio'}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </QuickTooltip>

          {/* Turntable Auto-Orbit */}
          {onToggleAutoOrbit && (
            <QuickTooltip content="360° Turntable Auto Orbit">
              <button
                onClick={onToggleAutoOrbit}
                className={`p-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  isAutoOrbiting
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${isAutoOrbiting ? 'animate-spin' : ''}`} />
              </button>
            </QuickTooltip>
          )}

          {/* Minimize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 ml-1"
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="space-y-2.5">
          {/* Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-400 shrink-0">0% (Assembled)</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={separation}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  onChangeDeviceConfig({
                    starkModeEnabled: val > 0,
                    starkSeparationAmount: val,
                    explodedAmount: val,
                  });
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
            <span className="text-[10px] font-mono text-cyan-300 shrink-0">100% (Exploded)</span>
          </div>

          {/* Playback Controls & Speed Selectors */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Play/Pause & Reset */}
            <div className="flex items-center gap-1.5">
              <QuickTooltip content={isPlaying ? 'Pause Animation' : 'Play Exploded Animation'} shortcut="Space">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 rounded-xl flex items-center gap-1.5 font-semibold text-xs transition-all ${
                    isPlaying
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </QuickTooltip>

              <QuickTooltip content="Reset to Fully Assembled">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    onChangeDeviceConfig({
                      starkModeEnabled: false,
                      starkSeparationAmount: 0,
                      explodedAmount: 0,
                    });
                  }}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </QuickTooltip>
            </div>

            {/* Trajectory Preset Pills */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800">
              {[
                { id: 'radial_all', label: 'Radial' },
                { id: 'optics_stack', label: 'Axial Z' },
                { id: 'power_core', label: 'Core' },
                { id: 'chassis_orbit', label: 'Orbit' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id as any)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    deviceConfig.starkSeparationPreset === p.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Speed & Repeat Mode */}
            <div className="flex items-center gap-1.5">
              {/* Playback Mode (Ping-pong / Loop / Once) */}
              <QuickTooltip content={`Playback Mode: ${playbackMode}`}>
                <button
                  onClick={() => {
                    const next = playbackMode === 'pingpong' ? 'loop' : playbackMode === 'loop' ? 'once' : 'pingpong';
                    setPlaybackMode(next);
                  }}
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 ${
                    playbackMode !== 'once'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase">{playbackMode}</span>
                </button>
              </QuickTooltip>

              {/* Speed Buttons */}
              <div className="flex items-center bg-zinc-950/80 rounded-lg p-0.5 border border-zinc-800 text-[10px] font-mono">
                {[0.5, 1.0, 2.0].map(s => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      playbackSpeed === s
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
