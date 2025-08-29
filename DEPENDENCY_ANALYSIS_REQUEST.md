# 🚨 Dependency Analysis Request for Claude Opus

## Current Critical Issues

### 1. TypeScript Compilation Errors

```bash
# Current error when running tsc
tsconfig.json(27,25): error TS5090: Non-relative paths are not allowed when 'baseUrl' is not set.
```

### 2. Firebase Version Conflicts

- Multiple Firebase package versions across apps
- Authentication inconsistencies
- Firestore configuration issues

### 3. Package Dependencies Matrix

#### Root Dependencies

- Next.js: ^14.x (inconsistent across apps)
- TypeScript: ^5.x (version conflicts)
- Firebase: ^10.x (mixed versions)
- React: ^18.x (peer dependency issues)

#### Problematic Packages

- `@altamedica/types` - Type definitions conflicts
- `@altamedica/auth` - Firebase auth version mismatch
- `@altamedica/database` - Firestore integration issues
- `@altamedica/ui` - React version conflicts

### 4. Monorepo Package Resolution

```json
{
  "paths": {
    "@altamedica/*": ["packages/*/src"]
  }
}
```

- Path resolution failing
- Circular dependency warnings
- Build order issues

## Analysis Request for Opus

Please provide:

1. **Unified dependency versions** across all packages
2. **Complete TypeScript configuration** fixes
3. **Firebase integration solution** with consistent versions
4. **Step-by-step migration plan** with exact commands
5. **Package.json updates** for each app and package

## Expected Output

1. **Dependency Matrix** - Exact versions for all packages
2. **Configuration Files** - Updated tsconfig.json files
3. **Migration Commands** - Step-by-step execution plan
4. **Validation Steps** - How to verify fixes work

## Critical Apps Priority

1. `api-server` - Backend services
2. `patients` - Patient portal
3. `doctors` - Healthcare provider interface
4. `auth` package - Authentication system
5. `database` package - Data layer

**This requires Opus-level analysis for complex dependency resolution!**
