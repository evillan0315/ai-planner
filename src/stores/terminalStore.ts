import { atom } from 'nanostores';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '@/stores/authStore';

// Define the namespace path where the terminal server is listening
const TERMINAL_NAMESPACE = '/terminal';
const WS_URL_BASE = import.meta.env.VITE_TERMINAL_WS_URL?.replace(TERMINAL_NAMESPACE, '') || 'ws://localhost:3000';

interface TerminalState {
  socket: Socket | null;
  isConnected: boolean;
  cwd: string | null;
  error: string | null;
  initialCwd: string | null; // Passed during connection handshake
}

const INITIAL_STATE: TerminalState = {
  socket: null,
  isConnected: false,
  cwd: null,
  error: null,
  initialCwd: null,
};

export const terminalStore = atom<TerminalState>(INITIAL_STATE);

// --- Actions ---

/**
 * Initializes and connects the Socket.IO client to the terminal namespace.
 * Ensures only one socket instance is active.
 * @param initialCwd - Optional working directory to request on connection.
 */
export const connectTerminal = (initialCwd?: string) => {
  const current = terminalStore.get();
  if (current.socket && current.isConnected) return current.socket;
  
  if (current.socket) {
    current.socket.disconnect();
  }

  // 1. Determine extra headers/query parameters (e.g., Auth token, CWD)
  const token = getAuthToken();
  
  const socket = io(`${WS_URL_BASE}${TERMINAL_NAMESPACE}`, {
    // The websocket backend provided doesn't seem to use JWT token authentication
    // but relies on anonymous or external session management. 
    
    // Pass CWD as query parameter if supported by server
    query: {
      initialCwd: initialCwd || '', // Send the absolute path
    },
    transports: ['websocket', 'polling'], // Prefer websocket
    reconnection: true,
  });
  
  // 2. Set socket reference and loading state
  terminalStore.set({
    ...INITIAL_STATE,
    socket,
    initialCwd: initialCwd || null,
  });
  
  // 3. Setup Listeners
  socket.on('connect', () => {
    terminalStore.set({ ...terminalStore.get(), isConnected: true, error: null });
    console.log('Terminal connected via Socket.IO');
  });

  socket.on('disconnect', (reason) => {
    // Only clear if the disconnect was not due to explicit call
    if (reason !== 'io client disconnect') {
       terminalStore.set({ ...terminalStore.get(), isConnected: false, error: `Disconnected: ${reason}` });
    }
  });

  socket.on('connect_error', (error) => {
    terminalStore.set({ ...terminalStore.get(), isConnected: false, error: `Connection error: ${error.message}` });
    console.error('Terminal connection error:', error);
  });
  
  socket.on('error', (message: string) => {
    terminalStore.set({ ...terminalStore.get(), error: message });
    console.error('Terminal server error:', message);
  });

  // Listener for CWD updates from the server
  socket.on('outputPath', (newCwd: string) => {
    terminalStore.set({ ...terminalStore.get(), cwd: newCwd });
  });

  // Listener for server prompt signal (e.g., 'user@host:~/dir $')
  socket.on('prompt', (data: { cwd: string; command: string }) => {
    // The CWD update often comes bundled with the prompt event from the server
    terminalStore.set({ ...terminalStore.get(), cwd: data.cwd });
  });
  
  return socket;
};

/**
 * Disconnects the Socket.IO client.
 */
export const disconnectTerminal = () => {
  const current = terminalStore.get();
  if (current.socket) {
    current.socket.emit('close'); // Send close signal to server first
    current.socket.disconnect();
  }
  terminalStore.set(INITIAL_STATE);
};

/**
 * Sends data input to the terminal session.
 */
export const sendTerminalInput = (input: string) => {
  const current = terminalStore.get();
  if (current.socket && current.isConnected) {
    // Server expects { input: string } for 'input' event
    current.socket.emit('input', { input }); 
  }
};

/**
 * Sends a resize signal to the terminal session.
 */
export const sendTerminalResize = (cols: number, rows: number) => {
  const current = terminalStore.get();
  if (current.socket && current.isConnected) {
    // Server expects { cols: number, rows: number } for 'resize' event
    current.socket.emit('resize', { cols, rows });
  }
};
