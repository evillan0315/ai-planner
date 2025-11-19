// vite.config.ts
import { defineConfig, loadEnv } from "file:///media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/node_modules/vite/dist/node/index.js";
import react from "file:///media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    // Ensure plugins are correctly flattened if they return arrays or for type inference issues
    plugins: [react(), tailwindcss()].flat().filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    build: {
      chunkSizeWarningLimit: 1e3
    },
    preview: {
      port: 4173
      // Default preview server port
    },
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT || "3000"),
      // Convert string to number, with fallback
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path2) => path2.replace(/^\/api/, "")
        },
        "/gemini": {
          target: env.VITE_GEMINI_API_URL,
          changeOrigin: true,
          rewrite: (path2) => path2.replace(/^\/gemini/, "")
        }
      },
      cors: {
        origin: ["*"],
        methods: ["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
      },
      allowedHosts: ["app.local", "localhost", "generativelanguage.googleapis.com"]
    },
    define: {
      // These define statements are only relevant if the frontend code directly uses them.
      // Current services use relative '/api' paths handled by proxy/rewrites.
      "import.meta.env.GITHUB_CALLBACK_URL": JSON.stringify(env.GITHUB_CALLBACK_URL),
      "import.meta.env.GOOGLE_CALLBACK_URL": JSON.stringify(env.GOOGLE_CALLBACK_URL),
      "import.meta.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
      "import.meta.env.VITE_API_PORT": env.VITE_API_PORT,
      "import.meta.env.VITE_FRONTEND_PORT": env.VITE_FRONTEND_PORT,
      "import.meta.env.VITE_GEMINI_API_URL": JSON.stringify(env.VITE_GEMINI_API_URL),
      "import.meta.env.VITE_GEMINI_API_MODEL": JSON.stringify(env.VITE_GEMINI_API_MODEL),
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    test: {
      environment: "jsdom",
      // Use JSDOM for browser-like environment
      globals: true,
      // Make Vitest APIs global
      setupFiles: "./vitest.setup.ts",
      // Path to your setup file
      css: {
        modules: {
          classNameStrategy: "non-scoped"
        }
      },
      deps: {
        inline: ["@testing-library/jest-dom"]
        // Fix: Inline jest-dom for proper Vitest resolution
      },
      coverage: {
        provider: "v8",
        // or 'istanbul'
        reporter: ["text", "json", "html"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/main.tsx",
          // Entry file, not much logic to test directly
          "src/vite-env.d.ts",
          // Type declarations
          "src/App.tsx",
          // Routes setup, integration test territory
          "src/**/*.d.ts",
          // Any other declaration files
          "src/mocks/**/*",
          // Mocks itself
          "src/**/types.ts",
          // Type definitions are not tested
          "src/**/constants/**/*",
          // Constants files are not tested
          "src/theme/**/*",
          // Theme configuration is visual, not logic
          "src/utils/persistentAtom.ts"
          // Simple wrapper, covered implicitly
        ]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbWVkaWEvZWRkaWUvRGF0YS9wcm9qZWN0cy9uZXN0SlMvbmVzdC1tb2R1bGVzL3Byb2plY3QtYm9hcmQtc2VydmVyL2FwcHMvYWktcGxhbm5lclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21lZGlhL2VkZGllL0RhdGEvcHJvamVjdHMvbmVzdEpTL25lc3QtbW9kdWxlcy9wcm9qZWN0LWJvYXJkLXNlcnZlci9hcHBzL2FpLXBsYW5uZXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21lZGlhL2VkZGllL0RhdGEvcHJvamVjdHMvbmVzdEpTL25lc3QtbW9kdWxlcy9wcm9qZWN0LWJvYXJkLXNlcnZlci9hcHBzL2FpLXBsYW5uZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCkpO1xuXG4gIHJldHVybiB7XG4gICAgLy8gRW5zdXJlIHBsdWdpbnMgYXJlIGNvcnJlY3RseSBmbGF0dGVuZWQgaWYgdGhleSByZXR1cm4gYXJyYXlzIG9yIGZvciB0eXBlIGluZmVyZW5jZSBpc3N1ZXNcbiAgICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0uZmxhdCgpLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogNDE3MywgLy8gRGVmYXVsdCBwcmV2aWV3IHNlcnZlciBwb3J0XG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IHBhcnNlSW50KGVudi5WSVRFX0ZST05URU5EX1BPUlQgfHwgJzMwMDAnKSwgLy8gQ29udmVydCBzdHJpbmcgdG8gbnVtYmVyLCB3aXRoIGZhbGxiYWNrXG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGVudi5WSVRFX0FQSV9VUkwsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXG4gICAgICAgIH0sXG4gICAgICAgICcvZ2VtaW5pJzoge1xuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfR0VNSU5JX0FQSV9VUkwsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9nZW1pbmkvLCAnJyksXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgY29yczoge1xuICAgICAgICBvcmlnaW46IFsnKiddLFxuICAgICAgICBtZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ09QVElPTlMnLCAnREVMRVRFJywgJ1BBVENIJywgJ1BVVCddLFxuICAgICAgICBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddLFxuICAgICAgICBjcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBhbGxvd2VkSG9zdHM6IFsnYXBwLmxvY2FsJywgJ2xvY2FsaG9zdCcsICdnZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20nXSxcbiAgICB9LFxuICAgIGRlZmluZToge1xuICAgICAgLy8gVGhlc2UgZGVmaW5lIHN0YXRlbWVudHMgYXJlIG9ubHkgcmVsZXZhbnQgaWYgdGhlIGZyb250ZW5kIGNvZGUgZGlyZWN0bHkgdXNlcyB0aGVtLlxuICAgICAgLy8gQ3VycmVudCBzZXJ2aWNlcyB1c2UgcmVsYXRpdmUgJy9hcGknIHBhdGhzIGhhbmRsZWQgYnkgcHJveHkvcmV3cml0ZXMuXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LkdJVEhVQl9DQUxMQkFDS19VUkwnOiBKU09OLnN0cmluZ2lmeShlbnYuR0lUSFVCX0NBTExCQUNLX1VSTCksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LkdPT0dMRV9DQUxMQkFDS19VUkwnOiBKU09OLnN0cmluZ2lmeShlbnYuR09PR0xFX0NBTExCQUNLX1VSTCksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX1VSTCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0FQSV9VUkwpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQSV9QT1JUJzogZW52LlZJVEVfQVBJX1BPUlQsXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRlJPTlRFTkRfUE9SVCc6IGVudi5WSVRFX0ZST05URU5EX1BPUlQsXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfR0VNSU5JX0FQSV9VUkwnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9HRU1JTklfQVBJX1VSTCksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfR0VNSU5JX0FQSV9NT0RFTCc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0dFTUlOSV9BUElfTU9ERUwpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0dFTUlOSV9BUElfS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfR0VNSU5JX0FQSV9LRVkpLFxuICAgIH0sXG4gICAgdGVzdDoge1xuICAgICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsIC8vIFVzZSBKU0RPTSBmb3IgYnJvd3Nlci1saWtlIGVudmlyb25tZW50XG4gICAgICBnbG9iYWxzOiB0cnVlLCAvLyBNYWtlIFZpdGVzdCBBUElzIGdsb2JhbFxuICAgICAgc2V0dXBGaWxlczogJy4vdml0ZXN0LnNldHVwLnRzJywgLy8gUGF0aCB0byB5b3VyIHNldHVwIGZpbGVcbiAgICAgIGNzczoge1xuICAgICAgICBtb2R1bGVzOiB7XG4gICAgICAgICAgY2xhc3NOYW1lU3RyYXRlZ3k6ICdub24tc2NvcGVkJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBkZXBzOiB7XG4gICAgICAgIGlubGluZTogWydAdGVzdGluZy1saWJyYXJ5L2plc3QtZG9tJ10sIC8vIEZpeDogSW5saW5lIGplc3QtZG9tIGZvciBwcm9wZXIgVml0ZXN0IHJlc29sdXRpb25cbiAgICAgIH0sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBwcm92aWRlcjogJ3Y4JywgLy8gb3IgJ2lzdGFuYnVsJ1xuICAgICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLFxuICAgICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0cyx0c3h9J10sXG4gICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICAnc3JjL21haW4udHN4JywgLy8gRW50cnkgZmlsZSwgbm90IG11Y2ggbG9naWMgdG8gdGVzdCBkaXJlY3RseVxuICAgICAgICAgICdzcmMvdml0ZS1lbnYuZC50cycsIC8vIFR5cGUgZGVjbGFyYXRpb25zXG4gICAgICAgICAgJ3NyYy9BcHAudHN4JywgLy8gUm91dGVzIHNldHVwLCBpbnRlZ3JhdGlvbiB0ZXN0IHRlcnJpdG9yeVxuICAgICAgICAgICdzcmMvKiovKi5kLnRzJywgLy8gQW55IG90aGVyIGRlY2xhcmF0aW9uIGZpbGVzXG4gICAgICAgICAgJ3NyYy9tb2Nrcy8qKi8qJywgLy8gTW9ja3MgaXRzZWxmXG4gICAgICAgICAgJ3NyYy8qKi90eXBlcy50cycsIC8vIFR5cGUgZGVmaW5pdGlvbnMgYXJlIG5vdCB0ZXN0ZWRcbiAgICAgICAgICAnc3JjLyoqL2NvbnN0YW50cy8qKi8qJywgLy8gQ29uc3RhbnRzIGZpbGVzIGFyZSBub3QgdGVzdGVkXG4gICAgICAgICAgJ3NyYy90aGVtZS8qKi8qJywgLy8gVGhlbWUgY29uZmlndXJhdGlvbiBpcyB2aXN1YWwsIG5vdCBsb2dpY1xuICAgICAgICAgICdzcmMvdXRpbHMvcGVyc2lzdGVudEF0b20udHMnLCAvLyBTaW1wbGUgd3JhcHBlciwgY292ZXJlZCBpbXBsaWNpdGx5XG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMmEsU0FBUyxjQUFjLGVBQWU7QUFDamQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBRXhCLE9BQU8sVUFBVTtBQUpqQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBRXZDLFNBQU87QUFBQTtBQUFBLElBRUwsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDdkQsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ3BDO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQTtBQUFBLElBQ1I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU0sU0FBUyxJQUFJLHNCQUFzQixNQUFNO0FBQUE7QUFBQSxNQUMvQyxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLElBQUk7QUFBQSxVQUNaLGNBQWM7QUFBQSxVQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQzlDO0FBQUEsUUFDQSxXQUFXO0FBQUEsVUFDVCxRQUFRLElBQUk7QUFBQSxVQUNaLGNBQWM7QUFBQSxVQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLGFBQWEsRUFBRTtBQUFBLFFBQ2pEO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0osUUFBUSxDQUFDLEdBQUc7QUFBQSxRQUNaLFNBQVMsQ0FBQyxPQUFPLFFBQVEsV0FBVyxVQUFVLFNBQVMsS0FBSztBQUFBLFFBQzVELGdCQUFnQixDQUFDLGdCQUFnQixlQUFlO0FBQUEsUUFDaEQsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBLGNBQWMsQ0FBQyxhQUFhLGFBQWEsbUNBQW1DO0FBQUEsSUFDOUU7QUFBQSxJQUNBLFFBQVE7QUFBQTtBQUFBO0FBQUEsTUFHTix1Q0FBdUMsS0FBSyxVQUFVLElBQUksbUJBQW1CO0FBQUEsTUFDN0UsdUNBQXVDLEtBQUssVUFBVSxJQUFJLG1CQUFtQjtBQUFBLE1BQzdFLGdDQUFnQyxLQUFLLFVBQVUsSUFBSSxZQUFZO0FBQUEsTUFDL0QsaUNBQWlDLElBQUk7QUFBQSxNQUNyQyxzQ0FBc0MsSUFBSTtBQUFBLE1BQzFDLHVDQUF1QyxLQUFLLFVBQVUsSUFBSSxtQkFBbUI7QUFBQSxNQUM3RSx5Q0FBeUMsS0FBSyxVQUFVLElBQUkscUJBQXFCO0FBQUEsTUFDakYsdUNBQXVDLEtBQUssVUFBVSxJQUFJLG1CQUFtQjtBQUFBLElBQy9FO0FBQUEsSUFDQSxNQUFNO0FBQUEsTUFDSixhQUFhO0FBQUE7QUFBQSxNQUNiLFNBQVM7QUFBQTtBQUFBLE1BQ1QsWUFBWTtBQUFBO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsVUFDUCxtQkFBbUI7QUFBQSxRQUNyQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLE1BQU07QUFBQSxRQUNKLFFBQVEsQ0FBQywyQkFBMkI7QUFBQTtBQUFBLE1BQ3RDO0FBQUEsTUFDQSxVQUFVO0FBQUEsUUFDUixVQUFVO0FBQUE7QUFBQSxRQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLFFBQ2pDLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxRQUM3QixTQUFTO0FBQUEsVUFDUDtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
