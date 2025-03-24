"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { TokenService } from "./token-service"
import { RateLimitService } from "./rate-limit"
import { toast } from "sonner"
import { AuthService } from "@/lib/api/auth-service"

// Get BASE_URL from environment variables
const BASE_URL = process.env.BASE_URL || "https://api-9fi5.onrender.com/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface LoginResponse {
  data: User
  token: string
}

interface AuthError {
  message: string
  code?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  error: AuthError | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Function to handle logout
  const logout = () => {
    // Clear all tokens from localStorage
    TokenService.clearTokens();
    
    // Remove user data from localStorage
    localStorage.removeItem("user_data");
    
    // Remove auth header from axios
    AuthService.removeAuthHeader();
    
    // Reset user state
    setUser(null);
    
    // Add a success toast notification
    toast.success("Logged out successfully");
    
    // Redirect to homepage instead of login page
    router.push("/");
  }

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)

      try {
        const token = TokenService.getAccessToken()

        if (!token) {
          setIsLoading(false)
          setIsInitialized(true)
          return
        }

        // Set the auth header for all future requests
        AuthService.setAuthHeader(token)

        // Try to load user data first - this is faster than validating the token
        const userData = localStorage.getItem("user_data")
        if (userData) {
          setUser(JSON.parse(userData))
        }

        // In parallel, validate the token to ensure it's still valid
        const isValid = await AuthService.validateToken(token)
        if (!isValid) {
          // If token is invalid, log out
          logout()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        // If any error occurs during initialization, log out
        logout()
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    // Set up axios interceptor for handling 401 responses
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // If we get a 401 Unauthorized response, log out the user
        if (error.response?.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    initializeAuth()

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [router])

  const clearError = () => {
    setError(null)
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    clearError()

    try {
      // Check rate limiting
      const { allowed, waitTime } = RateLimitService.checkRateLimit(email)

      if (!allowed) {
        throw {
          message: `Too many login attempts. Please try again in ${waitTime} seconds.`,
          code: "RATE_LIMITED",
        }
      }

      // Make the API call to login
      const response = await AuthService.login({ email, password })
      
      // Complete the login process
      completeLogin(response)

      // Reset rate limiting on successful login
      RateLimitService.resetAttempts(email)

      // Show success toast
      toast.success("Login successful. Welcome back!")
    } catch (error: any) {
      // Record failed attempt
      RateLimitService.recordAttempt(email)

      if (error.code === "RATE_LIMITED") {
        setError(error)
        toast.error(`Too many login attempts. Please try again in ${error.waitTime} seconds.`)
      } else if (error.response?.status === 401) {
        setError({ message: "Invalid email or password" })
        toast.error("Invalid email or password")
      } else if (error.response?.status === 403) {
        setError({ message: "Your account has been locked. Please contact support." })
        toast.error("Your account has been locked. Please contact support.")
      } else {
        setError({ message: error.message || "An error occurred during login. Please try again." })
        toast.error(error.message || "An error occurred during login. Please try again.")
      }

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const completeLogin = (data: LoginResponse) => {
    const { token, data: userData } = data

    // Store token securely
    TokenService.storeTokens(token, token) // Using the same token for access and refresh for simplicity

    // Store user data
    localStorage.setItem("user_data", JSON.stringify(userData))

    // Set authorization header for future requests
    AuthService.setAuthHeader(token)

    // Set user data
    setUser(userData)

    // Navigate to dashboard
    router.push("/dashboard")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || !isInitialized,
        login,
        logout,
        isAuthenticated: !!user,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

