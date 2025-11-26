// FIlePath: src/stores/terminalStore.ts
// Title: Terminal store and socket orchestration
// Reason: Expose terminal client state and lifecycle functions with inline Swagger-style JSDoc for automated docs

import { map } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { SystemInfo, PromptData } from '../types/terminal';
import stripAnsi from 'strip-ansi';
import { projectRootDirectoryStore } from '@/stores';
// import { getToken } from '@/stores/authStore'; // Removed direct import, handled by service
import { terminalSocketService } from '@/components/terminal/services/terminalSocketService';

/**
 * @openapi
 * components:
 *   schemas:
 *     TerminalState:
 *       type: object
 *       properties:
 *         currentPath:
 *           type: string
 *           description: Current working path displayed in the terminal.
 *           example: "~"
 *         systemInfo:
 *           type: string
 *           nullable: true
 *           description: Basic system information or banner, if available.
 *         isConnected:
 *           type: boolean
 *           description: Connection status to the backend terminal socket.
 *         commandHistory:
 *           type: array
 *           items:
 *             type: string
 *           description: Client-side recorded command history.
 *         historyIndex:
 *           type: integer
 *           description: Cursor/index used when browsing history in UI.
 *         output:
 *           type: array
 *           items:
 *             type: string
 *           description: Plain-text terminal output lines (ANSI sequences preserved).
 */

/**
 * @openapi
 * tags:
 *   - name: TerminalStore
 *     description: Client-side terminal state and lifecycle functions
 */

// ──────────────────────────────────────────────
// State Definition
// ──────────────────────────────────────────────

export interface TerminalState {
  currentPath: string;
  systemInfo: string | null;
  isConnected: boolean;
  commandHistory: string[];
  historyIndex: number;
  output: string[]; // This stores plain text output for history/display
}

/**
 * @openapi
 * /terminal/visibility:
 *   put:
 *     tags:
 *       - TerminalStore
 *     summary: Set terminal UI visibility
 *     description: Persisted toggle for showing or hiding the terminal component in the UI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: boolean
 *     responses:
 *       204:
 *         description: Visibility updated (client-side only).
 */
export const isTerminalVisible = persistentAtom<boolean>('showTerminal', false);
export const setShowTerminal = (show: boolean) => isTerminalVisible.set(show);

/**
 * @openapi
 * /terminal/state:
 *   get:
 *     tags:
 *       - TerminalStore
 *     summary: Get terminal store snapshot
 *     responses:
 *       200:
 *         description: Terminal state object (client-side store).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TerminalState'
 */
export const terminalStore = map<TerminalState>({
  currentPath: '~',
  systemInfo: null,
  isConnected: false,
  commandHistory: [],
  historyIndex: -1,
  output: [],
});

// ──────────────────────────────────────────────
// Basic Mutations
// ──────────────────────────────────────────────

/**
 * @openapi
 * /terminal/currentPath:
 *   put:
 *     tags:
 *       - TerminalStore
 *     summary: Set the current path
 *     description: Updates both the terminal's local currentPath and the global project root directory store.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *             example: "/home/user/project"
 *     responses:
 *       204:
 *         description: currentPath updated (client-side only).
 */
export const setCurrentPath = (path: string) => {
  projectRootDirectoryStore.set(path); // Update global project root store
  terminalStore.setKey('currentPath', path); // Also update local terminal store
};

/**
 * @openapi
 * /terminal/systemInfo:
 *   put:
 *     tags:
 *       - TerminalStore
 *     summary: Set system info banner
 *     description: Sets a human readable system information string used in UI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *     responses:
 *       204:
 *         description: systemInfo updated.
 */
export const setSystemInfo = (info: string) => {
  terminalStore.setKey('systemInfo', info);
};

/**
 * @openapi
 * /terminal/connection:
 *   put:
 *     tags:
 *       - TerminalStore
 *     summary: Set connection status
 *     description: Mark the terminal as connected or disconnected (client-side state).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: boolean
 *     responses:
 *       204:
 *         description: Connection state updated.
 */
export const setConnected = (isConnected: boolean) => {
  terminalStore.setKey('isConnected', isConnected);
};

/**
 * @openapi
 * /terminal/commandHistory:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Add command to client history
 *     description: Appends a command to the client-side command history array.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *             example: "npm run dev"
 *     responses:
 *       201:
 *         description: Command added to history.
 */
export const addCommandToHistory = (command: string) => {
  const state = terminalStore.get();
  const updatedHistory = [...state.commandHistory, command];
  terminalStore.set({
    ...state,
    commandHistory: updatedHistory,
    historyIndex: updatedHistory.length,
  });
};

/**
 * @openapi
 * /terminal/history/browse:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Browse command history
 *     description: Move the history cursor up or down for UI consumption.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [up, down]
 *             example:
 *               direction: "up"
 *     responses:
 *       200:
 *         description: Updated history index.
 */
export const browseHistory = (direction: 'up' | 'down') => {
  const state = terminalStore.get();
  let newIndex = state.historyIndex;

  newIndex =
    direction === 'up'
      ? Math.max(0, newIndex - 1)
      : Math.min(state.commandHistory.length - 1, newIndex + 1);

  terminalStore.setKey('historyIndex', newIndex);
};

/**
 * @openapi
 * /terminal/history/reset:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Reset history index
 *     description: Sets the in-memory history index back to -1.
 *     responses:
 *       204:
 *         description: history index reset.
 */
export const resetHistoryIndex = () => terminalStore.setKey('historyIndex', -1);

// ──────────────────────────────────────────────
// Output Deduplication (Spinner-Aware)
// ──────────────────────────────────────────────

/**
 * @openapi
 * /terminal/output/append:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Append output to terminal buffer
 *     description: |
 *       Adds plain text terminal output to the store. ANSI sequences are preserved in the stored string,
 *       but duplicate spinner frames and trivial duplicates are deduplicated to keep the UI history readable.
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             example: "\\u001b[32mConnected to terminal server.\\u001b[0m"
 *     responses:
 *       201:
 *         description: Output appended to terminal buffer.
 */
export const appendOutput = (text: string) => {
  const plainText = stripAnsi(text).replace(/\r/g, '');
  const trimmed = plainText.trim();
  if (!trimmed) return;

  const state = terminalStore.get();
  const output = [...state.output];
  const lastLine = output[output.length - 1]?.trim() ?? '';

  // Spinner frames common in terminal loading animations
  const spinnerFrames = [
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
    '⠋',
  ];

  // Handle spinner animation to avoid duplicating frames in history
  if (spinnerFrames.includes(trimmed)) {
    if (spinnerFrames.includes(lastLine)) {
      output[output.length - 1] = plainText; // Replace last spinner frame
    } else {
      output.push(plainText); // Add new spinner frame
    }
  }
  // Handle new, distinct output: append if not a duplicate or partial match
  else if (
    trimmed !== lastLine &&
    !lastLine.endsWith(trimmed) &&
    !trimmed.endsWith(lastLine)
  ) {
    output.push(plainText);
  }

  // Keep terminal output history bounded to prevent excessive memory usage
  if (output.length > 5000) output.splice(0, output.length - 5000);

  terminalStore.set({ ...state, output });
};

// ──────────────────────────────────────────────
// Socket Lifecycle Orchestration
// ──────────────────────────────────────────────

/**
 * @openapi
 * /terminal/output/clear:
 *   delete:
 *     tags:
 *       - TerminalStore
 *     summary: Clear terminal output
 *     description: Clear in-memory terminal output buffer.
 *     responses:
 *       204:
 *         description: Output cleared.
 */
export const clearOutput = () => terminalStore.setKey('output', []);

/**
 * @openapi
 * /terminal/connect:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Connect to terminal socket
 *     description: |
 *       Establishes a WebSocket/socket.io connection to the terminal backend using the terminalSocketService.
 *       On success the terminal state will be set to connected and a startup banner is appended.
 *     responses:
 *       200:
 *         description: Connected and ready
 *       500:
 *         description: Connection failed (error appended to output).
 */
export const connectTerminal = async () => {
  try {
    // Orchestrate the connection using the dedicated terminal socket service
    await terminalSocketService.connect();
    // Update global store state upon successful connection
    setConnected(true);
    clearOutput(); // Clear historical output for a fresh session
    appendOutput('\x1b[36mProject Terminal Ready\x1b[0m');
    appendOutput('---------------------------------------');
    appendOutput('\x1b[32mConnected to terminal server.\x1b[0m\n');
  } catch (error) {
    // Handle connection error: update store state and append an error message
    console.error('Terminal connection failed:', error);
    setConnected(false);
    appendOutput(`\x1b[31mConnection error:\x1b[0m ${error instanceof Error ? error.message : String(error)}\n`);
    throw error; // Re-throw the error for upstream components (e.g., Terminal) to handle if needed
  }
};

/**
 * @openapi
 * /terminal/disconnect:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Disconnect terminal socket
 *     description: Terminate the client socket connection and update client state.
 *     responses:
 *       204:
 *         description: Disconnected and client state updated.
 */
export const disconnectTerminal = () => {
  // Orchestrate the disconnection using the dedicated terminal socket service
  terminalSocketService.disconnect();
  // Update global store state upon disconnection
  setConnected(false);
  appendOutput('\x1b[33mDisconnected from terminal server.\x1b[0m\n');
};

/**
 * @openapi
 * /terminal/execute:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Execute a command on the terminal backend
 *     description: |
 *       Sends a command to the backend for semantic execution via the terminalSocketService.
 *       If the command is an empty string or whitespace only, it is silently ignored.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: string
 *             example: "ls -la"
 *     responses:
 *       202:
 *         description: Command accepted for execution (client-side delegation).
 */
export const executeCommand = (command: string) => {
  if (!command.trim()) return;
  addCommandToHistory(command); // Still adds to client-side history for programmatic use
  terminalSocketService.execCommand(command); // Use new service for command execution
};

/**
 * @openapi
 * /terminal/resize:
 *   post:
 *     tags:
 *       - TerminalStore
 *     summary: Resize remote PTY
 *     description: Resize the remote PTY grid if connected.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cols:
 *                 type: integer
 *               rows:
 *                 type: integer
 *             example:
 *               cols: 120
 *               rows: 30
 *     responses:
 *       200:
 *         description: Resize event sent if connected; no-op if disconnected.
 */
export const resizeTerminal = (cols: number, rows: number) => {
  if (terminalStore.get().isConnected) {
    terminalSocketService.resize(cols, rows); // Use new service for resizing
  }
};
