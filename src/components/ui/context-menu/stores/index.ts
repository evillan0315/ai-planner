import { atom } from 'nanostores';

/**
 * Interface for the coordinates of the context menu.
 */
export interface ContextMenuPosition {
  x: number;
  y: number;
}

/**
 * Interface for the state of the File Explorer context menu.
 */
export interface ContextMenuState {
  isOpen: boolean;
  position: ContextMenuPosition | null;
}



