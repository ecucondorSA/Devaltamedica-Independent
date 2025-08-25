# AltaMedica - Sistema de Telemedicina

**Estado Real**: 🟡 Funcional pero con problemas de CI/CD  
**GitHub Actions**: ❌ Fallando por lockfile desincronizado  
**Objetivo**: ✅ Hacer que pase el pipeline

## 🚨 Problema Actual - GitHub Actions

```
Error: ERR_PNPM_OUTDATED_LOCKFILE
Package: @altamedica/telemedicine-core
Causa: Dependencias faltantes en pnpm-lock.yaml
```

### Fix Inmediato

```javascript
const fs = require('fs');
const { execSync } = require('child_process');

const fixLockfile = () => {
  try {
    execSync('pnpm install --frozen-lockfile=false');
    execSync('pnpm type-check');
    return 'FIXED';
  } catch (error) {
    return `FAILED: ${error.message}`;
  }
};

console.log(fixLockfile());
```

## 🎯 Apps Reales (Estado Honesto)

| App | Puerto | Estado | Funciona |
|-----|--------|--------|----------|
| api-server | 3001 | 95% | ✅ Sí |
| doctors | 3002 | 85% | ✅ Sí |
| patients | 3003 | 95% | ✅ Sí |
| companies | 3004 | 80% | ✅ Sí |
| admin | 3005 | 40% | ⚠️ Parcial |
| web-app | 3000 | 70% | ⚠️ Solo landing |
| signaling | 8888 | 90% | ✅ Sí |

## ⚡ Inicio Rápido (Que Funciona)

```bash
git clone <repo-url>
cd devaltamedica
npm install
npm run dev:medical
```

### URLs Funcionales

```
http://localhost:3001/api/health  # API status
http://localhost:3002             # Doctors app  
http://localhost:3003             # Patients app
http://localhost:8888/health      # WebRTC status
```

## 🔧 Scripts Útiles

### Diagnóstico

```javascript
const { execSync } = require('child_process');

const checkPorts = () => {
  const ports = [3001, 3002, 3003, 8888];
  return ports.map(p => {
    try {
      execSync(`netstat -ano | findstr :${p}`, { stdio: 'pipe' });
      return `${p}: OCCUPIED`;
    } catch {
      return `${p}: FREE`;
    }
  });
};

console.log(checkPorts());
```

### Fix GitHub Actions

```javascript
const fixCiCd = () => {
  const steps = [
    () => execSync('pnpm install --frozen-lockfile=false'),
    () => execSync('pnpm type-check'),
    () => execSync('git add pnpm-lock.yaml'),
    () => execSync('git commit -m "fix: sync lockfile"')
  ];
  
  steps.forEach((step, i) => {
    try {
      step();
      console.log(`Step ${i + 1}: ✅`);
    } catch (error) {
      console.log(`Step ${i + 1}: ❌ ${error.message}`);
      throw error;
    }
  });
};

fixCiCd();
```

### Kill Procesos

```javascript
const killAllPorts = () => {
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 8888];
  ports.forEach(port => {
    try {
      const result = execSync(`netstat -ano | findstr :${port}`).toString();
      const pid = result.split(/\s+/).pop().trim();
      execSync(`taskkill /F /PID ${pid}`);
      console.log(`Killed port ${port} (PID: ${pid})`);
    } catch {
      console.log(`Port ${port}: not in use`);
    }
  });
};

killAllPorts();
```

## 🏗️ Arquitectura Real

```
monorepo/
├── apps/
│   ├── api-server/    # Express + Firebase (95% funcional)
│   ├── doctors/       # Next.js + WebRTC (85% funcional)
│   ├── patients/      # Next.js + WebRTC (95% funcional)
│   ├── companies/     # Next.js + B2B (80% funcional)
│   ├── admin/         # Next.js (40% funcional) ⚠️
│   ├── web-app/       # Next.js (70% funcional) ⚠️
│   └── signaling/     # WebRTC server (90% funcional)
└── packages/
    ├── auth/          # Firebase Auth
    ├── ui/            # Components
    ├── types/         # TypeScript types
    └── medical/       # Medical components
```

## 📦 Stack Tecnológico

**Funciona**: Next.js 15, React 19, TypeScript 5+, Firebase, WebRTC  
**Problema**: Versiones inconsistentes de TypeScript en packages  
**Build Tool**: pnpm workspaces  
**Testing**: Playwright, Vitest (parcialmente configurado)

## 🔥 Problemas Conocidos

### 1. GitHub Actions Falla
**Error**: Lockfile desincronizado  
**Fix**: `pnpm install --frozen-lockfile=false`

### 2. Admin App Incompleta
**Estado**: 40% desarrollada  
**Falta**: Dashboard, gestión usuarios, métricas

### 3. Web App Solo Landing
**Estado**: 70% landing page  
**Falta**: About, Services, Contact, Blog

### 4. TypeScript Inconsistente
**Problema**: 8 versiones diferentes en packages  
**Fix**: Estandarizar a TypeScript 5.8.3

## 🧪 Testing (Estado Real)

```javascript
const testStatus = {
  unit: 'Parcialmente configurado',
  e2e: 'WebRTC tests implementados pero no ejecutados',
  integration: 'Falta por implementar',
  accessibility: 'Basic smoke tests',
  coverage: 'Sin métricas reales'
};

console.log(testStatus);
```

## 🚀 Deploy

### Desarrollo
```bash
npm run dev:medical      # Core medical apps
npm run dev:core         # Web + API
```

### Producción (No Probada)
```bash
npm run build
npm run start
```

**Nota**: Deploy real no está probado. Hay scripts pero sin validación.

## 🔧 Variables de Entorno

```bash
cp .env.example .env.local
```

**Crítico**: Firebase config debe estar correcto o nada funciona.

## 📊 Métricas Reales

- **Líneas de código**: ~50,000
- **Componentes**: ~200
- **Packages**: 30+ (versiones inconsistentes)
- **Apps funcionales**: 5/7
- **Coverage**: No medido
- **Performance**: No medido

## 🆘 Cuando Algo Falla

### Puerto Ocupado
```javascript
execSync(`netstat -ano | findstr :3001`);
```

### Dependencias Corruptas
```javascript
execSync('rm -rf node_modules && npm install');
```

### TypeScript Errors
```javascript
execSync('pnpm type-check');
```

### Firebase Errors
```javascript
const checkFirebase = () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  return required.every(key => process.env[key]);
};
```

## 🎯 Próximos Pasos Críticos

1. **Fix GitHub Actions**: Resolver lockfile issue
2. **Completar Admin App**: Desarrollar 60% faltante
3. **Estandarizar TypeScript**: Una sola versión en todos los packages
4. **Testing Real**: Implementar coverage measurement
5. **Deploy Pipeline**: Validar proceso completo

## 🤝 Contribuir

**Antes de contribuir**:
1. Ejecuta `node health-check.js`
2. Verifica que GitHub Actions pasa
3. Prueba tu cambio en desarrollo
4. No commits a main sin PR

## 📞 Soporte

**GitHub Issues**: Para bugs  
**Documentación**: `CLAUDE.md` para development  
**Logs**: `logs/` directory

---

**⚠️ Disclaimer**: Este README refleja el estado REAL del proyecto, no aspiracional. Si algo no funciona como se describe, es porque así está documentado intencionalmente.