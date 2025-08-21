import { useState, useEffect } from "react";

// ==================== USE MEDIA QUERY HOOK ====================

/**
 * Hook for media queries
 */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// ==================== PREDEFINED MEDIA QUERIES ====================

export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () =>
  useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
export const useIsLargeDesktop = () => useMediaQuery("(min-width: 1280px)");
export const useIsExtraLargeDesktop = () =>
  useMediaQuery("(min-width: 1536px)");

// ==================== ORIENTATION QUERIES ====================

export const useIsPortrait = () => useMediaQuery("(orientation: portrait)");
export const useIsLandscape = () => useMediaQuery("(orientation: landscape)");

// ==================== FEATURE QUERIES ====================

export const useSupportsHover = () => useMediaQuery("(hover: hover)");
export const useSupportsTouch = () => useMediaQuery("(pointer: coarse)");
export const usePrefersReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");
export const usePrefersDarkMode = () =>
  useMediaQuery("(prefers-color-scheme: dark)");
export const usePrefersLightMode = () =>
  useMediaQuery("(prefers-color-scheme: light)");

// ==================== DEVICE QUERIES ====================

export const useIsHighDPI = () =>
  useMediaQuery(
    "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)"
  );
export const useIsRetina = () =>
  useMediaQuery(
    "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)"
  );

// ==================== PRINT QUERIES ====================

export const useIsPrint = () => useMediaQuery("print");

// ==================== CUSTOM BREAKPOINT HOOKS ====================

export const useBreakpoint = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();
  const isExtraLargeDesktop = useIsExtraLargeDesktop();

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  if (isDesktop) return "desktop";
  if (isLargeDesktop) return "large";
  if (isExtraLargeDesktop) return "xl";

  return "unknown";
};

// ==================== RESPONSIVE VALUES HOOK ====================

export function useResponsiveValue<T>(
  values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    large?: T;
    xl?: T;
  },
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();

  switch (breakpoint) {
    case "mobile":
      return values.mobile ?? defaultValue;
    case "tablet":
      return values.tablet ?? values.mobile ?? defaultValue;
    case "desktop":
      return values.desktop ?? values.tablet ?? values.mobile ?? defaultValue;
    case "large":
      return (
        values.large ??
        values.desktop ??
        values.tablet ??
        values.mobile ??
        defaultValue
      );
    case "xl":
      return (
        values.xl ??
        values.large ??
        values.desktop ??
        values.tablet ??
        values.mobile ??
        defaultValue
      );
    default:
      return defaultValue;
  }
}

// ==================== USE VIEWPORT SIZE ====================

export function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateSize();

    // Add event listener
    window.addEventListener("resize", updateSize);

    // Cleanup
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

// ==================== USE SCREEN SIZE ====================

export function useScreenSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setSize({
        width: window.screen.width,
        height: window.screen.height,
      });
    };

    // Set initial size
    updateSize();

    // Add event listener
    window.addEventListener("resize", updateSize);

    // Cleanup
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

// ==================== USE DEVICE INFO ====================

export function useDeviceInfo() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isPortrait = useIsPortrait();
  const isLandscape = useIsLandscape();
  const supportsHover = useSupportsHover();
  const supportsTouch = useSupportsTouch();
  const prefersReducedMotion = usePrefersReducedMotion();
  const prefersDarkMode = usePrefersDarkMode();
  const viewportSize = useViewportSize();
  const screenSize = useScreenSize();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    supportsHover,
    supportsTouch,
    prefersReducedMotion,
    prefersDarkMode,
    viewportSize,
    screenSize,
    breakpoint: useBreakpoint(),
  };
}

// ==================== USE CONDITIONAL RENDERING ====================

export function useConditionalRender(condition: boolean, delay: number = 0) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (condition) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    } else {
      setShouldRender(false);
    }
  }, [condition, delay]);

  return shouldRender;
}

// ==================== USE RESPONSIVE LAYOUT ====================

export function useResponsiveLayout() {
  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    columns: isMobile ? 1 : isTablet ? 2 : 3,
    spacing: isMobile ? 16 : isTablet ? 24 : 32,
    maxWidth: isMobile ? "100%" : isTablet ? "768px" : "1200px",
  };
}