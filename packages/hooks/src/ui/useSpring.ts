import { useState, useCallback, useEffect } from 'react';

export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  precision?: number;
}

export interface UseSpringReturn {
  value: number;
  isAnimating: boolean;
  set: (target: number) => void;
  stop: () => void;
}

const defaultConfig: Required<SpringConfig> = {
  tension: 170,
  friction: 26,
  mass: 1,
  precision: 0.01,
};

export const useSpring = (
  initialValue: number = 0,
  config: SpringConfig = {}
): UseSpringReturn => {
  const [value, setValue] = useState(initialValue);
  const [target, setTarget] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const [velocity, setVelocity] = useState(0);

  const springConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (!isAnimating) return;

    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, 16.67); // Cap at 60fps
      lastTime = currentTime;

      setValue((currentValue) => {
        const displacement = currentValue - target;
        const spring = -springConfig.tension * displacement;
        const damping = -springConfig.friction * velocity;
        const acceleration = (spring + damping) / springConfig.mass;
        
        const newVelocity = velocity + acceleration * (deltaTime / 1000);
        const newValue = currentValue + newVelocity * (deltaTime / 1000);

        setVelocity(newVelocity);

        // Check if animation should stop
        if (
          Math.abs(displacement) < springConfig.precision &&
          Math.abs(newVelocity) < springConfig.precision
        ) {
          setIsAnimating(false);
          setVelocity(0);
          return target;
        }

        return newValue;
      });

      if (isAnimating) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnimating, target, velocity, springConfig]);

  const set = useCallback((newTarget: number) => {
    setTarget(newTarget);
    if (newTarget !== value) {
      setIsAnimating(true);
    }
  }, [value]);

  const stop = useCallback(() => {
    setIsAnimating(false);
    setVelocity(0);
  }, []);

  return {
    value,
    isAnimating,
    set,
    stop,
  };
};