# PHASE 2: CROSS-APP CONSUMPTION ANALYSIS

## UI Package Import Analysis & Critical Gap Detection

**Analysis Date**: 2025-08-25  
**Analysis Scope**: All apps consuming @altamedica/ui package  
**Critical Issues Found**: 15 high-priority import failures

---

## 🚨 CRITICAL IMPORT FAILURES

### 1. **Missing Corporate Components**

**Status**: BREAKING BUILDS ❌

**Components Failing**:

- `CardCorporate` - imported by 8+ files
- `CardContentCorporate` - imported by 7+ files
- `CardHeaderCorporate` - imported by 4+ files
- `ButtonCorporate` - imported by 6+ files

**Apps Affected**:

- ✅ `apps/patients/src/` (heavily affected)
- ⚠️ `apps/web-app/src/` (some files)

**Example Failures**:

```typescript
// ❌ FAILING IMPORTS
import { CardCorporate } from '@altamedica/ui';
import { ButtonCorporate } from '@altamedica/ui';
import { CardHeaderCorporate, CardContentCorporate } from '@altamedica/ui';

// Files affected:
// - apps/patients/src/components/AnamnesisStats.tsx:19-20
// - apps/patients/src/components/AnamnesisCard.tsx:22-24
// - apps/patients/src/components/layout/Sidebar.tsx:16-18
```

### 2. **Missing Dialog/Modal Components**

**Status**: CRITICAL ❌

**Components Failing**:

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- Apps trying to import these from `@altamedica/ui/dialog`

**Apps Affected**:

- ✅ `apps/companies/src/components/appointments/` (2 files)
- ✅ `apps/companies/src/components/forms/` (1 file)
- ✅ `apps/patients/src/components/data-export/` (2 files)

**Example Failures**:

```typescript
// ❌ FAILING IMPORT PATTERNS
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@altamedica/ui/dialog';
import { DialogFooter, DialogHeader, DialogTitle } from '@altamedica/ui/dialog';
```

### 3. **Missing Enhanced Onboarding Components**

**Status**: CRITICAL ❌

**Components Failing**:

- `EnhancedPatientOnboarding`
- `EnhancedDoctorOnboarding`

**Apps Affected**:

```typescript
// ❌ FAILING IN DOCTORS APP
import { EnhancedDoctorOnboarding } from '@altamedica/ui';
// apps/doctors/src/app/onboarding/page.tsx:4

// ❌ FAILING IN PATIENTS APP
import { EnhancedPatientOnboarding } from '@altamedica/ui';
// apps/patients/src/app/onboarding/page.tsx:4
```

### 4. **Missing Telemedicine Components**

**Status**: HIGH PRIORITY ❌

**Components Failing**:

- `EmergencyButton`, `EmergencyType`
- `ConnectionMetrics`, `ConnectionStatus`
- `toast` function

**Apps Affected**:

```typescript
// ❌ FAILING IN DOCTORS APP
import { EmergencyButton, EmergencyType } from '@altamedica/ui';
import { toast } from '@altamedica/ui';
import { ConnectionMetrics, ConnectionStatus } from '@altamedica/ui';
```

### 5. **Missing Admin Components**

**Status**: MEDIUM PRIORITY ⚠️

**Components Failing**:

- `AuditLogTable`
- `StatsGrid` from dashboard

**Apps Affected**:

```typescript
// ❌ FAILING IN ADMIN APP
import { AuditLogTable } from '@altamedica/ui';
import { StatsGrid } from '@altamedica/ui/components/dashboard';
```

---

## 📊 COMPONENT USAGE FREQUENCY ANALYSIS

### **Most Used Components** (Cross-app consumption)

1. **Card** - 201 imports ✅ (working)
2. **Button** - 190 imports ✅ (working)
3. **Input** - 173 imports ✅ (working)
4. **CardHeader** - 26 imports ✅ (working)
5. **CardContent** - 26 imports ✅ (working)
6. **Badge** - 16 imports ✅ (working)
7. **CardTitle** - 9 imports ✅ (working)
8. **Tabs, TabsContent, TabsList** - 7 imports each ✅ (working)

### **Corporate Components** (High failure rate)

- **ButtonCorporate** - 4+ imports ❌ (failing)
- **CardCorporate** - 8+ imports ❌ (failing)
- **CardContentCorporate** - 7+ imports ❌ (failing)

---

## 🏗️ IMPORT PATTERN ANALYSIS

### **Inconsistent Import Patterns Found**

#### 1. **Mixed Import Styles**

```typescript
// ✅ WORKING PATTERN
import { Button, Card, Input } from '@altamedica/ui';

// ❌ FAILING PATTERN (subpath imports)
import { Button } from '@altamedica/ui/button';
import { Dialog } from '@altamedica/ui/dialog';
```

#### 2. **Corporate vs Standard Component Confusion**

```typescript
// ❌ MIXED USAGE CAUSING CONFUSION
import { Card } from '@altamedica/ui'; // Standard
import { CardCorporate } from '@altamedica/ui'; // Corporate (missing!)

// This creates inconsistent UX across apps
```

#### 3. **Alias Imports for Missing Components**

```typescript
// ⚠️ WORKAROUND PATTERNS FOUND
import {
  CardCorporate as Card,
  CardContentCorporate as CardContent,
  CardHeaderCorporate as CardHeader,
  ButtonCorporate as Button,
} from '@altamedica/ui';
// apps/patients/src/app/post-consultation/page.tsx:8-11
```

---

## 🎯 APP-SPECIFIC CONSUMPTION PATTERNS

### **PATIENTS APP** - Heaviest UI Consumer

- **Status**: MOST CRITICAL ❌
- **Files**: 80+ files importing from @altamedica/ui
- **Main Issues**:
  - Heavy use of `CardCorporate` variants (failing)
  - Mixed import patterns
  - Stub components created to handle failures

**Critical Files**:

```
apps/patients/src/components/AnamnesisStats.tsx
apps/patients/src/components/AnamnesisCard.tsx
apps/patients/src/components/layout/Sidebar.tsx
apps/patients/src/app/post-consultation/page.tsx
```

### **DOCTORS APP** - Professional Focus

- **Status**: HIGH PRIORITY ❌
- **Files**: 60+ files importing from @altamedica/ui
- **Main Issues**:
  - Missing `EnhancedDoctorOnboarding`
  - Missing telemedicine components
  - Standard components working well

### **COMPANIES APP** - B2B Dashboard Focus

- **Status**: MEDIUM PRIORITY ⚠️
- **Files**: 50+ files importing from @altamedica/ui
- **Main Issues**:
  - Dialog components failing in appointments
  - Heavy use of dashboard components (mostly working)

### **ADMIN APP** - System Management

- **Status**: MEDIUM PRIORITY ⚠️
- **Files**: 15+ files importing from @altamedica/ui
- **Main Issues**:
  - Missing `AuditLogTable`
  - Missing dashboard components
  - Basic components working

### **WEB-APP** - Marketing Site

- **Status**: LOW PRIORITY ✅
- **Files**: 30+ files importing from @altamedica/ui
- **Main Issues**:
  - Minimal failures
  - Mostly uses basic components

---

## 🚨 IMMEDIATE ACTION REQUIRED

### **Priority 1: Fix Corporate Components** (BLOCKING)

These are causing the most build failures:

```typescript
// MISSING FROM @altamedica/ui/src/index.ts:
export { CardCorporate } from './components/ui/card-corporate';
export { CardContentCorporate } from './components/ui/card-corporate';
export { CardHeaderCorporate } from './components/ui/card-corporate';
export { ButtonCorporate } from './components/ui/button-corporate';
```

### **Priority 2: Fix Dialog Components** (BLOCKING)

Apps expect these to be available:

```typescript
// MISSING DIALOG EXPORTS:
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
```

### **Priority 3: Fix Onboarding Components** (HIGH)

Critical for user flows:

```typescript
// MISSING ONBOARDING EXPORTS:
export { EnhancedPatientOnboarding } from './components/medical/patient-onboarding';
export { EnhancedDoctorOnboarding } from './components/medical/doctor-onboarding';
```

### **Priority 4: Fix Telemedicine Components** (HIGH)

Critical for video calls:

```typescript
// MISSING TELEMEDICINE EXPORTS:
export { EmergencyButton } from './components/telemedicine/emergency-button';
export { ConnectionMetrics, ConnectionStatus } from './components/telemedicine/connection';
export { toast } from './utils/toast'; // or appropriate toast implementation
export type { EmergencyType } from './types/telemedicine';
```

---

## 🔧 RECOMMENDED FIX STRATEGY

### **Step 1: Audit UI Package Exports**

1. ✅ Compare imports vs actual exports in `/packages/ui/src/index.ts`
2. ✅ Identify all missing components
3. ✅ Create component files if they don't exist
4. ✅ Add proper exports

### **Step 2: Standardize Import Patterns**

1. ❌ **Remove subpath imports**: `/button`, `/dialog`, `/card` etc
2. ✅ **Force single entry point**: Import everything from `@altamedica/ui`
3. ✅ **Update all apps** to use consistent import pattern

### **Step 3: Component Consolidation**

1. **Decision needed**: Keep both `Card` AND `CardCorporate`?
2. **Recommendation**: Consolidate to single `Card` with variant props
3. **Migration**: Provide codemod for mass replacement

### **Step 4: Build Verification**

1. ✅ Fix TypeScript compilation errors
2. ✅ Test apps individually: `npm run dev` in each app
3. ✅ Test monorepo build: `pnpm build`
4. ✅ Verify GitHub Actions pass

---

## 📈 SUCCESS METRICS

### **Before Fix (Current State)**:

- ❌ TypeScript errors: ~50+ across apps
- ❌ Build failures in CI/CD
- ❌ Missing component stubs needed
- ❌ Inconsistent UX due to missing corporate styling

### **After Fix (Target State)**:

- ✅ Zero TypeScript compilation errors
- ✅ All apps build successfully
- ✅ Green GitHub Actions
- ✅ Consistent component usage across apps
- ✅ No workaround stubs needed

---

## 🧪 TESTING STRATEGY

### **Per App Testing**:

```bash
# Test each app individually
cd apps/patients && npm run dev
cd apps/doctors && npm run dev
cd apps/companies && npm run dev
cd apps/admin && npm run dev
cd apps/web-app && npm run dev
```

### **Monorepo Testing**:

```bash
# Test full build
pnpm type-check
pnpm build

# Test dev mode
pnpm dev:medical
```

---

This analysis provides a complete picture of UI consumption patterns and critical import failures that need immediate resolution to restore build stability.
