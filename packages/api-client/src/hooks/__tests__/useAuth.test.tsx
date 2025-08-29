/**
 * 🧪 TESTS - AUTH HOOKS
 * Tests unitarios para los hooks de autenticación
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  useLogin, 
  useLogout, 
  useCurrentUser, 
  useRegister,
  useUpdateProfile 
} from '../useAuth';
import { createApiClient } from '../../client';

// Mock del cliente API
vi.mock('../../client', () => ({
  getApiClient: vi.fn(() => ({
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    setAccessToken: vi.fn(),
  })),
  createApiClient: vi.fn(),
}));

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe realizar login exitosamente', async () => {
    const mockResponse = {
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        id: '123',
        email: 'test@altamedica.com',
        name: 'Test User',
        role: 'patient',
      },
    };

    const mockApiClient = {
      post: vi.fn().mockResolvedValue(mockResponse),
      setAccessToken: vi.fn(),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@altamedica.com',
        password: 'password123',
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      { email: 'test@altamedica.com', password: 'password123' },
      { skipAuth: true }
    );

    expect(mockApiClient.setAccessToken).toHaveBeenCalledWith('test-token');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockResponse);
  });

  it('debe manejar errores de login', async () => {
    const mockError = new Error('Invalid credentials');
    const mockApiClient = {
      post: vi.fn().mockRejectedValue(mockError),
      setAccessToken: vi.fn(),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'test@altamedica.com',
          password: 'wrong-password',
        });
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useCurrentUser', () => {
  it('debe obtener el usuario actual', async () => {
    const mockUser = {
      id: '123',
      email: 'test@altamedica.com',
      name: 'Test User',
      role: 'patient',
      avatar: 'https://example.com/avatar.jpg',
      phone: '+1234567890',
      verified: true,
      createdAt: '2024-01-01T00:00:00Z',
    };

    const mockApiClient = {
      get: vi.fn().mockResolvedValue(mockUser),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({ validate: expect.any(Function) })
    );

    expect(result.current.data).toEqual(mockUser);
  });

  it('debe manejar usuario no autenticado', async () => {
    const mockError = { statusCode: 401, message: 'Unauthorized' };
    const mockApiClient = {
      get: vi.fn().mockRejectedValue(mockError),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useLogout', () => {
  it('debe cerrar sesión correctamente', async () => {
    const mockApiClient = {
      post: vi.fn().mockResolvedValue({}),
      setAccessToken: vi.fn(),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    expect(mockApiClient.setAccessToken).toHaveBeenCalledWith(null);
    expect(clearSpy).toHaveBeenCalled();
  });
});

describe('useRegister', () => {
  it('debe registrar un nuevo usuario', async () => {
    const mockResponse = {
      accessToken: 'new-user-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        id: '456',
        email: 'newuser@altamedica.com',
        name: 'New User',
        role: 'patient',
      },
    };

    const mockApiClient = {
      post: vi.fn().mockResolvedValue(mockResponse),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    const registerData = {
      email: 'newuser@altamedica.com',
      password: 'securePassword123',
      name: 'New User',
      role: 'patient' as const,
      phone: '+1234567890',
    };

    await act(async () => {
      await result.current.mutateAsync(registerData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      registerData,
      { skipAuth: true }
    );

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockResponse);
  });
});

describe('useUpdateProfile', () => {
  it('debe actualizar el perfil del usuario', async () => {
    const mockApiClient = {
      put: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    const profileData = {
      name: 'Updated Name',
      phone: '+9876543210',
    };

    await act(async () => {
      await result.current.mutateAsync(profileData);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/api/v1/users/updateProfile',
      profileData
    );

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['user', 'current'],
    });
  });
});

describe('Integration: Auth Flow', () => {
  it('debe completar flujo completo de autenticación', async () => {
    const mockApiClient = {
      post: vi.fn(),
      get: vi.fn(),
      setAccessToken: vi.fn(),
    };

    // Mock login response
    mockApiClient.post.mockResolvedValueOnce({
      accessToken: 'auth-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        id: '789',
        email: 'integration@altamedica.com',
        name: 'Integration Test',
        role: 'patient',
      },
    });

    // Mock current user response
    mockApiClient.get.mockResolvedValueOnce({
      id: '789',
      email: 'integration@altamedica.com',
      name: 'Integration Test',
      role: 'patient',
      verified: true,
      createdAt: '2024-01-01T00:00:00Z',
    });

    vi.mocked(createApiClient).mockReturnValue(mockApiClient as any);

    const { result: loginResult } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    // Step 1: Login
    await act(async () => {
      await loginResult.current.mutateAsync({
        email: 'integration@altamedica.com',
        password: 'testPassword123',
      });
    });

    expect(mockApiClient.setAccessToken).toHaveBeenCalledWith('auth-token');

    // Step 2: Get current user
    const { result: userResult } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(userResult.current.isSuccess).toBe(true);
    });

    expect(userResult.current.data?.email).toBe('integration@altamedica.com');
  });
});