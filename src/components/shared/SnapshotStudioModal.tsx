import React, { useState } from 'react';
import { SnapshotItem, DesignSection } from '../../types/cad';
import {
  X,
  Camera,
  Download,
  Copy,
  Trash2,
  Maximize2,
  Check,
  Sparkles,
  Layers,
  Clock,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SnapshotStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: SnapshotItem[];
  onTakeSnapshot: (options: {
    resolutionMultiplier: number;
    transparentBg: boolean;
    includeWatermark: boolean;
    aspectRatio: string;
  }) => Promise<SnapshotItem | null>;
  onDeleteSnapshot: (id: string) => void;
  onRestoreCameraView?: (cameraState: SnapshotItem['cameraState']) => void;
  currentSection: DesignSection;
}

export const SnapshotStudioModal: React.FC<SnapshotStudioModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onTakeSnapshot,
  onDeleteSnapshot,
  onRestoreCameraView,
  currentSection,
}) => {
  const [resolutionMultiplier, setResolutionMultiplier] = useState<number>(2); // 2x default (2K QHD)
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPreviewSnapshot, setSelectedPreviewSnapshot] = useState<SnapshotItem | null>(null);

  if (!isOpen) return null;

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const snap = await onTakeSnapshot({
        resolutionMultiplier,
        transparentBg,
        includeWatermark,
        aspectRatio,
      });
      if (snap) {
        setSelectedPreviewSnapshot(snap);
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.2 } });
      }
    } catch (e) {
      console.error('Failed to capture snapshot:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = (snapshot: SnapshotItem) => {
    const link = document.createElement('a');
    link.download = `${snapshot.title.toLowerCase().replace(/\s+/g, '_')}_${snapshot.timestamp}.png`;
    link.href = snapshot.dataUrl;
    link.click();
  };

  const handleCopyToClipboard = async (snapshot: SnapshotItem) => {
    try {
      const res = await fetch(snapshot.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopiedId(snapshot.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Clipboard write image failed, copying URL fallback:', err);
      navigator.clipboard.writeText(snapshot.dataUrl);
      setCopiedId(snapshot.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const activeSnapshot = selectedPreviewSnapshot || snapshots[snapshots.length - 1] || null;

  return (
    <div
      id="snapshot_studio_backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="snapshot_studio_modal"
        className="w-full max-w-5xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 text-blue-400 border border-zinc-700/80">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">View Snapshot Studio</h2>
                <span className="text-[10px] font-semibold bg-zinc-800 text-blue-400 border border-zinc-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  High-Res Render
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Capture high-resolution technical & marketing snapshots with camera state restore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content: Left = Capture Controls & Gallery, Right = Snapshot Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Camera & Capture Options + History List */}
          <div className="w-full md:w-80 border-r border-zinc-800 bg-zinc-950/60 p-5 flex flex-col justify-between overflow-y-auto space-y-4 shrink-0">
            <div className="space-y-4">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider block">
                Render Parameters
              </span>

              {/* Resolution Multiplier */}
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Output Resolution</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { mult: 1, label: '1x (1080p)' },
                    { mult: 2, label: '2x (2K QHD)' },
                    { mult: 3, label: '3x (4K UHD)' },
                  ].map(res => (
                    <button
                      key={res.mult}
                      onClick={() => setResolutionMultiplier(res.mult)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        resolutionMultiplier === res.mult
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['16:9', '4:3', '1:1'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        aspectRatio === ratio
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span>Transparent Background (PNG)</span>
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={e => setTransparentBg(e.target.checked)}
                    className="accent-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span>Include Watermark & Spec Tag</span>
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={e => setIncludeWatermark(e.target.checked)}
                    className="accent-blue-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Trigger Capture Button */}
              <button
                id="btn_trigger_render_snapshot"
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {isCapturing ? 'Rendering Frame...' : 'Capture View Snapshot'}
              </button>
            </div>

            {/* Snapshot Session Gallery Strip */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Session Gallery</span>
                <span>{snapshots.length} frames</span>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs bg-zinc-900/50 rounded-xl border border-zinc-850">
                  No snapshots captured yet. Click Capture above.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-zinc-900/40 rounded-xl border border-zinc-800">
                  {snapshots.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedPreviewSnapshot(s)}
                      className={`relative rounded-lg overflow-hidden border cursor-pointer group aspect-video bg-zinc-950 ${
                        activeSnapshot?.id === s.id
                          ? 'border-blue-500 ring-1 ring-blue-500'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={s.dataUrl}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteSnapshot(s.id);
                          if (selectedPreviewSnapshot?.id === s.id) {
                            setSelectedPreviewSnapshot(null);
                          }
                        }}
                        className="absolute top-1 right-1 p-1 rounded bg-black/70 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Snapshot Display & Inspector */}
          <div className="flex-1 bg-zinc-950 p-6 flex flex-col justify-between overflow-hidden">
            {activeSnapshot ? (
              <div className="flex-1 flex flex-col justify-between space-y-4 overflow-hidden">
                {/* Active Snapshot Metadata Pill */}
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-semibold text-zinc-200">{activeSnapshot.title}</span>
                    <span className="text-zinc-600">|</span>
                    <span>{activeSnapshot.resolution}</span>
                    <span className="text-zinc-600">|</span>
                    <span>{new Date(activeSnapshot.timestamp).toLocaleTimeString()}</span>
                  </div>

                  {activeSnapshot.cameraState && onRestoreCameraView && (
                    <button
                      onClick={() => onRestoreCameraView(activeSnapshot.cameraState)}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 transition-colors"
                      title="Reposition 3D Viewport Camera to exact match of this shot"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore View Camera
                    </button>
                  )}
                </div>

                {/* Big Preview Frame */}
                <div className="flex-1 flex items-center justify-center p-2 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 overflow-hidden relative group">
                  <img
                    src={activeSnapshot.dataUrl}
                    alt={activeSnapshot.title}
                    className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>

                {/* Bottom Snapshot Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>{activeSnapshot.partCount} Components rendered</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyToClipboard(activeSnapshot)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      {copiedId === activeSnapshot.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Image</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownload(activeSnapshot)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-sm font-semibold text-zinc-300">Ready for High-Res Capture</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Frame your desired perspective in the 3D canvas and click "Capture View Snapshot".
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between text-xs text-zinc-400">
          <span>Snapshots are rendered directly from the WebGL hardware framebuffer.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
