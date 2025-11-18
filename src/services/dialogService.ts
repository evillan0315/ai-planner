import React, { ReactNode } from 'react';
import {
  openDialog,
  DialogOptions,
  PromptDialogOptions,
} from '@/stores/dialogStore';

// --- Type Definitions for Service Wrappers ---

interface BaseServiceOptions {
  title?: string;
  content: ReactNode;
  maxWidth?: DialogOptions['maxWidth'];
}

interface AlertOptions extends BaseServiceOptions {}
interface ConfirmOptions extends BaseServiceOptions {}

interface PromptOptions extends BaseServiceOptions {
  initialValue?: string;
  placeholder?: string;
}

/**
 * Displays an Alert dialog with a custom title and content.
 * @param options - Configuration for the alert.
 * @returns A Promise that resolves when the user clicks 'OK'.
 */
export function alert(options: AlertOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const dialogOptions: DialogOptions = {
      type: 'alert',
      title: options.title,
      content: options.content,
      maxWidth: options.maxWidth || 'sm',
    } as DialogOptions; // Cast necessary for union type
    openDialog(dialogOptions, () => resolve(), reject);
  });
}

/**
 * Displays a Confirm dialog with 'Cancel' and 'Confirm' buttons.
 * @param options - Configuration for the confirmation prompt.
 * @returns A Promise that resolves to `true` if confirmed, or `false` if cancelled.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const dialogOptions: DialogOptions = {
      type: 'confirm',
      title: options.title || 'Confirm Action',
      content: options.content,
      maxWidth: options.maxWidth || 'sm',
    } as DialogOptions; // Cast necessary for union type

    // resolve(true) on confirm button click, resolve(false) on cancel/rejection
    openDialog(
      dialogOptions,
      (result) => resolve(result === true),
      (reason) => {
        // If rejected (e.g., escape key/cancel button), return false to consumer
        resolve(false);
      },
    );
  });
}

/**
 * Displays a Prompt dialog requiring text input from the user.
 * @param options - Configuration including initial value and placeholder.
 * @returns A Promise that resolves to the entered string value, or null if cancelled.
 */
export function prompt(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const dialogOptions: PromptDialogOptions = {
      type: 'prompt',
      title: options.title || 'Input Required',
      content: options.content,
      initialValue: options.initialValue,
      placeholder: options.placeholder,
      maxWidth: options.maxWidth || 'sm',
    };

    // Resolve(string) on submit, resolve(null) on cancel/rejection
    openDialog(dialogOptions, resolve, (reason) => {
      resolve(null);
    });
  });
}

// Export a single object for convenience
export const dialogService = {
  alert,
  confirm,
  prompt,
};
