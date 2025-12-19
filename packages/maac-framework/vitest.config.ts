import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    // Load .env from workspace root
    env: {
      ...require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }).parsed,
    },
  },
});
