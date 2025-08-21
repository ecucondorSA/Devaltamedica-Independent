import { defineConfig } from 'tsup';

const shouldGenerateTypes = true;

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'medical/index': 'src/medical/index.ts',
    'medical/patient/index': 'src/medical/patient/index.ts',
    'medical/doctor/index': 'src/medical/doctor/index.ts',
    'medical/clinical/index': 'src/medical/clinical/index.ts',
    'api/index': 'src/api/index.ts',
    'security/index': 'src/security/index.ts',
    'validators/index': 'src/validators/index.ts',
    'guards/index': 'src/guards/index.ts',
    'ai/index': 'src/ai/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: shouldGenerateTypes,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.esm.js' : '.js',
    };
  },
});
