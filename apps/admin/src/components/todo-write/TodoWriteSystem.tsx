/**
 * TODO-WRITE SYSTEM - ALTAMEDICA
 * Sistema de gestión de tareas y documentación técnica
 * Implementado por Claude bajo supervisión de ChatGPT-5
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface TodoTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'review' | 'completed';
  category: 'development' | 'testing' | 'documentation' | 'deployment' | 'maintenance';
  assignedTo: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  comments: TaskComment[];
  tags: string[];
  estimatedHours: number;
  actualHours: number;
  hipaaCompliant: boolean;
  medicalContext?: {
    isEmergency: boolean;
    patientImpact: 'none' | 'low' | 'medium' | 'high';
    complianceRequired: boolean;
  };
}

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  isInternal: boolean;
}

export interface TodoMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  productivityScore: number;
  hipaaComplianceRate: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const TodoWriteSystem: React.FC = () => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<TodoMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    averageCompletionTime: 0,
    productivityScore: 0,
    hipaaComplianceRate: 100,
  });

  // ============================================================================
  // FUNCIONES PRINCIPALES
  // ============================================================================

  const _createTask = (taskData: Omit<TodoTask, 'id' | 'createdAt' | 'comments'>) => {
    const newTask: TodoTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      comments: [],
    };
    setTasks((prev) => [...prev, newTask]);
    setShowCreateModal(false);
    updateMetrics();
  };

  const _updateTask = (taskId: string, updates: Partial<TodoTask>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
    setShowEditModal(false);
    updateMetrics();
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      updateMetrics();
    }
  };

  const _addComment = (taskId: string, comment: Omit<TaskComment, 'id' | 'timestamp'>) => {
    const newComment: TaskComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      timestamp: new Date(),
    };

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, comments: [...task.comments, newComment] } : task,
      ),
    );
  };

  const updateMetrics = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date() > t.dueDate && t.status !== 'completed',
    ).length;

    const avgCompletionTime =
      completed > 0
        ? tasks
            .filter((t) => t.status === 'completed' && t.completedAt)
            .reduce((acc, t) => {
              const completionTime = t.completedAt!.getTime() - t.createdAt.getTime();
              return acc + completionTime;
            }, 0) /
          completed /
          (1000 * 60 * 60) // Convertir a horas
        : 0;

    const productivityScore = total > 0 ? (completed / total) * 100 : 0;
    const hipaaComplianceRate =
      total > 0 ? (tasks.filter((t) => t.hipaaCompliant).length / total) * 100 : 100;

    setMetrics({
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      averageCompletionTime: avgCompletionTime,
      productivityScore,
      hipaaComplianceRate,
    });
  };

  // ============================================================================
  // FILTROS Y BÚSQUEDA
  // ============================================================================

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesCategory = filters.category === 'all' || task.category === filters.category;
    const matchesAssigned = filters.assignedTo === 'all' || task.assignedTo === filters.assignedTo;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned;
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header del Sistema */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 TODO-WRITE SYSTEM</h1>
        <p className="text-gray-600">
          Sistema de gestión de tareas y documentación técnica para AltaMedica
        </p>
      </div>

      {/* Métricas del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tareas en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.productivityScore.toFixed(1)}% productividad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">{metrics.overdueTasks} vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HIPAA Compliance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.hipaaComplianceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Cumplimiento médico</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles y Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in-progress">En progreso</option>
              <option value="review">En revisión</option>
              <option value="completed">Completada</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Tareas del Sistema</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay tareas que coincidan con los filtros</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : task.status === 'review'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{task.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {task.assignedTo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : 'Sin fecha límite'}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {task.estimatedHours}h estimadas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modales - Claude debe implementar */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Crear Nueva Tarea</h3>
            <p className="text-gray-600 mb-4">
              Claude debe implementar el formulario de creación de tareas
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Editar Tarea</h3>
            <p className="text-gray-600 mb-4">
              Claude debe implementar el formulario de edición de tareas
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoWriteSystem;
