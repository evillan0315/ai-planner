# Project Roadmap

This document outlines the vision, current focus, and planned future enhancements for the AI Code Planner Frontend.

## Vision

To create a powerful, intuitive, and highly integrated suite of AI-powered developer tools, making complex tasks like code modification accessible and efficient directly from the user's desktop.

## Current Focus (v0.1.0 - Initial Release)

-   **Robust Authentication:** Ensure secure and reliable user login via email/password, Google OAuth2, and GitHub OAuth2.
-   **AI Code Planner (MVP):** Provide foundational AI code planning capabilities, including:
    -   Defining project context (root directory, scan paths).
    -   Crafting AI instructions and expected output formats.
    -   Generating and displaying structured plans (add, modify, delete, repair, analyze).
    -   Applying individual or full plans to the local filesystem.
    -   Multimodal input (e.g., image upload) for additional AI context.
-   **User Experience:** Deliver a clean, responsive UI with light/dark mode support and clear feedback mechanisms.
-   **Core Infrastructure:** Establish a solid Vite/React/TypeScript foundation with Material UI and Tailwind CSS.

## Future Enhancements

### Short-Term (Next 1-3 Months)

-   **Enhanced AI Planner Features:**
    -   **Contextual Auto-completion:** Provide smarter suggestions for scan paths and file names based on the project structure.
    -   **Diff View for MODIFY/REPAIR:** Implement a visual diff tool within the `PlanDisplay` component to show proposed changes before application.
    -   **Undo/Rollback Mechanism:** Allow users to easily revert applied changes, possibly by integrating with Git staging/reset commands.
    -   **Pre-defined Plan Templates:** Offer templates for common refactoring or feature addition tasks to streamline planning.
    -   **Interactive File Tree Browser:** Improve `DirectoryPickerDrawer` to allow actual browsing of local directories (requires backend support for file listing).
-   **Notifications & Feedback:** More prominent success/error notifications for plan generation and application.

### Medium-Term (Next 3-6 Months)

-   **Advanced AI Capabilities:**
    -   **Code Analysis & Refactoring Suggestions:** Proactive suggestions for code improvements.
    -   **Automated Testing Plan Generation:** AI-generated test plans and even test code based on feature descriptions.
    -   **Multi-Modal AI Input:** Expanded support for image/screenshot/file input for the AI planner (e.g., "make UI look like this").
-   **Project Integration:**
    -   **Git Integration:** Deeper integration with Git, including branch management, commit message generation, and pull request drafting.
    -   **Monorepo Support:** Improved handling and context management for monorepo structures.
-   **User Customization & Presets:** Save and manage custom AI instructions, output schemas, and default planner settings.

### Long-Term (6+ Months)

-   **Collaborative Features:** Allow teams to share plans, review changes, and collaborate on code generation.
-   **Plugin Architecture:** Enable community-driven extensions for different AI models, frameworks, or tools.
-   **Desktop Application:** Explore Electron or Tauri for a native desktop experience with deeper filesystem integration.
-   **Cloud Integration:** Connect with cloud-based development environments or CI/CD pipelines.
-   **Learning & Adaptation:** AI models that learn from user feedback and preferences to provide increasingly accurate and helpful suggestions.

This roadmap is subject to change based on user feedback, technological advancements, and project priorities. Your input is valuable!