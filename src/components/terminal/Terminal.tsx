/**
 * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
 * Title: Terminal Component (Terminal.tsx)
 * Reason: Provide inline JSDoc metadata and formal documentation for the Terminal React component, its props, helper functions, and each significant effect/handler. Metadata blocks are placed at the top of the file and inside each major code block per project requirements.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { Terminal as XtermTerminal } from '@xterm/xterm'; // Renamed to avoid conflict with component name
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import '@xterm/xterm/css/xterm.css';
import { getAuthToken } from '@/stores/authStore';
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

import { themeAtom } from '@/stores/themeStore';
import stripAnsi from 'strip-ansi';
import { SystemInfo, PromptData } from './types/terminal';
import { useAuth } from '@/hooks/useAuth';
import { ContentLayout } from '@/components/ui/layouts/ContentLayout';

/**
 * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
 * Title: TerminalProps Interface
 * Reason: Describe the component props used by Terminal component.
 */
/**
 * TerminalProps describes the external properties accepted by the Terminal component.
 *
 * @property {() => void} onLogout - Callback invoked to log the user out.
 * @property {number} terminalHeight - Height value provided by parent layout used for resizing logic.
 */
interface TerminalProps {
  onLogout: () => void;
  terminalHeight: number;
}

/**
 * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
 * Title: terminalContainerSx helper
 * Reason: Provide consistent MUI sx styling for the terminal container supporting light/dark themes.
 *
 * @param {'light' | 'dark'} themeMode - Theme mode selected.
 * @param {any} theme - MUI theme object.
 * @returns {object} - sx style object for container Box.
 */
const terminalContainerSx = (themeMode: 'light' | 'dark', theme: any) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  border: 0,
  overflow: 'hidden',
  position: 'relative',
  backgroundColor:
    themeMode === 'dark'
      ? theme.palette.background.default
      : theme.palette.background.paper,
});

/**
 * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
 * Title: xtermBoxSx helper
 * Reason: Create styles for the xterm container box so Xterm can occupy available space.
 *
 * @returns {object} - sx style object
 */
const xtermBoxSx = () => ({
  flexGrow: 1,
  overflow: 'hidden',
  '.xterm': { padding: '2px' },
});

/**
 * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
 * Title: Terminal Component
 * Reason: Primary exported React component that embeds Xterm.js, hooks to the socket service, and synchronizes state with the terminal store.
 *
 * The component:
 * - Initializes Xterm with fit/clipboard/webgl addons
 * - Binds socket event listeners to handle PTY output, system info, prompts and connection events
 * - Attempts automatic connection when an auth token is present
 * - Provides toolbar controls for connect/disconnect/settings/logout
 *
 * @param {TerminalProps} props - Component properties.
 * @returns {JSX.Element} Rendered Terminal component.
 */
export const Terminal: React.FC<TerminalProps> = ({
  onLogout,
  terminalHeight,
}) => {
  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: useAuth usage
   * Reason: Acquire authentication helpers (isLoggedIn, logout, user) used for auth flows.
   */
  const { isLoggedIn, logout, user } = useAuth();

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: Global store values
   * Reason: Pull connection state and current path from terminalStore for toolbar and UI.
   */
  const { isConnected, currentPath } = useStore(terminalStore);
  const navigate = useNavigate();

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: logoutRef stabilization
   * Reason: Keep a stable reference to logout to avoid effect re-run loops and to use in promise catch blocks.
   */
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const muitheme = useTheme();
  const { theme } = useStore(themeAtom);

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: DOM and addon refs
   * Reason: Hold references to DOM container and xterm/addons to manage lifecycle.
   */
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XtermTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const clipboardAddonRef = useRef<ClipboardAddon | null>(null);
  const [open, setOpen] = useState(false);

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: XTerm initialization effect
   * Reason: Create Xterm instance with Fit and Clipboard addons, attempt WebGL addon, register onData and onKey handlers, and ensure proper cleanup on unmount or theme change.
   *
   * Runs whenever `theme` changes to update terminal styling.
   */
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

    /**
     * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
     * Title: waitForContainerReady helper
     * Reason: Poll until the terminal container has non-zero dimensions, then open the Xterm instance and attempt WebGL.
     *
     * @returns {void}
     */
    const waitForContainerReady = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        term.open(container);

        try {
          // Attempt to load WebGL Addon for accelerated rendering
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

        /**
         * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
         * Title: onData handler
         * Reason: Route all character data (typing and pasting) to the socket service.
         *
         * @param {string} data - Character data from xterm.
         */
        term.onData((data) => {
          terminalSocketService.sendInput(data);
        });

        /**
         * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
         * Title: onKey handler
         * Reason: Process certain DOM key events (Ctrl+C, Enter, Arrows, Tab) that may require explicit PTY sequences or special handling.
         *
         * @param {{ domEvent: KeyboardEvent }} ev - Event payload from Xterm onKey.
         */
        term.onKey(({ domEvent }) => {
          const { key: pressedKey, ctrlKey } = domEvent;
          // Note: ClipboardAddon handles copy/paste typically via browser shortcuts (Ctrl/Cmd + C/V) 

          // Ctrl+C: Send interrupt to PTY only if no text is selected for copying
          if (ctrlKey && pressedKey.toLowerCase() === 'c') {
            if (!term.hasSelection()) {
              // No selection, send Ctrl+C to terminal (interrupt)
              terminalSocketService.sendInput('\x03'); // ASCII for Ctrl+C (ETX)
            }
            // If selection exists, ClipboardAddon or browser default handles copy.
            return; // Prevent further processing by other handlers
          }

          // Case handling for explicit PTY sequences (like arrows, which often don't fire onData consistently)
          switch (pressedKey) {
            case 'Enter':
              terminalSocketService.sendInput('\r'); // Send Carriage Return to PTY
              break;

            case 'Backspace':
              // Handled by the shell/PTY, typically sent via onData. If PTY is in raw mode, might need \x7F here.
              // We rely on onData here for standard key presses that aren't control sequences.
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
              // All other characters should be captured by `onData`.
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

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: Socket event listeners effect
   * Reason: Attach socket event listeners to handle PTY output, errors, system info, prompts, and connection state events. Remove listeners on cleanup to prevent leaks.
   *
   * NOTE: This effect intentionally runs once on mount to register handlers.
   */
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    /**
     * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
     * Title: handleOutput
     * Reason: Write raw PTY output to Xterm and store a stripped text version in the terminal store.
     *
     * @param {string} data - Raw ANSI output from backend PTY.
     */
    const handleOutput = (data: string) => {
      term.write(data);
      appendOutput(stripAnsi(data)); // Update nanostore with plain text version
    };

    /**
     * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
     * Title: handleError
     * Reason: Render error message in terminal and update store.
     *
     * @param {string} data - Error message
     */
    const handleError = (data: string) => {
      term.writeln(`\r\n\x1b[31mError:\x1b[0m ${data}`);
      appendOutput(`Error: ${stripAnsi(data)}`); // Update nanostore
    };

    /**
     * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
     * Title: handleOutputInfo
     * Reason: Convert system info object to a formatted string, write to terminal, and update store.
     *
     * @param {SystemInfo} data - Information object returned by the backend.
     */
    const handleOutputInfo = (data: SystemInfo) => {
      const formatted = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      term.writeln(formatted);
      setSystemInfo(`${formatted}\n`); // Update nanostore
    };

    /**
     * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
     * Title: handlePrompt
     * Reason: Update CWD in store when backend emits prompt metadata (CWD), PTY still prints prompt text via handleOutput.
     *
     * @param {PromptData} data - Prompt metadata containing cwd and other info.
     */
    const handlePrompt = (data: PromptData) => {
      // Update CWD in store. PTY itself will print the prompt via `handleOutput`.
      setCurrentPath(data.cwd);
    };

    /**
     * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
     * Title: Connection state handlers
     * Reason: Update isConnected state on socket connect/disconnect/error events.
     */
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

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: Auto-connect effect
   * Reason: Attempt to connect automatically on mount if a valid auth token exists. If auth fails, trigger logout and redirect to /login.
   *
   * @remarks Depends on navigate but intentionally uses logoutRef for stable logout reference handling.
   */
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      // If no token, ensure disconnected state and prevent connection attempt
      setConnected(false);
      console.warn(
        'No authentication token available for terminal. Skipping auto-connect.',
      );
      return;
    }

    connectTerminal().catch(async (error) => {
      console.error('Initial terminal connection failed:', error);
      // Specific error message check for authentication token issues
      if (
        error instanceof Error &&
        error.message === 'No authentication token.'
      ) {
        await logoutRef.current();
        navigate('/login');
      }
    });

    // Cleanup: Disconnect terminal when component unmounts
    return () => {
      disconnectTerminal();
    };
  }, [navigate]); // Depend on navigate and stable logoutRef (logout handled indirectly)

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: Refit effect on external terminalHeight change
   * Reason: When parent layout changes provided terminalHeight, re-fit xterm and notify backend with new cols/rows.
   *
   * @remarks This ensures the backend PTY receives the updated geometry after layout changes.
   */
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
        console.error('Terminal refit failed:', e);
      }
    });
  }, [terminalHeight]); // Re-fit whenever the provided terminalHeight changes

  /**
   * FilePath: /media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/ai-planner/src/components/terminal/Terminal.md
   * Title: Render
   * Reason: Render toolbar, terminal container (which becomes the Xterm root), and settings dialog.
   */
  return (
    <Box sx={terminalContainerSx(theme, muitheme)}>
      <TerminalToolbar
        isConnected={isConnected}
        currentPath={currentPath} // `currentPath` is retrieved from `terminalStore` if needed, not passed directly via prop if not used
        onConnect={connectTerminal}
        onDisconnect={disconnectTerminal}
        onSettings={() => setOpen(true)}
        onLogout={onLogout}
        sx={{ position: 'sticky', top: 0, zIndex: 1 }} // Keeps toolbar at top on scroll
      />

      <Box
        ref={terminalContainerRef}
        // Use a click handler here to force focus on the terminal container
        onClick={() => xtermRef.current?.focus()}
        sx={xtermBoxSx()}
      />

      <TerminalSettingsDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};
