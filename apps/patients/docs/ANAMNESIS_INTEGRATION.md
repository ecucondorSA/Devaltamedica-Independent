# Integración de Anamnesis - Altamedica Pacientes

## 📋 Descripción

Esta integración permite importar y gestionar datos de anamnesis desde el juego interactivo de anamnesis hacia la aplicación de pacientes, proporcionando una experiencia completa de gestión de información médica.

## 🏗️ Arquitectura

### Componentes Principales

1. **Servicio de Anamnesis** (`src/services/anamnesis-service.ts`)
   - Gestiona todas las operaciones de anamnesis
   - Convierte datos del juego al formato de la aplicación
   - Proporciona métodos para importar, obtener y actualizar anamnesis

2. **Hook Personalizado** (`src/hooks/useAnamnesis.ts`)
   - Gestiona el estado de anamnesis en componentes React
   - Proporciona métodos para cargar, refrescar e importar datos
   - Incluye valores computados (calidad, urgencia, alertas)

3. **Componente AnamnesisCard** (`src/components/AnamnesisCard.tsx`)
   - Muestra información de anamnesis en el dashboard
   - Permite expandir/contraer detalles
   - Incluye botones para actualizar y descargar

4. **Componente AnamnesisStats** (`src/components/AnamnesisStats.tsx`)
   - Muestra estadísticas y métricas de anamnesis
   - Incluye gráficos de completitud y calidad
   - Muestra alertas y recomendaciones

### Endpoints API

1. **`/api/v1/anamnesis`** - Operaciones CRUD básicas
2. **`/api/v1/anamnesis/importar`** - Importación desde el juego
3. **`/api/v1/anamnesis/paciente/[id]`** - Anamnesis específica por paciente
4. **`/api/v1/anamnesis/paciente/[id]/resumen`** - Resumen clínico

## 🚀 Uso

### En el Dashboard de Pacientes

El componente `AnamnesisCard` se integra automáticamente en el dashboard principal:

```tsx
// En page.tsx
import { AnamnesisCard } from "../components/AnamnesisCard";

// En el sidebar del dashboard
<AnamnesisCard 
  pacienteId={authState?.user?.id || ''} 
  className="mb-6"
/>
```

### Uso del Hook

```tsx
import { useAnamnesis } from '../hooks/useAnamnesis';

function MiComponente() {
  const {
    anamnesis,
    loading,
    error,
    refresh,
    hasAnamnesis,
    anamnesisQuality,
    urgencyLevel,
    alerts,
    recommendations
  } = useAnamnesis(pacienteId);

  // Usar los datos...
}
```

### Importación desde el Juego

```tsx
import { anamnesisService } from '../services/anamnesis-service';

// Datos del juego de anamnesis
const respuestasJuego = {
  nombre: 'Juan Pérez',
  edad: '35',
  genero: 'Masculino',
  // ... más datos
};

// Importar
const anamnesis = await anamnesisService.importarDesdeJuego(
  respuestasJuego,
  pacienteId,
  token
);
```

## 📊 Estructura de Datos

### AnamnesisData Interface

```typescript
interface AnamnesisData {
  id: string;
  pacienteId: string;
  doctorId?: string;
  fechaCompletada: string;
  estado: 'completada' | 'en_progreso' | 'pendiente';
  datos: {
    // Datos personales
    nombre: string;
    edad: string;
    genero: string;
    estadoCivil: string;
    ocupacion: string;
    
    // Antecedentes familiares
    antecedentesFamiliares: {
      diabetes: boolean;
      hipertension: boolean;
      cancer: boolean;
      enfermedadesCardiovasculares: boolean;
      otrasEnfermedades?: string;
    };
    
    // Antecedentes personales
    alergias: boolean;
    alergiasDescripcion?: string;
    cirugiasPrevias: boolean;
    cirugiasDescripcion?: string;
    medicamentosActuales: boolean;
    medicamentosLista?: string;
    
    // Hábitos
    fuma: boolean;
    alcohol: boolean;
    ejercicio: boolean;
    dieta: string;
    sueno: string;
    
    // Motivo de consulta
    motivoConsulta: string;
    duracionSintomas: string;
    intensidadDolor?: string;
    factoresAgravantes?: string;
    factoresMejorantes?: string;
    sintomasAsociados?: string;
    inicioSintomas: string;
    evolucionSintomas: string;
    
    // Revisión por sistemas
    sistemaCardiovascular: string;
    sistemaRespiratorio: string;
    sistemaDigestivo: string;
    sistemaNeurologico: string;
    sistemaMusculoesqueletico: string;
  };
  
  // Análisis clínico
  analisis?: {
    urgencia: 'baja' | 'media' | 'alta' | 'crítica';
    alertas: string[];
    factoresRiesgo: string[];
    recomendaciones: string[];
  };
  
  // Validación
  validacion?: {
    esValida: boolean;
    completitud: number;
    calidad: number;
    advertencias: string[];
  };
  
  // Resúmenes
  resumenMedico?: string;
  resumenPaciente?: string;
}
```

## 🔧 Configuración

### 1. Instalación

Los componentes ya están integrados en el proyecto. No se requieren dependencias adicionales.

### 2. Configuración de API

Los endpoints están configurados automáticamente. Asegúrate de que el servidor esté corriendo:

```bash
pnpm --filter "./apps/patients" run dev
```

### 3. Autenticación Simplificada

La integración usa autenticación basada en tokens Bearer. En desarrollo, puedes usar cualquier token válido:

```bash
# Ejemplo de llamada a la API
curl -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     http://localhost:3002/api/v1/anamnesis/importar
```

### 4. Autenticación en Producción

En producción, la integración debería usar el sistema de autenticación completo. Los endpoints verifican automáticamente los permisos del usuario.

## 🧪 Pruebas

### Script de Pruebas

Ejecuta el script de pruebas para verificar la integración:

```bash
cd apps/patients
node scripts/test-anamnesis-integration.mjs
```

### Script de Inicio Completo

Para iniciar el servidor y ejecutar pruebas automáticamente:

```bash
cd apps/patients
node scripts/start-and-test.mjs
```

### Pruebas Manuales

1. **Probar importación desde juego:**
   - Ve al juego de anamnesis en `/anamnesis-juego`
   - Completa la anamnesis
   - Verifica que los datos aparezcan en el dashboard de pacientes

2. **Probar API endpoints:**
   - `GET /api/v1/anamnesis?pacienteId=123`
   - `POST /api/v1/anamnesis/importar`
   - `GET /api/v1/anamnesis/paciente/123/resumen`

## 📈 Métricas y Análisis

### Calidad de Anamnesis

- **Completitud:** Porcentaje de campos obligatorios completados
- **Calidad:** Puntuación basada en detalle y precisión de la información
- **Urgencia:** Nivel de urgencia clínica determinado automáticamente

### Alertas Automáticas

- Alergias documentadas
- Medicación actual
- Factores de riesgo identificados
- Dolor de alta intensidad

### Recomendaciones

- Actividad física (si no se reporta ejercicio)
- Cesación tabáquica (si fuma)
- Evaluación de hábitos de sueño (si duerme menos de 6 horas)

## 🔄 Flujo de Datos

1. **Juego de Anamnesis** → Usuario completa formulario interactivo
2. **Exportación** → Datos se envían al servicio de anamnesis
3. **Procesamiento** → Análisis clínico y validación automática
4. **Almacenamiento** → Datos guardados en la base de datos
5. **Visualización** → Información mostrada en el dashboard de pacientes
6. **Acceso Médico** → Doctores pueden acceder a la información completa

## 🛠️ Mantenimiento

### Logs

Los logs importantes se registran en la consola:
- `🚀 Importando anamnesis desde el juego...`
- `✅ Anamnesis importada exitosamente`
- `🔍 Procesando anamnesis importada...`
- `✅ Anamnesis procesada exitosamente`

### Monitoreo

- Verificar logs de API para errores
- Monitorear calidad promedio de anamnesis
- Revisar alertas generadas automáticamente

## 🔮 Futuras Mejoras

1. **Integración con IA:**
   - Análisis predictivo de riesgos
   - Recomendaciones personalizadas
   - Detección de patrones anómalos

2. **Interoperabilidad:**
   - Exportación a formatos estándar (FHIR)
   - Integración con otros sistemas médicos
   - Sincronización con dispositivos IoT

3. **Experiencia de Usuario:**
   - Progreso visual en tiempo real
   - Recordatorios inteligentes
   - Gamificación adicional

## 📞 Soporte

Para problemas o preguntas sobre la integración de anamnesis:

1. Revisa los logs de la aplicación
2. Ejecuta el script de pruebas
3. Verifica la configuración de autenticación
4. Consulta la documentación de la API

---

**Versión:** 1.0.0  
**Última actualización:** Julio 2025  
**Módulo:** ESM (ES Modules) 