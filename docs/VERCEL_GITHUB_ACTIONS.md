# Vercel Deployment with GitHub Actions for AI Planner Frontend

This document provides detailed instructions and explanations for deploying the `ai-planner` frontend application to Vercel using an automated GitHub Actions workflow.

## 1. Vercel Configuration (`vercel.json`)

The `vercel.json` file, located at the root of the `apps/ai-planner` directory, configures how Vercel builds and serves your frontend application. It also handles crucial API rewrites to direct backend calls.

```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "${VERCEL_BACKEND_API_URL}/api/$1"
    }
  ]
}
```

### Explanation of `vercel.json`:

*   **`framework: "vite"`**: Specifies that the project is built using Vite. Vercel automatically detects and optimizes for Vite projects, but explicitly defining it ensures consistency.
*   **`buildCommand: "pnpm run build"`**: This is the command Vercel executes to build your application. It corresponds to the `build` script defined in your `package.json`.
*   **`outputDirectory: "dist"`**: After the build command runs, Vercel expects the static assets to be located in the `dist` directory, which is the default output for Vite builds.
*   **`rewrites`**: This is a critical configuration for monorepos and applications interacting with a separate backend. It tells Vercel's edge network to intercept and redirect requests based on defined rules.
    *   **`source: "/api/(.*)"`**: This rule matches any incoming request path that starts with `/api/`. The `(.*)` is a wildcard that captures the rest of the path.
    *   **`destination: "${VERCEL_BACKEND_API_URL}/api/$1"`**: When a request matches the `source`, Vercel rewrites it to this `destination`.
        *   `${VERCEL_BACKEND_API_URL}`: This is an environment variable that **must be configured in your Vercel Project Settings** (and GitHub Actions secrets, as shown below). It should point to the base URL of your deployed backend API (e.g., `https://your-backend-api.com`).
        *   `/api/$1`: The captured part of the original source path (`$1`) is appended after `/api/` to the backend URL, ensuring the correct API endpoint is targeted (e.g., `/api/auth/login` becomes `https://your-backend-api.com/api/auth/login`).

This rewrite rule enables your frontend to make relative API calls (e.g., `axios.get('/api/auth/me')`) which Vercel then transparently forwards to your actual backend service, avoiding CORS issues and simplifying client-side API configuration.

## 2. GitHub Actions Workflow (`.github/workflows/deploy-vercel.yml`)

The GitHub Actions workflow automates the process of building and deploying the `ai-planner` frontend to Vercel whenever changes are pushed or pull requests are opened against the `main` branch within the `apps/ai-planner` directory.

```yaml
name: Deploy AI Planner Frontend to Vercel

on:
  push:
    branches:
      - main
    paths:
      - 'apps/ai-planner/**'
  pull_request:
    branches:
      - main
    paths:
      - 'apps/ai-planner/**'

env:
  NODE_VERSION: '20'
  PNPM_CACHE_DIR: '~/.pnpm-store'

jobs:
  deploy-vercel:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./apps/ai-planner

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ env.NODE_VERSION }} and pnpm
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          run_install: false

      - name: Get pnpm store directory
        id: pnpm-cache
        run: |
          echo "PNPM_STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Cache pnpm modules
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.PNPM_STORE_PATH }}
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm run lint

      - name: Build project
        run: pnpm run build

      - name: Deploy to Vercel
        uses: vercel/action-deploy@v5
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
          org-id: ${{ secrets.VERCEL_ORG_ID }}
          project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          # Set 'cwd' to the subdirectory containing your Vercel project (where vercel.json is)
          cwd: './apps/ai-planner'
          # Pass the backend API URL as an environment variable for vercel.json rewrites
          env: |
            VERCEL_BACKEND_API_URL=${{ secrets.VERCEL_BACKEND_API_URL }}
```

### Secrets Management

To ensure this workflow functions correctly and securely, you need to configure the following secrets:

1.  **GitHub Repository Secrets**: Navigate to your GitHub repository settings -> `Secrets and variables` -> `Actions` and add the following new repository secrets:
    *   `VERCEL_TOKEN`: Your personal Vercel API token. Generate one from Vercel Dashboard -> Account -> Settings -> Tokens.
    *   `VERCEL_ORG_ID`: Found in your Vercel project settings under 'General' or 'Vercel Org ID' from the dashboard URL.
    *   `VERCEL_PROJECT_ID`: Found in your Vercel project settings under 'General' or the URL of your Vercel project.
    *   `VERCEL_BACKEND_API_URL`: The full URL to your deployed backend API (e.g., `https://api.yourdomain.com`). This will be used by the `vercel.json` rewrites.

2.  **Vercel Project Environment Variables**: In your Vercel Dashboard, go to your `ai-planner` project settings -> `Environment Variables`. Add `VERCEL_BACKEND_API_URL` here as well, with the same value as your GitHub Secret. While the GitHub Action passes it to the *build environment*, Vercel itself also needs it configured for its runtime and rewrites to function correctly.

By following these steps, your `ai-planner` frontend will be automatically built, linted, and deployed to Vercel whenever relevant changes are pushed to your `main` branch, ensuring a continuous and efficient deployment pipeline.