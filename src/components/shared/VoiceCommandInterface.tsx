import React, { useState, useEffect } from 'react';
import { VoiceCommandEngine, VoiceStatus, VoiceCommandMatch } from '../../utils/voiceCommand';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceCommandInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (match: VoiceCommandMatch) => void;
}

export const VoiceCommandInterface: React.FC<VoiceCommandInterfaceProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [engine] = useState(() => new VoiceCommandEngine());
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastMatch, setLastMatch] = useState<VoiceCommandMatch | null>(null);

  useEffect(() => {
    engine.setCallbacks(
      (newStatus, text) => {
        setStatus(newStatus);
        if (text !== undefined) setTranscript(text);
      },
      match => {
        setLastMatch(match);
        onExecuteCommand(match);
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.1 } });
      }
    );
  }, [engine, onExecuteCommand]);

  if (!isOpen) return null;

  const handleStartMic = () => {
    engine.startListening();
  };

  const handleStopMic = () => {
    engine.stopListening();
  };

  const handleManualCommand = (commandText: string) => {
    const match = engine.parseTranscript(commandText);
    if (match) {
      setLastMatch(match);
      onExecuteCommand(match);
      engine.speakFeedback(match.feedbackText);
      confetti({ particleCount: 25, spread: 40, origin: { y: 0.1 } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-rose-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Voice Command Interface
                <span className="px-2 py-0.5 text-xs bg-rose-500/20 text-rose-300 rounded-full font-mono">
                  Web Speech API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Speak commands to control explode mode, view styles, 3MF export, mass, and physics.
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

        {/* Content & Microphone Visualizer */}
        <div className="p-6 space-y-6 text-center">
          {/* Animated Microphone Button */}
          <div className="flex justify-center items-center py-4">
            <button
              onClick={status === 'listening' ? handleStopMic : handleStartMic}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition shadow-2xl ${
                status === 'listening'
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 ring-8 ring-rose-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700'
              }`}
            >
              {status === 'listening' ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10" />}
            </button>
          </div>

          {/* Sound Wave Waveform Indicators */}
          <div className="flex justify-center items-center space-x-1.5 h-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  status === 'listening'
                    ? 'bg-rose-400 animate-bounce'
                    : 'bg-slate-800 h-2'
                }`}
                style={{
                  height: status === 'listening' ? `${Math.sin(i + Date.now()) * 12 + 16}px` : '6px',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Transcript Display */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 min-h-[60px] flex items-center justify-center">
            {transcript ? (
              <span className="text-sm font-medium text-slate-200 font-mono">
                "{transcript}"
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">
                {status === 'listening'
                  ? 'Listening for voice commands...'
                  : 'Click the microphone button and speak a CAD command'}
              </span>
            )}
          </div>

          {/* Last Executed Command Feedback */}
          {lastMatch && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-left text-xs space-y-1">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-400" />
                Executed: {lastMatch.action.toUpperCase()}
              </div>
              <div className="text-slate-400">{lastMatch.feedbackText}</div>
            </div>
          )}

          {/* Quick Voice Command Preset Buttons */}
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Supported Voice Phrases (Click or Speak)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Explode Model',
                'Blueprint Mode',
                'Export 3MF',
                'Calculate Mass',
                'Select Edges',
                '3D Physics Simulation',
                'Open Project Chat',
                'Automatic Texture',
              ].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleManualCommand(cmd)}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs text-left transition flex items-center justify-between"
                >
                  <span>"{cmd}"</span>
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
          <span>Continuous Speech Parser Active</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
