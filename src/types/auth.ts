/**
 * Represents credentials for email/password login.
 */
export interface EmailPasswordCredentials {
  email: string;
  password: string; // Changed from passwordHash to password to match backend LoginDto
}

/**
 * Represents credentials for user registration.
 */
export interface RegisterCredentials extends EmailPasswordCredentials {
  name?: string;
  phoneNumber?: string; // Renamed from phone_number for frontend consistency
  role?: string; // Corresponds to backend Role enum (e.g., 'USER', 'ADMIN')
}

/**
 * Represents credentials for resetting a password.
 */
export interface ResetPasswordCredentials {
  token: string;
  newPassword: string;
}

/**
 * Represents the profile of an authenticated user.
 * Aligns with backend AuthUserDto and CreateJwtUserDto for common fields.
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role?: string; // Using string for frontend to avoid direct Prisma enum dependency
  image?: string;
  phoneNumber?: string; // Frontend convention
}

/**
 * Represents the internal frontend response after a successful login or token validation.
 * This is a simplified view of the backend's LoginResponseDto for frontend consumption.
 */
export interface AuthResponse {
  token: string;
  user: UserProfile;
}

/**
 * Generic response for operations that return a message (e.g., logout, password reset).
 */
export interface AuthMessageResponse {
  message: string;
}

/**
 * Backend's LoginResponseDto structure, used internally for mapping.
 * This maps directly to the backend's LoginResponseDto (from auth.controller.ts)
 */
interface BackendLoginResponseDto {
  access_token: string;
  refresh_token: string; // Frontend might not use this, but included for fidelity
  user: {
    id?: string;
    sub: string;
    email: string;
    name?: string;
    phone_number?: string; // Backend naming convention
    role: string; // Backend Role enum as string
    image?: string;
    provider?: string;
    username?: string;
  };
}
