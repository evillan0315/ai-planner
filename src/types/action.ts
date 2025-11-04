import type { ButtonProps } from '@mui/material'; // Import ButtonProps to infer types

// Define ButtonColor and ButtonVariant based on Material UI's ButtonProps
export type ButtonColor = ButtonProps['color'];
export type ButtonVariant = ButtonProps['variant'];

export interface GlobalAction {
  label?: string;
  action?: () => void;
  icon?: React.ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  component?: React.ReactNode;
}
