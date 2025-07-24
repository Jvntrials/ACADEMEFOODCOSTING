import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

const TooltipContent = ({ text, coords }: { text: string; coords: { top: number; left: number } }) => {
  return (
    <div
      style={{
        position: 'fixed', // Fixed positioning is crucial for Portals to escape parent containers
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translate(-50%, -100%)', // Positions the tooltip above and centered relative to the coords
        pointerEvents: 'none', // Prevents the tooltip from capturing mouse events and causing flicker
      }}
      className="mb-3 w-max max-w-xs
                 bg-gray-900 text-gray-200 text-sm rounded-lg shadow-xl p-3 z-50
                 ring-1 ring-gray-700
                 whitespace-pre-line text-left normal-case"
    >
      {text}
      {/* Arrow pointing down */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                    border-x-8 border-x-transparent
                    border-t-8 border-t-gray-900" />
    </div>
  );
};

export const Tooltip = ({ children, text }: TooltipProps): React.ReactNode => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top, // Positioned at the top edge of the trigger element
        left: rect.left + rect.width / 2, // Positioned at the horizontal center of the trigger element
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  // By wrapping the children in a standard span, we can reliably attach a ref and event handlers.
  // This is more robust than using `display: 'contents'`, which can be buggy for event handling.
  const trigger = (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );

  return (
    <>
      {trigger}
      {/* Use a Portal to render the tooltip content at the top level of the DOM (document.body) */}
      {/* This ensures it is not clipped by any parent containers with overflow settings. */}
      {isVisible && ReactDOM.createPortal(
        <TooltipContent text={text} coords={coords} />,
        document.body
      )}
    </>
  );
};