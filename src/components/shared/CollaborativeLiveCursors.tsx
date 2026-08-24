import React from 'react';
import { LiveUserCursor } from '../../types/collaboration';
import { MousePointer2 } from 'lucide-react';

interface CollaborativeLiveCursorsProps {
  cursors: LiveUserCursor[];
}

export const CollaborativeLiveCursors: React.FC<CollaborativeLiveCursorsProps> = ({ cursors }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {cursors.map(cursor => (
        <div
          key={cursor.id}
          className="absolute transition-all duration-150 ease-out flex items-start space-x-1.5"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
          }}
        >
          {/* Custom SVG / Icon Mouse Pointer */}
          <MousePointer2
            className="w-5 h-5 drop-shadow-md transform -rotate-45"
            style={{ color: cursor.avatarColor, fill: cursor.avatarColor }}
          />

          {/* User Name Tag Badge */}
          <div
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white shadow-lg flex items-center space-x-1.5 whitespace-nowrap backdrop-blur-sm"
            style={{ backgroundColor: cursor.avatarColor }}
          >
            <span>{cursor.name}</span>
            {cursor.selectedPartName && (
              <span className="opacity-75 font-mono text-[10px]">@{cursor.selectedPartName}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
