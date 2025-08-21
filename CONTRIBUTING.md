# Contributing to AltaMedica

## 📋 TypeScript Monorepo Standards (30 Rules)

This project enforces strict TypeScript monorepo standards. All contributions must follow these rules:

### Critical Rules

1. **Exports Order**: `types` must be first in package.json exports
2. **Build Outputs**: All packages must generate dist folders
3. **No Broken Imports**: All imports must resolve correctly
4. **TypeScript Config**: `declaration: true` required
5. **Version Sync**: Internal packages must use consistent versions

### Before Submitting

1. **Validate**: `node monorepo-validator.js`
2. **Fix Issues**: `node fix-monorepo-aggressive.js`
3. **Build All**: `pnpm -r build`
4. **Test**: `pnpm test`

### Quality Standards

- TypeScript strict mode (goal)
- ESLint rules enforced
- Prettier formatting
- Test coverage >80%

### Workflow

1. Create feature branch
2. Make changes following standards
3. Run validation scripts
4. Submit PR with passing CI

## Current Health Score

Check `VALIDATION_REPORT_*.md` for latest score.

---

_Maintained by the AltaMedica team_
