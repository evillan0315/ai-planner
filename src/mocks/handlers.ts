import { http, HttpResponse } from 'msw';
// Role enum is not available in frontend, use string literals for consistency

const API_BASE_URL = `${import.meta.env.VITE_API_URL}` || '/api';

export const handlers = [
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as any; // Backend expects 'password'
    if (email === 'test@example.com' && password === 'password123') {
      // Check for 'password'
      return HttpResponse.json(
        {
          access_token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN', // Use single role string
            // Add other UserProfile fields as needed (username, image, phoneNumber)
          },
        },
        { status: 200 },
      );
    } else if (email === 'error@example.com') {
      return HttpResponse.json({ message: 'Login failed' }, { status: 401 });
    }
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 },
    ); // Return message
  }),

  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (token === 'mock-jwt-token') {
      return HttpResponse.json(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER', // Use single role string
          // Add other UserProfile fields as needed
        },
        { status: 200 },
      );
    } else if (token === 'invalid-token') {
      return HttpResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }),

  // Add mocks for new endpoints if needed for testing:
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const { email, password, name } = (await request.json()) as any;
    if (email && password) {
      return HttpResponse.json(
        {
          access_token: 'mock-register-jwt',
          refresh_token: 'mock-register-refresh',
          user: {
            id: '2',
            email: email,
            name: name || 'New User',
            role: 'USER',
          },
        },
        { status: 201 },
      );
    }
    return HttpResponse.json(
      { message: 'Registration failed' },
      { status: 400 },
    );
  }),

  http.post(`${API_BASE_URL}/auth/resend-verification`, () => {
    return HttpResponse.json(
      { message: 'Verification email resent.' },
      { status: 200 },
    );
  }),

  http.get(`${API_BASE_URL}/auth/verify-email`, () => {
    return HttpResponse.json(
      { message: 'Email verified successfully.' },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, () => {
    return HttpResponse.json(
      { message: 'Password reset email sent.' },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, () => {
    return HttpResponse.json(
      { message: 'Password has been successfully reset.' },
      { status: 200 },
    );
  }),
];
