# @altamedica/api-helpers

API utility functions and helpers

## 📦 Installation

```bash
pnpm add @altamedica/api-helpers
```

## 🚀 Usage

```typescript
import { /* components/functions */ } from '@altamedica/api-helpers';
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
packages/api-helpers/
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

API documentation is available in the source code with JSDoc comments.

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
- @altamedica/shared

---

Part of the [AltaMedica Platform](https://github.com/altamedica/platform)
