import { useState, useEffect, RefObject } from 'react';

export interface Size {
  width: number;
  height: number;
}

export interface UseSizeReturn extends Size {
  ref: RefObject<HTMLElement>;
}

export const useSize = <T extends HTMLElement = HTMLDivElement>(): UseSizeReturn => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [element, setElement] = useState<T | null>(null);

  const ref = {
    current: element,
  } as RefObject<T>;

  useEffect(() => {
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  // Callback ref para manejar el elemento
  const callbackRef = (node: T | null) => {
    setElement(node);
  };

  return {
    ...size,
    ref: {
      current: element,
    } as RefObject<HTMLElement>,
  };
};