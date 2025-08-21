# @altamedica/config-next

Preset compartido para Next.js con headers HIPAA y CSP consistente en todas las apps.

- Exporta: `createNextConfig`, `hipaaSecurityHeaders`, `buildCsp`.
- Uso recomendado en `next.config.js`:

```js
// next.config.js
const { createNextConfig } = require('@altamedica/config-next');

module.exports = {
  ...createNextConfig({ appName: 'web-app' }),
  // overrides locales aquí
};
```

Notas

- Evita duplicación de headers en cada app.
- CSP cambia en dev para habilitar HMR.
- Si tu herramienta no resuelve workspaces durante build, puedes usar fallback relativo:

```js
let createNextConfig;
try {
  ({ createNextConfig } = require('@altamedica/config-next'));
} catch {
  ({ createNextConfig } = require('../../packages/config-next/dist'));
}
```

Mantenimiento

- Cualquier cambio en contratos de headers requiere actualizar esta librería y reconstruir.
