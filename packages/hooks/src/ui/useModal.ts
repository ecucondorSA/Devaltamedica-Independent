/**
 * @fileoverview Hook básico para modales
 */

import { useDisclosure } from './useDisclosure';

export function useModal() {
  return useDisclosure();
}