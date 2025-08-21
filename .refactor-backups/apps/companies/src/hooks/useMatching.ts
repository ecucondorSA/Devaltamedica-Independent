// hooks/useMatching.ts
// Extensión de los hooks existentes de companies para incluir matching B2B

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import { logger } from '@altamedica/shared/services/logger.service';
// =====================================
// TIPOS PARA MATCHING
// =====================================

export interface Company {
  id: string
  name: string
  type: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy'
  location: {
    city: string
    state: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  specialties: string[]
  capacity: {
    beds?: number
    staff: number
    emergencyCapacity: boolean
  }
  rating?: number
  contact: {
    phone: string
    email: string
    website?: string
  }
}

export interface MatchRequest {
  requesting_company_id: string
  match_type: 'partnership' | 'referral' | 'equipment' | 'emergency'
  specialty_needed: string
  urgency_level: 'low' | 'medium' | 'high' | 'emergency'
  patient_condition?: string
  geographic_radius: number
  budget_range?: {
    min: number
    max: number
  }
}

export interface MatchResult {
  match_id: string
  requesting_company: Company
  matched_company: Company
  match_score: number
  match_reasons: string[]
  estimated_cost?: number
  availability: {
    emergency_beds: number
    next_appointment: string
    response_time: string
    working_hours: Record<string, any>
  }
  next_steps: string[]
}

export interface Partnership {
  id: string
  company1_id: string
  company2_id: string
  partnership_type: string
  status: 'pending' | 'active' | 'paused' | 'ended'
  terms: Record<string, any>
  created_at: string
  revenue_share?: number
}

// =====================================
// SERVICIOS DE MATCHING
// =====================================

class MatchingService {
  private baseUrl = 'http://localhost:8889' // Matching engine

  async findMatches(request: MatchRequest): Promise<MatchResult[]> {
    const response = await fetch(`${this.baseUrl}/api/matching/find-partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`Error finding matches: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getRecommendations(companyId: string, limit: number = 5): Promise<MatchResult[]> {
    const response = await fetch(
      `${this.baseUrl}/api/matching/companies/${companyId}/recommendations?limit=${limit}`
    )
    
    if (!response.ok) {
      throw new Error(`Error getting recommendations: ${response.statusText}`)
    }
    
    return response.json()
  }

  async createPartnership(partnershipData: Partial<Partnership>): Promise<Partnership> {
    const response = await fetch(`${this.baseUrl}/api/matching/partnership/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partnershipData)
    })
    
    if (!response.ok) {
      throw new Error(`Error creating partnership: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Integración con el backend de Next.js existente
  async syncWithCompaniesAPI(matchResult: MatchResult): Promise<void> {
    await fetch('/api/companies/partnerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company1_id: matchResult.requesting_company.id,
        company2_id: matchResult.matched_company.id,
        match_score: matchResult.match_score,
        match_data: matchResult
      })
    })
  }
}

const matchingService = new MatchingService()

// =====================================
// HOOKS DE MATCHING
// =====================================

/**
 * Hook para buscar matches médicos
 */
export function useFindMatches() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: MatchRequest) => matchingService.findMatches(request),
    onSuccess: (matches) => {
      // Cache los matches para uso posterior
      matches.forEach(match => {
        queryClient.setQueryData(['match', match.match_id], match)
      })
    }
  })
}

/**
 * Hook para obtener recomendaciones proactivas
 */
export function useMatchingRecommendations(companyId: string) {
  return useQuery({
    queryKey: ['matching-recommendations', companyId],
    queryFn: () => matchingService.getRecommendations(companyId),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 5 * 60 * 1000 // Refetch cada 5 minutos
  })
}

/**
 * Hook para crear partnerships
 */
export function useCreatePartnership() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (partnershipData: Partial<Partnership>) => 
      matchingService.createPartnership(partnershipData),
    onSuccess: (partnership) => {
      queryClient.invalidateQueries({ queryKey: ['partnerships'] })
      queryClient.setQueryData(['partnership', partnership.id], partnership)
    }
  })
}

/**
 * Hook para gestión de partnerships existentes
 */
export function usePartnerships(companyId: string) {
  return useQuery({
    queryKey: ['partnerships', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/partnerships`)
      if (!response.ok) throw new Error('Error loading partnerships')
      return response.json()
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook para matching en tiempo real con WebSocket
 */
export function useRealTimeMatching(companyId: string) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    if (!companyId) return

    const ws = new WebSocket(`ws://localhost:8889/ws/matching/${companyId}`)
    
    ws.onopen = () => {
      setConnectionStatus('connected')
      logger.info('🔗 Conectado a matching en tiempo real')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'new_match') {
        // Actualizar matches disponibles
        logger.info('🎯 Nuevo match disponible:', data)
        // Podrías disparar una notificación aquí
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      logger.info('🔌 Desconectado del matching en tiempo real')
    }

    ws.onerror = (error) => {
      logger.error('❌ Error en WebSocket matching:', error)
      setConnectionStatus('disconnected')
    }

    return () => {
      ws.close()
    }
  }, [companyId])

  return {
    matches,
    connectionStatus,
    isConnected: connectionStatus === 'connected'
  }
}

/**
 * Hook para análisis de matching performance
 */
export function useMatchingAnalytics(companyId: string, period: string = 'monthly') {
  return useQuery({
    queryKey: ['matching-analytics', companyId, period],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/matching-analytics?period=${period}`)
      if (!response.ok) throw new Error('Error loading matching analytics')
      return response.json()
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000 // 30 minutos
  })
}

/**
 * Hook de configuración de matching preferences
 */
export function useMatchingPreferences(companyId: string) {
  const queryClient = useQueryClient()

  const { data: preferences } = useQuery({
    queryKey: ['matching-preferences', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/matching-preferences`)
      if (!response.ok) throw new Error('Error loading preferences')
      return response.json()
    },
    enabled: !!companyId
  })

  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: any) => {
      const response = await fetch(`/api/companies/${companyId}/matching-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })
      if (!response.ok) throw new Error('Error updating preferences')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matching-preferences', companyId] })
    }
  })

  return {
    preferences,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending
  }
}

/**
 * Hook maestro que combina múltiples funcionalidades de matching
 */
export function useCompanyMatching(companyId: string) {
  const findMatches = useFindMatches()
  const recommendations = useMatchingRecommendations(companyId)
  const partnerships = usePartnerships(companyId)
  const realTimeMatching = useRealTimeMatching(companyId)
  const analytics = useMatchingAnalytics(companyId)
  const { preferences, updatePreferences } = useMatchingPreferences(companyId)

  const searchForPartners = useCallback(async (request: Omit<MatchRequest, 'requesting_company_id'>) => {
    return findMatches.mutateAsync({
      ...request,
      requesting_company_id: companyId
    })
  }, [companyId, findMatches])

  return {
    // Búsqueda de matches
    searchForPartners,
    isSearching: findMatches.isPending,
    
    // Recomendaciones proactivas
    recommendations: recommendations.data || [],
    isLoadingRecommendations: recommendations.isLoading,
    
    // Partnerships existentes
    partnerships: partnerships.data || [],
    isLoadingPartnerships: partnerships.isLoading,
    
    // Tiempo real
    realTimeMatching,
    
    // Analytics
    analytics: analytics.data,
    isLoadingAnalytics: analytics.isLoading,
    
    // Preferencias
    preferences,
    updatePreferences,
    
    // Estados globales
    hasError: findMatches.isError || recommendations.isError || partnerships.isError,
    error: findMatches.error || recommendations.error || partnerships.error
  }
}

// =====================================
// HOOKS DE UTILIDAD
// =====================================

/**
 * Hook para calcular compatibility score entre dos empresas
 */
export function useCompatibilityScore(company1Id: string, company2Id: string) {
  return useQuery({
    queryKey: ['compatibility-score', company1Id, company2Id],
    queryFn: async () => {
      const response = await fetch(`/api/matching/compatibility/${company1Id}/${company2Id}`)
      if (!response.ok) throw new Error('Error calculating compatibility')
      return response.json()
    },
    enabled: !!company1Id && !!company2Id,
    staleTime: 15 * 60 * 1000
  })
}

/**
 * Hook para notificaciones de matching
 */
export function useMatchingNotifications(companyId: string) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Implementar lógica de notificaciones
    // Podría usar Server-Sent Events o polling
  }, [companyId])

  return {
    notifications,
    markAsRead: (notificationId: string) => {
      // Implementar marcar como leído
    },
    clearAll: () => setNotifications([])
  }
}

export default {
  useFindMatches,
  useMatchingRecommendations,
  useCreatePartnership,
  usePartnerships,
  useRealTimeMatching,
  useMatchingAnalytics,
  useMatchingPreferences,
  useCompanyMatching,
  useCompatibilityScore,
  useMatchingNotifications
}
