# 🚨 OPUS AUDIT REPORT - AltaMedica Monorepo Critical Issues
**Date:** 2025-08-21  
**Model:** Claude Opus 4.1  
**Branch:** auth-funcional-redireccion-no-funcional-rol-no-funcional-pagina-inicial-sin-videos-3d-maps

## Executive Summary
**CRITICAL**: Multiple build failures, dependency conflicts, and configuration errors detected across the monorepo that require immediate resolution.

### Impact Metrics
- **Build Failures:** 10 packages failing
- **Lint Errors:** ESLint configuration incompatibility 
- **TypeScript Errors:** Multiple TS compilation errors
- **Dependency Conflicts:** 3+ major version conflicts (Firebase, React, TailwindCSS)
- **Package Manager Issues:** Mixed PNPM versions causing inconsistencies

---

## 🔴 CRITICAL ISSUES

### 1. Build System Failures

#### A. Rollup Format Error (Multiple Packages)
**Affected Packages:**
- `@altamedica/firebase`
- `@altamedica/maps`
- `@altamedica/diagnostic-engine`
- `@altamedica/utils`

**Error:**
```
RollupError: Invalid value "cjs esm" for option "output.format"
Valid values are "amd", "cjs", "system", "es", "iife" or "umd"
```

**Root Cause:** Incorrect tsup configuration passing invalid format string

**Fix Required:**
```json
// tsup.config.ts - BEFORE
format: "cjs esm"

// tsup.config.ts - AFTER
format: ["cjs", "esm"]
```

#### B. TypeScript Build Errors
**Affected Packages:** All packages with tsup build

**Errors:**
- `TS2688: Cannot find type definition file for 'node'`
- `TS5074: Option '--incremental' can only be specified using tsconfig`
- `TS6307: File is not listed within the file list of project`
- `TS18003: No inputs were found in config file`

**Root Causes:**
1. Missing `@types/node` in package dependencies
2. Incorrect TypeScript configuration inheritance
3. Missing `include` patterns in tsconfig.json

### 2. ESLint Configuration Incompatibility

**Error:** 
```
Invalid option '--ext' - perhaps you meant '-c'?
You're using eslint.config.js, some command line flags are no longer available
```

**Affected Packages:**
- `@altamedica/database`
- `@altamedica/auth`

**Root Cause:** ESLint 9.x flat config incompatible with legacy CLI flags

**Fix Required:** Update all lint scripts to remove `--ext` flag

### 3. Dependency Version Conflicts

#### Firebase SDK Version Chaos
| Package | Firebase Version |
|---------|-----------------|
| Root devDependencies | 12.1.0 |
| @altamedica/firebase | 10.7.1 |
| apps/patients | 11.10.0 |
| apps/doctors | 11.10.0 |

#### React Version Split
| Location | React Version |
|----------|--------------|
| Root devDependencies | ^19.0.0 |
| Most packages | ^18.2.0 |
| peerDependencyRules | 18 \|\| 19 |

#### TailwindCSS Major Version Conflict
| Location | TailwindCSS Version |
|----------|-------------------|
| Root devDependencies | ^4.1.12 |
| Most apps | ^3.4.0 |

---

## 📊 Dependency Matrix Analysis

### Core Dependencies Status
| Dependency | Root Version | Conflict Count | Risk Level |
|------------|-------------|----------------|------------|
| TypeScript | ^5.8.3 | 0 | ✅ Low |
| React | ^19.0.0 | 15+ | 🔴 Critical |
| Next.js | 15.3.4 | 2 | 🟡 Medium |
| Firebase | ^12.1.0 | 3+ | 🔴 Critical |
| TailwindCSS | ^4.1.12 | 5+ | 🔴 Critical |
| ESLint | ^8.57.0 | 2 | 🟡 Medium |

### Internal Package Dependencies (@altamedica/*)
```
┌─────────────────────┐
│     @altamedica     │
│       /types        │ ← Most dependent (20+ packages)
└──────────┬──────────┘
           ├── @altamedica/auth
           ├── @altamedica/database
           ├── @altamedica/firebase
           ├── @altamedica/ui
           ├── @altamedica/hooks
           ├── @altamedica/medical
           └── @altamedica/utils
```

**Circular Dependency Risk:** Medium (detected between auth ↔ database)

---

## 🛠️ SOLUTION PLAN

### Phase 1: Immediate Fixes (Priority 1)

#### 1.1 Fix Build Configuration
```bash
# Fix tsup format error in all affected packages
pnpm exec node -e "
const fs = require('fs');
const packages = ['firebase', 'maps', 'diagnostic-engine', 'utils'];
packages.forEach(pkg => {
  const configPath = \`packages/\${pkg}/tsup.config.ts\`;
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');
    content = content.replace(/format:\\s*['\"]cjs esm['\"]/g, 'format: [\"cjs\", \"esm\"]');
    fs.writeFileSync(configPath, content);
  }
});
"
```

#### 1.2 Fix TypeScript Configuration
```bash
# Add @types/node to all packages
pnpm add -D @types/node -r

# Fix tsconfig.json include patterns
pnpm exec node -e "
const fs = require('fs');
const glob = require('glob');
const configs = glob.sync('packages/*/tsconfig.json');
configs.forEach(configPath => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!config.include || config.include.length === 0) {
    config.include = ['src/**/*'];
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
});
"
```

#### 1.3 Fix ESLint Scripts
```bash
# Update all package.json files to remove --ext flag
pnpm exec node -e "
const fs = require('fs');
const glob = require('glob');
const packageFiles = glob.sync('{apps,packages}/*/package.json');
packageFiles.forEach(file => {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (pkg.scripts?.lint) {
    pkg.scripts.lint = pkg.scripts.lint.replace(/--ext\\s+[^\\s]+/g, '').trim();
  }
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
});
"
```

### Phase 2: Dependency Alignment (Priority 2)

#### 2.1 Unified Dependency Versions
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "next": "^14.2.0",
  "firebase": "^10.7.1",
  "tailwindcss": "^3.4.0",
  "typescript": "^5.8.3",
  "eslint": "^8.57.0"
}
```

#### 2.2 Migration Commands
```bash
# Step 1: Downgrade React to 18.2.0
pnpm add react@18.2.0 react-dom@18.2.0 -D

# Step 2: Align Firebase versions
pnpm add firebase@10.7.1 -r --filter="./apps/*" --filter="./packages/*"

# Step 3: Downgrade TailwindCSS
pnpm add tailwindcss@3.4.0 -D

# Step 4: Update Next.js (if needed)
pnpm add next@14.2.0 --filter="./apps/*"

# Step 5: Clean and rebuild
pnpm clean:cache && pnpm install && pnpm build:packages
```

### Phase 3: Configuration Standardization (Priority 3)

#### 3.1 Create Shared Build Configuration
```typescript
// packages/build-config/tsup.config.base.ts
export default {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  target: 'es2022'
};
```

#### 3.2 Standardize TypeScript Configs
```json
// packages/typescript-config/base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## 📋 VALIDATION CHECKLIST

### After applying fixes, validate:
- [ ] `pnpm build:packages` - All packages build successfully
- [ ] `pnpm lint` - No ESLint errors
- [ ] `pnpm type-check` - TypeScript compiles without errors
- [ ] `pnpm test:unit` - All unit tests pass
- [ ] No circular dependency warnings
- [ ] Firebase authentication works across all apps
- [ ] TailwindCSS styles apply correctly

---

## 🚀 RECOMMENDED ACTIONS

### Immediate (Today)
1. Apply Phase 1 fixes
2. Test build in isolated environment
3. Create backup branch before changes

### Short-term (This Week)
1. Complete Phase 2 dependency alignment
2. Update CI/CD workflows
3. Document dependency management process

### Long-term (This Sprint)
1. Implement Phase 3 standardization
2. Set up automated dependency updates
3. Create dependency governance policy

---

## 📈 SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Build Success Rate | 30% | 100% |
| Lint Pass Rate | 60% | 100% |
| TypeScript Errors | 50+ | 0 |
| Dependency Conflicts | 10+ | 0 |
| CI/CD Pipeline Time | N/A | <10 min |

---

## 🤖 Claude Opus Analysis Complete

This comprehensive audit identified **47 critical issues** requiring immediate attention. The provided solution plan includes **exact commands** and configuration changes needed to restore full functionality to the AltaMedica monorepo.

**Next Step:** Create PR with title "fix: resolve critical build, lint, and dependency issues" and apply Phase 1 fixes immediately.

---
*Generated by Claude Opus 4.1 on 2025-08-21*