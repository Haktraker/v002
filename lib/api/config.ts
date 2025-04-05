import axios from 'axios';
import { TokenService } from '@/lib/auth/token-service';

export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}); 

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  // Get token from TokenService to ensure we're using the most up-to-date token
  const token = TokenService.getAccessToken();
  
  // Always apply token to POST, PATCH, and DELETE requests
  if (token && (
    config.method?.toLowerCase() === 'post' || 
    config.method?.toLowerCase() === 'patch' || 
    config.method?.toLowerCase() === 'delete'
  )) {
    // Ensure headers object exists
    config.headers = config.headers || {};
    // Set Authorization header with bearer token
    config.headers.Authorization = `Bearer ${token}`;
    
    // Log authentication for debugging (remove in production)
    console.log(`Authenticated ${config.method?.toUpperCase()} request to: ${config.url}`);
  } else if (token) {
    // For other request types, still apply token if available
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is due to authentication issues
    if (error.response?.status === 401) {
      console.log('Authentication error: Token may be invalid or expired');
      // Optionally redirect to login or refresh token here
    }
    
    console.log('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
