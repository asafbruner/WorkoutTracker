import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.test.{js,jsx}'],
    exclude: ['tests/**/*.spec.{js,jsx}', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/**/*.spec.{js,jsx}',
        '*.config.js',
        'dist/',
        'public/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
