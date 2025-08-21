# CLAUDE.md - App: Doctors 🏥

**Última actualización:** 28 de enero de 2025

## 🎯 Resumen de la Aplicación

- **Propósito:** Plataforma para que los profesionales médicos gestionen su agenda, atiendan pacientes (telemedicina) y actualicen historiales clínicos.
- **Tecnologías Clave:** Next.js 15, React 18, TypeScript, Tailwind CSS, WebRTC.
- **Puerto:** 3002
- **Rutas Principales:**
  - `/schedule`: Visualización y gestión de la agenda.
  - `/telemedicine/:sessionId`: Sala de consulta virtual.
  - `/patients/:patientId`: Perfil del paciente y su historial clínico.

---

## 🏗️ Arquitectura Backend - AltaMedica

### 📍 **Ubicación de Servicios Backend**

```
🌐 API Server (Puerto 3001)
├── 📂 /mnt/c/Users/Eduardo/Documents/devaltamedica/apps/api-server/
├── 🔗 URL: http://localhost:3001
└── 📚 Documentación: /apps/api-server/CLAUDE.md

🎥 Signaling Server (Puerto 8888)
├── 📂 /mnt/c/Users/Eduardo/Documents/devaltamedica/apps/signaling-server/
├── 🔗 URL: ws://localhost:8888
└── 🎯 Propósito: WebRTC signaling para videollamadas

🔥 Firebase Services
├── 🗄️ Firestore: Base de datos principal
├── 🔐 Firebase Auth: Autenticación de usuarios
├── 💾 Firebase Storage: Almacenamiento de archivos médicos
└── 📱 Cloud Messaging: Notificaciones push
```

### 🔌 **APIs Principales para Doctors App**

| Endpoint                          | Propósito                    | Estado                   |
| --------------------------------- | ---------------------------- | ------------------------ |
| `/api/v1/auth/*`                  | Login/registro médico        | ✅ **PRODUCCIÓN**        |
| `/api/v1/appointments/*`          | Gestión completa de citas    | ✅ **PRODUCCIÓN**        |
| `/api/v1/patients`                | Lista y gestión de pacientes | ✅ **PRODUCCIÓN**        |
| `/api/v1/medical-records/*`       | Historiales clínicos         | ✅ **PRODUCCIÓN**        |
| `/api/v1/prescriptions/*`         | Emisión de recetas           | ✅ **PRODUCCIÓN**        |
| `/api/v1/telemedicine/sessions/*` | Videollamadas médicas        | ✅ **NIVEL EMPRESARIAL** |
| `/api/v1/jobs`                    | Ofertas de trabajo médico    | ✅ **PRODUCCIÓN**        |

### 🚀 **Funcionalidades Tiempo Real**

- ✅ **WebRTC + MediaSoup:** Videollamadas HD con <100ms latencia
- ✅ **Socket.io:** Notificaciones de citas en tiempo real
- ✅ **Firestore Listeners:** Cambios de estado automáticos
- ✅ **WebRTC Signaling:** Sistema completo de señalización (263 líneas)

### 🔐 **Express + Middleware Stack**

- ✅ **UnifiedAuth:** Middleware de autenticación centralizado
- ✅ **Rate Limiting:** Protección contra spam
- ✅ **HIPAA Compliance:** Auditoría automática de acciones médicas
- ✅ **Service Pattern:** Lógica de negocio en servicios especializados

---

## 🔗 Integraciones Técnicas

### APIs Backend

- **API Principal:** Interactúa con el `api-server` (Puerto 3001) para gestión de datos médicos
- **Telemedicina:** Se integra con el `signaling-server` (Puerto 8888) para WebRTC
- **Autenticación:** Firebase Auth + custom tokens del API server

### Estándares de UI/UX

- **Componentes:** Reutiliza componentes de `@altamedica/ui` y componentes específicos de la app de doctores (`/components`).
- **Flujo de Telemedicina:** La lógica de WebRTC está encapsulada en hooks (`useWebRTC`) para simplificar la gestión de la conexión, el streaming y los eventos.

## 3. Reglas de Codificación (App-Specific)

- **Seguridad en Telemedicina:** Asegúrate de que la conexión WebRTC sea segura (DTLS-SRTP). No se debe transmitir PHI a través del servidor de señalización.
- **Manejo de Estado:** Utiliza Zustand para estados complejos como la gestión de la sala de telemedicina (participantes, estado de la llamada).
- **Pruebas:** Las pruebas de telemedicina deben usar mocks para la API de WebRTC y centrarse en la lógica de señalización y la gestión del estado de la llamada.

---

## 🧪 Triage rápido: “Module not found” en monorepo PNPM (Next.js)

Cuando Next.js muestre el error https://nextjs.org/docs/messages/module-not-found con una import trace, sigue este flujo corto para resolver en minutos.

1. Identifica el paquete exacto de la traza

- Mira el import que falla y la import trace (quién lo usa). Ej.: `@altamedica/api-client` → usado por `./src/hooks/useDiagnosis.ts` → `./src/components/layout/VSCodeLayout.tsx`.

2. Verifica el paquete en el monorepo

- Abre `packages/<lib>/package.json` y confirma:
  - `name` correcto (debe coincidir con el import).
  - `exports`/`main`/`module` configurados (si aplica).

3. Asegura la dependencia en la app consumidora

- En `apps/<app>/package.json`, agrega si falta: `"<paquete>": "workspace:*"` en `dependencies`.

4. Instala y valida el linking del workspace

- Ejecuta en la raíz del repo:

```powershell
pnpm install
pnpm -w list "@altamedica/api-client" --depth -1
pnpm -w why "@altamedica/api-client"
```

Si la instalación se canceló, repítela antes de tocar más código para evitar falsos positivos.

5. Si es paquete TS, transpílalo en Next

- En `apps/<app>/next.config.js` añade el paquete a `transpilePackages`:

```js
transpilePackages: [
  '@altamedica/ui',
  '@altamedica/api-client'
],
```

6. Alias de TS vs paquete real

- Si importas vía alias (ej.: `@/lib/api-client`), verifica `tsconfig.json` del app (`baseUrl`, `paths`) y que el archivo exista.
- Si importas el paquete real, asegúrate que esté instalado (pasos 3-4) y compilado.

7. Reinicia dev server y limpia caché si persiste

```powershell
# Desde apps/<app>
pnpm dev
# Si persiste, limpia Next cache
Remove-Item -Recurse -Force .next
pnpm dev
```

8. Smoke test del import mínimo

- Añade un import mínimo temporal en un componente/route y valida que no truene el build.

—

Caso práctico: @altamedica/api-client en Doctors

1. Se detectó `module not found` desde `useDiagnosis` → `VSCodeLayout`.
2. Se añadió la dependencia en `apps/doctors/package.json`:
   - `"@altamedica/api-client": "workspace:*"`.
3. Se agregó a `transpilePackages` en `apps/doctors/next.config.js`.
4. Se creó un wrapper fino en `apps/doctors/src/lib/api-client.ts`:
   - Usa `createApiClient` con `baseURL` por `NEXT_PUBLIC_API_BASE_URL` (fallback `http://localhost:3001`).
   - Helper `withOptions` para mapear `params` a querystring y pasar `headers`.
5. `useDiagnosis` ahora importa desde `"@/lib/api-client"` para encabezados/params consistentes.
6. Ejecutar `pnpm install` en raíz y reiniciar dev server.

Comandos útiles (Windows PowerShell):

```powershell
# En la raíz
pnpm install
pnpm -w list "@altamedica/api-client" --depth -1
pnpm -w why "@altamedica/api-client"

# Ejecutar Doctors
pnpm --filter doctors dev
```

Notas:

- Si el error continúa, valida que el nombre del paquete en el import coincida con `packages/api-client/package.json`.
- En Next 15 App Router, paquetes internos TS suelen requerir `transpilePackages`.
- Si cambiaste `exports` del paquete, reconstruye o limpia `.next` del app consumidor.
