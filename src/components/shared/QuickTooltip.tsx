/**
 * Quick Tooltip Component
 * Provides micro-tooltips with keyboard shortcut keycaps and high-contrast styling.
 */

import React, { useState } from 'react';

interface QuickTooltipProps {
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  description?: string;
  delayMs?: number;
  children: React.ReactNode;
  className?: string;
}

export const QuickTooltip: React.FC<QuickTooltipProps> = ({
  content,
  shortcut,
  position = 'bottom',
  description,
  delayMs = 250,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const show = () => {
    const id = window.setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
    setTimeoutId(id);
  };

  const hide = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'bottom':
      default:
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none ${getPositionClasses()} animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="bg-zinc-900/95 text-zinc-100 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 shadow-xl backdrop-blur-md whitespace-nowrap flex flex-col gap-0.5 max-w-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[11.5px] text-zinc-100">{content}</span>
              {shortcut && (
                <kbd className="bg-zinc-800 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-zinc-600 shadow-inner tracking-wider">
                  {shortcut}
                </kbd>
              )}
            </div>
            {description && (
              <span className="text-[10px] text-zinc-400 font-normal leading-tight">
                {description}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
