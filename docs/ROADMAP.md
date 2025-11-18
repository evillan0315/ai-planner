# Project Roadmap

This document outlines the vision, current focus, and planned future enhancements for the AI Code Planner Frontend.

## Vision

To create a powerful, intuitive, and highly integrated suite of AI-powered developer tools, making complex tasks like code modification accessible and efficient directly from the user's desktop.

## Current Focus (v0.1.0 - Initial Release)

This release establishes the core functionality and foundational user experience of the AI Code Planner.

-   **Robust Authentication:** Secure and reliable user login via email/password, Google OAuth2, and GitHub OAuth2.
-   **AI Code Planner Core Functionality:**
    -   **AI-driven Plan Generation:** Define project context (root directory, scan paths), craft detailed AI instructions (system prompt), specify JSON output format, and upload multimodal inputs (e.g., images) to generate structured code modification plans (add, modify, delete, repair, analyze files, install, run).
    -   **Dynamic File System Browsing:** Integrated file system browser within drawers to easily select project root directories and scan paths directly from the UI, enhancing setup for AI planning contexts.
    -   **Granular Plan Review & Editing:** Review detailed generated plans, including overall metadata (title, summary, thought process, documentation, git instructions) and individual file changes. Edit any aspect of the plan or its file changes (path, action, reason, new content) directly in the UI before application.
    -   **Granular Plan Application:** Apply entire generated plans or individual file changes to your local project directory, automating code modifications with clear status feedback.
    -   **Plan Management:** View a paginated list of all previously generated plans and load them for review or re-application.
-   **User Experience (UX):** A clean, responsive UI with light/dark mode support and clear feedback mechanisms for loading states, errors, and successful operations.
-   **Core Infrastructure:** A solid and maintainable React/Vite/TypeScript frontend, leveraging Material UI v6 for components and Tailwind CSS v4 for utility-first styling.

## Future Enhancements

### Short-Term (Next 1-3 Months)

-   **Enhanced AI Planner Interaction:**
    -   **Contextual Auto-completion:** Provide smarter suggestions for scan paths and file names based on the project structure and common project conventions.
    -   **Diff View for MODIFY/REPAIR:** Implement a visual diff tool within the `PlanDisplay` component to show proposed changes for `MODIFY` and `REPAIR` actions before application.
    -   **Undo/Rollback Mechanism:** Allow users to easily revert applied changes, possibly by integrating with Git staging/reset commands or by saving snapshots.
    -   **Pre-defined Plan Templates:** Offer a library of templates for common refactoring or feature addition tasks to streamline plan creation.
    -   **Improved File Tree Navigation:** Enhance the browsing experience with features like search, filtering, and more detailed file information.
-   **Notifications & Feedback:** More prominent and configurable success/error notifications for plan generation and application, potentially including desktop notifications.

### Medium-Term (Next 3-6 Months)

-   **Advanced AI Capabilities:**
    -   **Code Analysis & Refactoring Suggestions:** Proactive AI-driven suggestions for code improvements, security vulnerabilities, or performance optimizations.
    -   **Automated Testing Plan Generation:** AI-generated test plans and even test code based on feature descriptions or existing codebases.
    -   **Expanded Multi-Modal AI Input:** Deeper integration for various input types (e.g., video clips, audio) for the AI planner, enabling prompts like "make UI look like this screenshot."
-   **Project Integration:**
    -   **Deeper Git Integration:** Advanced integration with Git, including branch management, intelligent commit message generation, and automated pull request drafting.
    -   **Monorepo-Aware Context:** Improved handling and context management specifically for monorepo structures, understanding cross-project dependencies.
-   **User Customization & Presets:** Save and manage custom AI instructions, output schemas, default planner settings, and user-specific preferences across sessions.

### Long-Term (6+ Months)

-   **Collaborative Features:** Enable teams to share plans, review changes collaboratively, and manage code generation tasks within a team context.
-   **Plugin Architecture:** Develop a robust plugin architecture to allow community-driven extensions for different AI models, frameworks, programming languages, or development tools.
-   **Native Desktop Application:** Explore Electron or Tauri for a native desktop experience, offering deeper filesystem integration and potentially offline capabilities.
-   **Cloud/CI/CD Integration:** Connect directly with cloud-based development environments or CI/CD pipelines for automated plan execution and validation.
-   **Learning & Adaptation:** Implement AI models that learn from user feedback, accepted changes, and preferences to provide increasingly accurate, personalized, and helpful suggestions over time.

This roadmap is subject to change based on user feedback, technological advancements, and evolving project priorities. Your input is valuable!