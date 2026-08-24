export interface LiveUserCursor {
  id: string;
  name: string;
  avatarColor: string;
  x: number; // percentage (0-100) or pixel
  y: number; // percentage (0-100) or pixel
  activeTool: string;
  selectedPartName?: string;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  author: string;
  avatarColor: string;
  channel: 'general' | 'dfm-review' | 'assembly' | 'materials';
  text: string;
  taggedPartId?: string;
  taggedPartName?: string;
  timestamp: string;
  isSystem?: boolean;
}
