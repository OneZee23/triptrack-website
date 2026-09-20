import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // jsdom opted-in per-file via `// @vitest-environment jsdom`
    setupFiles: ['./src/test/setup.ts'],
    // Соседние воркдеревья агентов лежат в .worktrees/ — без исключения
    // прогон из корня собирает их копии тестов и падает на чужой версии.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
  },
});
