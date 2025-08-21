/**
import { logger } from '@altamedica/shared/services/logger.service';

 * Development utility to handle ChunkLoadError
 * This should only be used in development mode
 */

interface ChunkErrorHandlerOptions {
  /** Maximum number of retries before giving up */
  maxRetries?: number;
  /** Show user notification on error */
  showNotification?: boolean;
  /** Custom notification message */
  notificationMessage?: string;
}

/**
 * Attaches a global error handler for ChunkLoadError
 * Should be called once in the root layout in development mode
 */
export function attachChunkErrorHandler(options: ChunkErrorHandlerOptions = {}) {
  if (typeof window === 'undefined') return;
  
  const {
    maxRetries = 3,
    showNotification = true,
    notificationMessage = 'Actualizando la aplicación...'
  } = options;

  // Track retry attempts per chunk
  const retryAttempts = new Map<string, number>();

  window.addEventListener('error', (event) => {
    if (event.error?.name === 'ChunkLoadError') {
      const chunkId = event.error.message || 'unknown';
      const attempts = retryAttempts.get(chunkId) || 0;

      if (attempts < maxRetries) {
        retryAttempts.set(chunkId, attempts + 1);
        
        // Show notification if enabled
        if (showNotification && attempts === 0) {
          showReloadNotification(notificationMessage);
        }

        // Reload with cache bypass
        const url = new URL(window.location.href);
        url.searchParams.set('nocache', Date.now().toString());
        window.location.replace(url.toString());
      } else {
        // Max retries reached, show error
        logger.error('ChunkLoadError: Max retries reached for chunk:', chunkId);
        
        if (showNotification) {
          showReloadNotification(
            'Error al cargar la aplicación. Por favor, recarga la página manualmente.',
            true
          );
        }
      }
    }
  });
}

/**
 * Shows a notification to the user about the reload
 */
function showReloadNotification(message: string, isError = false) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('chunk-error-notification');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'chunk-error-notification';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${isError ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(container);
  }
  
  container.textContent = message;
  container.style.background = isError ? '#ef4444' : '#3b82f6';
  
  // Auto-hide after 5 seconds if not an error
  if (!isError) {
    setTimeout(() => {
      container?.remove();
    }, 5000);
  }
}

/**
 * Inline script to inject into HTML for immediate error handling
 * Use this in development builds only
 */
export const CHUNK_ERROR_HANDLER_SCRIPT = `
<script>
(function() {
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('error', function(e) {
      if (e.error && e.error.name === 'ChunkLoadError') {
        const url = new URL(window.location.href);
        url.searchParams.set('nocache', Date.now());
        window.location.replace(url.toString());
      }
    });
  }
})();
</script>
`;