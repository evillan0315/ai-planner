# AI Planner: Structured Code Generation and Prompt Engineering UI

The AI Planner provides a powerful web interface to turn natural-language developer requests into structured, executable code plans. It also features a dedicated LLM Prompt Generator to assist in creating highly constrained system prompts for custom AI tasks, alongside **integrated file management** and a **dedicated code workspace (Codejector)** for reviewing and modifying files locally. Built with TypeScript, a React + Vite frontend, and a Node/NestJS backend, it streamlines the process of generating, reviewing, and applying code changes safely.

- Repository: evillan0315/ai-planner
- Primary language: TypeScript

---

## Quick Overview

AI Planner UI provides three main tools:

1. **AI Code Planner:** Accepts developer instructions, analyzes project context, and generates structured, executable code plans (unified diffs, new file content, build scripts, git commands).
2. **Codejector Workspace:** A dedicated split-view IDE for file management (CRUD), code editing (Monaco), and multi-tab viewing, linked directly to the project root.
3. **LLM Prompt Generator:** A dedicated tool for composing and validating complex, schema-enforced system prompts used for planning and custom generation tasks.

Watch a short demo: https://youtu.be/Lcls1s0MJV0


## Screenshots

![Planner 01](https://github.com/evillan0315/ai-planner/blob/main/screens/planner03.png)
![Planner 02](https://github.com/evillan0315/ai-planner/blob/main/screens/planner02.png)
![Planner 03](https://github.com/evillan0315/ai-planner/blob/main/screens/planner01.png)


For architecture details see docs/OVERVIEW_ARCHITECTURE.md.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage (Web UI Workflow)](#usage-web-ui-workflow)
- [Configuration](#configuration)
- [Backend API (quick reference)](#backend-api-quick-reference)
- [Project Structure](#project-structure)
- [Customization & Extensibility](#customization--extensibility)
- [Contributing](#contributing)
- [License & Contact](#license--contact)

---

## Features

- Natural-language driven planning and patch suggestion.
- **Integrated File Management:** Full CRUD operations (Create, Read, Update, Delete) for files and folders, along with Drag-and-Drop Move/Copy functionality, all executed on the host filesystem via the secure backend API.
- **Codejector Workspace:** Dedicated multi-tab Monaco editor integrated with the File Explorer for deep context review and file modification. Supports standard code editing features, including line/column tracking and save shortcuts.
- **Media Viewer:** Floating, resizable, and draggable window viewers for common image, video (e.g., MP4), and audio formats, utilizing secure stream URLs from the backend.
- **Structured Plan Output:** Generates a single, valid JSON object (`IPlan`) containing:
    - **Plan Metadata:** Title, Summary, AI Confidence (0.0-1.0), Estimated Effort (minutes).
    - **Execution Details:** Detailed **Thought Process**, **Assumptions**, **Build Scripts**, and user-reviewable **Documentation**.
    - **Code Changes:** A list of executable file changes (`ADD`, `MODIFY`, `DELETE`, `REPAIR`) with unified diffs or new content, individual rationale, and effort estimates.
    - **Tests & Git:** Structured lists of recommended tests to add/modify, plus executable Git instructions (branch name, commit message, commands).
- LLM Prompt Generator: A dedicated UI for defining complex system prompts, JSON schemas, constraints, and examples for fine-tuning LLM output.
- Edit plan and individual file changes before applying.
- Dry-run preview mode and optional apply mode (creates local patches/commits).
- Multimodal inputs (file uploads) to enrich AI context.
- Folder browsing to select local project roots.
- Authentication via backend (JWT + Google/GitHub OAuth).
- Theme toggle, robust error handling, and clear operation status.

---

## Getting Started

Prerequisites:
- Node.js v18+.
- pnpm (recommended) or npm/yarn.
- Backend server (project-board-server) running and reachable (default: http://localhost:5000/api).
- An LLM provider configured on the backend (e.g., Google Gemini or OpenAI-compatible).

Clone and install:

```bash
git clone https://github.com/evillan0315/ai-planner.git
cd ai-planner
pnpm install
```

Start development server:

```bash
pnpm run dev
# Default: http://localhost:3003
```

Build for production:

```bash
pnpm run build
# Output -> dist/
```

Run tests:

```bash
pnpm test
pnpm test:coverage
```

---

## Usage (Web UI Workflow)

The AI Planner application is a single-page application focused on providing a structured planning interface.

1. **Workspace Navigation:** Use the left sidebar File Explorer to browse the project. Files (code/text) can be opened in the multi-tab **Codejector Workspace** via double-click, and media files (images, video, audio) open in **Floating Viewer windows**.
2. **Set Project Root & Context:** On the Planner page, use the integrated File Explorer to define the local `Project Root` (an absolute path on the host filesystem) and configure `Scan Paths` (relevant files/folders to analyze relative to the root).
3. **Generate Plan:** Provide a detailed natural language request (or define structured prompt components) and click 'Generate Plan'. The UI sends the request, project context, and default instructions/schema to the backend API.
4. **Review & Edit:** Review the AI-generated structured plan, including the **Thought Process**, **Assumptions**, **Confidence Metrics**, and the detailed list of **File Changes** (patches, additions, deletions). Individual file changes (diffs/new content) and plan metadata can be edited before application.
5. **Apply Changes:** Click 'Apply Plan' to send the executable changes (patches, additions, deletions) to the backend, which attempts to apply them to your local project directory. You can also apply changes individually via the action buttons in the File Changes table.

---

## Configuration

### Frontend Environment Variables (.env):

```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_PORT=3003
VITE_BASE_DIR=/absolute/path/to/ai-planner # Crucial: Must be an absolute path on host filesystem
VITE_PREVIEW_APP_URL=http://localhost:3002 # Optional preview URL
```

Important: `VITE_BASE_DIR` must be the absolute path to the project root on your filesystem where the planner will execute file operations. The frontend uses this as the default project root when creating planner requests. If incorrect, the planner cannot scan or apply changes properly.

### Backend Configuration (project-board-server .env):
The backend OAuth configuration must match the frontend callback URLs:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3003/auth/callback

HUB_CLIENT_ID=...
HUB_CLIENT_SECRET=...
HUB_CALLBACK_URL=http://localhost:3003/auth/callback

FRONTEND_URL=http://localhost:3003
```

Security: never commit API keys or secrets. Use environment variables or secret managers.

---

## Backend API (quick reference)

Assumes VITE_API_URL configured to the backend.

- POST /api/plan
  - Generate a new plan. Sends userPrompt, projectRoot, scanPaths, additional instructions, expected format, and optional base64 file data.
  - Response: { planId, plan }

- GET /api/plan/:planId
  - Retrieve an existing plan.

- GET /api/planner/paginated?page=&pageSize=
  - Paginated list of plans for the authenticated user.

- POST /api/plan/apply
  - Apply a plan to the server’s filesystem (projectRoot optional; falls back to server config).

- POST /api/plan/:planId/apply-chunk/:changeIndex
  - Apply a single change within a plan.

File listing and operations:
- GET /api/file/list?directory=<path>&recursive=false
- POST /api/file/read (Reads file content)
- POST /api/file/write (Writes/updates file content)
- POST /api/file/create (Creates new file or folder)
- POST /api/file/delete (Deletes file/folder)
- POST /api/file/rename (Renames file/folder)
- POST /api/file/copy (Copies file/folder)
- POST /api/file/move (Moves file/folder)
- GET /api/file/stream (Retrieves secured media stream URL for viewers)

Request/response shapes align to types in src/components/planner/types.ts (ILlmInput, IGeneratePlanResponse, IApplyPlanResult, etc.).

---

## Project Structure (high level)

Key directories:
- public/ — static assets
- src/
  - api/ — axios services (auth, planner)
  - components/
    - file-explorer/ — Integrated file system browsing and context setting.
    - planner/ — Core UI and logic for plan generation, review, and application.
    - editor/ — Monaco Editor wrapper and multi-tab/floating viewer state management.
    - ui/ — Reusable components (e.g., context menus, dialogs, media players).
  - pages/ — route-level components (PlannerPage, LoginPage, CodejectorPage)
  - stores/ — nanostores for app state
  - theme/ — MUI theme config
  - utils/ — helpers
- docs/ — User/Developer/Architecture guides
- kubernetes/ — optional deployment configs

See the full tree in the repository for file-level details.

---

## Customization & Extensibility

- Modify default AI prompts and output schema: `src/components/planner/constants/instructions.ts`
- Change default project root: `.env` -> `VITE_BASE_DIR` or via plannerStore initial state.
- Add provider adapters on the backend to support alternative LLMs.
- Extend analyzers/plugins to support more frameworks or project types.

---

## Contributing

Contributions welcome — please follow these steps:
1. Fork the repo and create a branch.
2. Add tests for new behavior.
3. Open a PR with a clear description and a link to any related issue.
4. Run linter and tests before submitting.

See CONTRIBUTING.md for details.

---

## License & Contact

MIT License — see LICENSE.

Eddie Villanueva — evillan0315@gmail.com
LinkedIn: https://www.linkedin.com/in/evillanueva0315/
GitHub: https://github.com/evillan0315
