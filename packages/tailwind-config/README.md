# @altamedica/tailwind-config

Configuración unificada de Tailwind CSS y PostCSS para todas las aplicaciones de AltaMedica.

## 📦 Instalación

```bash
pnpm add -D @altamedica/tailwind-config
```

## 🚀 Uso

### Tailwind Config

En tu archivo `tailwind.config.js`:

```javascript
const baseConfig = require('@altamedica/tailwind-config/base');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@altamedica/ui/dist/**/*.js',
  ],
  // Puedes extender o sobrescribir configuraciones específicas
  theme: {
    extend: {
      ...baseConfig.theme.extend,
      // Tus extensiones específicas aquí
    }
  }
};
```

### PostCSS Config

En tu archivo `postcss.config.js`:

```javascript
module.exports = require('@altamedica/tailwind-config/postcss');
```

### Solo el Tema

Si solo necesitas los colores y el tema:

```javascript
const altamedicaTheme = require('@altamedica/tailwind-config/theme');

module.exports = {
  theme: {
    extend: {
      colors: altamedicaTheme.colors,
    }
  }
};
```

## 🎨 Colores del Sistema

La paleta de colores unificada incluye:

- **Primary** (Cyan/Azul Celeste): Color principal de la marca
- **Neutral** (Grises): Para textos y fondos
- **Success** (Verde): Estados positivos y confirmaciones
- **Alert** (Rojo): Errores y estados críticos
- **Argentina** (Azules): Colores especiales para el mercado argentino

## 🔧 Características Incluidas

- **Plugins**: Forms, Typography, Aspect Ratio, Container Queries
- **Dark Mode**: Habilitado con clase 'dark'
- **Animaciones**: Fade-in, slide-in, pulse-slow, bounce-slow
- **Sombras Médicas**: Optimizadas para UI médica
- **Breakpoints**: xs, 3xl, 4xl adicionales
- **Gradientes**: Médicos y de emergencia predefinidos

## 📝 Migración desde Configuración Local

1. Instala el paquete:
   ```bash
   pnpm add -D @altamedica/tailwind-config
   ```

2. Reemplaza tu `tailwind.config.js`:
   ```javascript
   // Antes (configuración local)
   module.exports = {
     content: [...],
     theme: { ... },
     plugins: [...]
   }
   
   // Después (configuración unificada)
   const baseConfig = require('@altamedica/tailwind-config/base');
   
   module.exports = {
     ...baseConfig,
     content: [...] // Mantén tu content específico
   };
   ```

3. Actualiza `postcss.config.js`:
   ```javascript
   module.exports = require('@altamedica/tailwind-config/postcss');
   ```

4. Elimina dependencias duplicadas de tu package.json local:
   - @tailwindcss/forms
   - @tailwindcss/typography
   - autoprefixer
   - postcss-import
   - etc.

## 🔄 Compatibilidad

- Tailwind CSS: ^3.3.0
- PostCSS: ^8.4.0
- Node.js: >=18.0.0

## 📚 Documentación Completa

Para más detalles sobre la configuración y personalización, consulta la documentación principal en `/docs/tailwind-config.md`.