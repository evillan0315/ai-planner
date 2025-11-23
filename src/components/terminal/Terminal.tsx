import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { Terminal as XtermTerminal } from '@xterm/xterm'; // Renamed to avoid conflict with component name
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import '@xterm/xterm/css/xterm.css';
import { getAuthToken  } from '@/stores/authStore';
import { TerminalToolbar } from './TerminalToolbar';
import TerminalSettingsDialog from './TerminalSettingsDialog';
import {
  terminalStore,
  connectTerminal,
  disconnectTerminal,
  appendOutput,
  setSystemInfo,
  setCurrentPath,
  setConnected,
} from '@/components/terminal/stores/terminalStore';
import { terminalSocketService } from '@/components/terminal/services/terminalSocketService';

import { themeAtom  } from '@/stores/themeStore';
import stripAnsi from 'strip-ansi';
import { SystemInfo, PromptData } from './types/terminal';
import { useAuth } from '@/hooks/useAuth';

interface TerminalProps {
  onLogout: () => void;
  terminalHeight: number;
}

const terminalContainerSx = (themeMode: 'light' | 'dark', theme: any) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  border: 0,
  overflow: 'hidden',
  position: 'relative',
  backgroundColor:
    themeMode === 'dark'
      ? theme.palette.background.paper
      : theme.palette.background.default,
});

// MODIFIED: Use flexGrow: 1 instead of fixed pixel height calculation.
// Height is now inherited from the parent Box sizing in AppLayout.
const xtermBoxSx = () => ({
  flexGrow: 1,
  overflow: 'hidden',
  '.xterm': { padding: '8px' },
});

export const Terminal: React.FC<TerminalProps> = ({
  onLogout,
  terminalHeight,
}) => {
  const { isLoggedIn, logout, user } = useAuth();
  const { isConnected } = useStore(terminalStore);
  const navigate = useNavigate();

  const muitheme = useTheme();
  const { theme  } = useStore(themeAtom);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XtermTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const clipboardAddonRef = useRef<ClipboardAddon | null>(null); // Keep a ref to ClipboardAddon
  const [open, setOpen] = useState(false);

  // ──────────────────────────────────────────────
  // Initialize terminal with WebGL + Clipboard
  // ──────────────────────────────────────────────
  useEffect(() => {
    const container = terminalContainerRef.current;
    if (!container) return;

    const term = new XtermTerminal({
      allowProposedApi: true,
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 13,
      convertEol: true,
      scrollback: 3000,
      theme:
        theme === 'dark'
          ? {
              background: '#1e1e1e',
              foreground: '#d4d4d4',
              cursor: '#4ec9b0',
              selectionBackground: '#264f78',
            }
          : {
              background: '#fafafa',
              foreground: '#000000',
              cursor: '#007acc',
              selectionBackground: '#cce5ff',
            },
    });

    const fitAddon = new FitAddon();
    const clipboardAddon = new ClipboardAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(clipboardAddon);

    const waitForContainerReady = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        term.open(container);

        try {
          const webglAddon = new WebglAddon();
          term.loadAddon(webglAddon);
          console.log('[Terminal] WebGL renderer enabled.');
        } catch (err) {
          console.warn('[Terminal] WebGL not available:', err);
        }

        setTimeout(() => {
          try {
            fitAddon.fit();
            // Initial resize event to backend
            terminalSocketService.resize(term.cols, term.rows); 
          } catch (err) {
            console.warn('[Terminal] Fit skipped:', err);
          }
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        clipboardAddonRef.current = clipboardAddon; // Store clipboard addon in ref

        // All character input (typing and pasting) goes through onData
        term.onData((data) => {
          terminalSocketService.sendInput(data);
        });

        // ──────────────────────────────────────────────
        // Input Handling (onKey for specific DOM events/control sequences)
        // The PTY/shell on the backend will handle line editing, history, and interactive prompts.
        // ──────────────────────────────────────────────
        term.onKey(({ domEvent }) => {
          const { key: pressedKey, ctrlKey } = domEvent;
          const currentClipboardAddon = clipboardAddonRef.current;

          // Ctrl+C: Copy if selection, otherwise send interrupt to PTY
          if (ctrlKey && pressedKey.toLowerCase() === 'c') {
            if (term.hasSelection()) {
              //currentClipboardAddon?.copySelection(); // Use addon's copy function
            } else {
              // No selection, send Ctrl+C to terminal (interrupt)
              terminalSocketService.sendInput('\x03'); // ASCII for Ctrl+C (ETX)
            }
            return; // Prevent further processing by other handlers
          }

          // Ctrl+V: No explicit handling here. ClipboardAddon, in combination with onData,
          // should handle pasting automatically by emitting the pasted characters via onData.

          // The following cases are for specific key presses that need explicit PTY sequences
          // sent to the backend, if they are not naturally emitted via onData or require
          // special handling. This pattern is often used when the backend PTY is in raw mode.
          switch (pressedKey) {
            case 'Enter':
              terminalSocketService.sendInput('\r'); // Send Carriage Return to PTY
              break;

            case 'Backspace':
              //terminalSocketService.sendInput('\x7F'); // Send ASCII DELETE to PTY
              break;

            case 'Tab':
              terminalSocketService.sendInput('\t'); // Send Tab to PTY
              break;

            case 'ArrowUp':
              terminalSocketService.sendInput('\x1b[A'); // ANSI escape for ArrowUp
              break;

            case 'ArrowDown':
              terminalSocketService.sendInput('\x1b[B'); // ANSI escape for ArrowDown
              break;

            case 'ArrowLeft':
              terminalSocketService.sendInput('\x1b[D'); // ANSI escape for ArrowLeft
              break;

            case 'ArrowRight':
              terminalSocketService.sendInput('\x1b[C'); // ANSI escape for ArrowRight
              break;

            default:
              // For all other keys (including regular characters), they should be caught by `onData`.
              // No action needed here, as `onData` will forward character input.
              break;
          }
        });

      } else {
        requestAnimationFrame(waitForContainerReady);
      }
    };

    waitForContainerReady();

    // Cleanup XTerm.js instance on component unmount
    return () => {
      if (term) {
        term.dispose(); // term.dispose() clears all listeners internally
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
      clipboardAddonRef.current = null;
    };
  }, [theme]); // Re-run if theme mode changes to update terminal theme

  // ──────────────────────────────────────────────
  // Socket Event Handling (via terminalSocketService)
  // This useEffect attaches listeners to the terminalSocketService
  // and updates both the XTerm.js instance and the nanostore.
  // ──────────────────────────────────────────────
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    // Handlers that write to the XTerm.js instance and update the global terminalStore
    const handleOutput = (data: string) => {
      term.write(data);
      appendOutput(stripAnsi(data)); // Update nanostore with plain text version
    };

    const handleError = (data: string) => {
      term.writeln(`\r\n\x1b[31mError:\x1b[0m ${data}`);
      appendOutput(`Error: ${stripAnsi(data)}`); // Update nanostore
    };

    const handleOutputInfo = (data: SystemInfo) => {
      const formatted = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      term.writeln(formatted);
      setSystemInfo(`${formatted}\n`); // Update nanostore
    };

    const handlePrompt = (data: PromptData) => {
      // Update CWD in store. PTY itself will print the prompt via `handleOutput`.
      setCurrentPath(data.cwd);
    };

    // Listeners for internal connection/disconnection state changes of the underlying socket
    // These update the global `isConnected` state directly and write messages to XTerm
    const handleSocketConnect = () => {
      setConnected(true);
    };

    const handleSocketDisconnect = (reason: string) => {
      setConnected(false);
    };

    const handleSocketConnectError = (error: Error) => {
      setConnected(false);
    };

    // Attach listeners to the terminalSocketService instance
    terminalSocketService.on('output', handleOutput);
    terminalSocketService.on('outputMessage', handleOutput); // Also listen for 'outputMessage' for consistency
    terminalSocketService.on('error', handleError);
    terminalSocketService.on('outputInfo', handleOutputInfo);
    terminalSocketService.on('prompt', handlePrompt);

    // Listen to raw socket connect/disconnect events for direct state updates
    terminalSocketService.on('connect', handleSocketConnect);
    terminalSocketService.on('disconnect', handleSocketDisconnect);
    terminalSocketService.on('connect_error', handleSocketConnectError);

    // Cleanup: Remove all listeners when component unmounts or dependencies change
    return () => {
      terminalSocketService.off('output', handleOutput);
      terminalSocketService.off('outputMessage', handleOutput);
      terminalSocketService.off('error', handleError);
      terminalSocketService.off('outputInfo', handleOutputInfo);
      terminalSocketService.off('prompt', handlePrompt);
      terminalSocketService.off('connect', handleSocketConnect);
      terminalSocketService.off('disconnect', handleSocketDisconnect);
      terminalSocketService.off('connect_error', handleSocketConnectError);
    };
  }, []); // Empty dependency array ensures these listeners are set up once on mount

  // ──────────────────────────────────────────────
  // Auto-connect on mount and handle disconnect on unmount
  // Uses the orchestrating actions from terminalStore.
  // ──────────────────────────────────────────────
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
        // If no token, ensure disconnected state and prevent connection attempt
        setConnected(false);
        console.warn('No authentication token available for terminal. Skipping auto-connect.');
        // Optionally, redirect to login if auth is strictly required
        // navigate('/login');
        return;
    }

    // Attempt to connect using the terminalStore action, which handles connection logic
    connectTerminal().catch(async (error) => {
      console.error('Initial terminal connection failed:', error);
      // Specific error message check for authentication token issues
      if (error instanceof Error && error.message === 'No authentication token.') {
        await logout();
        navigate('/login');
      }
    });

    // Cleanup: Disconnect terminal when component unmounts
    return () => {
      disconnectTerminal();
    };
  }, []); // Empty dependency array ensures this effect runs once on mount/unmount

  // ──────────────────────────────────────────────
  // Dynamic height/width refit for XTerm.js instance (Triggered by AppLayout resize)
  // ──────────────────────────────────────────────
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    // RequestAnimationFrame ensures refit happens after DOM layout is stable
    requestAnimationFrame(() => {
      try {
        fitAddonRef.current?.fit();
        
        // IMPORTANT: Communicate new dimensions to the backend PTY
        terminalSocketService.resize(term.cols, term.rows);

      } catch (e) {
        /* Ignore errors if renderer is not yet ready, common during rapid updates */
        console.error("Terminal refit failed:", e);
      }
    });
  }, [terminalHeight]); // Re-fit whenever the provided terminalHeight changes

  // ──────────────────────────────────────────────
  // Context menu for copy/paste functionality
  // ──────────────────────────────────────────────
  useEffect(() => {
  const container = terminalContainerRef.current;
  const term = xtermRef.current;
  const currentClipboardAddon = clipboardAddonRef.current; // Access the ref here

  if (!container || !term || !currentClipboardAddon) return;

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault(); // Prevent default browser context menu
    if (term.hasSelection()) {
      // If text is selected, copy it to clipboard using addon's copySelection()
      //currentClipboardAddon.copySelection();
      term.clearSelection(); // Clear selection after copying
    } else {
      // If no text selected, paste from clipboard using addon's paste()
      //currentClipboardAddon.paste();
    }
  };

  container.addEventListener('contextmenu', handleContextMenu);
  return () => container.removeEventListener('contextmenu', handleContextMenu);
}, []); // Empty dependency array ensures this runs once on mount/unmount
  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <Paper
      variant="outlined"
      sx={terminalContainerSx(theme, muitheme)}
    >
      <TerminalToolbar
        isConnected={isConnected}
        currentPath="" // `currentPath` is retrieved from `terminalStore` if needed, not passed directly via prop if not used
        onConnect={connectTerminal}
        onDisconnect={disconnectTerminal}
        onSettings={() => setOpen(true)}
        onLogout={onLogout}
        sx={{ position: 'sticky', top: 0, zIndex: 1 }} // Keeps toolbar at top on scroll
      />

      <Box
        ref={terminalContainerRef}
        // onClick={() => terminalContainerRef.current?.focus()} // XTerm handles its own focus logic internally
        sx={xtermBoxSx()} 
      />

      <TerminalSettingsDialog open={open} onClose={() => setOpen(false)} />
    </Paper>
  );
};
