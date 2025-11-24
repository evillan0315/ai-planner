# AI Planner Drawer Components

The AI Planner uses several specialized `CustomDrawer` components (located in `src/components/planner/drawerContent`) for configuring inputs and editing AI outputs.

## 1. `FileExplorerPlannerDrawerContent.tsx`

This drawer is used for selecting local filesystem paths required for AI context.

### Modes of Operation:

1.  **`mode: 'root'` (Select Project Root):**
    *   Allows the user to browse the filesystem (starting at the current `projectRoot`).
    *   When the user confirms a path, it updates the `plannerStore.projectRoot` and the persistent `fileTreeStore.projectRootDirectoryStore`.
    *   The primary output is the single absolute path.
2.  **`mode: 'scan'` (Manage Scan Paths):**
    *   Allows the user to browse the filesystem starting from the active `projectRoot`.
    *   Clicking "Use Path" (in the File Explorer controls) toggles the path's inclusion in the `currentScanPaths` array (managed locally in `PlanGenerator` and committed on save).
    *   Supports adding manual paths or glob patterns via a text field.

### Key Integration Points:
*   It wraps the general `FileExplorer` component, injecting a custom `onPathSelectedForUse` handler that routes path selections based on the operating `mode`.

## 2. `InstructionEditorDrawer.tsx`

Used to edit the configuration prompts sent to the LLM. It relies on the Monaco Editor for syntax highlighting and a better editing experience.

### Types:
1.  **`type: 'ai'` (AI Instructions / System Prompt):** Edits the Markdown content of the detailed system prompt (`plannerStore.additionalInstructions`). Uses `markdown` language mode in Monaco.
2.  **`type: 'expected'` (Expected Output Format / JSON Schema):** Edits the JSON schema or explicit formatting rules the AI must follow (`plannerStore.expectedOutputFormat`). Uses `json` language mode in Monaco.

## 3. `PlanMetadataEditorDrawer.tsx`

Allows developers to modify the high-level summary and metrics of a generated plan before application. This is essential for correcting or refining AI suggestions (e.g., adjusting `estimatedEffortMinutes`).

### Editable Fields:
*   `Title` and `Summary`.
*   `Thought Process` and `Assumptions` (entered as newline-separated strings, stored as string arrays).
*   `Confidence` (number, 0.0 - 1.0).
*   `Estimated Effort Minutes` (integer).
*   `Documentation` (Markdown).
*   `Build Scripts` (JSON object).
*   `Git Instructions` (Branch name, commit message, command list).

Changes are committed to the `plannerStore` via `updateCurrentPlanMetadata`, which marks the plan as locally modified and resets the application status.

## 4. `FileChangeEditorDrawer.tsx`

Provides a granular interface for editing a single `IFileChange` entry from the plan. This is crucial for reviewing and correcting patches or ensuring the paths are correct.

### Key Features:
*   **New Content Editor:** Uses Monaco Editor with appropriate language syntax (`getMonacoLanguage(filePath)`) for editing `newContent` (for ADD, MODIFY, REPAIR actions).
*   **Preview Panes (Read-Only):** Displays the original content sample (`oldContent`) and the unified diff (`diff`) if available, using read-only Monaco instances.
*   **Metadata Editing:** Allows adjustment of `reason`, `estimatedMinutes`, and associated `testsAdded`.

## 5. `ErrorDetailsDrawerContent.tsx`

This utility drawer is accessed when a generation or application error occurs. It provides debugging information for the user and developer.

### Content Display:
*   If a critical network error occurred (`plannerStore.error`), it displays the raw stringified error message (often including backend details or HTTP response data).
*   If the LLM failed validation but returned a plan object (`plan.error` exists), it displays the entire raw `IPlan` object in a read-only JSON editor for inspection.
