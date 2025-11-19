import React, {useMemo} from 'react';
import { Box, Typography, Chip, useTheme, SxProps, Tooltip } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error'; // Use ErrorIcon for better contrast/visibility for ESLint

// --- Types ---
interface EditorStatusFooterProps {
    filePath: string;
    hasUnsavedChanges: boolean;
    line?: number;
    column?: number;
    eslintIssuesCount?: number; // NEW PROP
    sx?: SxProps; // Allow external styling overrides
}

// --- Styles ---
const defaultSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    px: 2, // Reduced padding slightly for status bar elements
    py: 1,
    height: '30px',
    backgroundColor: theme.palette.background.default,
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
});

const statusItemSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
};

// --- Utilities ---

/**
 * Truncates a file path to show start/end segments.
 * @param filePath The full file path.
 * @param maxTotalLength Maximum allowed length before truncation.
 */
const truncatePath = (filePath: string, maxTotalLength = 60): string => {
    if (!filePath || filePath.length <= maxTotalLength) return filePath;

    // Use a fixed strategy: show base directory, ellipsis, and filename
    const parts = filePath.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    
    // Reserve space for filename and ellipsis/separator
    // We allocate remaining space to the path start
    const remainingSpace = maxTotalLength - fileName.length - 3; // -3 for '.../'

    if (remainingSpace <= 0) {
        // If there's no room, just show ellipsis/file end
        return `...${fileName.slice(-maxTotalLength + 3)}`;
    }
    
    // Show path start + ellipsis + filename
    const start = filePath.slice(0, remainingSpace);

    // Find the last separator in the truncated start slice to make it cleaner
    const lastSeparatorIndex = Math.max(start.lastIndexOf('/'), start.lastIndexOf('\\'));
    const finalStart = lastSeparatorIndex > 0 ? start.slice(0, lastSeparatorIndex) : start;
    
    return `${finalStart}/.../${fileName}`;
};


/**
 * Renders the status bar showing file path and unsaved changes status,
 * including optional Monaco line/column numbers and ESLint issue count.
 */
export const EditorStatusFooter: React.FC<EditorStatusFooterProps> = ({
    filePath,
    hasUnsavedChanges,
    line,
    column,
    eslintIssuesCount = 0, // Default to 0
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
    
    // Determine max length dynamically, assuming common usage contexts have around 800px width.
    // If we use 60 characters, it should be safe.
    const truncatedPath = useMemo(() => truncatePath(filePath), [filePath]);

    return (
        <Box sx={combinedSx} className="w-full">
            {/* Left Section: Path & Unsaved */}
            <Box sx={statusItemSx} className="min-w-0 flex-shrink-1 truncate pr-2">
                <Typography variant="caption" color="text.secondary" className='truncate'>
                    Path: <Tooltip title={filePath} arrow placement="top"><span className="font-mono">{truncatedPath}</span></Tooltip>
                </Typography>
                {hasUnsavedChanges && (
                    <Chip 
                        label="Unsaved" 
                        color="warning" 
                        size="small" 
                        className="animate-pulse flex-shrink-0" 
                    />
                )}
            </Box>

            {/* Right Section: Status (Issues, Line/Col) */}
            <Box sx={statusItemSx} className="flex-shrink-0">
                {/* ESLint Issues Count */}
                {eslintIssuesCount > 0 && (
                     <Chip 
                        label={`${eslintIssuesCount} Problems`} 
                        color="error" 
                        size="small" 
                        icon={<ErrorIcon fontSize="small" />}
                        className="mr-2"
                    />
                )}
                {/* Line / Column Display */}
                {(line !== undefined || column !== undefined) && (
                    <Typography variant="caption" color="text.secondary" className="font-mono">
                        Ln {line ?? 1}, Col {column ?? 1}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};