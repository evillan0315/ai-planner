# AI Planner Primary Components

This guide details the main React components responsible for the AI Planner user interface, located in `src/components/planner`.

## 1. `PlanGenerator.tsx` (Orchestration Layer)

This is the primary component for the `/planner-generator` route. It manages the overall state flow, triggers API calls, and orchestrates the display of the plan and various modal/drawer configurations.

### Key Responsibilities:
*   **State Observation:** Subscribes to `plannerStore` for `userPrompt`, `plan`, `isLoading`, and `applyStatus`.
*   **UI Layout:** Uses `ContentLayout` to structure the view with a main scrollable area (`PlanGenerationStatus`) and a fixed bottom input panel (`PlanInputForm`).
*   **Action Handling:** Contains methods for `handleGeneratePlan`, `handleApplyPlan`, and `handleClearPlan`, which interact directly with `plannerService` and update the `plannerStore`.
*   **Drawer Management:** Controls the state (`open/close`) of all configuration drawers (Root Picker, Scan Paths, Instructions, Metadata Editor, Error Details).
*   **Plan Editing:** Provides callbacks (`handleEditFileChangeRequest`, `handleSavePlanMetadata`) to bridge the drawer editors with the `plannerStore` update actions.

## 2. `PlanInputForm.tsx` (Input & Configuration)

This component handles user inputs and contextual configuration for the AI generation request. It uses the `FloatingIconTextField` component to embed setting buttons directly into the prompt textarea.

### Key Features:
*   **User Prompt:** Main multiline text field for developer instructions.
*   **Context Display:** Shows the currently active `projectRoot` and truncated information about the `scanPaths`.
*   **Action Buttons (Floating):** Provides immediate access to critical configuration drawers via floating icons:
    *   Set Project Root (`FolderOpenIcon`)
    *   Manage Scan Paths (`AddRoadIcon`)
    *   Edit AI Instructions (`SettingsIcon`)
    *   Edit Output Schema (`SchemaIcon`)
    *   Upload Multimodal File (`UploadFileIcon`)
    *   Generate Plan (`RocketLaunchIcon`)

## 3. `PlanGenerationStatus.tsx`

A simple wrapper component that conditionally displays either a loading indicator, an instruction message, or the completed plan (`PlanDisplay`), based on the `isLoading` and `plan` state from `plannerStore`.

## 4. `PlanDisplay.tsx` (Review Layer)

This component is responsible for rendering the detailed contents of the `IPlan` object. It utilizes several sub-components for structure and presentation.

### Key Features:
*   **Metadata:** Displays `title`, `summary`, `planId`, and `tokensUsed`. Includes an `EditIcon` to trigger the `PlanMetadataEditorDrawer`.
*   **Structured Sections:** Uses `PlanSectionAccordion.tsx` to display key parts of the plan: `Thought Process`, `Assumptions`, `Build Scripts`, `Documentation`, `Tests`, and `Git Instructions`. Markdown is used extensively via `MarkdownRenderer`.
*   **Metrics:** Uses `PlanMetricsDisplay.tsx` to show `confidence` and `estimatedEffortMinutes`.
*   **File Changes Table:** Renders `PlanFileChangesTable.tsx` for the list of `IFileChange` objects, including individual application status tracking.

## 5. `PlanFileChangesTable.tsx` & `PlanChangeTableRow.tsx`

These components handle the rendering of the `IFileChange` array.
*   `PlanFileChangesTable` provides the table structure.
*   `PlanChangeTableRow` renders an individual change, including:
    *   A status indicator (`idle`, `applying`, `success`, `failure`).
    *   Action chip (ADD, MODIFY, DELETE) using MUI `Chip` with appropriate colors.
    *   Action buttons for applying the change individually or editing the change details.

## 6. `PlannerList.tsx` (Plan History)

Renders a paginated list of previously generated plans (`IPlannerListItem[]`) fetched from the backend via `plannerService.getPaginatedPlans`. Allows users to quickly view and navigate to past plans using `react-router-dom` links.
