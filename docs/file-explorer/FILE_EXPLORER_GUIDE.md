# File Explorer Guide

The File Explorer component (`src/components/file-explorer`) is a critical part of the AI Planner, providing the interface for browsing the host filesystem (via the secure backend API), selecting files for editing, defining AI context (Project Root, Scan Paths), and managing files (CRUD).

## 1. Architecture and Component Breakdown

The file explorer is implemented using React, Material UI, and Nanostores for state management. It separates concerns into four main areas:

1.  **Orchestration & Interaction (`FileExplorer.tsx`)**
2.  **Data & Caching Logic (`hooks/useFileTreeState.ts`)**
3.  **Global State Management (`stores/fileTreeStore.ts`)**
4.  **UI Elements (`FileTreeItem.tsx`, `FileTreeRenderer.tsx`, `FileExplorerContextMenu.tsx`)

### Core Technologies Used

| Feature | Technology |
| :--- | :--- |
| Data Fetching | `fileExplorerService.ts` (Axios) |
| Tree Structure & Caching | `useFileTreeState` (Custom Hook) |
| Global State | Nanostores (`fileTreeStore`) |
| Path Manipulation | `path-browserify` (Node.js `path` module polyfill) |
| UI & Styling | Material UI + Tailwind CSS |

## 2. State Management and Data Flow

### 2.1 The `fileTreeStore` (Nanostores)

Global state related to the file explorer is managed by Nanostores in `stores/fileTreeStore.ts`:

*   **`projectRootDirectoryStore`**: Stores the absolute path used as the base for AI Planning. This is a `persistentAtom` so it remembers the root between sessions.
*   **`refreshTriggerAtom`**: An integer atom incremented by `triggerFileExplorerRefresh()` to force the `useFileTreeState` hook to reload the current path contents.
*   **`fileTreeSelectionStore`**: Manages which paths are currently selected (`selectedPaths: Set<string>`) and the anchor path for range selection (`lastSelectedPath: string | null`).
*   **`fileTreeContextMenuStore`**: Controls the visibility, position, and associated entries for the right-click context menu.

### 2.2 The `useFileTreeState` Hook

This hook is the core business logic engine, managing the dynamic, recursive file tree data:

*   **`currentPath`**: The absolute path of the directory currently being viewed as the root of the explorer.
*   **`loadingRoot` / `rootError`**: Status for the current directory fetch.
*   **`treeState`**: Contains three key properties:
    *   `cachedContents`: A map of directory paths to their loaded `IDirectoryListing` children. This prevents unnecessary re-fetching when expanding/collapsing.
    *   `loadingPaths`: A set tracking directories whose contents are currently being fetched.
    *   `expandedPaths`: A set tracking directories that are currently expanded in the tree view.

### Data Flow for Expansion

1.  User clicks the expand icon on a folder (`FileTreeItem`).
2.  `handleToggleExpand` in `useFileTreeState` is called.
3.  If the path is not cached and not currently loading, `fetchContents(path, false)` is executed.
4.  `fetchContents` calls the backend via `fileExplorerService.fetchDirectoryContents`.
5.  Upon success, the results are stored in `treeState.cachedContents`.
6.  The `FileTreeRenderer` detects the new content and recursively renders the child list.

## 3. User Interaction Models

### 3.1 Selection

The file explorer supports three primary selection modes, orchestrated within `FileExplorer.tsx` by examining mouse event modifiers:

| Mode | Input | Action |
| :--- | :--- | :--- |
| **Single** | Simple Click | Clears existing selections, selects the clicked item, and sets it as the new anchor path. If it's a file, the content is opened (editor or floating viewer). |
| **Toggle** | Ctrl/Cmd + Click | Adds or removes the item from the selection set (`selectedPaths`) without clearing other selections. |
| **Range** | Shift + Click | Selects all items between the clicked item and the last selected item (`lastSelectedPath`). This relies on `FileTreeRenderer` registering visible paths via `registerVisiblePath` to calculate indices.

### 3.2 File Actions (Opening Content)

*   **Double-Click Folder**: Navigates the main explorer view to the folder's path (changing the root context).
*   **Single-Click File (No Modifiers)**: The file is passed to `openFileInEditor`.
    *   If the file is code/text, the user is navigated to the `/codejector/editor` route.
    *   If the file is media (Image, Video, Audio), it is opened in a floating, resizable media viewer, handled by the editor store logic.

### 3.3 Drag and Drop (D&D)

The explorer supports moving files and folders using drag-and-drop:

*   **Source**: `FileTreeItem` is set as `draggable=true` and `onDragStart` sets the source path.
*   **Target**: `FileTreeItem` uses `onDragEnter/onDragLeave/onDragOver/onDrop` to handle drop zone logic.
*   **Execution**: When dropped, `FileExplorer.tsx` uses `fileExplorerService.moveFileOrFolder` to execute the move operation on the backend filesystem, followed by a `handleRefresh()` to update the UI.

### 3.4 Context Menu (`FileExplorerContextMenu.tsx`)

Right-clicking an entry triggers `openFileTreeContextMenu` to display a set of available actions, which primarily utilize the `dialogService` for user input (prompt/confirm) and `fileExplorerService` for backend operations.

| Action | Target | Description | Backend Service |
| :--- | :--- | :--- | :--- |
| **Set as Project Root** | Directory (Single) | Sets `projectRootDirectoryStore` for AI Planning context. | None (Local Store) |
| **Create File/Folder** | Any Item (Creates inside its directory) | Prompts for a new name and executes creation. | `fileExplorerService.createFileOrFolder` |
| **Rename** | Any Item (Single) | Prompts for a new name and executes rename. | `fileExplorerService.renameFileOrFolder` |
| **Copy** | Any Item (Single) | Prompts for a destination path and copies the item. | `fileExplorerService.copyFileOrFolder` |
| **Delete** | Any/Multiple | Confirms deletion and deletes all selected entries. | `fileExplorerService.deleteFileOrFolder` |
| **Add to Scan Path** | Any/Multiple | Appends the path(s) to the `plannerStore.scanPathsInput` string, crucial for providing AI context. | `plannerStore` (Local Store) |
| **Info** | Any Item (Single) | Displays detailed file metadata (size, dates, mime type). | None (Local Data) |
