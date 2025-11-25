import React, { ReactNode, useMemo } from 'react';
import { Box, Paper, Toolbar, AppBar, useTheme, type SxProps, type Theme } from '@mui/material';
import GlobalActionButton, { type GlobalAction } from '@/components/ui/GlobalActionButton';

interface ContentLayoutProps {
  /** Content of the sticky header (e.g., title, navigation). */
  headerContent?: ReactNode;
  /** Actions positioned on the left side of the header. */
  headerLeftActions?: GlobalAction[];
  /** Actions positioned on the right side of the header. */
  headerRightActions?: GlobalAction[];
  /** Content of the main scrolling area. */
  children: ReactNode;
  /** Optional content for the sticky footer. */
  footerContent?: ReactNode;
  /** Optional fixed height for the header (default: 64px). */
  headerHeight?: number;
  /** Optional fixed height for the footer (default: 50px). */
  footerHeight?: number;
  /** Additional styling for the main content wrapper (to control overflow/padding). */
  contentWrapperSx?: SxProps<Theme>;
}

const DEFAULT_HEADER_HEIGHT = 48;
const DEFAULT_FOOTER_HEIGHT = 30;

const headerBarSx = (theme: Theme): SxProps => ({
  backgroundColor: theme.palette.background.default,
  //borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.primary.main,
  minHeight: `${DEFAULT_HEADER_HEIGHT}px`,
  //boxShadow: 0,
  // Tailwind handles sticky positioning and Z-index
});

const toolbarSx: SxProps = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  px: `0px !important`,
  minHeight: `38px`
};

const mainContentSx = (hHeight: number, fHeight: number): SxProps => ({
  flexGrow: 1,
  // Ensure the container fills remaining vertical space
  height: `calc(100% - ${hHeight}px - ${fHeight}px)`,
  minHeight: `calc(100% - ${hHeight}px - ${fHeight}px)`,
  overflowY: 'auto',
});

const footerBarSx = (theme: Theme): SxProps => ({
  backgroundColor: theme.palette.background.default,
  borderTop: `1px solid ${theme.palette.divider}`,
  // Tailwind handles sticky positioning and Z-index
});

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  headerContent,
  headerLeftActions,
  headerRightActions,
  children,
  footerContent,
  headerHeight = DEFAULT_HEADER_HEIGHT,
  footerHeight = DEFAULT_FOOTER_HEIGHT,
  contentWrapperSx = {},
}) => {
  const theme = useTheme();

  const renderedHeaderActionsLeft = useMemo(() => {
    if (!headerLeftActions || headerLeftActions.length === 0) return null;
    return <GlobalActionButton globalActions={headerLeftActions} iconOnly={true}/>;
  }, [headerLeftActions]);

  const renderedHeaderActionsRight = useMemo(() => {
    if (!headerRightActions || headerRightActions.length === 0) return null;
    return <GlobalActionButton globalActions={headerRightActions} />;
  }, [headerRightActions]);

  return (
    <Box className="flex flex-col h-full w-full">

      <AppBar position="static" className="sticky top-0 z-[400]" sx={headerBarSx(theme)}>
        <Toolbar sx={{ ...toolbarSx, minHeight: `${DEFAULT_HEADER_HEIGHT}px !important`}}>
          {renderedHeaderActionsLeft && (
            <Box className="flex items-center flex-shrink-0 min-w-10 pl-2">
              {renderedHeaderActionsLeft}
            </Box>
          )}
          
          <Box className="flex-grow flex justify-start items-center px-4 min-w-0">
            {headerContent}
          </Box>
          {renderedHeaderActionsRight && (
            <Box className="flex items-center flex-shrink-0 min-w-10 pr-2">
              {renderedHeaderActionsRight}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box 
        sx={{ 
            ...mainContentSx(headerHeight, footerHeight),
            ...contentWrapperSx 
        }}
        // Use Tailwind flex-grow to ensure it takes up vertical space, min-h-0 for proper scrolling inside flex
        className="flex-grow min-h-0" 
      >
        {children}
      </Box>

      {/* Sticky Footer */}
      {footerContent && (
        <Paper 
          className="sticky bottom-0 z-[300] w-full flex-shrink-0"
          elevation={1}
          sx={{ 
            ...footerBarSx(theme),
            height: footerHeight,
            minHeight: footerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            //backgroundColor: theme.palette.background.default,
            //borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {footerContent}
        </Paper>
      )}
    </Box>
  );
};
