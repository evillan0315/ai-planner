import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Paper,
  useTheme,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * A React Error Boundary component to catch and handle JavaScript errors
 * anywhere in its child component tree. It displays a fallback UI instead
 * of crashing the entire application.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  /**
   * Static method to update state so the next render will show the fallback UI.
   * This method is called after an error has been thrown by a descendant component.
   * @param error The error that was thrown.
   * @returns An object to update the state.
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // console.error('ErrorBoundary: getDerivedStateFromError', error);
    return { hasError: true, error, errorInfo: null };
  }

  /**
   * This method is called after an error has been thrown by a descendant component.
   * It is useful for side effects like logging errors to an error reporting service.
   * @param error The error that was thrown.
   * @param errorInfo An object with a componentStack key containing information about which component threw the error.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error('ErrorBoundary: componentDidCatch', error, errorInfo);
    this.setState({ errorInfo });
    // You can also log error messages to an error reporting service here
    // logErrorToMyService(error, errorInfo);
  }

  /**
   * Resets the error boundary state, allowing the component tree to attempt a re-render.
   * This can be used with a 'Try Again' button.
   */
  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, render it.
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI using Material UI
      return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
            }}
          >
            <BugReportIcon color="error" sx={{ fontSize: 60, mb: 3 }} />
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              <AlertTitle>Oops! Something went wrong.</AlertTitle>
              <Typography variant="body1" component="p" gutterBottom>
                We're sorry for the inconvenience. An unexpected error occurred.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please try refreshing the page or navigating back to the home
                page.
              </Typography>
            </Alert>

            {/* Only show error details in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 3,
                  width: '100%',
                  border: '1px dashed',
                  borderColor: 'error.main',
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  overflowX: 'auto',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  Error Details:
                </Typography>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    component="code"
                    sx={{
                      fontFamily: 'monospace',
                      color: 'error.contrastText',
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack &&
                      `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                  </Typography>
                </pre>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={this.resetError}
              sx={{ mt: 3 }}
            >
              Try Again
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide useTheme context to ErrorBoundary (if needed for custom styling or conditional logic based on theme mode)
// This is an alternative if the class component cannot directly consume hooks.
// For the current implementation, useTheme is only used in the default fallback, which is inside render, not directly by ErrorBoundary class.
// If custom fallback *needs* theme, it would use useTheme itself. No change needed here for now.

export default ErrorBoundary;
