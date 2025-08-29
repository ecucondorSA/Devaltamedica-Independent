# @AltaMedica/Hooks - Glosario Alfabético

## 🏷️ Leyenda de Badges

### Runtime Compatibility
- 💻 **Client-only** - Solo funciona en browser (usa DOM/window)
- 🏷️ **Edge-safe** - Compatible con Edge Runtime
- 🔒 **Server-only** - Solo Node.js (usa fs/crypto/etc)
- ⚛️ **SSR-safe** - Compatible con Server-Side Rendering

### Estabilidad
- 📊 **Stable** - API estable, no cambiará
- 🔄 **Beta** - Puede cambiar en menores
- 🚧 **Experimental** - Cambios frecuentes
- ⚠️ **Deprecated** - Obsoleto, migrar

### Categoría
- 🏥 **Medical** - Hooks médicos/HIPAA
- 🔐 **Auth** - Autenticación/seguridad
- 🎨 **UI** - Interface/UX
- 📡 **Data** - Fetching/estado
- ⚡ **Performance** - Optimización
- 🔄 **Lifecycle** - Ciclo de vida

## 📚 Hooks por Categoría

### 🏥 Hooks Médicos (HIPAA Compliant)

#### @usePatients
```typescript
import { usePatients } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🏥 **Medical**
- Hook para gestión de pacientes
- Incluye paginación, búsqueda y filtros
- ⚠️ **Requiere autenticación médica**

#### @useMedicalRecords
```typescript
import { useMedicalRecords } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🏥 **Medical** | 🔒 **HIPAA**
- Acceso a historiales médicos
- Encriptación automática de datos sensibles
- Audit logging incluido

#### @useAppointments
```typescript
import { useAppointments } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🏥 **Medical**
- Gestión de citas médicas
- Real-time updates vía WebSocket
- Sincronización con calendario

#### @usePrescriptions
```typescript
import { usePrescriptions } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🏥 **Medical** | 🔒 **HIPAA**
- Manejo de prescripciones médicas
- Validación con base de medicamentos
- Integración con farmacias

#### @useVitalSigns
```typescript
import { useVitalSigns } from '@altamedica/hooks';
```
- 💻 **Client-only** | 🔄 **Beta** | 🏥 **Medical**
- Monitoreo de signos vitales
- Gráficas en tiempo real
- Alertas automáticas

#### @useMedicalAI
```typescript
import { useMedicalAI } from '@altamedica/hooks';
```
- 💻 **Client-only** | 🚧 **Experimental** | 🏥 **Medical**
- Diagnóstico asistido por IA
- Predicciones basadas en ML
- ⚠️ **Solo uso asistencial, no diagnóstico final**

### 🔐 Hooks de Autenticación

#### @useAuth
```typescript
import { useAuth } from '@altamedica/hooks';
```
- 🏷️ **Edge-safe** | 📊 **Stable** | 🔐 **Auth**
- Hook principal de autenticación
- Compatible con SSR
- Auto-refresh de tokens

#### @usePermissions
```typescript
import { usePermissions } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🔐 **Auth**
- Control de permisos basado en roles
- Cache de permisos
- Validación en tiempo real

#### @useSession
```typescript
import { useSession } from '@altamedica/hooks';
```
- 🏷️ **Edge-safe** | 📊 **Stable** | 🔐 **Auth**
- Gestión de sesión de usuario
- Auto logout por inactividad
- Persistencia segura

### 🎨 Hooks de UI/UX

#### @useTheme
```typescript
import { useTheme } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🎨 **UI**
- Gestión de tema (light/dark/auto)
- Persistencia en localStorage
- Sistema de diseño consistente

#### @useToast
```typescript
import { useToast } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🎨 **UI**
- Sistema de notificaciones toast
- Queue automático
- Accesibilidad ARIA

#### @useModal
```typescript
import { useModal } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🎨 **UI**
- Control de modales
- Focus trap incluido
- Escape key handling

#### @useAccessibility
```typescript
import { useAccessibility } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🎨 **UI**
- Utilidades de accesibilidad
- Screen reader announcements
- Keyboard navigation

### 📡 Hooks de Data/Estado

#### @useAsync
```typescript
import { useAsync } from '@altamedica/hooks';
```
- 🏷️ **Edge-safe** | 📊 **Stable** | 📡 **Data**
- Manejo de operaciones asíncronas
- Estados: loading, error, data
- Cancelación automática

#### @useDebounce
```typescript
import { useDebounce } from '@altamedica/hooks';
```
- 🏷️ **Edge-safe** | 📊 **Stable** | ⚡ **Performance**
- Debounce de valores
- Configurable delay
- Cancelación manual

#### @useLocalStorage
```typescript
import { useLocalStorage } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 📡 **Data**
- Sincronización con localStorage
- Serialización automática
- SSR-safe con fallback

#### @useMediaQuery
```typescript
import { useMediaQuery } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 🎨 **UI**
- Responsive design hooks
- SSR compatible
- Performance optimized

### 🔄 Hooks de WebSocket/Real-time

#### @useWebSocket
```typescript
import { useWebSocket } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 📡 **Data**
- Conexión WebSocket gestionada
- Auto-reconnect
- Message queue

#### @useNotifications
```typescript
import { useNotifications } from '@altamedica/hooks';
```
- 💻 **Client-only** | 📊 **Stable** | 📡 **Data**
- Push notifications
- Real-time updates
- Permission handling

#### @useRealTimeUpdates
```typescript
import { useRealTimeUpdates } from '@altamedica/hooks';
```
- 💻 **Client-only** | 🔄 **Beta** | 📡 **Data**
- Sincronización en tiempo real
- Optimistic updates
- Conflict resolution

## 🚨 Client-only vs Server-only vs Edge-safe

### 💻 Client-only Hooks
Estos hooks **SOLO** funcionan en el browser:
```typescript
// ❌ NO funcionará en servidor/Edge Runtime
const theme = useTheme(); // Error: window is not defined

// ✅ Solución: Usar con conditional rendering
const MyComponent = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  const theme = useTheme(); // Ahora es seguro
  return <div>Theme: {theme}</div>;
};
```

### 🏷️ Edge-safe Hooks
Funcionan en Edge Runtime (Vercel Edge, Cloudflare Workers):
```typescript
// ✅ Estos funcionan en cualquier runtime
const { user } = useAuth();
const debouncedValue = useDebounce(value, 500);
const { data, loading } = useAsync(fetchData);
```

### ⚛️ SSR Considerations
Para Server-Side Rendering con Next.js:
```typescript
// ❌ PROBLEMA: useLocalStorage en SSR
const [value] = useLocalStorage('key', 'default'); // Error en servidor

// ✅ SOLUCIÓN: Usar fallback para SSR
const [value] = useLocalStorage('key', 'default', {
  ssr: true, // Retorna default en servidor
});
```

## 🔧 Patrones de Import Recomendados

### Import Específico (Recomendado)
```typescript
// ✅ Tree-shaking optimizado
import { useAuth, usePatients } from '@altamedica/hooks';
```

### Import por Categoría
```typescript
// ✅ Organizado por dominio
import { useAuth, usePermissions } from '@altamedica/hooks/auth';
import { usePatients, useMedicalRecords } from '@altamedica/hooks/medical';
import { useTheme, useToast } from '@altamedica/hooks/ui';
```

### Import con Type Safety
```typescript
// ✅ Types seguros
import { usePatients } from '@altamedica/hooks';
import type { Patient, PatientsFilter } from '@altamedica/types';

const { data: patients } = usePatients<Patient>({
  filter: { status: 'active' } as PatientsFilter
});
```

## 🐛 Errores Comunes y Soluciones

### ⚠️ Error: Exhaustive deps (ESLint)
```typescript
// ❌ PROBLEMA: Dependencia faltante
useEffect(() => {
  fetchData(userId);
}, []); // ESLint: React Hook useEffect has a missing dependency

// ✅ SOLUCIÓN 1: Añadir dependencia
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ SOLUCIÓN 2: useCallback si la función cambia
const stableFetch = useCallback(() => {
  fetchData(userId);
}, [userId]);

useEffect(() => {
  stableFetch();
}, [stableFetch]);
```

### ⚠️ Error: Rules of Hooks violation
```typescript
// ❌ PROBLEMA: Hook condicional
if (isLoggedIn) {
  const user = useAuth(); // Error: Hook called conditionally
}

// ✅ SOLUCIÓN: Hooks siempre al top level
const { user } = useAuth();
if (isLoggedIn && user) {
  // Usar user aquí
}
```

### ⚠️ Error: Infinite re-renders
```typescript
// ❌ PROBLEMA: setState en render
const Component = () => {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Infinite loop!
  
// ✅ SOLUCIÓN: setState en efectos o handlers
const Component = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(c => c + 1);
  }, []); // Solo una vez
  
  // O en event handler
  const increment = () => setCount(c => c + 1);
```

### ⚠️ Error: Memory leaks con subscriptions
```typescript
// ❌ PROBLEMA: No cleanup en useEffect
useEffect(() => {
  const subscription = api.subscribe(handleUpdate);
  // Sin cleanup = memory leak
}, []);

// ✅ SOLUCIÓN: Return cleanup function
useEffect(() => {
  const subscription = api.subscribe(handleUpdate);
  return () => subscription.unsubscribe(); // Cleanup
}, []);
```

## 📋 Recetas Comunes

### Fetch con Loading y Error
```typescript
const useFetchData = (url: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          signal: abortController.signal
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => abortController.abort();
  }, [url]);
  
  return { data, loading, error };
};
```

### Debounced Search
```typescript
const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  
  const { data: results } = useAsync(
    () => searchAPI(debouncedQuery),
    [debouncedQuery]
  );
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {results && <Results data={results} />}
    </div>
  );
};
```

### Real-time Medical Monitoring
```typescript
const VitalSignsMonitor = ({ patientId }) => {
  const { data: vitalSigns, subscribe } = useVitalSigns(patientId);
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const unsubscribe = subscribe((newVitals) => {
      // Check for critical values
      if (newVitals.heartRate > 120 || newVitals.heartRate < 50) {
        setAlerts(prev => [...prev, {
          type: 'critical',
          message: `Heart rate: ${newVitals.heartRate}`,
          timestamp: new Date()
        }]);
      }
    });
    
    return unsubscribe;
  }, [patientId, subscribe]);
  
  return (
    <div>
      <VitalSignsChart data={vitalSigns} />
      <AlertsList alerts={alerts} />
    </div>
  );
};
```

## 🔒 Consideraciones de Seguridad HIPAA

Para hooks que manejan datos médicos:

```typescript
// ✅ SIEMPRE encriptar datos sensibles
const { data: records } = useMedicalRecords(patientId, {
  encryption: true,
  auditLog: true,
  sanitizeForLogs: true
});

// ✅ Limpiar datos en unmount
useEffect(() => {
  return () => {
    // Limpiar datos sensibles de memoria
    clearSensitiveData();
  };
}, []);

// ✅ No exponer datos en DevTools
if (process.env.NODE_ENV === 'production') {
  Object.freeze(medicalData);
}
```

## 📊 Testing Hooks

### Con React Testing Library
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from '@altamedica/hooks';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### Mock de Hooks en Tests
```typescript
// __mocks__/@altamedica/hooks.ts
export const useAuth = jest.fn(() => ({
  user: { id: '123', name: 'Test User' },
  isAuthenticated: true
}));

export const usePatients = jest.fn(() => ({
  data: mockPatients,
  loading: false,
  error: null
}));
```

## 🚀 Performance Best Practices

1. **Memoización**: Usar `useMemo` y `useCallback` apropiadamente
2. **Lazy Loading**: Cargar hooks pesados solo cuando necesario
3. **Suspense**: Usar React.Suspense para loading states
4. **Code Splitting**: Separar hooks por rutas/features

```typescript
// ✅ Lazy load de hooks pesados
const MedicalDashboard = lazy(() => 
  import('./MedicalDashboard').then(module => ({
    default: module.MedicalDashboard
  }))
);
```

---

**📚 Total de Hooks Disponibles**: 80+  
**🏥 Hooks Médicos**: 25+  
**🎨 Hooks de UI**: 20+  
**📡 Hooks de Data**: 35+  

**Última actualización**: 2025-08-29  
**Versión del package**: 1.0.0