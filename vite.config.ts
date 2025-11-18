import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    // Ensure plugins are correctly flattened if they return arrays or for type inference issues
    plugins: [react(), tailwindcss()].flat().filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    preview: {
      port: 4173, // Default preview server port
    },
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT || '3000'), // Convert string to number, with fallback
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/gemini': {
          target: env.VITE_GEMINI_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/gemini/, ''),
        },
      },
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      allowedHosts: ['app.local', 'localhost', 'generativelanguage.googleapis.com'],
    },
    define: {
      // These define statements are only relevant if the frontend code directly uses them.
      // Current services use relative '/api' paths handled by proxy/rewrites.
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(env.GITHUB_CALLBACK_URL),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(env.GOOGLE_CALLBACK_URL),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_API_PORT': env.VITE_API_PORT,
      'import.meta.env.VITE_FRONTEND_PORT': env.VITE_FRONTEND_PORT,
      'import.meta.env.VITE_GEMINI_API_URL': JSON.stringify(env.VITE_GEMINI_API_URL),
      'import.meta.env.VITE_GEMINI_API_MODEL': JSON.stringify(env.VITE_GEMINI_API_MODEL),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    test: {
      environment: 'jsdom', // Use JSDOM for browser-like environment
      globals: true, // Make Vitest APIs global
      setupFiles: './vitest.setup.ts', // Path to your setup file
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
      deps: {
        inline: ['@testing-library/jest-dom'], // Fix: Inline jest-dom for proper Vitest resolution
      },
      coverage: {
        provider: 'v8', // or 'istanbul'
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx', // Entry file, not much logic to test directly
          'src/vite-env.d.ts', // Type declarations
          'src/App.tsx', // Routes setup, integration test territory
          'src/**/*.d.ts', // Any other declaration files
          'src/mocks/**/*', // Mocks itself
          'src/**/types.ts', // Type definitions are not tested
          'src/**/constants/**/*', // Constants files are not tested
          'src/theme/**/*', // Theme configuration is visual, not logic
          'src/utils/persistentAtom.ts', // Simple wrapper, covered implicitly
        ],
      },
    },
  };
});
