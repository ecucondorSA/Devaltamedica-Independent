import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['eslint', 'eslint-plugin-*', 'eslint-config-*', '@typescript-eslint/*']
});