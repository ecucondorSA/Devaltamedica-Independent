
# 📚 GUÍA DE MIGRACIÓN A @altamedica/api-client

## 1. Instalar dependencias
```bash
pnpm add @altamedica/api-client --filter @altamedica/patients
```

## 2. Configurar el cliente API
Crear archivo: apps/patients/src/lib/api-client.ts

## 3. Agregar QueryProvider
Actualizar el layout principal para incluir QueryProvider

## 4. Migrar llamadas
Seguir los ejemplos en appointment-service-migrated.ts

## 5. Hooks más comunes
- useLogin() - Para autenticación
- useCurrentUser() - Obtener usuario actual  
- useAppointments() - Listar citas
- useCreateAppointment() - Crear nueva cita
- usePatients() - Listar pacientes
- useDoctors() - Listar doctores

## 6. Ventajas
- ✅ Gestión automática del estado
- ✅ Cache inteligente
- ✅ Type safety mejorado
- ✅ Menos código boilerplate
