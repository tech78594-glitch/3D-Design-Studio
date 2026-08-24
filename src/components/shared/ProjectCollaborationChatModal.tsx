import React, { useState } from 'react';
import { ChatMessage, LiveUserCursor } from '../../types/collaboration';
import { CADObject } from '../../types/cad';
import {
  X,
  Send,
  MessageSquare,
  Hash,
  Users,
  Paperclip,
  Tag,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ProjectCollaborationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  objects: CADObject[];
  onlineUsers: LiveUserCursor[];
}

export const ProjectCollaborationChatModal: React.FC<ProjectCollaborationChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  objects,
  onlineUsers,
}) => {
  const [activeChannel, setActiveChannel] = useState<'general' | 'dfm-review' | 'assembly' | 'materials'>('general');
  const [textInput, setTextInput] = useState('');
  const [selectedTaggedPartId, setSelectedTaggedPartId] = useState<string>('');

  if (!isOpen) return null;

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const taggedObj = objects.find(o => o.id === selectedTaggedPartId);

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      author: 'Lead DFM Engineer (You)',
      avatarColor: '#38bdf8',
      channel: activeChannel,
      text: textInput,
      taggedPartId: taggedObj?.id,
      taggedPartName: taggedObj?.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage(newMsg);
    setTextInput('');
    setSelectedTaggedPartId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Project Collaboration Team Chat
                <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineUsers.length} Online
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Real-time technical discussions, DFM reviews, and live part mentions.
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

        {/* Body Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 overflow-hidden">
          {/* Sidebar Channels & Online Users */}
          <div className="bg-slate-950/60 p-4 border-r border-slate-800 space-y-6">
            {/* Channels List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Review Channels
              </span>
              {[
                { id: 'general', label: 'general-chat', desc: 'Main CAD workspace' },
                { id: 'dfm-review', label: 'dfm-clearance', desc: 'Tolerance & clashes' },
                { id: 'assembly', label: 'assembly-sequence', desc: 'Kinematics & mates' },
                { id: 'materials', label: 'material-specs', desc: 'BOM & carbon cost' },
              ].map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id as any)}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center space-x-2 text-xs font-medium ${
                    activeChannel === ch.id
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Hash className="w-4 h-4 text-blue-400" />
                  <span className="truncate">{ch.label}</span>
                </button>
              ))}
            </div>

            {/* Online Collaborators */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Collaborators</span>
                <Users className="w-3.5 h-3.5" />
              </span>
              <div className="space-y-2">
                {onlineUsers.map(usr => (
                  <div key={usr.id} className="flex items-center space-x-2.5 text-xs text-slate-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: usr.avatarColor }}
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200">{usr.name}</div>
                      <div className="text-[10px] text-slate-500">{usr.activeTool}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Message Stream */}
          <div className="md:col-span-3 flex flex-col bg-slate-900/40">
            {/* Messages Display Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {filteredMessages.map(msg => (
                <div key={msg.id} className="flex items-start space-x-3 group">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-md"
                    style={{ backgroundColor: msg.avatarColor }}
                  >
                    {msg.author.charAt(0)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">{msg.author}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                      <p className="leading-relaxed">{msg.text}</p>

                      {msg.taggedPartName && (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 text-[11px]">
                          <Tag className="w-3 h-3 text-cyan-400" />
                          <span>Part Reference: <strong>{msg.taggedPartName}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input & Attachments Bar */}
            <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedTaggedPartId}
                  onChange={e => setSelectedTaggedPartId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500 max-w-[200px]"
                >
                  <option value="">+ Mention CAD Part</option>
                  {objects.map(o => (
                    <option key={o.id} value={o.id}>
                      @{o.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 font-mono">Channel: #{activeChannel}</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={`Message #${activeChannel}... (press Enter)`}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
