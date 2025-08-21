# @altamedica/auth

Authentication and authorization system

## 📦 Installation

```bash
pnpm add @altamedica/auth
```

## 🚀 Usage

```typescript
import { /* components/functions */ } from '@altamedica/auth';
```

## 🏗️ Development

### Prerequisites
- Node.js 18+
- pnpm 8.15.6+

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Development mode
pnpm dev

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean
```

## 📁 Structure

```
packages/auth/
├── src/           # Source code
├── dist/          # Compiled output
├── package.json   # Package configuration
└── tsconfig.json  # TypeScript configuration
```

## 🔧 Configuration

This package is part of the AltaMedica monorepo and follows the standardized configuration:

- **TypeScript**: ^5.8.3
- **Build Tool**: tsup (dual CJS/ESM output)
- **Module System**: ESM with CJS compatibility
- **Package Manager**: pnpm workspace

## 📚 API Documentation

Authentication flows and middleware documentation in CLAUDE.md.

## 🧪 Testing

```bash
pnpm test
```

## 📄 License

MIT © AltaMedica Platform

## 🤝 Contributing

This is an internal package of the AltaMedica platform. For contributing guidelines, please refer to the main repository documentation.

## 🔗 Related Packages

- @altamedica/types
- @altamedica/firebase
- @altamedica/shared

---

Part of the [AltaMedica Platform](https://github.com/altamedica/platform)
