"use client"

import { Employee, employeeSchema } from '@altamedica/types'
import { Button } from '@altamedica/ui/button'
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@altamedica/ui/dialog'
import { Input } from '@altamedica/ui/input'
import { Label } from '@altamedica/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface EmployeeFormProps {
  employee?: Employee
  onSubmit: (data: Employee) => void
  onCancel: () => void
  isLoading?: boolean
}

export function EmployeeForm({ employee, onSubmit, onCancel, isLoading }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Employee>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      role: 'Otro',
      department: '',
      hireDate: new Date(),
      status: 'Activo',
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
        </DialogTitle>
        <DialogDescription>
          {employee 
            ? 'Modifica la información del empleado.' 
            : 'Completa los datos para crear un nuevo empleado.'
          }
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ej: Juan Pérez"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="juan.perez@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <select
            id="role"
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Admin">Admin</option>
            <option value="Doctor">Doctor</option>
            <option value="Enfermero">Enfermero</option>
            <option value="Recepción">Recepción</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.role && (
            <p className="text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            {...register('department')}
            placeholder="Ej: Cardiología"
          />
          {errors.department && (
            <p className="text-sm text-red-500">{errors.department.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hireDate">Fecha de contratación</Label>
          <Input
            id="hireDate"
            type="date"
            {...register('hireDate', {
              valueAsDate: true,
            })}
          />
          {errors.hireDate && (
            <p className="text-sm text-red-500">{errors.hireDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="De Licencia">De Licencia</option>
          </select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
