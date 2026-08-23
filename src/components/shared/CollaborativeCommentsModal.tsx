import React, { useState } from 'react';
import { CADCommentPin, CADCommentReply, CADObject, CommentStatus, CommentCategory } from '../../types/cad';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Filter,
  X,
  Target,
  Sparkles,
  AlertCircle,
  Tag,
  Download,
  RotateCcw,
  Check,
} from 'lucide-react';

interface CollaborativeCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CADCommentPin[];
  onUpdateComments: (comments: CADCommentPin[]) => void;
  objects: CADObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onFocusCoordinate?: (pos: [number, number, number]) => void;
}

export const CollaborativeCommentsModal: React.FC<CollaborativeCommentsModalProps> = ({
  isOpen,
  onClose,
  comments,
  onUpdateComments,
  objects,
  selectedObjectId,
  onSelectObject,
  onFocusCoordinate,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(comments[0]?.id || null);

  // New Comment Form State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('Lead Reviewer');
  const [newCategory, setNewCategory] = useState<CommentCategory>('design_change');
  const [newTargetPartId, setNewTargetPartId] = useState<string>(selectedObjectId || '');

  // Reply text
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const filteredComments = comments.filter(c => {
    if (activeFilter === 'all') return true;
    return c.status === activeFilter;
  });

  const selectedComment = comments.find(c => c.id === selectedCommentId) || filteredComments[0];

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    const targetObj = objects.find(o => o.id === newTargetPartId);
    const targetPos: [number, number, number] = targetObj ? targetObj.position : [0, 0, 0];

    const initials = newAuthor
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CAD';

    const colors = ['#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#fb923c', '#eab308'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newPin: CADCommentPin = {
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      text: newText.trim(),
      author: newAuthor.trim() || 'Reviewer',
      authorInitials: initials,
      avatarColor,
      position: targetPos,
      targetPartId: targetObj?.id,
      targetPartName: targetObj?.name,
      status: 'open',
      category: newCategory,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replies: [],
    };

    onUpdateComments([newPin, ...comments]);
    setSelectedCommentId(newPin.id);
    setIsAddingNew(false);
    setNewTitle('');
    setNewText('');
  };

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedComment) return;

    const reply: CADCommentReply = {
      id: `rep_${Date.now()}`,
      author: newAuthor,
      avatarColor: '#38bdf8',
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = comments.map(c => {
      if (c.id === selectedComment.id) {
        return { ...c, replies: [...c.replies, reply] };
      }
      return c;
    });

    onUpdateComments(updated);
    setReplyText('');
  };

  const handleToggleStatus = (id: string, newStatus: CommentStatus) => {
    const updated = comments.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          resolvedAt: newStatus === 'resolved' ? new Date().toLocaleTimeString() : undefined,
        };
      }
      return c;
    });
    onUpdateComments(updated);
  };

  const handleExportMarkups = () => {
    const lines = [
      '# 3D Design Review Markups & Comments Summary',
      `Generated: ${new Date().toLocaleString()}`,
      '',
    ];

    comments.forEach((c, idx) => {
      lines.push(`### ${idx + 1}. [${c.status.toUpperCase()}] ${c.title}`);
      lines.push(`- **Author:** ${c.author} (${c.createdAt})`);
      lines.push(`- **Subsystem / Target:** ${c.targetPartName || 'Global Canvas'}`);
      lines.push(`- **Category:** ${c.category}`);
      lines.push(`- **Details:** ${c.text}`);
      if (c.replies.length > 0) {
        lines.push(`- **Replies (${c.replies.length}):**`);
        c.replies.forEach(r => lines.push(`  - *${r.author}*: ${r.text}`));
      }
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAD_Markups_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[88vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Collaborative 3D Spatial Comments & Markup Pins
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono font-bold">
                  {comments.filter(c => c.status === 'open').length} Open / {comments.length} Total
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Pin contextual design review markups directly onto 3D coordinates, thread discussions, and track issue resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkups}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markups</span>
            </button>

            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Comment Pin</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Comment Pin List & Filters */}
          <div className="w-80 border-r border-zinc-800 bg-zinc-950/40 p-4 flex flex-col overflow-hidden">
            {/* Filter Tabs */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px] mb-3 shrink-0">
              {(['all', 'open', 'in_review', 'resolved'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex-1 py-1 rounded-lg font-semibold capitalize transition-all ${
                    activeFilter === f
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredComments.map(c => {
                const isSelected = c.id === selectedComment?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCommentId(c.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md text-zinc-100'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full text-[10px] font-bold text-zinc-950 flex items-center justify-center font-mono shrink-0"
                          style={{ backgroundColor: c.avatarColor }}
                        >
                          {c.authorInitials}
                        </span>
                        <span className="text-xs font-bold text-zinc-200 truncate max-w-[130px]">
                          {c.title}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                          c.status === 'resolved'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : c.status === 'in_review'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{c.text}</p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                      <span className="truncate max-w-[140px] text-zinc-400">
                        {c.targetPartName || 'Scene'}
                      </span>
                      <span>{c.replies.length} replies</span>
                    </div>
                  </button>
                );
              })}

              {filteredComments.length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No comments matching "{activeFilter}".
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Thread & Detailed Conversation */}
          <div className="flex-1 flex flex-col bg-zinc-900/60 overflow-hidden">
            {isAddingNew ? (
              /* Add New Comment Form */
              <form onSubmit={handleCreateComment} className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span>Create 3D Pin Annotation</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Comment Title
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                      placeholder="e.g., Thermal Clearance Issue on Lens Module"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={e => setNewAuthor(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    >
                      <option value="design_change">Design Change Request</option>
                      <option value="tolerance_issue">Tolerance / Interference Issue</option>
                      <option value="material_check">Material / Finish Review</option>
                      <option value="electrical_note">Electrical / Power Routing</option>
                      <option value="general">General Design Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Target Component Attachment
                    </label>
                    <select
                      value={newTargetPartId}
                      onChange={e => setNewTargetPartId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    >
                      <option value="">Global 3D Canvas Space</option>
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.id}>
                          {obj.name} ({obj.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Detailed Engineering Review Note
                  </label>
                  <textarea
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Describe specific dimensional adjustments, material changes, or clearance constraints..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Pin Annotation</span>
                  </button>
                </div>
              </form>
            ) : selectedComment ? (
              /* Selected Thread View */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Thread Top Bar */}
                <div className="p-5 border-b border-zinc-800 bg-zinc-950/40 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full text-xs font-bold text-zinc-950 flex items-center justify-center font-mono"
                        style={{ backgroundColor: selectedComment.avatarColor }}
                      >
                        {selectedComment.authorInitials}
                      </span>
                      <h3 className="text-base font-bold text-zinc-100">{selectedComment.title}</h3>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-3">
                      <span>By <strong>{selectedComment.author}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-indigo-400">{selectedComment.targetPartName || '3D Space'}</strong></span>
                      <span>•</span>
                      <span>{selectedComment.createdAt}</span>
                    </div>
                  </div>

                  {/* Status buttons & Jump to part */}
                  <div className="flex items-center gap-2">
                    {selectedComment.targetPartId && (
                      <button
                        onClick={() => {
                          onSelectObject(selectedComment.targetPartId || null);
                          if (onFocusCoordinate) onFocusCoordinate(selectedComment.position);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-semibold border border-zinc-700"
                        title="Highlight attached part in 3D canvas"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Focus Part</span>
                      </button>
                    )}

                    <select
                      value={selectedComment.status}
                      onChange={e => handleToggleStatus(selectedComment.id, e.target.value as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        selectedComment.status === 'resolved'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : selectedComment.status === 'in_review'
                          ? 'bg-amber-950 border-amber-500 text-amber-300'
                          : 'bg-rose-950 border-rose-500 text-rose-300'
                      }`}
                    >
                      <option value="open">Status: Open</option>
                      <option value="in_review">Status: In Review</option>
                      <option value="resolved">Status: Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Main Comment Text */}
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/20 text-xs text-zinc-200 leading-relaxed">
                  {selectedComment.text}
                </div>

                {/* Replies Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <div className="text-[11px] font-bold text-zinc-400 mb-2">
                    Discussion Replies ({selectedComment.replies.length})
                  </div>

                  {selectedComment.replies.map(rep => (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-semibold text-zinc-200">{rep.author}</span>
                        <span className="text-[10px] text-zinc-500">{rep.timestamp}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">{rep.text}</p>
                    </div>
                  ))}

                  {selectedComment.replies.length === 0 && (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No replies yet. Type below to respond to this design review pin.
                    </div>
                  )}
                </div>

                {/* Reply Input Box */}
                <form
                  onSubmit={handleAddReply}
                  className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a response / engineering feedback..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-8 space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-600" />
                <span>Select a comment from the list or click "New Comment Pin"</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Real-time Multi-Reviewer 3D Coordination Thread</span>
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
