# @altamedica/ui

UI component library

## 📦 Installation

```bash
pnpm add @altamedica/ui
```

## 🚀 Usage

```typescript
import { /* components/functions */ } from '@altamedica/ui';
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
packages/ui/
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

See [Storybook](https://storybook.altamedica.com) for component documentation.

## 🧪 Testing

```bash
pnpm test
```

## 📄 License

MIT © AltaMedica Platform

## 🤝 Contributing

This is an internal package of the AltaMedica platform. For contributing guidelines, please refer to the main repository documentation.

## 🔗 Related Packages

- @altamedica/hooks
- @altamedica/types
- @altamedica/medical

---

Part of the [AltaMedica Platform](https://github.com/altamedica/platform)
