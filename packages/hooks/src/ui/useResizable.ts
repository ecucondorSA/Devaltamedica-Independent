import { useState, useCallback, useEffect, useRef } from 'react';

export interface ResizeHandle {
  x: number;
  y: number;
}

export interface UseResizableOptions {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  onResize?: (width: number, height: number) => void;
}

export interface UseResizableReturn {
  width: number;
  height: number;
  isResizing: boolean;
  resizeProps: {
    onMouseDown: (event: React.MouseEvent) => void;
  };
  style: {
    width: number;
    height: number;
  };
}

export const useResizable = (options: UseResizableOptions = {}): UseResizableReturn => {
  const {
    initialWidth = 200,
    initialHeight = 200,
    minWidth = 50,
    minHeight = 50,
    maxWidth = Infinity,
    maxHeight = Infinity,
    aspectRatio,
    onResize,
  } = options;

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef<ResizeHandle>({ x: 0, y: 0 });
  const startSize = useRef({ width: initialWidth, height: initialHeight });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = event.clientX - startPos.current.x;
    const deltaY = event.clientY - startPos.current.y;

    let newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.current.width + deltaX));
    let newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.current.height + deltaY));

    // Maintain aspect ratio if specified
    if (aspectRatio) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }

      // Ensure constraints are still respected
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    }

    setWidth(newWidth);
    setHeight(newHeight);
    onResize?.(newWidth, newHeight);
  }, [isResizing, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    startPos.current = { x: event.clientX, y: event.clientY };
    startSize.current = { width, height };
  }, [width, height]);

  return {
    width,
    height,
    isResizing,
    resizeProps: {
      onMouseDown: handleMouseDown,
    },
    style: {
      width,
      height,
    },
  };
};