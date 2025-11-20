import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';

// --- Constants ---
const DEFAULT_LEFT_WIDTH = 300;
const DEFAULT_RIGHT_WIDTH = 400;

// --- State Definitions ---

export const isLeftSidebarVisible = persistentAtom<boolean>(
  'isLeftSidebarVisible',
  false,
);
export const isRightSidebarVisible = persistentAtom<boolean>(
  'isRightSidebarVisible',
  false,
);

// Use persistent atoms for width to maintain user preference across sessions
export const leftSidebarWidth = persistentAtom<number>(
  'leftSidebarWidth',
  DEFAULT_LEFT_WIDTH,
);
export const rightSidebarWidth = persistentAtom<number>(
  'rightSidebarWidth',
  DEFAULT_RIGHT_WIDTH,
);

// --- Actions ---

export const toggleLeftSidebar = () => {
  isLeftSidebarVisible.set(!isLeftSidebarVisible.get());
};

export const toggleRightSidebar = () => {
  isRightSidebarVisible.set(!isRightSidebarVisible.get());
};
