import axios from 'axios';

// Get the base URL from environment variables
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BASE_URL || "https://api-9fi5.onrender.com/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

/**
 * Service responsible for handling authentication-related API calls
 */
export const AuthService = {
  /**
   * Authenticates a user with the provided credentials
   * @param credentials The user's login credentials
   * @returns A promise that resolves to the login response containing user data and token
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
      return response.data;
    } catch (error: any) {
      // If there's a response with error details, pass them along
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      
      // Otherwise, throw a generic error
      throw new Error('Authentication failed. Please try again.');
    }
  },

  /**
   * Validates if a token is still valid
   * @param token The JWT token to validate
   * @returns A promise that resolves to true if the token is valid
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // First check if the token is present
      if (!token) return false;
      
      // Make API call to validate the token
      // If the endpoint doesn't exist, you can use any authenticated endpoint
      // that would return 401 if token is invalid
      await axios.get(`${BASE_URL}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return true;
    } catch (error: any) {
      // Check specifically for 401 Unauthorized response
      if (error.response?.status === 401) {
        return false;
      }
      
      // If server is down or other network issues, assume token is valid 
      // to prevent unnecessary logouts when API is unavailable
      // We can do this because we still validate token expiration on client side
      console.warn('Token validation failed with unexpected error:', error);
      
      // If the error isn't specifically a 401, we'll return true
      // This prevents logging out users due to temporary API issues
      return true;
    }
  },

  /**
   * Sets the authentication token for all future requests
   * @param token The JWT token to set in the Authorization header
   */
  setAuthHeader(token: string): void {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Removes the authentication token from the headers
   */
  removeAuthHeader(): void {
    delete axios.defaults.headers.common['Authorization'];
  },
  
  /**
   * Silent token refresh logic (if your API supports this feature)
   * This would typically use a refresh token to get a new access token
   * @returns A promise that resolves to the new token if refresh was successful
   */
  async silentRefresh(): Promise<string | null> {
    try {
      // Get the current user data from localStorage
      const userData = localStorage.getItem("user_data");
      if (!userData) return null;
      
      // Try to refresh the token using user data
      // This is a placeholder - your API will determine how token refresh works
      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        userId: JSON.parse(userData)._id
      });
      
      return response.data.token;
    } catch (error) {
      console.error("Error during silent token refresh:", error);
      return null;
    }
  }
}; 