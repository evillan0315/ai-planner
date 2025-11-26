# Documentation for Terminal.tsx

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Terminal Component (Terminal.tsx)
Reason: Provide inline JSDoc metadata and formal documentation for the Terminal React component, its props, helper functions, and each significant effect/handler. Metadata blocks are placed at the top of the file and inside each major code block per project requirements.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: TerminalProps Interface
Reason: Describe the component props used by Terminal component.

---

TerminalProps describes the external properties accepted by the Terminal component.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: terminalContainerSx helper
Reason: Provide consistent MUI sx styling for the terminal container supporting light/dark themes.


**Parameters:**
- {'light' | 'dark'} themeMode - Theme mode selected.
- {any} theme - MUI theme object.

**Returns:**
{object} - sx style object for container Box.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: xtermBoxSx helper
Reason: Create styles for the xterm container box so Xterm can occupy available space.


**Returns:**
{object} - sx style object

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Terminal Component
Reason: Primary exported React component that embeds Xterm.js, hooks to the socket service, and synchronizes state with the terminal store.

The component:
- Initializes Xterm with fit/clipboard/webgl addons
- Binds socket event listeners to handle PTY output, system info, prompts and connection events
- Attempts automatic connection when an auth token is present
- Provides toolbar controls for connect/disconnect/settings/logout


**Parameters:**
- {TerminalProps} props - Component properties.

**Returns:**
{JSX.Element} Rendered Terminal component.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: useAuth usage
Reason: Acquire authentication helpers (isLoggedIn, logout, user) used for auth flows.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Global store values
Reason: Pull connection state and current path from terminalStore for toolbar and UI.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: logoutRef stabilization
Reason: Keep a stable reference to logout to avoid effect re-run loops and to use in promise catch blocks.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: DOM and addon refs
Reason: Hold references to DOM container and xterm/addons to manage lifecycle.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: XTerm initialization effect
Reason: Create Xterm instance with Fit and Clipboard addons, attempt WebGL addon, register onData and onKey handlers, and ensure proper cleanup on unmount or theme change.

Runs whenever `theme` changes to update terminal styling.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: waitForContainerReady helper
Reason: Poll until the terminal container has non-zero dimensions, then open the Xterm instance and attempt WebGL.


**Returns:**
{void}

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: onData handler
Reason: Route all character data (typing and pasting) to the socket service.


**Parameters:**
- {string} data - Character data from xterm.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: onKey handler
Reason: Process certain DOM key events (Ctrl+C, Enter, Arrows, Tab) that may require explicit PTY sequences or special handling.


**Parameters:**
- {{ domEvent: KeyboardEvent }} ev - Event payload from Xterm onKey.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Socket event listeners effect
Reason: Attach socket event listeners to handle PTY output, errors, system info, prompts, and connection state events. Remove listeners on cleanup to prevent leaks.

NOTE: This effect intentionally runs once on mount to register handlers.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: handleOutput
Reason: Write raw PTY output to Xterm and store a stripped text version in the terminal store.


**Parameters:**
- {string} data - Raw ANSI output from backend PTY.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: handleError
Reason: Render error message in terminal and update store.


**Parameters:**
- {string} data - Error message

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: handleOutputInfo
Reason: Convert system info object to a formatted string, write to terminal, and update store.


**Parameters:**
- {SystemInfo} data - Information object returned by the backend.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: handlePrompt
Reason: Update CWD in store when backend emits prompt metadata (CWD), PTY still prints prompt text via handleOutput.


**Parameters:**
- {PromptData} data - Prompt metadata containing cwd and other info.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Connection state handlers
Reason: Update isConnected state on socket connect/disconnect/error events.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Auto-connect effect
Reason: Attempt to connect automatically on mount if a valid auth token exists. If auth fails, trigger logout and redirect to /login.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Refit effect on external terminalHeight change
Reason: When parent layout changes provided terminalHeight, re-fit xterm and notify backend with new cols/rows.

---

FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
Title: Render
Reason: Render toolbar, terminal container (which becomes the Xterm root), and settings dialog.