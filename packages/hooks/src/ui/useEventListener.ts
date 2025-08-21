import React, { useEffect, useRef } from 'react';

export type EventTarget = Window | Document | HTMLElement | MediaQueryList;

export interface UseEventListenerOptions {
  passive?: boolean;
  once?: boolean;
  capture?: boolean;
}

export const useEventListener = <T extends EventTarget, K extends keyof GlobalEventHandlersEventMap>(
  eventName: K | string,
  handler: (event: GlobalEventHandlersEventMap[K] | Event) => void,
  element?: T | null,
  options: UseEventListenerOptions = {}
): void => {
  // Create a ref that stores handler
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Define the listening target
    const targetElement: T | Window = element ?? window;
    
    if (!(targetElement && targetElement.addEventListener)) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: Event) => {
      savedHandler.current(event);
    };

    targetElement.addEventListener(eventName as string, eventListener, options);

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName as string, eventListener, options);
    };
  }, [eventName, element, options.passive, options.once, options.capture]);
};

// Convenience hooks for common events
export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent) => void
): void => {
  useEventListener('click', (event) => {
    const el = ref?.current;
    
    // Do nothing if clicking ref's element or descendent elements
    if (!el || el.contains(event.target as Node)) {
      return;
    }
    
    handler(event as MouseEvent);
  }, document);
};

export const useKeyPress = (
  targetKey: string,
  handler: (event: KeyboardEvent) => void,
  element?: HTMLElement
): void => {
  useEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === targetKey) {
      handler(event as KeyboardEvent);
    }
  }, element);
};

export const useWindowResize = (
  handler: (event: Event | UIEvent) => void
): void => {
  useEventListener('resize', handler, window);
};

export const useDocumentVisibility = (
  handler: (isVisible: boolean) => void
): void => {
  useEventListener('visibilitychange', () => {
    handler(!document.hidden);
  }, document);
};