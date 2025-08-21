import { useState, useEffect, useCallback } from 'react';

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface UseScrollReturn extends ScrollPosition {
  isScrolling: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | null;
  scrollTo: (position: Partial<ScrollPosition>) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export const useScroll = (element?: HTMLElement): UseScrollReturn => {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [previousPosition, setPreviousPosition] = useState<ScrollPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const targetElement = element || window;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollX = element ? element.scrollLeft : window.pageXOffset;
      const scrollY = element ? element.scrollTop : window.pageYOffset;

      const newPosition = { x: scrollX, y: scrollY };
      
      // Determine scroll direction
      const deltaX = scrollX - previousPosition.x;
      const deltaY = scrollY - previousPosition.y;
      
      let newDirection: typeof direction = null;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        newDirection = deltaY > 0 ? 'down' : 'up';
      } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDirection = deltaX > 0 ? 'right' : 'left';
      }

      setScrollPosition(newPosition);
      setDirection(newDirection);
      setPreviousPosition(newPosition);
      setIsScrolling(true);

      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Set scrolling to false after scrolling stops
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        setDirection(null);
      }, 150);
    };

    // Initial position
    const initialX = element ? element.scrollLeft : window.pageXOffset;
    const initialY = element ? element.scrollTop : window.pageYOffset;
    const initialPosition = { x: initialX, y: initialY };
    setScrollPosition(initialPosition);
    setPreviousPosition(initialPosition);

    targetElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      targetElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [element]);

  const scrollTo = useCallback((position: Partial<ScrollPosition>) => {
    const targetElement = element || window;
    
    if ('scrollTo' in targetElement) {
      targetElement.scrollTo({
        left: position.x,
        top: position.y,
        behavior: 'smooth'
      });
    }
  }, [element]);

  const scrollToTop = useCallback(() => {
    scrollTo({ x: 0, y: 0 });
  }, [scrollTo]);

  const scrollToBottom = useCallback(() => {
    const targetElement = element || document.documentElement;
    const maxScroll = element ? element.scrollHeight - element.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    scrollTo({ y: maxScroll });
  }, [element, scrollTo]);

  return {
    x: scrollPosition.x,
    y: scrollPosition.y,
    isScrolling,
    direction,
    scrollTo,
    scrollToTop,
    scrollToBottom,
  };
};