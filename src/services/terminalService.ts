import type { Socket } from 'socket.io-client';
import { connectTerminal, disconnectTerminal, sendTerminalInput, sendTerminalResize } from '@/stores/terminalStore';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

/**
 * Interface to wrap the Xterm.js instance and its required plugins/addons.
 */
interface XtermWrapper {
  terminal: Terminal;
  fitAddon: FitAddon;
  socket?: Socket;
}

const XTERM_OPTIONS = {
  fontSize: 14,
  fontFamily: 'monospace',
  allowTransparency: true,
  theme: {
    background: '#1E1E1E', // VS Code dark terminal background
    foreground: '#D4D4D4',
    cursor: '#D4D4D4',
  },
  scrollback: 1000,
};

export class TerminalService {
  private xtermWrapper: XtermWrapper | null = null;
  private resizeObserver: ResizeObserver | null = null;
  
  /**
   * Initializes the Xterm terminal instance within the provided DOM element.
   * @param container The HTML element to mount the terminal into.
   * @param initialCwd The initial working directory.
   */
  public initializeTerminal(container: HTMLElement, initialCwd?: string): void {
    if (this.xtermWrapper) {
        this.destroyTerminal();
    }
    
    // 1. Initialize Xterm components
    const terminal = new Terminal(XTERM_OPTIONS);
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // 2. Open terminal in container
    terminal.open(container);

    // 3. Connect to the Socket
    const socket = connectTerminal(initialCwd);
    this.xtermWrapper = { terminal, fitAddon, socket };
    console.log(socket, 'socket');
    // 4. Set up socket output handler
    socket.on('output', (data: string) => {
        // Raw output from pty/shell
        terminal.write(data);
    });

    // 5. Set up local input handler (from keyboard)
    terminal.onData((data) => {
        // Send keyboard input through the store action
        sendTerminalInput(data);
    });
    
    // 6. Initial fit and observer setup
    this.setupResizeLogic(container);
  }

  /**
   * Sets up ResizeObserver to automatically fit the terminal when its container resizes.
   */
  private setupResizeLogic(container: HTMLElement): void {
    if (!this.xtermWrapper) return;
    const { terminal, fitAddon } = this.xtermWrapper;
    
    const throttledFit = () => {
      try {
        fitAddon.fit();
        // Inform the server about the new size
        sendTerminalResize(terminal.cols, terminal.rows);
      } catch (e) {
        console.warn('Xterm fit failed:', e);
      }
    };
    
    // Throttle resize execution (using simplified setTimeout approach)
    let resizeTimer: number;
    const throttledResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(throttledFit, 100);
    };

    // Use ResizeObserver for efficient detection of container size changes
    this.resizeObserver = new ResizeObserver(throttledResize);
    this.resizeObserver.observe(container);
    
    // Immediate fit on setup
    throttledFit();
  }

  /**
   * Destroys the Xterm terminal instance and disconnects the socket.
   */
  public destroyTerminal(): void {
    if (this.xtermWrapper) {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.xtermWrapper.terminal.dispose();
      disconnectTerminal();
      this.xtermWrapper = null;
    }
  }

  /**
   * Manually resize the terminal if necessary (e.g., external event, though ResizeObserver should handle most).
   */
  public manualResize(): void {
    if (this.xtermWrapper) {
      this.xtermWrapper.fitAddon.fit();
      sendTerminalResize(this.xtermWrapper.terminal.cols, this.xtermWrapper.terminal.rows);
    }
  }

  /**
   * Focuses the terminal input.
   */
  public focus(): void {
    if (this.xtermWrapper) {
      this.xtermWrapper.terminal.focus();
    }
  }
}

export const terminalService = new TerminalService();
