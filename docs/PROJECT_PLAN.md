# AI Code Planner Project Plan

## 1. Introduction

This document outlines the project plan, encompassing the vision, goals, key features, technology stack, architectural overview, development workflow, design principles, and processes for the AI Code Planner frontend application. It serves as a guiding document for all stakeholders, ensuring alignment and providing a clear understanding of how the project is conceived, built, and maintained.

It complements other detailed documentation found in this `docs/` directory, such as the [Overview and Architecture](OVERVIEW_ARCHITECTURE.md), [Developer Guide](DEVELOPER_GUIDE.md), and [Project Roadmap](ROADMAP.md).

## 2. Project Vision & Goals

**Vision:** To empower developers with an intelligent, AI-driven platform that automates and streamlines code planning, modification, and project management directly within their local development environments.

**Goals:**
*   Provide a highly intuitive and responsive user interface for interacting with AI-generated code plans.
*   Enable granular control over AI output, allowing users to review, edit, and selectively apply code changes.
*   Ensure seamless integration with a robust Node.js/NestJS backend for AI processing and local file system interactions.
*   Prioritize type-safety, maintainability, and scalability in the frontend codebase.
*   Offer flexible authentication options to secure user data and interactions.
*   Facilitate efficient contribution and development through clear processes and comprehensive documentation.

## 3. Key Features

Based on the project's `README.md`, the AI Code Planner offers the following core features:

*   **Authentication:** JWT-based authentication with OAuth2 support (Google, GitHub) via the backend.
*   **AI Code Planning & Generation:** Natural language prompts, configurable scan paths, customizable AI instructions (system prompt), and specified JSON output format for structured code modification plans.
*   **Multimodal Input:** Ability to upload images or other files to provide additional context to the AI.
*   **Dynamic Folder Browsing:** In-app browsing of the local file system for selecting project roots and scan paths.
*   **Granular Plan Review & Editing:** Detailed review of generated plans (metadata, individual file changes) with full editing capabilities before application.
*   **Granular Plan Application:** Apply entire plans or individual file changes to the local project directory, with clear status feedback.
*   **User Feedback & Error Details:** Visual cues for loading states, comprehensive error handling, and dedicated UI for detailed AI generation error messages.
*   **Theming:** Light/Dark mode toggle.

## 4. Technology Stack

### Frontend
*   **Core:** React v18, Vite, TypeScript
*   **UI Framework:** Material UI v6, Material Icons v6
*   **Styling:** Tailwind CSS v4 (for layout and utilities), Emotion (MUI's styling engine)
*   **State Management:** Nanostores (global and persistent state), React `useState`/`useReducer` (local component state)
*   **Routing:** React Router DOM
*   **API Client:** Axios
*   **Code Editor:** Monaco Editor
*   **File Path Utilities:** `path-browserify`
*   **Date Handling:** `date-fns`

### Backend (Interacts with)
*   **Framework:** Node.js, NestJS
*   **AI Integration:** Google Gemini API
*   **Database:** Prisma (for data persistence related to plans, users, etc.)

## 5. Architecture Overview

The frontend follows a modern, component-based architecture designed for modularity, maintainability, and scalability. It leverages React for UI, Nanostores for state, and Material UI/Tailwind for styling.

Key architectural considerations:
*   **Client-Side Rendering (CSR):** The application is a single-page application (SPA) rendered client-side with Vite.
*   **Modular Design:** Components are organized by feature (`planner/`, `auth/`), with clear separation of concerns (UI components, hooks, services, stores).
*   **Global State Management:** Nanostores are used for application-wide state (e.g., `authStore`, `themeStore`, `plannerStore`, `fileTreeStore`), offering a lean and reactive approach.
*   **Services Layer:** `api/` directory contains services (`authService.ts`, `plannerService.ts`) responsible for encapsulating API calls using Axios, abstracting backend interactions from components and stores.
*   **Routing:** React Router DOM manages navigation and view rendering based on URL paths.
*   **Theming:** Material UI's `ThemeProvider` combined with Nanostores provides dynamic light/dark mode switching, with Tailwind CSS classes used for utility-first styling.
*   **Code Editing:** Integration of Monaco Editor for rich code viewing and editing experiences within the planner feature.

For a detailed breakdown of the system architecture, refer to the [Overview and Architecture document](docs/OVERVIEW_ARCHITECTURE.md).

## 6. Workflow & Development Process

### 6.1. Feature Lifecycle
1.  **Ideation & Planning:** Features are discussed, scoped, and outlined, often involving updates to the [ROADMAP.md](ROADMAP.md).
2.  **Design:** UI/UX mockups or detailed component designs are created for new features.
3.  **Development:** Developers pick up tasks, create feature branches, and implement changes.
4.  **Testing:** Unit, component, and integration tests are written/updated. Manual testing and peer reviews are conducted.
5.  **Code Review:** Pull Requests (PRs) are opened, requiring at least one (preferably two) approvals from other team members. CI/CD checks must pass.
6.  **Deployment:** Merged changes are deployed to staging/production environments via automated CI/CD pipelines (refer to [DEPLOYMENT.md](DEPLOYMENT.md) and [VERCEL_GITHUB_ACTIONS.md](VERCEL_GITHUB_ACTIONS.md)).

### 6.2. Branching Strategy
The project utilizes a simplified GitHub Flow, aiming for clear separation of development from stable releases.

*   **`main` branch:** Represents the latest stable, production-ready code. Only hotfixes or releases should be merged directly into `main` after passing all checks.
*   **`develop` branch:** Primary branch for ongoing development. All new features and regular bug fixes are eventually merged into `develop`.
*   **`feature/<feature-name>` branches:** Created from `develop` for implementing new features. These are merged back into `develop` via PRs.
*   **`bugfix/<bug-description>` branches:** Created from `develop` for non-critical bug fixes. Merged back into `develop` via PRs.
*   **`hotfix/<hotfix-description>` branches:** Created from `main` for critical production bugs. Merged back into both `main` and `develop`.

### 6.3. Code Review Process
*   All code changes must go through a Pull Request (PR).
*   PRs should have clear titles and descriptions, linking to relevant issues/tasks.
*   At least one approving review is required before merging. Reviewers should check for:
    *   Adherence to coding standards and style guides.
    *   Type safety and absence of `any` where avoidable.
    *   Correct implementation of requirements.
    *   Performance implications.
    *   Test coverage.
*   Automated CI checks (linting, build, basic tests) must pass.

### 6.4. Testing Strategy
*   **Unit Tests:** Using a framework like Vitest (if integrated) for individual functions, hooks, and small components.
*   **Component Tests:** Using React Testing Library for testing React components in isolation, simulating user interactions.
*   **End-to-End (E2E) Tests:** Using Playwright or Cypress (if integrated) for critical user flows across the application.
*   **Manual Testing:** Before merging to `main`, features are manually tested on a staging environment.

### 6.5. Deployment Strategy
*   Automated CI/CD pipelines are configured using GitHub Actions.
*   Merges to `develop` trigger deployments to a staging environment for testing.
*   Merges/releases from `main` trigger deployments to production.
*   Details are available in [DEPLOYMENT.md](DEPLOYMENT.md) and [VERCEL_GITHUB_ACTIONS.md](VERCEL_GITHUB_ACTIONS.md).

## 7. Design Principles

*   **Modularity & Reusability:** Components, hooks, and utilities are designed to be small, focused, and reusable across the application.
*   **Type Safety:** Strict TypeScript usage throughout the codebase to catch errors early and improve maintainability.
*   **Responsiveness:** UI is designed to be fully responsive, adapting to various screen sizes using Tailwind CSS and Material UI's responsive features.
*   **Performance:** Code splitting, memoization (e.g., `useMemo`, `useCallback`), and efficient state updates are employed to ensure a smooth user experience.
*   **User Experience (UX):** Emphasis on intuitive navigation, clear visual feedback (loading states, error messages), and accessible design.
*   **Consistency:** Adherence to Material UI design system principles and consistent use of Tailwind CSS for spacing and layout.
*   **Separation of Concerns:** Clear distinction between UI logic, business logic (stores/services), and data fetching.

## 8. State Management Strategy

*   **Global/Application State:** Managed using **Nanostores**. This includes authentication status (`authStore`), theme preference (`themeStore`), global project root (`fileTreeStore`), and the primary AI planner state (`plannerStore`). Nanostores provide a lightweight, reactive, and performant solution for global state.
*   **Persistent State:** For values that need to survive page refreshes, `nanostores` combined with `localStorage` (via a `persistentAtom` utility) is used.
*   **Local Component State:** For ephemeral state that is only relevant within a single component, React's `useState` and `useReducer` hooks are utilized.

## 9. API Interaction & Error Handling

*   **API Client:** Axios is used for all HTTP requests to the backend.
*   **Service Layer:** Dedicated service files (`authService.ts`, `plannerService.ts`) encapsulate API calls, ensuring consistency, handling common headers (e.g., JWT token), and providing type-safe request/response interfaces.
*   **Authentication Token:** JWT tokens are stored in `localStorage` and managed by `authStore`, automatically attached to authenticated requests.
*   **Centralized Error Handling:** Errors from API calls are caught in service layers or hooks, propagated to Nanostores (e.g., `authStore.error`, `plannerStore.error`), and displayed to the user via UI components (e.g., `Alert`, `Snackbar`). Detailed error messages from the AI backend are explicitly handled and presented.

## 10. Documentation Strategy

The project maintains comprehensive documentation to support development, usage, and deployment:

*   **`README.md`:** High-level project overview, setup, features, and quick start guide.
*   **`docs/OVERVIEW_ARCHITECTURE.md`:** Detailed explanation of the system's design and architecture.
*   **`docs/DEVELOPER_GUIDE.md`:** Setup for contributors, coding standards, and deep dive into the frontend stack.
*   **`docs/USER_GUIDE.md`:** Instructions on how to use the application's features.
*   **`docs/DEPLOYMENT.md`:** Guides for deploying the application.
*   **`docs/ROADMAP.md`:** Future vision and planned features.
*   **`docs/PROJECT_PLAN.md` (This document):** Strategic overview of the project's direction and processes.
*   **Inline Code Comments:** JSDoc-style comments for functions, interfaces, and complex logic.

## 11. Future Considerations (Integration with Roadmap)

The project's evolution is guided by the [Project Roadmap](ROADMAP.md), which outlines planned enhancements and new features. This plan provides the foundational processes and principles that will enable the successful implementation of those roadmap items.

Continuous feedback from users and developers will be incorporated to refine features and prioritize development efforts, maintaining a responsive and adaptable project direction.