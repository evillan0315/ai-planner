import { useStore } from '@nanostores/react';
import { authStore, logoutUser, loginUser } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { EmailPasswordCredentials } from '@/types/auth'; // Updated import

/**
 * Custom hook for managing authentication state and actions.
 * Provides login, logout, and access to current user data.
 */
export const useAuth = () => {
  const { isLoggedIn, token, user, loading, error } = useStore(authStore);
  const navigate = useNavigate();

  // The useEffect for fetching user profile is removed as initAuth (in App.tsx)
  // and loginUser (in authStore) already handle this efficiently on app load and login respectively.

  /**
   * Logs out the current user and navigates to the login page.
   */
  const logout = () => {
    logoutUser();
    navigate('/login');
  };

  /**
   * Attempts to log in a user with the provided credentials.
   * Navigates to the home page on success.
   * @param credentials - The user's login credentials.
   * @returns An object indicating success or containing an error message.
   */
  const login = async (credentials: EmailPasswordCredentials) => {
    // Updated type
    const result = await loginUser(credentials);
    if (result.success) {
      navigate('/'); // Redirect to home on successful login
    }
    return result;
  };

  return { isLoggedIn, token, user, loading, error, login, logout };
};
