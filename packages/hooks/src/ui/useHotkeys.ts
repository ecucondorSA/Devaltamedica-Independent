import { useEffect, useCallback } from 'react';

export type HotkeyHandler = (event: KeyboardEvent) => void;

export interface HotkeyConfig {
  key: string;
  handler: HotkeyHandler;
  options?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    enabled?: boolean;
  };
}

export interface UseHotkeysOptions {
  enableOnFormTags?: boolean;
  enableOnContentEditable?: boolean;
  enabled?: boolean;
}

const parseKey = (key: string): { key: string; modifiers: string[] } => {
  const parts = key.toLowerCase().split('+');
  const actualKey = parts.pop() || '';
  const modifiers = parts;
  
  return { key: actualKey, modifiers };
};

const matchesModifiers = (event: KeyboardEvent, modifiers: string[]): boolean => {
  const requiredModifiers = new Set(modifiers);
  const activeModifiers = new Set();
  
  if (event.ctrlKey) activeModifiers.add('ctrl');
  if (event.altKey) activeModifiers.add('alt');
  if (event.shiftKey) activeModifiers.add('shift');
  if (event.metaKey) activeModifiers.add('meta');
  
  return (
    requiredModifiers.size === activeModifiers.size &&
    [...requiredModifiers].every(mod => activeModifiers.has(mod))
  );
};

export const useHotkeys = (
  hotkeys: HotkeyConfig[] | HotkeyConfig,
  options: UseHotkeysOptions = {}
): void => {
  const {
    enableOnFormTags = false,
    enableOnContentEditable = false,
    enabled = true,
  } = options;

  const hotkeyList = Array.isArray(hotkeys) ? hotkeys : [hotkeys];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const isContentEditable = target.contentEditable === 'true';

    // Skip if focused on form elements (unless explicitly enabled)
    if (!enableOnFormTags && ['input', 'textarea', 'select'].includes(tagName)) {
      return;
    }

    // Skip if in contentEditable element (unless explicitly enabled)
    if (!enableOnContentEditable && isContentEditable) {
      return;
    }

    for (const hotkeyConfig of hotkeyList) {
      if (hotkeyConfig.options?.enabled === false) continue;

      const { key, modifiers } = parseKey(hotkeyConfig.key);
      const eventKey = event.key.toLowerCase();

      if (eventKey === key && matchesModifiers(event, modifiers)) {
        if (hotkeyConfig.options?.preventDefault !== false) {
          event.preventDefault();
        }
        if (hotkeyConfig.options?.stopPropagation) {
          event.stopPropagation();
        }

        hotkeyConfig.handler(event);
        break; // Only trigger the first matching hotkey
      }
    }
  }, [hotkeyList, enabled, enableOnFormTags, enableOnContentEditable]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

// Convenience hook for single hotkey
export const useHotkey = (
  key: string,
  handler: HotkeyHandler,
  options?: HotkeyConfig['options'] & UseHotkeysOptions
): void => {
  const { enableOnFormTags, enableOnContentEditable, enabled, ...hotkeyOptions } = options || {};
  
  useHotkeys(
    { key, handler, options: hotkeyOptions },
    { enableOnFormTags, enableOnContentEditable, enabled }
  );
};