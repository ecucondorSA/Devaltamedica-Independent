/**
 * @fileoverview Hook para manejar estados de disclosure (modales, etc)
 */

import { useState, useCallback } from 'react';

export interface UseDisclosureOptions {
  defaultIsOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDisclosure(options: UseDisclosureOptions = {}) {
  const [isOpen, setIsOpen] = useState(options.defaultIsOpen || false);

  const onOpen = useCallback(() => {
    setIsOpen(true);
    options.onOpen?.();
  }, [options]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  const onToggle = useCallback(() => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  }, [isOpen, onClose, onOpen]);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  };
}