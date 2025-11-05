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
      },
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      allowedHosts: ['app.local', 'localhost'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      // These define statements are only relevant if the frontend code directly uses them.
      // Current services use relative '/api' paths handled by proxy/rewrites.
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(env.GITHUB_CALLBACK_URL),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(env.GOOGLE_CALLBACK_URL),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_API_PORT': env.VITE_API_PORT,
      'import.meta.env.VITE_FRONTEND_PORT': env.VITE_FRONTEND_PORT,
    },
  };
});
