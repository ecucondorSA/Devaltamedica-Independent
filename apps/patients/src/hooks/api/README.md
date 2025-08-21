# 🎣 AltaMedica API Hooks

Hooks de React auto-generados para conectar con las APIs de AltaMedica sin usar mocks.

## 🚀 Inicio Rápido

```tsx
import { useAltaMedicaAPI, usePatients } from './hooks/api';

function MyComponent() {
  const { auth, isHealthy } = useAltaMedicaAPI();
  const { patients, loading } = usePatients({ 
    token: auth.token,
    immediate: auth.isAuthenticated 
  });
  
  if (!isHealthy) return <div>Servicios no disponibles</div>;
  if (!auth.isAuthenticated) return <LoginForm />;
  
  return (
    <div>
      {loading ? 'Cargando...' : `${patients.length} pacientes`}
    </div>
  );
}
```

## 📚 Hooks Disponibles

### 🔐 Autenticación
- `useAuth()` - Gestión de autenticación y tokens

### 👥 Gestión de Datos
- `usePatients()` - CRUD de pacientes
- `useDoctors()` - Gestión de doctores  
- `useAppointments()` - Gestión de citas
- `useVideoCall()` - Video llamadas

### 🔧 Utilidades
- `useApiBridge()` - Comunicación directa con API Bridge
- `useServiceHealth()` - Monitoreo de servicios

## ⚙️ Configuración

1. **Iniciar API Bridge**: `python tools/python/api_frontend_bridge.py`
2. **Importar hooks**: `import { useAltaMedicaAPI } from './hooks/api'`
3. **Usar en componentes**: Sin configuración adicional

## 🎯 Beneficios

- ✅ **Sin Mocks**: Conexión directa con APIs reales
- ✅ **Type Safe**: TypeScript completo
- ✅ **Auto-retry**: Manejo automático de errores
- ✅ **Caching**: Optimización automática
- ✅ **SSO Ready**: Integración con tokens JWT

## 🔄 Migración desde Mocks

Busca y reemplaza:
```tsx
// Antes (mock)
const [patients, setPatients] = useState(mockPatients);

// Después (real API)
const { patients } = usePatients({ token: auth.token });
```

Estos hooks son **auto-generados**. Para regenerar:
```bash
python tools/python/frontend_hook_generator.py
```
