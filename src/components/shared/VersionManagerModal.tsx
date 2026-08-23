import React, { useState } from 'react';
import { CADObject, CADConstraint, DesignVersion, VersionDiffResult } from '../../types/cad';
import { createVersionSnapshot, computeVersionDiff } from '../../utils/versionManager';
import {
  GitBranch,
  GitCommit,
  RotateCcw,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  X,
  Sparkles,
  Layers,
  Scale,
  DollarSign,
  Tag,
  Clock,
  User,
  ChevronRight,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface VersionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentObjects: CADObject[];
  constraints?: CADConstraint[];
  versionHistory: DesignVersion[];
  onUpdateVersionHistory: (history: DesignVersion[]) => void;
  onRestoreVersion: (version: DesignVersion) => void;
}

export const VersionManagerModal: React.FC<VersionManagerModalProps> = ({
  isOpen,
  onClose,
  currentObjects,
  constraints = [],
  versionHistory,
  onUpdateVersionHistory,
  onRestoreVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'diff' | 'commit'>('timeline');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versionHistory[versionHistory.length - 1]?.id || null
  );

  // Diff comparison states
  const [diffVersionAId, setDiffVersionAId] = useState<string>(
    versionHistory[Math.max(0, versionHistory.length - 2)]?.id || versionHistory[0]?.id || ''
  );
  const [diffVersionBId, setDiffVersionBId] = useState<string>(
    versionHistory[versionHistory.length - 1]?.id || ''
  );

  // New Version Commit Form
  const [newVersionTag, setNewVersionTag] = useState<string>(`v1.${versionHistory.length}.0`);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('Lead CAD Engineer');
  const [newVersionType, setNewVersionType] = useState<DesignVersion['tag']>('milestone');
  const [newChangeLogItem, setNewChangeLogItem] = useState<string>('');
  const [changeLogList, setChangeLogList] = useState<string[]>([
    'Refined component spatial envelope',
    'Updated assembly constraints & material specs',
  ]);

  if (!isOpen) return null;

  const selectedVersion = versionHistory.find(v => v.id === selectedVersionId) || versionHistory[0];

  const handleAddChangeLogItem = () => {
    if (!newChangeLogItem.trim()) return;
    setChangeLogList([...changeLogList, newChangeLogItem.trim()]);
    setNewChangeLogItem('');
  };

  const handleRemoveChangeLogItem = (index: number) => {
    setChangeLogList(changeLogList.filter((_, i) => i !== index));
  };

  const handleCommitNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newVer = createVersionSnapshot(
      currentObjects,
      newVersionTag.trim() || `v1.${versionHistory.length}.0`,
      newTitle.trim(),
      newDescription.trim() || 'Engineering revision snapshot',
      newAuthor.trim() || 'Lead CAD Engineer',
      newVersionType,
      changeLogList
    );

    const updated = [...versionHistory, newVer];
    onUpdateVersionHistory(updated);
    setSelectedVersionId(newVer.id);
    setActiveTab('timeline');
    setNewTitle('');
    setNewDescription('');
  };

  // Diff Computation
  const versionA = versionHistory.find(v => v.id === diffVersionAId) || versionHistory[0];
  const versionB = versionHistory.find(v => v.id === diffVersionBId) || versionHistory[versionHistory.length - 1];
  const diffResult: VersionDiffResult | null =
    versionA && versionB ? computeVersionDiff(versionA, versionB) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[860px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Design Version Control & Revisions
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono font-bold">
                  {versionHistory.length} Revisions
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Track design branches, compare geometric revisions, inspect changelogs, and restore design milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switches */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Visual Diff</span>
              </button>
              <button
                onClick={() => setActiveTab('commit')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'commit'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Commit Snapshot</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= TAB 1: TIMELINE & DETAILS ================= */}
        {activeTab === 'timeline' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Timeline List */}
            <div className="w-80 border-r border-zinc-800 bg-zinc-950/40 p-4 overflow-y-auto space-y-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300">Commit History</span>
                <span className="text-[11px] text-zinc-500 font-mono">Earliest → Latest</span>
              </div>

              {versionHistory.map((ver, idx) => {
                const isSelected = ver.id === selectedVersion?.id;
                const isLatest = idx === versionHistory.length - 1;

                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md text-zinc-100'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30">
                        {ver.versionNumber}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.2 rounded-full font-semibold">
                          HEAD / Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-zinc-200 truncate mt-1">
                      {ver.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-400" />
                        {ver.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {new Date(ver.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Version Detailed View */}
            {selectedVersion ? (
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-400 px-2.5 py-0.5 rounded-lg bg-indigo-950 border border-indigo-500/40">
                        {selectedVersion.versionNumber}
                      </span>
                      <h3 className="text-base font-bold text-zinc-100">{selectedVersion.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                      {selectedVersion.description}
                    </p>
                  </div>

                  {/* Restore / Rollback button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Restore workspace assembly back to revision ${selectedVersion.versionNumber}?`)) {
                        onRestoreVersion(selectedVersion);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rollback to this Version</span>
                  </button>
                </div>

                {/* KPI Metrics Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                      <span>Total Components</span>
                      <Layers className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-100">
                      {selectedVersion.metricsSummary.partCount} parts
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                      <span>Total Assembly Mass</span>
                      <Scale className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-100">
                      {selectedVersion.metricsSummary.totalMassGrams} g
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                      <span>Estimated BOM Cost</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      ${selectedVersion.metricsSummary.bomCostUsd}
                    </div>
                  </div>
                </div>

                {/* Changelog list */}
                <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Revision Change Log & Engineering Notes</span>
                  </h4>
                  <ul className="space-y-2">
                    {selectedVersion.changeLog?.map((note, i) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Snapshot Components Manifest */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-200">
                    Contained Components Manifest ({selectedVersion.objects.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedVersion.objects.map(obj => (
                      <div
                        key={obj.id}
                        className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-zinc-200 block truncate">{obj.name}</span>
                          <span className="text-[10px] text-zinc-500">{obj.category} • {obj.material?.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                          {obj.dimensions?.width}×{obj.dimensions?.height}mm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ================= TAB 2: VISUAL DIFF INSPECTOR ================= */}
        {activeTab === 'diff' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Version Selectors */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                  Base Revision (Version A):
                </label>
                <select
                  value={diffVersionAId}
                  onChange={e => setDiffVersionAId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                >
                  {versionHistory.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.versionNumber} - {v.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                  Target Revision (Version B):
                </label>
                <select
                  value={diffVersionBId}
                  onChange={e => setDiffVersionBId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                >
                  {versionHistory.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.versionNumber} - {v.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delta KPI Cards */}
            {diffResult && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {/* Delta Components */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block">Part Count Delta</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          diffResult.deltaPartCount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {diffResult.deltaPartCount >= 0 ? `+${diffResult.deltaPartCount}` : diffResult.deltaPartCount} parts
                      </span>
                    </div>
                    {diffResult.deltaPartCount >= 0 ? (
                      <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-rose-400" />
                    )}
                  </div>

                  {/* Delta Mass */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block">Mass Change</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          diffResult.deltaMassGrams >= 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {diffResult.deltaMassGrams >= 0 ? `+${diffResult.deltaMassGrams}` : diffResult.deltaMassGrams} g
                      </span>
                    </div>
                    <Scale className="w-6 h-6 text-blue-400" />
                  </div>

                  {/* Delta Cost */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block">Estimated BOM Delta</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          diffResult.deltaCostUsd >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {diffResult.deltaCostUsd >= 0 ? `+$${diffResult.deltaCostUsd}` : `-$${Math.abs(diffResult.deltaCostUsd)}`}
                      </span>
                    </div>
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                {/* Diff Itemized List */}
                <div className="space-y-4">
                  {/* Added Parts */}
                  {diffResult.addedParts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Added Components in {versionB.versionNumber} ({diffResult.addedParts.length})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {diffResult.addedParts.map(p => (
                          <div key={p.id} className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs text-zinc-200">
                            <strong>{p.name}</strong> • {p.category} ({p.material?.name})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modified Parts */}
                  {diffResult.modifiedParts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-2">
                      <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Modified Geometry & Materials ({diffResult.modifiedParts.length})</span>
                      </div>
                      <div className="space-y-2">
                        {diffResult.modifiedParts.map(m => (
                          <div key={m.partId} className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs space-y-1">
                            <strong className="text-zinc-100">{m.name}</strong>
                            <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-0.5">
                              {m.changes.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Removed Parts */}
                  {diffResult.removedParts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-2">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Removed Components in {versionB.versionNumber} ({diffResult.removedParts.length})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {diffResult.removedParts.map(p => (
                          <div key={p.id} className="p-2 bg-rose-950/40 rounded-xl border border-rose-500/20 text-xs text-zinc-200">
                            <strong>{p.name}</strong> • {p.category}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diffResult.addedParts.length === 0 &&
                    diffResult.modifiedParts.length === 0 &&
                    diffResult.removedParts.length === 0 && (
                      <div className="p-8 text-center text-zinc-500 text-xs">
                        No geometric or material differences detected between {versionA.versionNumber} and {versionB.versionNumber}.
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 3: COMMIT NEW SNAPSHOT ================= */}
        {activeTab === 'commit' && (
          <form onSubmit={handleCommitNewVersion} className="flex-1 p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Revision Tag
                </label>
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={e => setNewVersionTag(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                  placeholder="v1.2.0"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Author / Reviewer
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                  placeholder="Engineer Name"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Milestone Category
                </label>
                <select
                  value={newVersionType}
                  onChange={e => setNewVersionType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                >
                  <option value="milestone">Milestone Release</option>
                  <option value="prototype">Prototype Build</option>
                  <option value="review">Design Review WIP</option>
                  <option value="release">Production Release</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Version Title / Summary
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                placeholder="e.g., Optical Zoom Housing & Thermal Shielding..."
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Detailed Engineering Changelog Description
              </label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="Summarize key geometric tolerances, material upgrades, and assembly modifications..."
              />
            </div>

            {/* Change log line items */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Itemized Changelog Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChangeLogItem}
                  onChange={e => setNewChangeLogItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddChangeLogItem())}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100"
                  placeholder="Add bullet point note and click Add..."
                />
                <button
                  type="button"
                  onClick={handleAddChangeLogItem}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
                >
                  Add Note
                </button>
              </div>

              <ul className="space-y-1.5 pt-1">
                {changeLogList.map((item, i) => (
                  <li
                    key={i}
                    className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300"
                  >
                    <span>• {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChangeLogItem(i)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-1.5"
              >
                <GitCommit className="w-4 h-4" />
                <span>Save Revision ({currentObjects.length} Parts)</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Active Workspace: {currentObjects.length} components • ISO-9001 CAD Revision Schema</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
