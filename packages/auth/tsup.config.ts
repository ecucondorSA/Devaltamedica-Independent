import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'next'],
  noExternal: [],
  tsconfig: './tsconfig.json',
  // Preserve 'use client' directive
  banner: {
    js: `"use client";`,
  },
});
