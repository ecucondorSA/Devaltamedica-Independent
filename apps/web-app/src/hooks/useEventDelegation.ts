'use client'
import { useEffect, useRef, useCallback } from 'react'

import { logger } from '@altamedica/shared/services/logger.service';
interface EventDelegationConfig {
  // Selectores de elementos que deben pasar eventos
  passThrough?: string[]
  // Selectores de elementos que deben bloquear eventos
  blockEvents?: string[]
  // Callbacks para diferentes tipos de eventos
  onSceneInteraction?: (event: MouseEvent | TouchEvent) => void
  onUIInteraction?: (event: MouseEvent | TouchEvent) => void
  // Configuración de touch
  enableTouchPassthrough?: boolean
  // Configuración de mouse
  enableMousePassthrough?: boolean
  // Configuración específica para dispositivos móviles
  mobileConfig?: {
    preventScroll?: boolean
    preventZoom?: boolean
    preventContextMenu?: boolean
  }
  // Configuración de debug
  debug?: boolean
}

export function useEventDelegation(config: EventDelegationConfig = {}) {
  const {
    passThrough = ['.scene-3d', 'canvas'],
    blockEvents = ['.ui-panel', '.control-panel', '.overlay-ui', 'button', 'input', 'select', 'textarea'],
    onSceneInteraction,
    onUIInteraction,
    enableTouchPassthrough = true,
    enableMousePassthrough = true,
    mobileConfig = {
      preventScroll: false,
      preventZoom: false,
      preventContextMenu: true
    },
    debug = false
  } = config

  const eventListenersRef = useRef<Array<() => void>>([])
  const isInteractingRef = useRef(false)
  const lastInteractionTypeRef = useRef<'mouse' | 'touch' | null>(null)

  // Función para verificar si un elemento debe bloquear eventos
  const shouldBlockEvent = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    return blockEvents.some(selector => {
      try {
        return target.closest(selector) !== null
      } catch (e) {
        // Si el selector no es válido, verificar por className o tagName
        if (selector.startsWith('.')) {
          return target.classList.contains(selector.slice(1))
        } else {
          return target.tagName.toLowerCase() === selector.toLowerCase()
        }
      }
    })
  }, [blockEvents])

  // Función para verificar si un elemento debe pasar eventos
  const shouldPassThrough = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    return passThrough.some(selector => {
      try {
        return target.closest(selector) !== null
      } catch (e) {
        // Si el selector no es válido, verificar por className o tagName
        if (selector.startsWith('.')) {
          return target.classList.contains(selector.slice(1))
        } else {
          return target.tagName.toLowerCase() === selector.toLowerCase()
        }
      }
    })
  }, [passThrough])

  // Manejador de eventos de mouse
  const handleMouseEvent = useCallback((event: MouseEvent) => {
    const target = event.target
    
    if (debug) {
      logger.info('Mouse event:', event.type, 'Target:', target)
    }

    if (shouldBlockEvent(target)) {
      if (debug) {
        logger.info('Blocking mouse event for UI element')
      }
      onUIInteraction?.(event)
      return
    }

    if (shouldPassThrough(target) && enableMousePassthrough) {
      if (debug) {
        logger.info('Passing through mouse event to scene')
      }
      onSceneInteraction?.(event)
      lastInteractionTypeRef.current = 'mouse'
      
      // Marcar como interactuando para eventos de mouse
      if (event.type === 'mousedown') {
        isInteractingRef.current = true
      } else if (event.type === 'mouseup') {
        isInteractingRef.current = false
      }
    }
  }, [shouldBlockEvent, shouldPassThrough, enableMousePassthrough, onSceneInteraction, onUIInteraction, debug])

  // Manejador de eventos de touch
  const handleTouchEvent = useCallback((event: TouchEvent) => {
    const target = event.target
    
    if (debug) {
      logger.info('Touch event:', event.type, 'Target:', target)
    }

    if (shouldBlockEvent(target)) {
      if (debug) {
        logger.info('Blocking touch event for UI element')
      }
      onUIInteraction?.(event)
      return
    }

    if (shouldPassThrough(target) && enableTouchPassthrough) {
      if (debug) {
        logger.info('Passing through touch event to scene')
      }
      onSceneInteraction?.(event)
      lastInteractionTypeRef.current = 'touch'
      
      // Marcar como interactuando para eventos de touch
      if (event.type === 'touchstart') {
        isInteractingRef.current = true
      } else if (event.type === 'touchend') {
        isInteractingRef.current = false
      }

      // Aplicar configuración móvil
      if (mobileConfig.preventScroll && event.type === 'touchmove') {
        event.preventDefault()
      }
      
      if (mobileConfig.preventZoom && event.touches.length > 1) {
        event.preventDefault()
      }
    }
  }, [shouldBlockEvent, shouldPassThrough, enableTouchPassthrough, onSceneInteraction, onUIInteraction, mobileConfig, debug])

  // Manejador de eventos de contexto (click derecho)
  const handleContextMenu = useCallback((event: MouseEvent) => {
    const target = event.target
    
    if (shouldPassThrough(target) && mobileConfig.preventContextMenu) {
      event.preventDefault()
    }
  }, [shouldPassThrough, mobileConfig])

  // Manejador de eventos de rueda (wheel)
  const handleWheelEvent = useCallback((event: WheelEvent) => {
    const target = event.target
    
    if (shouldBlockEvent(target)) {
      return // Permitir scroll normal en elementos UI
    }

    if (shouldPassThrough(target)) {
      // Permitir zoom en la escena 3D
      onSceneInteraction?.(event as any)
    }
  }, [shouldBlockEvent, shouldPassThrough, onSceneInteraction])

  // Configurar event listeners
  useEffect(() => {
    // Limpiar listeners anteriores
    eventListenersRef.current.forEach(cleanup => cleanup())
    eventListenersRef.current = []

    // Eventos de mouse
    if (enableMousePassthrough) {
      const mouseEvents = ['mousedown', 'mousemove', 'mouseup', 'click'] as const
      mouseEvents.forEach(eventType => {
        const handler = (event: MouseEvent) => handleMouseEvent(event)
        document.addEventListener(eventType, handler, { passive: false })
        eventListenersRef.current.push(() => document.removeEventListener(eventType, handler))
      })
    }

    // Eventos de touch
    if (enableTouchPassthrough) {
      const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const
      touchEvents.forEach(eventType => {
        const handler = (event: TouchEvent) => handleTouchEvent(event)
        document.addEventListener(eventType, handler, { passive: false })
        eventListenersRef.current.push(() => document.removeEventListener(eventType, handler))
      })
    }

    // Evento de contexto
    const contextHandler = (event: MouseEvent) => handleContextMenu(event)
    document.addEventListener('contextmenu', contextHandler)
    eventListenersRef.current.push(() => document.removeEventListener('contextmenu', contextHandler))

    // Evento de rueda
    const wheelHandler = (event: WheelEvent) => handleWheelEvent(event)
    document.addEventListener('wheel', wheelHandler, { passive: false })
    eventListenersRef.current.push(() => document.removeEventListener('wheel', wheelHandler))

    // Cleanup al desmontar
    return () => {
      eventListenersRef.current.forEach(cleanup => cleanup())
      eventListenersRef.current = []
    }
  }, [enableMousePassthrough, enableTouchPassthrough, handleMouseEvent, handleTouchEvent, handleContextMenu, handleWheelEvent])

  // Función para verificar si actualmente se está interactuando
  const isInteracting = useCallback(() => {
    return isInteractingRef.current
  }, [])

  // Función para obtener el tipo de interacción actual
  const getInteractionType = useCallback(() => {
    return lastInteractionTypeRef.current
  }, [])

  // Función para forzar la limpieza de estado de interacción
  const clearInteractionState = useCallback(() => {
    isInteractingRef.current = false
    lastInteractionTypeRef.current = null
  }, [])

  // Función para verificar si el dispositivo es móvil
  const isMobile = useCallback(() => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  return {
    isInteracting,
    getInteractionType,
    clearInteractionState,
    isMobile,
    // Funciones de utilidad
    shouldBlockEvent,
    shouldPassThrough
  }
}
