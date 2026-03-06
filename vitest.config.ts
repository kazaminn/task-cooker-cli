import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
    },
  },
});
