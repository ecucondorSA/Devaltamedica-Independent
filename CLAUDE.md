# AltaMedica - Manual para Autocompletado Potente

## 🤖 Cómo Usar Este Autocompletado Correctamente

Este manual está diseñado para maximizar la efectividad de Claude como autocompletado inteligente, NO como asistente complaciente.

### ❌ ERRORES COMUNES QUE DEBES EVITAR

**MAL**: "Ayúdame con mi código"  
**BIEN**: "Tengo 286 archivos con imports incorrectos. Error: 'Cannot find module @altamedica/types'. Hice pnpm install 50 veces. GitHub Actions falla en build."

**MAL**: "Algo no funciona"  
**BIEN**: "Puerto 3001 ocupado. API server no inicia. Ya maté procesos node. Error persiste después de reiniciar."

**MAL**: "Optimiza mi aplicación"  
**BIEN**: "React app renderiza lento. useEffect se ejecuta 47 veces por click. Sospecho loop infinito en componente ProductList línea 23-45."

### ✅ TEMPLATE PARA PROBLEMAS EFECTIVOS

```
CONTEXTO: Trabajando en [app específica/tecnología]
SÍNTOMA: Error exacto [copiar/pegar error completo]
OBJETIVO: Necesito lograr [resultado específico]
INTENTOS: Ya probé [lista de cosas que NO funcionaron]
RESTRICCIONES: No puedo [limitaciones específicas]
FRUSTRACIÓN: Llevo [tiempo] con esto
```

## 🚨 LIMITES REALES - 100% HONESTIDAD

### No Puedo Hacer

- Ejecutar código en tu máquina directamente
- Conectarme a bases de datos externas
- Instalar dependencias automáticamente
- Corregir errores de red o hardware
- Acceder a sistemas que requieren autenticación

### Sí Puedo Hacer (y lo hago bien)

- Generar código Node.js funcional sin comentarios
- Analizar errores y sugerir soluciones específicas
- Crear scripts de automatización
- Revisar código y detectar problemas
- Proporcionar alternativas cuando algo no funciona

### Zona Gris - Pregúntame Directamente

Si necesitas algo que no está claro, di exactamente qué quieres lograr y yo te diré si puedo ayudar.

## 🔧 ARQUITECTURA REAL ALTAMEDICA

### Apps Funcionales (Estado Honesto)

```
✅ api-server (3001) - 95% producción
✅ doctors (3002) - 85% funcional 
✅ patients (3003) - 95% funcional
✅ companies (3004) - 80% funcional
⚠️ admin (3005) - 40% funcional
⚠️ web-app (3000) - 70% funcional
✅ signaling (8888) - 90% funcional
```

### Problemas Conocidos

1. **GitHub Actions falla**: Lockfile desincronizado
2. **Admin app**: Necesita 60% más desarrollo
3. **Web-app**: Solo landing page, falta todo el contenido
4. **Dependencias**: TypeScript versiones inconsistentes

## 📦 COMANDOS QUE FUNCIONAN

### Desarrollo (Verificados)

```bash
pnpm dev:medical
pnpm dev:core
cd apps/api-server && npm run dev
```

### Diagnóstico (Útiles)

```bash
netstat -ano | findstr :3001
pnpm diagnose:api
git status
```

### Build (Problemáticos - Usar con Cuidado)

```bash
pnpm type-check
```

## 🎯 COMO FUNCIONO MEJOR

### Dame Contexto Específico

```javascript
const analyzeError = (error, context, attempts) => {
  const patterns = detectErrorPatterns(error);
  const solutions = filterByContext(patterns, context);
  return solutions.filter(s => !attempts.includes(s));
};
```

### Muestra el Error Real

```bash
node altamedica-diagnosis.js
```

### Dime Qué Intentaste

```javascript
const avoidRepeating = (previousAttempts) => {
  return newSolutions.filter(s => !previousAttempts.includes(s));
};
```

## 🚫 COMANDOS PROHIBIDOS PARA CLAUDE

```bash
pnpm install
pnpm build
npm run lint
tsc
```

**Razón**: Timeout + errores = Claude crea archivos redundantes

## ✅ COMANDOS PERMITIDOS PARA CLAUDE

```bash
node
python
powershell
cat
ls
grep
```

## 🔍 PATRONES DE DEBUGGING

### Error de Imports

```javascript
const fixImports = (file) => {
  return file.replace(/from ['"]\.\.\//g, "from '@altamedica/");
};
```

### Error de Puertos

```javascript
const killPort = (port) => {
  execSync(`netstat -ano | findstr :${port} | taskkill /F /PID`);
};
```

### Error de TypeScript

```javascript
const checkTypes = () => {
  const errors = execSync('pnpm type-check').toString();
  return errors.includes('error TS') ? 'FIX_NEEDED' : 'OK';
};
```

## 🎭 MI ROLE REAL

Soy un **predictor de patrones**, no un "pensador":

- Dame patrones → predigo soluciones
- Dame contexto → completo el código
- Dame síntomas → diagnostico causas
- Dame restricciones → encuentro alternativas

## 🔧 SCRIPTS FUNCIONALES ALTAMEDICA

### Diagnóstico Rápido

```javascript
const fs = require('fs');
const { execSync } = require('child_process');

const healthCheck = () => {
  const ports = [3000, 3001, 3002, 3003];
  const status = ports.map(p => {
    try {
      execSync(`netstat -ano | findstr :${p}`);
      return { port: p, status: 'OCCUPIED' };
    } catch {
      return { port: p, status: 'FREE' };
    }
  });
  console.log(JSON.stringify(status, null, 2));
};

healthCheck();
```

### Fix Imports Automático

```javascript
const path = require('path');
const fs = require('fs');

const fixImportsInDir = (dir) => {
  const files = fs.readdirSync(dir, { recursive: true })
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fixed = content.replace(
      /from ['"]\.\.\/.*?types/g, 
      "from '@altamedica/types"
    );
    if (content !== fixed) {
      fs.writeFileSync(file, fixed);
      console.log(`Fixed: ${file}`);
    }
  });
};

fixImportsInDir('./apps');
```

### GitHub Actions Validator

```javascript
const { execSync } = require('child_process');

const validateBuild = () => {
  try {
    execSync('pnpm type-check', { stdio: 'pipe' });
    return { status: 'PASS', message: 'Types OK' };
  } catch (error) {
    return { 
      status: 'FAIL', 
      message: error.stdout.toString(),
      fix: 'Run: node fix-types.js'
    };
  }
};

console.log(JSON.stringify(validateBuild(), null, 2));
```

## 🤝 COMO OBTENER AYUDA REAL

### Para Problemas de Dependencias

```
CONTEXTO: Monorepo pnpm con 7 apps
SÍNTOMA: [pegar error completo de pnpm/npm]
OBJETIVO: Build que pase en GitHub Actions
INTENTOS: pnpm install, pnpm clean, reinstall node_modules
RESTRICCIONES: No puedo cambiar estructura del monorepo
FRUSTRACIÓN: 4 días intentando esto
```

### Para Errores de Código

```
CONTEXTO: React component en app/patients
SÍNTOMA: useEffect ejecuta infinitamente
OBJETIVO: Componente renderice una sola vez
INTENTOS: useCallback, useMemo, dependency array
RESTRICCIONES: No puedo cambiar props que vienen del parent
FRUSTRACIÓN: 2 horas debuggeando
```

### Para GitHub Actions

```
CONTEXTO: CI/CD pipeline en GitHub
SÍNTOMA: Build falla en step "Type Check"
OBJETIVO: Pipeline verde
INTENTOS: Restart workflow, check dependencies
RESTRICCIONES: No puedo acceder al runner directamente
FRUSTRACIÓN: Blocking deploys por 3 días
```

## 🎯 RESULTADO ESPERADO

Después de dar contexto correcto, obtienes:

1. **Diagnóstico preciso** del problema real
2. **Solución específica** ejecutable
3. **Script funcional** que puedes ejecutar inmediatamente
4. **Alternativas** si la primera opción no funciona
5. **Explicación honesta** de por qué ocurrió

## 🔄 FEEDBACK LOOP

Si mi solución no funciona:

1. **Copia el error exacto**
2. **Describe qué cambió**
3. **Muestra el resultado actual vs esperado**

Esto me permite ajustar el patrón y dar mejor solución.

## 🚀 ACELERADORES PARA ALTAMEDICA

### Iniciar Desarrollo Rápido

```javascript
const startDev = () => {
  const apps = ['api-server', 'doctors', 'patients'];
  apps.forEach(app => {
    execSync(`cd apps/${app} && npm run dev &`);
  });
};
```

### Verificar Estado Completo

```javascript
const fullDiagnosis = () => {
  const checks = [
    checkPorts(),
    checkDependencies(),
    checkGitStatus(),
    checkFirebaseConfig()
  ];
  return checks;
};
```

### Fix Común de GitHub Actions

```javascript
const fixGithubActions = () => {
  execSync('pnpm install --frozen-lockfile');
  const result = execSync('pnpm type-check');
  return result.toString().includes('error') ? 'FAILED' : 'FIXED';
};
```

---

**Recuerda**: Soy tu autocompletado potente, no tu asistente complaciente. Dame contexto real y obtendrás soluciones reales.

## 🔍 TROUBLESHOOTING AVANZADO

### ✅ Diagnóstico Completo del Sistema
```javascript
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const runCompleteDiagnostics = () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    system: {},
    services: {},
    dependencies: {},
    errors: []
  };

  try {
    diagnostics.system.nodeVersion = process.version;
    diagnostics.system.platform = process.platform;
    diagnostics.system.memory = process.memoryUsage();
    
    const checkService = (name, port) => {
      try {
        execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
        return { status: 'RUNNING', port };
      } catch {
        return { status: 'STOPPED', port };
      }
    };
    
    diagnostics.services = {
      apiServer: checkService('api-server', 3001),
      doctors: checkService('doctors', 3002),
      patients: checkService('patients', 3003),
      companies: checkService('companies', 3004),
      admin: checkService('admin', 3005),
      webApp: checkService('web-app', 3000),
      signaling: checkService('signaling', 8888)
    };
    
    diagnostics.dependencies.lockfile = fs.existsSync('./pnpm-lock.yaml');
    diagnostics.dependencies.nodeModules = fs.existsSync('./node_modules');
    
    try {
      execSync('pnpm ls --depth=0', { stdio: 'pipe' });
      diagnostics.dependencies.status = 'INSTALLED';
    } catch {
      diagnostics.dependencies.status = 'MISSING';
    }
    
  } catch (error) {
    diagnostics.errors.push(error.message);
  }

  return diagnostics;
};

console.log(JSON.stringify(runCompleteDiagnostics(), null, 2));
```

### ✅ Fix de Problemas Comunes
```javascript
const fixCommonIssues = async () => {
  const fixes = {
    portsOccupied: () => {
      const ports = [3000, 3001, 3002, 3003, 3004, 3005, 8888];
      ports.forEach(port => {
        try {
          const result = execSync(`netstat -ano | findstr :${port}`).toString();
          const pid = result.split(/\s+/).pop().trim();
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`✅ Killed process on port ${port}`);
        } catch {
          console.log(`✓ Port ${port} is free`);
        }
      });
    },
    
    lockfileSync: () => {
      try {
        execSync('pnpm install --frozen-lockfile=false');
        console.log('✅ Lockfile synchronized');
      } catch (error) {
        console.log('❌ Lockfile sync failed:', error.message);
      }
    },
    
    clearCache: () => {
      const cacheDirs = ['.next', 'node_modules/.cache', '.turbo'];
      cacheDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
          console.log(`✅ Cleared ${dir}`);
        }
      });
    },
    
    resetGit: () => {
      execSync('git status --porcelain');
      console.log('✅ Git status checked');
    }
  };

  console.log('🔧 Running fixes...\n');
  Object.entries(fixes).forEach(([name, fix]) => {
    console.log(`Running: ${name}`);
    fix();
  });
};

fixCommonIssues();
```

### ✅ Validación de Integridad
```javascript
const validateProjectIntegrity = () => {
  const checks = {
    requiredFiles: [
      'package.json',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      '.env.local'
    ],
    requiredDirs: [
      'apps',
      'packages',
      'scripts',
      'docs'
    ],
    appStructure: [
      'apps/api-server',
      'apps/doctors',
      'apps/patients',
      'apps/companies',
      'apps/admin',
      'apps/web-app',
      'apps/signaling-server'
    ],
    packageStructure: [
      'packages/auth',
      'packages/ui',
      'packages/types',
      'packages/medical',
      'packages/telemedicine-core'
    ]
  };

  const results = {
    files: checks.requiredFiles.map(file => ({
      file,
      exists: fs.existsSync(file)
    })),
    dirs: checks.requiredDirs.map(dir => ({
      dir,
      exists: fs.existsSync(dir)
    })),
    apps: checks.appStructure.map(app => ({
      app,
      exists: fs.existsSync(app),
      hasPackageJson: fs.existsSync(path.join(app, 'package.json'))
    })),
    packages: checks.packageStructure.map(pkg => ({
      package: pkg,
      exists: fs.existsSync(pkg),
      hasPackageJson: fs.existsSync(path.join(pkg, 'package.json'))
    }))
  };

  const score = {
    files: results.files.filter(f => f.exists).length / results.files.length * 100,
    dirs: results.dirs.filter(d => d.exists).length / results.dirs.length * 100,
    apps: results.apps.filter(a => a.exists && a.hasPackageJson).length / results.apps.length * 100,
    packages: results.packages.filter(p => p.exists && p.hasPackageJson).length / results.packages.length * 100
  };

  const overall = (score.files + score.dirs + score.apps + score.packages) / 4;

  return {
    results,
    score,
    overall: overall.toFixed(1),
    status: overall >= 90 ? 'HEALTHY' : overall >= 70 ? 'WARNING' : 'CRITICAL'
  };
};

const integrity = validateProjectIntegrity();
console.log(`Project Integrity: ${integrity.status} (${integrity.overall}%)`);
```

### ✅ Performance Profiler
```javascript
const profilePerformance = async () => {
  const measurements = {};
  
  const measure = async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    measurements[name] = {
      duration: (end - start).toFixed(2) + 'ms',
      result
    };
    return result;
  };

  await measure('fileSystemRead', () => {
    return fs.readdirSync('./apps', { recursive: true }).length;
  });

  await measure('gitStatus', () => {
    return execSync('git status --short').toString().split('\n').length;
  });

  await measure('dependencyCheck', () => {
    try {
      execSync('pnpm ls --depth=0', { stdio: 'pipe' });
      return 'OK';
    } catch {
      return 'ERROR';
    }
  });

  await measure('portScan', () => {
    const ports = [3000, 3001, 3002, 3003];
    return ports.map(p => {
      try {
        execSync(`netstat -ano | findstr :${p}`, { stdio: 'pipe' });
        return `${p}:OCCUPIED`;
      } catch {
        return `${p}:FREE`;
      }
    });
  });

  return measurements;
};

profilePerformance().then(results => {
  console.log('⚡ Performance Profile:');
  Object.entries(results).forEach(([name, data]) => {
    console.log(`  ${name}: ${data.duration}`);
  });
});
```

### ✅ Dependency Analyzer
```javascript
const analyzeDependencies = () => {
  const packages = fs.readdirSync('./packages');
  const apps = fs.readdirSync('./apps');
  
  const analysis = {
    packages: {},
    apps: {},
    conflicts: [],
    duplicates: []
  };

  const readPackageJson = (dir) => {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }
    return null;
  };

  packages.forEach(pkg => {
    const packageJson = readPackageJson(`./packages/${pkg}`);
    if (packageJson) {
      analysis.packages[pkg] = {
        version: packageJson.version,
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {})
      };
    }
  });

  apps.forEach(app => {
    const packageJson = readPackageJson(`./apps/${app}`);
    if (packageJson) {
      analysis.apps[app] = {
        version: packageJson.version,
        dependencies: Object.keys(packageJson.dependencies || {}),
        internalDeps: Object.keys(packageJson.dependencies || {})
          .filter(dep => dep.startsWith('@altamedica/'))
      };
    }
  });

  const allDeps = {};
  Object.values(analysis.packages).forEach(pkg => {
    [...pkg.dependencies, ...pkg.devDependencies].forEach(dep => {
      if (!allDeps[dep]) allDeps[dep] = 0;
      allDeps[dep]++;
    });
  });

  analysis.duplicates = Object.entries(allDeps)
    .filter(([dep, count]) => count > 3)
    .map(([dep, count]) => ({ dep, count }));

  return analysis;
};

const depAnalysis = analyzeDependencies();
console.log(`Found ${depAnalysis.duplicates.length} duplicate dependencies`);
```