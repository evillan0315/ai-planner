import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';

// --- Constants ---
const DEFAULT_LEFT_WIDTH = 300;
const DEFAULT_RIGHT_WIDTH = 400;
const DEFAULT_TERMINAL_HEIGHT = 300;

// --- State Definitions ---

export const isLeftSidebarVisible = persistentAtom<boolean>(
  'isLeftSidebarVisible',
  false,
);
export const isRightSidebarVisible = persistentAtom<boolean>(
  'isRightSidebarVisible',
  false,
);

// ADDED: Terminal visibility state
export const isTerminalVisible = persistentAtom<boolean>(
  'isTerminalVisible',
  false,
);

// Use persistent atoms for width/height to maintain user preference across sessions
export const leftSidebarWidth = persistentAtom<number>(
  'leftSidebarWidth',
  DEFAULT_LEFT_WIDTH,
);
export const rightSidebarWidth = persistentAtom<number>(
  'rightSidebarWidth',
  DEFAULT_RIGHT_WIDTH,
);

// ADDED: Terminal/bottom drawer height
export const terminalHeight = persistentAtom<number>(
  'terminalHeight',
  DEFAULT_TERMINAL_HEIGHT, // Default height in pixels
);

// --- Actions ---

export const toggleLeftSidebar = () => {
  isLeftSidebarVisible.set(!isLeftSidebarVisible.get());
};

export const toggleRightSidebar = () => {
  isRightSidebarVisible.set(!isRightSidebarVisible.get());
};

// ADDED: Action to toggle terminal visibility
export const toggleTerminal = () => {
  isTerminalVisible.set(!isTerminalVisible.get());
};

// ADDED: Action to set terminal height
export const setTerminalHeight = (height: number) => {
  // Ensure minimum height (e.g., 100px)
  terminalHeight.set(Math.max(100, height));
};
