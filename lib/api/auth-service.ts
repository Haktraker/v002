import axios from 'axios';
import { TokenService } from '@/lib/auth/token-service';

// Get the base URL from environment variables
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api-9fi5.onrender.com/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {

  data: {
    _id: string;
    email: string;
    name: string;
    role: string;
  },
  token: string;

}

/**
 * Service responsible for handling authentication-related API calls
 */
export const AuthService = {
  /**
   * Authenticates a user with email and password
   * @param credentials The user's login credentials
   * @returns A promise that resolves to the login response
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${BASE_URL}/auth/login`,
        credentials
      );

      // Store token securely using TokenService
      TokenService.storeTokens(response.data.token);

      // Set auth header for future requests
      this.setAuthToken(response.data.token);

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);

      // Otherwise, throw a generic error
      throw new Error('Authentication failed. Please try again.');
    }
  },

  /**
   * Validates if a token exists and is stored
   * @returns true if token exists and is valid, false otherwise
   */
  validateToken(): boolean {
    return TokenService.isAuthenticated();
  },

  /**
   * Sets the authentication token for all future requests
   * @param token The JWT token to set
   */
  setAuthToken(token: string | null): void {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Removes the authentication token and clears the auth header
   */
  removeAuthToken(): void {
    TokenService.clearTokens();
    delete axios.defaults.headers.common['Authorization'];
  }
};