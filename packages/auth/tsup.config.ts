import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/client.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom'],
  treeshake: true,
  onSuccess: async () => {
    // Ensure 'use client' directive is preserved in specific files
    const fs = await import('fs');
    const path = await import('path');

    const clientFiles = ['dist/index.js', 'dist/index.mjs', 'dist/client.js', 'dist/client.mjs'];

    for (const file of clientFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.startsWith("'use client'")) {
          fs.writeFileSync(filePath, `'use client';\n${content}`);
        }
      }
    }
  },
});
