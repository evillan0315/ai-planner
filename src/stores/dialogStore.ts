import { atom } from 'nanostores';
import type { ReactNode } from 'react';
import type { GlobalAction } from '@/types/action';

export type DialogType = 'alert' | 'confirm' | 'prompt';

// Base options for configuration
interface BaseDialogOptions {
  title?: string;
  content: ReactNode;
  actions?: GlobalAction[];
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

// State for prompt dialog, requiring input
export interface PromptDialogOptions extends BaseDialogOptions {
  type: 'prompt';
  content: ReactNode; // Prompt can still show instructions
  initialValue?: string;
  placeholder?: string;
}

// State for alert/confirm dialogs
interface SimpleDialogOptions extends BaseDialogOptions {
  type: 'alert' | 'confirm';
}

export type DialogOptions = PromptDialogOptions | SimpleDialogOptions;

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  // Functions to resolve the pending operation
  resolve: ((value: any) => void) | null;
  reject: ((reason?: any) => void) | null;
}

const INITIAL_STATE: DialogState = {
  isOpen: false,
  options: null,
  resolve: null,
  reject: null,
};

export const dialogStore = atom<DialogState>(INITIAL_STATE);

/**
 * Opens the dialog with the given options and sets the promise resolution functions.
 */
export const openDialog = (
  options: DialogOptions,
  resolve: (value: any) => void,
  reject: (reason?: any) => void,
) => {
  dialogStore.set({
    isOpen: true,
    options,
    resolve,
    reject,
  });
};

/**
 * Closes the dialog and resets the state.
 */
export const closeDialog = () => {
  dialogStore.set(INITIAL_STATE);
};
