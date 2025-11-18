import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { completeOAuthLogin } from '../stores/authStore'; // Import the new centralized action
import { useAuth } from '@/hooks/useAuth';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

function AuthCallback() {
  const { loading, error } = useAuth(); // Use useAuth for consistent state access
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('accessToken');
    const provider_token = searchParams.get('provider_token');

    const errorParam = searchParams.get('error'); // Renamed to avoid collision with hook's 'error'

    const handleAuthResult = async () => {
      if (token) {
        const result = await completeOAuthLogin(token, provider_token);
        if (result.success) {
          console.warn(
            'JWT Token received, stored, and user profile fetched. Redirecting to home.',
          );
          navigate('/'); // Redirect to home or dashboard after successful login
        } else {
          // Error already set in authStore by completeOAuthLogin
          navigate(
            '/login?error=' +
              encodeURIComponent(error || 'Authentication failed.'),
          );
        }
      } else if (errorParam) {
        console.error('Authentication error from callback URL:', errorParam);
        // Set error state through useAuth/authStore if not already handled by completeOAuthLogin
        // The useAuth hook's error state will already be updated by completeOAuthLogin if it failed.
        navigate('/login?error=' + encodeURIComponent(errorParam)); // Redirect to login with error
      } else {
        // No token or error, likely a direct access or incomplete flow
        console.warn(
          'AuthCallback accessed without token or error param. Redirecting to login.',
        );
        navigate('/login');
      }
    };

    handleAuthResult();
  }, [searchParams, navigate, error]); // Add error to dependencies to ensure navigate responds to failures from completeOAuthLogin

  return (
    <Box
      className="flex flex-col items-center justify-center min-h-[50vh]"
      sx={{ mt: 4 }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Authentication failed: {error}
        </Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Authenticating...
          </Typography>
        </>
      )}
    </Box>
  );
}

export default AuthCallback;
