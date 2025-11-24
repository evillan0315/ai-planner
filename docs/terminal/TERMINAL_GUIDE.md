# Integrated Project Terminal Guide

The AI Planner application includes a fully functional, integrated terminal emulator powered by Xterm.js. This terminal connects via WebSockets to a dedicated backend server (PTY service) that provides direct shell access to the host machine's filesystem, typically starting in the project root defined by `VITE_BASE_DIR`.

This feature allows developers to execute system commands, manage files, install dependencies, and run scripts directly from the UI, complementing the file explorer and AI planning features.

## 1. Architecture and Technology Stack

The terminal is implemented using a client-server architecture:

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Client UI** | React, TypeScript, Xterm.js, MUI | Renders the terminal output, captures keyboard input, and handles resizing. Located in `src/components/terminal/`. |
| **Client State** | Nanostores (`terminalStore`) | Manages connection status, current working directory (CWD), and output history. |
| **Client Service** | `terminalSocketService.ts` | Abstracts WebSocket communication, sending user input, resize events, and listening for output from the server. |
| **Backend PTY Service** | Node.js/NestJS (External) | Handles the actual PTY (Pseudo-Terminal) process, runs commands (e.g., bash/zsh), and streams output (including ANSI escape codes) back to the client via WebSockets. (Assumed external service running, typically on port 3000). |

## 2. Configuration and Setup

The terminal relies on a separate backend PTY service running independently from the main Planner API server (which usually runs on port 5000).

### Frontend Configuration (`.env`)

Ensure the `VITE_TERMINAL_WS_URL` environment variable points to the WebSocket endpoint of your terminal server.

```env
# ... existing configurations ...

VITE_BASE_DIR=/absolute/path/to/project # This sets the default start directory for the shell
VITE_TERMINAL_WS_URL=http://localhost:3000 # Default URL for the terminal server
```

If the terminal server is running on a different host or port, update this variable.

### Backend Terminal Service Setup

(Note: The PTY server implementation is assumed to exist externally, likely within the `project-board-server` NestJS monorepo, listening for Socket.IO connections.)

1. **Start the PTY Backend:** Ensure the dedicated terminal server is running and accessible at the address specified by `VITE_TERMINAL_WS_URL`.
2. **Authentication:** The `terminalSocketService` automatically attempts to pass the JWT token to the connection request (via `socketClientFactory`), ensuring only authenticated users can access the host shell.

## 3. Usage Guide

### 3.1 Connecting and Disconnecting

1. **Visibility:** The terminal component is usually displayed as a bottom panel or within a dedicated view (depending on application layout).
2. **Initial Connection:** When the component loads, it automatically attempts to connect to the configured `VITE_TERMINAL_WS_URL` using the user's authentication token.
3. **Toolbar Status:** The `TerminalToolbar` displays a status indicator (green for connected, red for disconnected).
4. **Manual Control:** If disconnected, clicking the connect button (if available) or refreshing the terminal view will trigger a connection attempt (`connectTerminal()` action).

### 3.2 Interaction

*   **Input:** Type commands directly into the terminal area. Input is sent character-by-character (or line-by-line depending on shell mode) to the backend PTY.
*   **Copy/Paste:** Standard browser shortcuts (Ctrl+C/Cmd+C for copy, Ctrl+V/Cmd+V for paste) are supported by the Xterm.js `ClipboardAddon`.
*   **Ctrl+C Handling:** If text is selected, Ctrl+C copies. If no text is selected, Ctrl+C sends the interrupt signal (`\x03`) to the running shell process, typically stopping the current command.
*   **Resizing:** The terminal automatically resizes (and communicates the new dimensions to the backend PTY) when the parent container size changes (e.g., when resizing the bottom panel or the browser window). This ensures command wrapping and layout are correct.

### 3.3 Known Limitations

*   **Security:** The terminal grants full shell access to the host system. It must only be used in trusted, controlled environments (e.g., local development or self-hosted secure environments).
*   **File Sync:** Changes made via the terminal are immediately applied to the file system, but the File Explorer component might require a refresh (manual or automatic polling) to reflect those changes instantly.
*   **Initial Path:** The shell session starts at the `VITE_BASE_DIR` path defined in the frontend `.env`, which should ideally match the path accessible by the backend PTY service.
