import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to type resolution issues
  clean: true,
  target: 'es2022',
  sourcemap: false,
  splitting: false,
  skipNodeModulesBundle: true,
  silent: true
});