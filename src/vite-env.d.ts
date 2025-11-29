/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FRONTEND_PORT: number;
  readonly VITE_API_PORT: number;
  readonly GITHUB_CALLBACK_URL: string;
  readonly GOOGLE_CALLBACK_URL: string;
  readonly VITE_BASE_DIR: string; // New: Default base directory for AI Planner
  readonly VITE_GEMINI_API_URL: string;
  readonly VITE_GEMINI_API_MODEL: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_GEMINI_API_ENDPOINT: string;
  readonly VITE_TERMINAL_WS_URL: string; // ADDED
  readonly VITE_BACKEND: string;
  
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
