import axios from 'axios';
import { getAuthToken } from '@/stores/authStore';
import type {
  AuthResponse,
  UserProfile,
  EmailPasswordCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  AuthMessageResponse,
  // Internal type to match backend DTO, not exposed
  BackendLoginResponseDto,
} from '@/types/auth';

export const API_BASE_URL = `${import.meta.env.VITE_API_URL}` || '/api';

// Helper to get authorization headers for protected routes
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to convert backend user DTO to frontend UserProfile
const mapBackendUserToUserProfile = (
  backendUser: BackendLoginResponseDto['user'],
): UserProfile => ({
  id: backendUser.id || backendUser.sub, // Use sub as fallback for id
  email: backendUser.email,
  name: backendUser.name || undefined,
  username: backendUser.username || undefined,
  role: backendUser.role || undefined,
  image: backendUser.image || undefined,
  phoneNumber: backendUser.phone_number || undefined,
});

/**
 * Service for interacting with the backend authentication API.
 */
export const authService = {
  /**
   * Authenticates a user with email and password.
   * @param credentials - User's email and password.
   * @returns A promise that resolves to AuthResponse containing the JWT token and user profile.
   * @throws Error if login fails.
   */
  login: async (
    credentials: EmailPasswordCredentials,
  ): Promise<AuthResponse> => {
    try {
      // Backend expects 'password' field, not 'passwordHash'
      const response = await axios.post<BackendLoginResponseDto>(
        `${API_BASE_URL}/auth/login`,
        { email: credentials.email, password: credentials.password },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return {
        token: response.data.access_token,
        user: mapBackendUserToUserProfile(response.data.user),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Login failed',
        );
      }
      throw new Error(
        (error as Error).message || 'An unknown error occurred during login',
      );
    }
  },

  /**
   * Registers a new user with email, password, and optional details.
   * @param credentials - User's registration details.
   * @returns A promise that resolves to AuthResponse containing the JWT token and user profile.
   * @throws Error if registration fails.
   */
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await axios.post<BackendLoginResponseDto>(
        `${API_BASE_URL}/auth/register`,
        {
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
          phone_number: credentials.phoneNumber, // Backend expects phone_number
          role: credentials.role,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return {
        token: response.data.access_token,
        user: mapBackendUserToUserProfile(response.data.user),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            'Registration failed',
        );
      }
      throw new Error(
        (error as Error).message ||
          'An unknown error occurred during registration',
      );
    }
  },

  /**
   * Logs out the current user by invalidating the session on the backend.
   * Clears any client-side session state regardless of backend success.
   * @returns A promise that resolves when the logout attempt is complete.
   */
  logout: async (): Promise<AuthMessageResponse> => {
    const token = getAuthToken();
    if (!token) return { message: 'Already logged out or no token' }; // Already logged out or no token

    try {
      const response = await axios.post<AuthMessageResponse>(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: getAuthHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Logout failed on backend:', error);
      // Even if backend logout fails, client-side state will be cleared by authStore action
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Logout failed',
        );
      }
      throw new Error(
        (error as Error).message || 'An unknown error occurred during logout',
      );
    }
  },

  /**
   * Resends the email verification link.
   * @param email - The email address to resend verification for.
   * @returns A promise that resolves to a success message.
   */
  resendVerification: async (email: string): Promise<AuthMessageResponse> => {
    try {
      const response = await axios.post<AuthMessageResponse>(
        `${API_BASE_URL}/auth/resend-verification`,
        { email },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            'Failed to resend verification email',
        );
      }
      throw new Error(
        (error as Error).message ||
          'An unknown error occurred while resending verification',
      );
    }
  },

  /**
   * Verifies a user's email address using a token.
   * @param token - The verification token.
   * @returns A promise that resolves to a success message.
   */
  verifyEmail: async (token: string): Promise<AuthMessageResponse> => {
    try {
      const response = await axios.get<AuthMessageResponse>(
        `${API_BASE_URL}/auth/verify-email?token=${token}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            'Email verification failed',
        );
      }
      throw new Error(
        (error as Error).message ||
          'An unknown error occurred during email verification',
      );
    }
  },

  /**
   * Requests a password reset link for the given email.
   * @param email - The email address for password reset.
   * @returns A promise that resolves to a success message.
   */
  forgotPassword: async (email: string): Promise<AuthMessageResponse> => {
    try {
      const response = await axios.post<AuthMessageResponse>(
        `${API_BASE_URL}/auth/forgot-password`,
        { email },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            'Failed to request password reset',
        );
      }
      throw new Error(
        (error as Error).message ||
          'An unknown error occurred during password reset request',
      );
    }
  },

  /**
   * Resets the user's password using a token and new password.
   * @param credentials - Token and new password.
   * @returns A promise that resolves to a success message.
   */
  resetPassword: async (
    credentials: ResetPasswordCredentials,
  ): Promise<AuthMessageResponse> => {
    try {
      const response = await axios.post<AuthMessageResponse>(
        `${API_BASE_URL}/auth/reset-password`,
        credentials,
        { headers: { 'Content-Type': 'application/json' } },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            'Failed to reset password',
        );
      }
      throw new Error(
        (error as Error).message ||
          'An unknown error occurred during password reset',
      );
    }
  },

  /**
   * Fetches the profile of the currently authenticated user.
   * Requires an active JWT token.
   * @returns A promise that resolves to the UserProfile.
   * @throws Error if the token is missing or fetching the profile fails.
   */
  getProfile: async (): Promise<UserProfile> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing. Please log in.');
    }

    try {
      const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      // Backend /auth/me returns a Prisma User object, which directly maps to UserProfile
      // except for `phone_number` vs `phoneNumber`. Map explicitly for consistency.
      return mapBackendUserToUserProfile(response.data as any); // Cast as `any` for `phone_number` mapping
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            'Failed to fetch user profile',
        );
      }
      throw new Error(
        (error as Error).message ||
          'An unknown error occurred while fetching profile',
      );
    }
  },
};
