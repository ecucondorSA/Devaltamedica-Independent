import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Chunk Error Handler
 * Handles webpack chunk loading errors gracefully with retry logic
 */

export class ChunkLoadError extends Error {
  constructor(
    message: string,
    public readonly chunkId?: string,
  ) {
    super(message);
    this.name = 'ChunkLoadError';
  }
}

/**
 * Retry loading a failed chunk
 */
export function retryChunkLoad(
  fn: () => Promise<any>,
  retriesLeft = 3,
  interval = 1000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error: Error) => {
        // Check if it's a chunk load error
        if (
          retriesLeft > 0 &&
          (error.name === 'ChunkLoadError' ||
            error.message.includes('Loading chunk') ||
            error.message.includes('Failed to fetch'))
        ) {
          logger.warn(`Retrying chunk load, ${retriesLeft} attempts remaining...`);
          setTimeout(() => {
            retryChunkLoad(fn, retriesLeft - 1, interval).then(resolve, reject);
          }, interval);
        } else {
          reject(error);
        }
      });
  });
}

/**
 * Handle chunk load errors globally
 */
export function setupChunkErrorHandler() {
  if (typeof window === 'undefined') return;

  // Handle webpack chunk load errors
  window.addEventListener('error', (event) => {
    const { error } = event;

    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module')
    ) {
      logger.error('Chunk load error detected:', error);

      // Check if we're in development
      if (process.env.NODE_ENV === 'development') {
        // In development, try to reload with cache busting
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has('_retry')) {
          currentUrl.searchParams.set('_retry', Date.now().toString());
          logger.info('Reloading page with cache busting...');
          window.location.href = currentUrl.toString();
        }
      } else {
        // In production, show user-friendly message
        const shouldReload = window.confirm(
          'Hubo un problema al cargar algunos recursos. ¿Desea recargar la página?',
        );
        if (shouldReload) {
          window.location.reload();
        }
      }

      // Prevent default error handling
      event.preventDefault();
    }
  });

  // Handle promise rejections from dynamic imports
  window.addEventListener('unhandledrejection', (event) => {
    const { reason } = event;

    if (
      reason?.name === 'ChunkLoadError' ||
      reason?.message?.includes('Loading chunk') ||
      reason?.message?.includes('Failed to fetch dynamically imported module')
    ) {
      logger.error('Unhandled chunk load rejection:', reason);

      // In development, log detailed info
      if (process.env.NODE_ENV === 'development') {
        logger.info('Failed chunk details:', {
          message: reason.message,
          stack: reason.stack,
          timestamp: new Date().toISOString(),
        });
      }

      // Prevent default rejection handling
      event.preventDefault();
    }
  });
}

/**
 * Wrapper for dynamic imports with retry logic
 */
export function dynamicImportWithRetry<T = any>(
  importFn: () => Promise<{ default: T }>,
  componentName?: string,
): Promise<{ default: T }> {
  return retryChunkLoad(importFn).catch((error) => {
    logger.error(`Failed to load component ${componentName || 'unknown'}:`, error);

    // Return a fallback component
    return {
      default: (() => {
        const FallbackComponent = () => (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <p className="mb-2">Error al cargar el componente</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm underline hover:text-gray-700"
              >
                Recargar página
              </button>
            </div>
          </div>
        );
        return FallbackComponent;
      })() as T,
    };
  });
}

/**
 * Create a safe dynamic import function
 */
export function createSafeDynamic() {
  return function safeDynamic<T = any>(
    loader: () => Promise<{ default: T }>,
    options?: {
      loading?: () => React.JSX.Element | null;
      ssr?: boolean;
      componentName?: string;
    },
  ) {
    const wrappedLoader = () => dynamicImportWithRetry(loader, options?.componentName);

    // Return the loader with retry logic
    return {
      loader: wrappedLoader,
      loading: options?.loading,
      ssr: options?.ssr,
    };
  };
}
