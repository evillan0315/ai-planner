import React, {useMemo} from 'react';
import { Box, Typography, Chip, useTheme, SxProps } from '@mui/material';

// --- Types ---
interface EditorStatusFooterProps {
    filePath: string;
    hasUnsavedChanges: boolean;
    sx?: SxProps; // Allow external styling overrides
}

// --- Styles ---
const defaultSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    px: 4,
    py: 1,
    height: '30px',
    backgroundColor: theme.palette.background.default,
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
});

/**
 * Renders the status bar showing file path and unsaved changes status.
 */
export const EditorStatusFooter: React.FC<EditorStatusFooterProps> = ({
    filePath,
    hasUnsavedChanges,
    sx,
}) => {
    const theme = useTheme();

    // Handle merging default and custom Sx props
    const combinedSx = useMemo(() => {
        const base = defaultSx(theme);
        if (Array.isArray(sx)) {
            return [base, ...sx];
        } else if (sx) {
            return [base, sx];
        } 
        return base;
    }, [theme, sx]);

    return (
        <Box sx={combinedSx} className="w-full">
            <Typography variant="caption" color="text.secondary">
                Path: <span className="font-mono">{filePath}</span>
            </Typography>
            {hasUnsavedChanges && (
                <Chip 
                    label="Unsaved Changes" 
                    color="warning" 
                    size="small" 
                    className="animate-pulse" 
                />
            )}
        </Box>
    );
};

