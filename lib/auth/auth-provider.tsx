'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/api/auth-service";
import { TokenService } from "@/lib/auth/token-service";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a valid token
        const token = TokenService.getAccessToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Set the token in auth header
        AuthService.setAuthToken(token);

        // Get stored user data
        try {
          const userData = localStorage.getItem("user_data");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            // Validate user data structure
            if (parsedUser && 
                typeof parsedUser === 'object' && 
                '_id' in parsedUser && 
                'email' in parsedUser && 
                'name' in parsedUser && 
                'role' in parsedUser) {
              setUser(parsedUser);
            } else {
              throw new Error('Invalid user data structure');
            }
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          // Clear invalid data
          localStorage.removeItem("user_data");
          TokenService.clearTokens();
          AuthService.removeAuthToken();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear any invalid data
        TokenService.clearTokens();
        AuthService.removeAuthToken();
        localStorage.removeItem("user_data");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login({ email, password });
      
      // Store user data
      const userData = {
        _id: response.data._id,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role
      };
      
      // Store token
      TokenService.storeTokens(response.token);
      AuthService.setAuthToken(response.token);
      
      // Store user data
      localStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);
      
      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear auth state
    TokenService.clearTokens();
    AuthService.removeAuthToken();
    localStorage.removeItem("user_data");
    setUser(null);
    
    // Redirect to login
    router.replace("/auth/login");
  };

  const isAuthenticated = !!user && !!TokenService.getAccessToken();

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
