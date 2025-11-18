// FilePath: src/components/StreamDemo.tsx
// Title: Gemini Streaming Demo React component (fully working with normalized chunk.delta)
// Reason: Updated to work with GeminiService.streamGenerateContent that normalizes events, ensuring progressive output display

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Card,
  CardContent,
  Stack,
  SxProps,
} from '@mui/material';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { geminiService } from '@/api/geminiService'; // MODIFIED: Import singleton instance directly
import type { GenerateContentRequest, StreamEvent, ApiError } from '@/types/gemini';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';

// Import nanostore utilities
import { useStore } from '@nanostores/react';
import { geminiStore, setStreamingStatus, appendStreamingContent, clearStreamingData } from '@/stores/geminiStore'; 

// Styles for streaming output box
const streamOutputSx: SxProps = {
  border: '1px solid',
  borderColor: 'divider',
  p: 2,
  minHeight: '200px',
  borderRadius: 2,
  mt: 2,
  bgcolor: 'background.paper',
  boxShadow: 1,
};

// Example prompt
const inputPrompt: GenerateContentRequest = {
  model: 'gemini-2.5-flash',
  contents: [
    {
      role: 'user',
      parts: [
        {
          text: 'Write a detailed technical plan for implementing an SSE streaming component in React, explaining the roles of async generator, AbortController, and React state updates. Use markdown formatting.',
        },
      ],
    },
  ],
};

const StreamDemo: React.FC = () => {
  // 1. Get streaming state from store
  const { streamingContent: output, isStreaming: isStoreStreaming, streamingError: storeError } = useStore(geminiStore);

  // 2. Keep local status for richer UI feedback (since nanostore doesn't track complete/aborted)
  const [status, setStatus] = useState<'idle' | 'streaming' | 'complete' | 'error' | 'aborted'>(
    'idle',
  );

  // Use store's isStreaming flag to determine disabled state
  const isStreaming = isStoreStreaming;
  const effectiveErrorMessage = storeError;

  const abortControllerRef = useRef<AbortController | null>(null);

  // REMOVED: const geminiService = useMemo(() => new GeminiService({}), []);

  useEffect(() => {
    return () => {
      // Cleanup store and controller on unmount
      abortControllerRef.current?.abort();
      if (isStoreStreaming) {
          setStreamingStatus(false, storeError);
      }
    };
  }, [isStoreStreaming, storeError]);

  const handleStartStream = useCallback(async () => {
    if (isStreaming) return;

    // 1. Reset content in store, set status locally and globally
    clearStreamingData(); 
    setStreamingStatus(true);
    setStatus('streaming');

    let finishedNormally = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Use the convenience wrapper streamContent on the imported singleton instance.
      // GeminiService handles endpoint path (:streamGenerateContent?alt=sse) 
      // and API key injection automatically.
      const stream =  geminiService.streamContent(inputPrompt, { signal: controller.signal });
      
      console.log(stream, controller);
      for await (const event of stream) {
        if (controller.signal.aborted) {
          setStatus('aborted');
          // Note: setStreamingStatus(false) is handled in finally block or catch
          break;
        }

        if (event.type === 'chunk' && event.chunk?.delta) {
          // Update store directly with chunk
          appendStreamingContent(event.chunk.delta);
          
          // Removed explicit yield for performance
        } else if (event.type === 'end') {
          finishedNormally = true;
          setStatus('complete');
          break;
        } else if (event.type === 'error') {
          // Update store error state
          setStreamingStatus(false, event.error?.message || 'Streaming API error.');
          setStatus('error');
          break;
        }
      }

      if (finishedNormally && abortControllerRef.current === controller) {
        setStatus('complete');
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      if (apiError?.code === 499 || controller.signal.aborted) {
        setStatus('aborted');
        setStreamingStatus(false); // Stop streaming in store on abort/cancellation
      } else {
        const errorMsg = apiError?.message || (err as Error).message || 'An unknown streaming error occurred.';
        setStreamingStatus(false, errorMsg); // Set error in store
        setStatus('error');
      }
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      // Ensure store streaming status is off if it hasn't been turned off by an explicit error event or catch
      if (isStoreStreaming) {
          const finalError = finishedNormally ? null : storeError; // Keep existing store error if stream didn't finish normally
          setStreamingStatus(false, finalError);
      }
    }
  }, [isStreaming, storeError, isStoreStreaming]); // Removed geminiService from deps

  const handleStopStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const statusMessage = useMemo(() => {
    switch (status) {
      case 'streaming': return 'Streaming live output...';
      case 'complete': return 'Streaming complete.';
      case 'aborted': return 'Streaming aborted.';
      case 'error': return effectiveErrorMessage || 'Error during streaming.';
      default: return 'Ready to start stream.';
    }
  }, [status, effectiveErrorMessage]);

  return (
    <Card className="shadow-lg p-6 max-w-4xl mx-auto">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Gemini Streaming Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          Demonstrates consuming the <code>streamContent</code> async generator with progressive UI updates and cancellation.
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" className="mb-4">
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartStream}
            disabled={isStreaming}
            startIcon={isStreaming ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          >
            Start Streaming Request
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleStopStream}
            disabled={!isStreaming}
            startIcon={<StopIcon />}
          >
            Stop / Cancel
          </Button>
        </Stack>

        <Box className="mb-4">
          {effectiveErrorMessage && <Alert severity="error">{effectiveErrorMessage}</Alert>}
          {!effectiveErrorMessage && status !== 'idle' && (
            <Alert severity={status === 'streaming' ? 'info' : (status === 'complete' ? 'success' : 'warning')}>
              {statusMessage}
            </Alert>
          )}
        </Box>

        <Typography variant="h6" className="mt-4">Output Preview:</Typography>
        <Box sx={streamOutputSx}>
          {output ? (
            <Box className="mb-4">
              <MarkdownRenderer content={output} /> {/* MODIFIED: Use MarkdownRenderer */}
            </Box>
          ) : (
            <Typography color="text.secondary">
              {status === 'streaming' ? 'Awaiting first chunk...' : 'Output will appear here.'}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StreamDemo;
