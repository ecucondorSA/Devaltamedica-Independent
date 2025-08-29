# 🎯 INSTRUCCIONES DE IMPLEMENTACIÓN PARA CLAUDE - ALTAMEDICA

**Responsable**: Claude Opus (Implementador Estratégico Delegado)
**Supervisor**: ChatGPT-5 (Líder Técnico Principal)
**Proyecto**: AltaMedica - Sistema Todo-Write
**Timeline**: 2 horas para implementación completa

---

## 📋 **TAREA PRINCIPAL: COMPLETAR SISTEMA TODO-WRITE**

### 🎯 **OBJETIVO**:

Completar la implementación del sistema de gestión de tareas y documentación técnica para AltaMedica, implementando las funcionalidades faltantes que ChatGPT-5 ha diseñado.

### 🔧 **ESTADO ACTUAL**:

- ✅ **Estructura base** del sistema implementada
- ✅ **Interfaces y tipos** definidos
- ✅ **Lógica de negocio** implementada
- ✅ **UI principal** y métricas funcionando
- ❌ **Formularios de creación/edición** pendientes de implementar
- ❌ **Sistema de comentarios** pendiente de implementar
- ❌ **Validaciones** pendientes de implementar

---

## 🚀 **FUNCIONALIDADES A IMPLEMENTAR**:

### **1. FORMULARIO DE CREACIÓN DE TAREAS**

**Archivo**: `apps/admin/src/components/todo-write/TodoWriteSystem.tsx`
**Ubicación**: Línea ~400 (modal de creación)

**Requerimientos**:

- Formulario completo con todos los campos de `TodoTask`
- Validaciones de campos obligatorios
- Selector de prioridad (low, medium, high, critical)
- Selector de estado (pending, in-progress, review, completed)
- Selector de categoría (development, testing, documentation, deployment, maintenance)
- Campo de fecha límite opcional
- Campo de horas estimadas
- Checkbox de compliance HIPAA
- Campos de contexto médico (opcionales)
- Botones de guardar y cancelar

**Implementación esperada**:

```tsx
// Reemplazar el modal actual con un formulario completo
{
  showCreateModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Crear Nueva Tarea</h3>

        <form onSubmit={handleCreateTask} className="space-y-4">
          {/* Título y Descripción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título de la tarea"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar categoría</option>
                <option value="development">Desarrollo</option>
                <option value="testing">Testing</option>
                <option value="documentation">Documentación</option>
                <option value="deployment">Deployment</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción detallada de la tarea"
            />
          </div>

          {/* Prioridad y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar prioridad</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in-progress">En progreso</option>
                <option value="review">En revisión</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          </div>

          {/* Asignación y Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del responsable"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas estimadas *
              </label>
              <input
                type="number"
                required
                min="0.5"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.5"
              />
            </div>
          </div>

          {/* Compliance y Contexto Médico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hipaaCompliant"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hipaaCompliant" className="text-sm font-medium text-gray-700">
                Cumple estándares HIPAA
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEmergency"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isEmergency" className="text-sm font-medium text-gray-700">
                Es emergencia médica
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3 (separados por comas)"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### **2. FORMULARIO DE EDICIÓN DE TAREAS**

**Archivo**: `apps/admin/src/components/todo-write/TodoWriteSystem.tsx`
**Ubicación**: Línea ~420 (modal de edición)

**Requerimientos**:

- Formulario similar al de creación pero pre-poblado con datos existentes
- Permitir edición de todos los campos
- Mantener historial de cambios
- Validaciones de campos obligatorios
- Botones de guardar cambios y cancelar

### **3. SISTEMA DE COMENTARIOS**

**Archivo**: `apps/admin/src/components/todo-write/TodoWriteSystem.tsx`
**Ubicación**: Dentro de cada tarea en la lista

**Requerimientos**:

- Mostrar comentarios existentes
- Formulario para agregar nuevos comentarios
- Indicador de comentarios internos vs. públicos
- Timestamp de cada comentario
- Autor del comentario

### **4. VALIDACIONES Y MANEJO DE ERRORES**

**Requerimientos**:

- Validación de campos obligatorios
- Mensajes de error claros
- Validación de fechas (fecha límite no puede ser anterior a hoy)
- Validación de horas estimadas (mínimo 0.5, máximo 168)
- Manejo de errores de API

---

## 🔧 **FUNCIONES A IMPLEMENTAR**:

### **handleCreateTask**:

```tsx
const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  const taskData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    priority: formData.get('priority') as TodoTask['priority'],
    status: formData.get('status') as TodoTask['status'],
    category: formData.get('category') as TodoTask['category'],
    assignedTo: formData.get('assignedTo') as string,
    estimatedHours: parseFloat(formData.get('estimatedHours') as string),
    hipaaCompliant: formData.get('hipaaCompliant') === 'on',
    tags: (formData.get('tags') as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    medicalContext: {
      isEmergency: formData.get('isEmergency') === 'on',
      patientImpact: 'none' as const,
      complianceRequired: formData.get('hipaaCompliant') === 'on',
    },
  };

  createTask(taskData);
};
```

### **handleEditTask**:

```tsx
const handleEditTask = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!selectedTask) return;

  const formData = new FormData(event.currentTarget);

  const updates = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    priority: formData.get('priority') as TodoTask['priority'],
    status: formData.get('status') as TodoTask['status'],
    category: formData.get('category') as TodoTask['category'],
    assignedTo: formData.get('assignedTo') as string,
    estimatedHours: parseFloat(formData.get('estimatedHours') as string),
    hipaaCompliant: formData.get('hipaaCompliant') === 'on',
    tags: (formData.get('tags') as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    medicalContext: {
      isEmergency: formData.get('isEmergency') === 'on',
      patientImpact: 'none' as const,
      complianceRequired: formData.get('hipaaCompliant') === 'on',
    },
  };

  updateTask(selectedTask.id, updates);
};
```

---

## 📊 **CRITERIOS DE ACEPTACIÓN**:

### **Funcional**:

- ✅ Formularios de creación y edición funcionando
- ✅ Validaciones implementadas
- ✅ Sistema de comentarios operativo
- ✅ Persistencia de datos en estado local
- ✅ Métricas actualizándose en tiempo real

### **UI/UX**:

- ✅ Formularios responsivos y accesibles
- ✅ Mensajes de error claros y útiles
- ✅ Feedback visual para acciones del usuario
- ✅ Diseño consistente con el resto de la aplicación

### **Técnico**:

- ✅ TypeScript sin errores
- ✅ Componentes reutilizables
- ✅ Manejo de estado eficiente
- ✅ Performance optimizada

---

## 🚀 **ENTREGABLES ESPERADOS**:

1. **Sistema Todo-Write completamente funcional**
2. **Formularios de creación y edición implementados**
3. **Sistema de comentarios operativo**
4. **Validaciones y manejo de errores implementados**
5. **Código limpio y bien documentado**

---

## 📋 **INSTRUCCIONES FINALES**:

**Claude, como implementador estratégico delegado, debes**:

1. **Implementar TODAS las funcionalidades faltantes** especificadas
2. **Mantener la calidad del código** existente
3. **Seguir las especificaciones técnicas** exactamente
4. **Reportar progreso** cada 30 minutos
5. **Entregar un sistema completamente funcional** en 2 horas

**Recuerda**: Estás trabajando para AltaMedica bajo la supervisión técnica de ChatGPT-5. La calidad y funcionalidad son críticas para una plataforma médica.

**¡Comienza la implementación inmediatamente!** 🚀
