import { useState, useCallback, DragEvent } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
export interface DragDropState {
  isDragging: boolean;
  isDragOver: boolean;
  draggedData: any;
}

export interface UseDragDropOptions {
  onDrop?: (data: any, event: DragEvent) => void;
  onDragStart?: (data: any, event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  acceptedTypes?: string[];
}

export interface UseDragDropReturn extends DragDropState {
  dragProps: {
    draggable: boolean;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
  };
  dropProps: {
    onDragOver: (event: DragEvent) => void;
    onDragEnter: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
  setDraggedData: (data: any) => void;
}

export const useDragDrop = (options: UseDragDropOptions = {}): UseDragDropReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedData, setDraggedData] = useState<any>(null);

  const { onDrop, onDragStart, onDragEnd, acceptedTypes } = options;

  const handleDragStart = useCallback((event: DragEvent) => {
    setIsDragging(true);
    if (draggedData) {
      event.dataTransfer.setData('text/plain', JSON.stringify(draggedData));
    }
    onDragStart?.(draggedData, event);
  }, [draggedData, onDragStart]);

  const handleDragEnd = useCallback((event: DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(event);
  }, [onDragEnd]);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    try {
      const dataString = event.dataTransfer.getData('text/plain');
      const data = dataString ? JSON.parse(dataString) : null;
      
      // Check accepted types if specified
      if (acceptedTypes && acceptedTypes.length > 0) {
        const hasAcceptedType = acceptedTypes.some(type => 
          event.dataTransfer.types.includes(type)
        );
        if (!hasAcceptedType) return;
      }
      
      onDrop?.(data, event);
    } catch (error) {
      logger.warn('Failed to parse dropped data:', error);
    }
  }, [onDrop, acceptedTypes]);

  return {
    isDragging,
    isDragOver,
    draggedData,
    dragProps: {
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
    dropProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    setDraggedData,
  };
};