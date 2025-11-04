/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_BASE_URL: string;
  readonly VITE_FRONTEND_PORT: string;
  readonly VITE_BASE_DIR: string; // Base directory for the project, used as default for AI Planner
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
