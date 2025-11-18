import { atom } from 'nanostores';
import { authService } from '@/api/authService';
import { persistentAtom } from '@/utils/persistentAtom';
import type {
  EmailPasswordCredentials,
  UserProfile,
  AuthResponse,
} from '@/types/auth'; // Updated import

/**
 * Interface representing the authentication state in the store.
 */
interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  provider_token: string | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Nanostore atom for managing global authentication state.
 * The entire AuthState object is persisted under the 'auth' key in localStorage by persistentAtom.
 * `isLoggedIn` will be derived from the presence of the token by actions, but defaults to false.
 */
export const authStore = persistentAtom<AuthState>('auth', {
  isLoggedIn: false, // Default to false, will be overridden by persisted state or set on login
  token: null, // Default to null, will be overridden by persisted state or set on login
  provider_token: null,
  user: null, // User profile will be fetched on login or app init
  loading: false,
  error: null,
});

/**
 * Sets authentication details (token and user profile) in the store.
 * Useful for handling OAuth callbacks where the token and initial user data are provided.
 * @param token - The JWT token.
 * @param user - The user's profile data.
 */
export const setAuthDetails = (token: string, user: UserProfile) => {
  authStore.set({
    isLoggedIn: true,
    token,
    user,
    loading: false,
    error: null,
  });
};

/**
 * Initiates a login request to the backend with provided credentials.
 * Updates the store with success or error state.
 * @param credentials - User's email and password.
 * @returns An object indicating success or containing an error message.
 */
export const loginUser = async (credentials: EmailPasswordCredentials) => {
  // Updated type
  authStore.set({ ...authStore.get(), loading: true, error: null });
  try {
    const { token, user } = await authService.login(credentials); // Now returns AuthResponse
    setAuthDetails(token, user);
    return { success: true };
  } catch (error) {
    const errorMessage = (error as Error).message || 'Login failed';
    authStore.set({
      ...authStore.get(),
      loading: false,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Handles the complete OAuth login flow after receiving an access token.
 * Sets the token, fetches the user profile, and updates auth state in a single action.
 * @param accessToken - The JWT token received from the OAuth callback.
 * @returns A promise that resolves when the process is complete, indicating success or failure.
 */
export const completeOAuthLogin = async (
  accessToken: string,
  provider_token: string,
) => {
  authStore.set({
    isLoggedIn: true,
    token: accessToken,
    provider_token,
    user: null, // Clear user while fetching to indicate pending state
    loading: true,
    error: null,
  });

  try {
    // Ensure authService uses the token that was just set.
    // getAuthToken() will now return the newly set accessToken.
    const user = await authService.getProfile();
    authStore.set({
      ...authStore.get(),
      user,
      loading: false,
      error: null,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to fetch user profile after OAuth token:', error);
    // If fetching profile fails, it means the token might be invalid or expired.
    // Clear authentication state.
    logoutUser(); // This will clear the token from store and localStorage, and set loading/error.
    const errorMessage =
      (error as Error).message ||
      'Failed to retrieve user profile after OAuth. Please try again.';
    authStore.set({
      ...authStore.get(),
      error: errorMessage,
      loading: false,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Logs out the current user. Calls the backend logout endpoint and clears client-side state.
 */
export const logoutUser = async () => {
  // Attempt to invalidate session on backend, but don't block client-side state update
  // as client should appear logged out regardless of backend's response.
  try {
    await authService.logout();
  } catch (error) {
    console.error('Backend logout failed:', error);
    // Continue clearing client-side state even if backend logout fails
  }

  authStore.set({
    isLoggedIn: false,
    token: null,
    user: null,
    loading: false,
    error: null,
  });
};

/**
 * Fetches the profile of the currently authenticated user from the backend.
 * Updates the store with the user profile or logs out if the token is invalid.
 */
export const fetchUserProfile = async () => {
  const current = authStore.get();
  // Only attempt to fetch if there's a token and user profile is not yet loaded
  if (!current.token || current.user) return;

  authStore.set({ ...current, loading: true, error: null });
  try {
    const user = await authService.getProfile(); // Returns UserProfile
    authStore.set({ ...current, user, loading: false, error: null });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    logoutUser();
    authStore.set({
      ...authStore.get(),
      error: (error as Error).message || 'Failed to retrieve user profile.',
    });
  }
};

/**
 * Initializes the authentication store. Called once on app start.
 * Checks for an existing token (from persisted state) and attempts to fetch the user profile if logged in
 * and user data is missing. Ensures `isLoggedIn` is true if a token is present.
 */
export const initAuth = async () => {
  const current = authStore.get();
  // If a token exists (e.g., from localStorage) but user data is missing, try to fetch the profile.
  // Also, explicitly set isLoggedIn to true if a token is found, as persistentAtom might not guarantee this.
  if (current.token && !current.user) {
    authStore.set({ ...current, isLoggedIn: true, loading: true });
    await fetchUserProfile();
  } else if (current.token && current.user) {
    // If both token and user are present, ensure isLoggedIn is true
    authStore.set({ ...current, isLoggedIn: true, loading: false });
  }
};

/**
 * Selector function to get the current authentication token.
 * @returns The JWT token or null if not logged in.
 */
export const getAuthToken = (): string | null => {
  return authStore.get().token;
};

/**
 * Selector function to get the current authentication token.
 * @returns The JWT token or null if not logged in.
 */
export const getProviderToken = (): string | null => {
  return authStore.get().provider_token;
};
