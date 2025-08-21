import { useState, useCallback, useRef } from 'react';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface UseAnimationReturn {
  isPlaying: boolean;
  isPaused: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  restart: () => void;
  ref: React.RefObject<HTMLElement>;
}

export const useAnimation = (
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  config: AnimationConfig = {}
): UseAnimationReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const animationRef = useRef<Animation | null>(null);

  const defaultConfig: Required<AnimationConfig> = {
    duration: 1000,
    easing: 'ease-in-out',
    delay: 0,
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    ...config,
  };

  const play = useCallback(() => {
    if (!elementRef.current) return;

    if (animationRef.current) {
      animationRef.current.play();
    } else {
      animationRef.current = elementRef.current.animate(keyframes, defaultConfig);
      
      animationRef.current.addEventListener('finish', () => {
        setIsPlaying(false);
        setIsPaused(false);
      });
    }
    
    setIsPlaying(true);
    setIsPaused(false);
  }, [keyframes, defaultConfig]);

  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const restart = useCallback(() => {
    stop();
    setTimeout(play, 0);
  }, [stop, play]);

  return {
    isPlaying,
    isPaused,
    play,
    pause,
    stop,
    restart,
    ref: elementRef,
  };
};