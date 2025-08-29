/**
 * @fileoverview UserManagement - Gestión de usuarios con arquitectura 3 capas
 * @description Componente para CRUD de usuarios usando tipos simples + adaptadores
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Edit,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

import { AdapterUtils, userAdapter } from '../../adapters/admin-adapters';
import {
  AdminActionResult,
  LoadingState,
  PaginatedResponse,
  SimpleUser,
  UserFilters,
} from '../../types';

// ==================== INTERFACES ====================

interface UserManagementProps {
  className?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  // Estados usando tipos simples
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [usersResponse, setUsersResponse] = useState<PaginatedResponse<SimpleUser> | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    limit: 10,
    offset: 0,
  });
  const [loadingState, setLoadingState] = useState<LoadingState>({
    loading: true,
    error: undefined,
    lastUpdated: undefined,
  });
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ==================== EFECTOS ====================

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingState((prev) => ({ ...prev, loading: true, error: undefined }));

      try {
        // Simular llamada a API (en real vendría de @altamedica/api-client)
        const complexUsers = await fetchUsersData(filters);

        // Usar adaptador para convertir datos complejos a simples
        const simpleUsers = complexUsers.data.map((user) => userAdapter.toSimple(user));

        setUsers(simpleUsers);
        setUsersResponse({
          data: simpleUsers,
          total: complexUsers.total,
          page: Math.floor(filters.offset! / filters.limit!) + 1,
          limit: filters.limit!,
          hasNext: complexUsers.total > filters.offset! + filters.limit!,
          hasPrevious: filters.offset! > 0,
        });

        setLoadingState({
          loading: false,
          error: undefined,
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        setLoadingState({
          loading: false,
          error: error instanceof Error ? error.message : 'Error al cargar usuarios',
          lastUpdated: undefined,
        });
      }
    };
    void loadUsers();
  }, [filters]);

  // ==================== FUNCIONES ====================

  const loadUsers = async () => {
    setLoadingState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Simular llamada a API (en real vendría de @altamedica/api-client)
      const complexUsers = await fetchUsersData(filters);

      // Usar adaptador para convertir datos complejos a simples
      const simpleUsers = complexUsers.data.map((user) => userAdapter.toSimple(user));

      setUsers(simpleUsers);
      setUsersResponse({
        data: simpleUsers,
        total: complexUsers.total,
        page: Math.floor(filters.offset! / filters.limit!) + 1,
        limit: filters.limit!,
        hasNext: complexUsers.total > filters.offset! + filters.limit!,
        hasPrevious: filters.offset! > 0,
      });

      setLoadingState({
        loading: false,
        error: undefined,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      setLoadingState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar usuarios',
        lastUpdated: undefined,
      });
    }
  };

  // Simular fetch de usuarios (en real vendría de packages complejos)
  const fetchUsersData = async (filters: UserFilters) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockComplexUsers = [
      {
        id: '1',
        personalInfo: {
          fullName: 'Dr. María González',
          firstName: 'María',
          lastName: 'González',
        },
        contactInfo: { primaryEmail: 'maria.gonzalez@hospital.com' },
        authorization: { role: 'doctor' },
        status: 'active' as const,
        metadata: {
          lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
      },
      {
        id: '2',
        personalInfo: {
          fullName: 'Juan Pérez',
          firstName: 'Juan',
          lastName: 'Pérez',
        },
        contactInfo: { primaryEmail: 'juan.perez@email.com' },
        authorization: { role: 'patient' },
        status: 'active' as const,
        metadata: {
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
      },
      {
        id: '3',
        personalInfo: {
          fullName: 'Admin AltaMedica',
          firstName: 'Admin',
          lastName: 'AltaMedica',
        },
        contactInfo: { primaryEmail: 'admin@altamedica.com' },
        authorization: { role: 'super_admin' },
        status: 'active' as const,
        metadata: {
          lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        },
      },
    ];

    // Aplicar filtros
    let filteredUsers = mockComplexUsers;

    if (filters.search) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.personalInfo?.fullName?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.contactInfo?.primaryEmail?.toLowerCase().includes(filters.search!.toLowerCase()),
      );
    }

    if (filters.role) {
      filteredUsers = filteredUsers.filter((user) => user.authorization?.role === filters.role);
    }

    if (filters.status) {
      filteredUsers = filteredUsers.filter((user) => user.status === filters.status);
    }

    const total = filteredUsers.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 10;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      data: paginatedUsers,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasNext: total > offset + limit,
      hasPrevious: offset > 0,
    };
  };

  const handleUserAction = async (
    action: string,
    userId: string,
  ): Promise<AdminActionResult> => {
    try {
      // Simular acción de usuario (en real vendría de @altamedica/api-client)
      await new Promise((resolve) => setTimeout(resolve, 500));

      switch (action) {
        case 'suspend':
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, status: 'suspended' as const } : user,
            ),
          );
          break;
        case 'activate':
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, status: 'active' as const } : user,
            ),
          );
          break;
        case 'delete':
          setUsers((prev) => prev.filter((user) => user.id !== userId));
          break;
        default:
          throw new Error(`Acción no válida: ${action}`);
      }

      return {
        success: true,
        message: `Usuario ${action === 'delete' ? 'eliminado' : 'actualizado'} correctamente`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      };
    }
  };

  const handleViewUser = (user: SimpleUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleFilterChange = (key: keyof UserFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: key !== 'offset' ? 0 : (value as number), // Reset pagination when filter changes
    }));
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * filters.limit!;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  // ==================== RENDER HELPERS ====================

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Super Admin': 'bg-red-100 text-red-800 border-red-200',
      Admin: 'bg-red-100 text-red-800 border-red-200',
      Doctor: 'bg-blue-100 text-blue-800 border-blue-200',
      Patient: 'bg-green-100 text-green-800 border-green-200',
      Company: 'bg-purple-100 text-purple-800 border-purple-200',
      Staff: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderFilters = () => (
    <div className={`${showFilters ? 'block' : 'hidden'} mt-4 border-t pt-4`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
            Rol
          </label>
          <select
            id="role"
            value={filters.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="patient">Paciente</option>
            <option value="company">Empresa</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>

        <div>
          <label htmlFor="limit" className="mb-1 block text-sm font-medium text-gray-700">
            Elementos por página
          </label>
          <select
            id="limit"
            value={filters.limit || 10}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER PRINCIPAL ====================

  if (loadingState.loading && !users.length) {
    return (
      <Card className={className}>
        <CardContent className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Cargando usuarios...</span>
        </CardContent>
      </Card>
    );
  }

  if (loadingState.error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h2 className="mb-2 text-xl font-semibold text-red-900">Error al cargar usuarios</h2>
          <p className="mb-4 text-gray-600">{loadingState.error}</p>
          <button
            onClick={() => loadUsers()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              {loadingState.lastUpdated && (
                <p className="mt-1 text-xs text-gray-500">
                  Última actualización: {AdapterUtils.formatDate(loadingState.lastUpdated)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadUsers()}
                disabled={loadingState.loading}
                className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 ${loadingState.loading ? 'animate-spin' : ''}`}
                />
              </button>
              <button className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Búsqueda y filtros */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center rounded-lg border px-4 py-2 hover:bg-gray-50 ${
                showFilters ? 'border-gray-400 bg-gray-100' : 'border-gray-300'
              }`}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros {showFilters && '(activos)'}
            </button>
          </div>

          {renderFilters()}

          {/* Tabla de usuarios */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Última Actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRoleColor(
                          user.role,
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getStatusColor(
                          user.status,
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {AdapterUtils.formatDate(user.lastActivity)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          className="rounded p-1 text-green-600 hover:bg-green-50 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleUserAction('suspend', user.id)}
                            className="rounded p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900"
                            title="Suspender"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction('activate', user.id)}
                            className="rounded p-1 text-green-600 hover:bg-green-50 hover:text-green-900"
                            title="Activar"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleUserAction('delete', user.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {usersResponse && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {users.length} de {usersResponse.total} usuarios
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(usersResponse.page - 1)}
                  disabled={!usersResponse.hasPrevious}
                  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {usersResponse.page} de{' '}
                  {Math.ceil(usersResponse.total / usersResponse.limit)}
                </span>
                <button
                  onClick={() => handlePageChange(usersResponse.page + 1)}
                  disabled={!usersResponse.hasNext}
                  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles de usuario */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Usuario</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-xl font-medium text-gray-600">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="userName">
                  Nombre
                </label>
                <p className="text-sm text-gray-900" id="userName">
                  {selectedUser.name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="userEmail">
                  Email
                </label>
                <p className="text-sm text-gray-900" id="userEmail">
                  {selectedUser.email}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="userId">
                  ID
                </label>
                <p className="font-mono text-xs text-gray-500" id="userId">
                  {selectedUser.id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="userRole">
                  Rol
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRoleColor(
                      selectedUser.role,
                    )}`}
                    id="userRole"
                  >
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="userStatus">
                  Estado
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getStatusColor(
                      selectedUser.status,
                    )}`}
                    id="userStatus"
                  >
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="lastActivity">
                  Última Actividad
                </label>
                <p className="text-sm text-gray-900" id="lastActivity">
                  {AdapterUtils.formatDate(selectedUser.lastActivity)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="createdAt">
                  Fecha de Registro
                </label>
                <p className="text-sm text-gray-900" id="createdAt">
                  {AdapterUtils.formatDate(selectedUser.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                Editar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
