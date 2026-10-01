import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  target: 'es2020',
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  banner: { js: '"use client";' },
});
