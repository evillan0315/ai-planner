import React, { SyntheticEvent } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  useTheme,
  SxProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { IEditorTab } from '@/components/editor/stores/multiTabEditorStore';
import { setActiveTab, closeTab } from '@/components/editor/stores/multiTabEditorStore';

// --- Types ---

interface MultiTabHeaderProps {
    tabs: IEditorTab[];
    activeTabIndex: number | null; // Changed to numeric index
}

// --- Styles ---

const tabStyles = (theme: ReturnType<typeof useTheme>): SxProps => ({
    minHeight: '48px',
    //height: '48px', // Ensure tabs are explicitly 38px high to match header
    py: 0,
    px: 2,
    textTransform: 'none',
    '&.Mui-selected': {
        backgroundColor: theme.palette.background.default, 
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: 'none',
        marginBottom: '-1px', // Overlay the toolbar bottom border
    },
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
});

// Custom styles for the Tabs container and scroll buttons
const tabsRootSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
    height: '100%', 
    alignItems: 'flex-end', 
    borderBottom: 'none', 
    flexGrow: 1,
    justifyContent: 'flex-start',
    
    // Fix 1 & 2: Ensure scroll buttons are full height (100%) and centered.
    // scrollButtons="auto" handles visibility based on overflow.
    '& .MuiTabs-scrollButtons': {
        height: '100%',
        display: 'flex',
        alignItems: 'center', 
        
        // Ensure the actual button element respects the centering
        '& button': {
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            // Default MUI buttons have some padding/margin that might need normalizing, 
            // but setting height: 100% on the container often resolves vertical misalignment.
        }
    },
});


/**
 * Renders the tab bar for the Multi-Tab Editor Mode.
 */
export const MultiTabHeader: React.FC<MultiTabHeaderProps> = ({ tabs, activeTabIndex }) => {
    const theme = useTheme();
    // The `value` prop in MUI Tabs expects a number corresponding to the Tab's value.
    const handleTabChange = (_: SyntheticEvent, newTabIndex: number) => {
        if (newTabIndex !== activeTabIndex) {
             setActiveTab(newTabIndex);
        }
    };

    return (
        <Tabs 
            value={activeTabIndex ?? 0} // MUI expects number here. Use 0 as fallback if tabs exist but index is null temporarily.
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={tabsRootSx(theme)}
        >
            {tabs.map((tab, index) => ( // Use index for iteration
                <Tooltip title={tab.filePath} key={tab.id}>
                    <Tab 
                        component="div"
                        value={index} // Use the array index as the tab value
                        label={
                            <Box className="flex items-center">
                                <Typography variant="body2" component="span" sx={{ mr: 1, fontStyle: tab.hasUnsavedChanges ? 'italic' : 'normal' }}>
                                    {tab.name}
                                    {tab.hasUnsavedChanges && ' *'}
                                </Typography>
                                <IconButton 
                                    size="small" 
                                    sx={{ p: 0, ml: 1, color: 'text.secondary' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        }
                        sx={tabStyles(theme)}
                    />
                </Tooltip>
            ))}
        </Tabs>
    );
};
