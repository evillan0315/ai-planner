# AI Code Planner Feature Overview

The AI Code Planner module (`src/components/planner`) is the core feature of the application, responsible for taking developer instructions, structuring project context, communicating with the backend LLM API, displaying the resulting code plan (`IPlan`), and facilitating its application to the local filesystem.

## 1. Core Workflow

The typical planning workflow involves four stages managed by the `PlanGenerator` component:

1.  **Input & Context Definition (PlanInputForm):** The user provides a natural language prompt, defines the absolute `projectRoot` directory, specifies `scanPaths` (files/directories to feed as context to the AI), and optionally customizes the `additionalInstructions` (system prompt) and `expectedOutputFormat` (JSON schema).
2.  **Generation:** The `PlanGenerator` compiles the context into an `ILlmInput` payload and sends it to the backend via `plannerService.generatePlan`.
3.  **Review & Editing (PlanDisplay):** The resulting `IPlan` object is stored in `plannerStore` and displayed by `PlanDisplay.tsx`. The user can review all details (thought process, confidence, git instructions) and use dedicated drawers (`PlanMetadataEditorDrawer`, `FileChangeEditorDrawer`) to modify the plan before execution.
4.  **Application:** The user triggers the application of the plan (either globally or chunk-by-chunk) via `plannerService.applyPlan` or `plannerService.applyFileChange`. The backend executes the file operations relative to the defined `projectRoot`.

## 2. Technology & Architecture within the Module

| Component/Concern | Implementation File | Role |
| :--- | :--- | :--- |
| **State Management** | `stores/plannerStore.ts` | Global Nanostore managing `IPlan`, `isLoading`, `error`, context paths, and instruction overrides. |
| **API Interaction** | `api/plannerService.ts` | Axios client for generating, retrieving, and applying plans (`/api/plan`). |
| **Orchestration** | `PlanGenerator.tsx` | Main page component that wires together the input form, state, and display components. |
| **Input UI** | `PlanInputForm.tsx` | Collects user prompt, project root, scan paths, and multimodal inputs. |
| **Display UI** | `PlanDisplay.tsx` | Renders the complex structure of the `IPlan` object using specialized sub-components (`PlanSectionAccordion`, `PlanFileChangesTable`). |
| **Data Structure** | `types.ts` | Defines core interfaces like `IPlan`, `IFileChange`, and `ILlmInput`. |

## 3. Key Concepts

### IPlan Structure
The `IPlan` interface represents the structured output expected from the LLM, ensuring the resulting modification plan is machine-readable and executable. Key fields include:
*   `title`, `summary`, `thoughtProcess`, `documentation`: Descriptive metadata.
*   `confidence`, `estimatedEffortMinutes`: AI-provided metrics.
*   `changes`: An array of `IFileChange` objects detailing specific file actions (ADD, MODIFY, DELETE, REPAIR).
*   `gitInstructions`: Executable commands for version control.

### Context Management
The planner heavily relies on providing precise context to the AI:
*   **`projectRoot`**: The absolute path on the host system where file operations occur. Managed persistently via `fileTreeStore` and mirrored in `plannerStore`.
*   **`scanPaths`**: A list of paths (relative to `projectRoot`) whose contents are sent to the AI for situational awareness.

### Granular Control
A fundamental design choice is providing the developer with maximum control:
*   **Instruction Overrides:** Users can modify the verbose system prompt (`additionalInstructions`) and the exact JSON output schema (`expectedOutputFormat`).
*   **In-Place Editing:** The plan and individual file changes (path, action, new content, diff) can be edited *before* the plan is applied.
*   **Chunk Application:** Users can apply changes individually using `applyFileChange`, isolating risk.
