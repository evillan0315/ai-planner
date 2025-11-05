/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_PORT: number;
  readonly VITE_API_PORT: number;
  readonly GITHUB_CALLBACK_URL: string;
  readonly GOOGLE_CALLBACK_URL: string;
  readonly VITE_BASE_DIR: string; // New: Default base directory for AI Planner
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
