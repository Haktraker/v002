import axios from 'axios';

// Get the base URL from environment variables
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api-9fi5.onrender.com/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
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

      // Store token in localStorage
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
   * @returns true if token exists, false otherwise
   */
  validateToken(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  },

  /**
   * Sets the authentication token for all future requests
   * @param token The JWT token to set
   */
  setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Removes the authentication token and clears the auth header
   */
  removeAuthToken() {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }
};