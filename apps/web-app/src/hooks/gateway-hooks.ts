// Gateway-specific React Hooks for Web-App (Phase 1)
// Only hooks needed for authentication gateway functionality

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gatewayAPI, AuthResponse, GlobalNotification, HealthStatus, setAuthToken, clearAuthToken } from '@/lib/gateway-api-client'

import { logger } from '@altamedica/shared/services/logger.service';
// 🔐 Authentication Hooks (Gateway Core Function)
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: gatewayAPI.auth.me,
    retry: false,
    staleTime: Infinity
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gatewayAPI.auth.login,
    onSuccess: (data: AuthResponse) => {
      setAuthToken(data.token)
      queryClient.setQueryData(['auth', 'me'], data.user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      // Log successful login
      logger.info('✅ [Gateway] Login successful:', {
        userId: data.user.id,
        role: data.user.role,
        expiresIn: data.expiresIn
      })
    },
    onError: (error: any) => {
      logger.error('❌ [Gateway] Login failed:', error)
      clearAuthToken()
    }
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gatewayAPI.auth.register,
    onSuccess: (data: AuthResponse) => {
      setAuthToken(data.token)
      queryClient.setQueryData(['auth', 'me'], data.user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      logger.info('✅ [Gateway] Registration successful:', {
        userId: data.user.id,
        role: data.user.role
      })
    },
    onError: (error: any) => {
      logger.error('❌ [Gateway] Registration failed:', error)
    }
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gatewayAPI.auth.logout,
    onSuccess: () => {
      clearAuthToken()
      queryClient.clear()
      
      logger.info('✅ [Gateway] Logout successful')
      
      // Redirect to login
      window.location.href = '/auth/login'
    },
    onError: (error: any) => {
      logger.error('❌ [Gateway] Logout error:', error)
      // Force logout anyway
      clearAuthToken()
      queryClient.clear()
      window.location.href = '/auth/login'
    }
  })
}

export function useRefreshToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gatewayAPI.auth.refresh,
    onSuccess: (data: { token: string }) => {
      setAuthToken(data.token)
      logger.info('✅ [Gateway] Token refreshed successfully')
    },
    onError: (error: any) => {
      logger.error('❌ [Gateway] Token refresh failed:', error)
      clearAuthToken()
      window.location.href = '/auth/login'
    }
  })
}

// 🏥 Health Check Hooks (System Monitoring)
export function useHealthStatus() {
  return useQuery({
    queryKey: ['health', 'status'],
    queryFn: gatewayAPI.health.status,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
    retry: 3
  })
}

export function useSystemVersion() {
  return useQuery({
    queryKey: ['health', 'version'],
    queryFn: gatewayAPI.health.version,
    staleTime: 5 * 60 * 1000, // 5 minutes - version rarely changes
    retry: false
  })
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['health', 'metrics'],
    queryFn: gatewayAPI.health.metrics,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Every 2 minutes
    enabled: process.env.NODE_ENV === 'development' // Only in development
  })
}

// 🔔 Global Notifications Hooks (Cross-App Communication)
export function useGlobalNotifications() {
  return useQuery({
    queryKey: ['notifications', 'global'],
    queryFn: () => gatewayAPI.notifications.global(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute for global alerts
    retry: 2
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gatewayAPI.notifications.markRead(id),
    onSuccess: (_, id) => {
      // Optimistically update the notifications list
      queryClient.setQueryData(['notifications', 'global'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((notification: GlobalNotification) =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        }
      })
      
      logger.info('✅ [Gateway] Notification marked as read:', id)
    },
    onError: (error: any) => {
      logger.error('❌ [Gateway] Failed to mark notification as read:', error)
    }
  })
}

// 🔧 Gateway-specific utility hooks
export function useRoleRedirection() {
  const { data: user, isLoading } = useAuth()
  
  return {
    user,
    isLoading,
    shouldRedirect: (currentPath: string) => {
      if (!user || isLoading) return false
      
      // Only patients stay in web-app
      if (user.role === 'patient') return false
      
      // Other roles should be redirected from protected paths
      const protectedPaths = ['/dashboard', '/profile', '/appointments', '/settings']
      return protectedPaths.some(path => currentPath.startsWith(path))
    },
    getRedirectUrl: () => {
      if (!user) return '/auth/login'
      
      const urls = {
        patient: '/dashboard', // Stay in web-app
        doctor: 'http://localhost:3002/dashboard',
        company: 'http://localhost:3004/dashboard',
        admin: 'http://localhost:3005/dashboard'
      }
      
      return urls[user.role] || '/auth/login'
    }
  }
}

// 📊 Migration tracking hook (for development)
export function useMigrationStatus() {
  return useQuery({
    queryKey: ['migration', 'status'],
    queryFn: () => gatewayAPI.health.metrics(), // Will include migration info
    enabled: process.env.NODE_ENV === 'development',
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000 // Every 30 seconds during development
  })
}

// 🧪 Testing hook for endpoint validation
export function useEndpointTest() {
  return useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await fetch(`http://localhost:3001/api${endpoint}`)
      return {
        endpoint,
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString()
      }
    },
    onSuccess: (data) => {
      logger.info('🧪 [Testing] Endpoint test result:', data)
    }
  })
}