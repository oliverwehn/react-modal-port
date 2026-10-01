import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    typecheck: {
      enabled: true,
      include: ['src/**/*.test-d.{ts,tsx}'],
      tsconfig: './tsconfig.json',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test*.{ts,tsx}', 'src/index.ts', 'src/types.ts'],
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 95 },
    },
  },
});
