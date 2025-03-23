"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { TokenService } from "./token-service"
import { RateLimitService } from "./rate-limit"
import { toast } from "react-toastify"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
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
  const router = useRouter()

  // Initialize axios with interceptors
  useEffect(() => {
    const accessToken = TokenService.getAccessToken()

    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
    }

    // Add request interceptor for token refresh
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        if (!config.url?.includes("/auth/refresh")) {
          const token = TokenService.getAccessToken()

          if (!token) {
            const refreshToken = TokenService.getRefreshToken()

            if (refreshToken) {
              try {
                // In a real app, this would call your API to refresh the token
                // For demo, we'll simulate a token refresh
                const newAccessToken = `refreshed-mock-jwt-token-${Date.now()}`
                TokenService.storeTokens(newAccessToken, refreshToken)
                config.headers.Authorization = `Bearer ${newAccessToken}`
              } catch (error) {
                TokenService.clearTokens()
              }
            }
          } else {
            config.headers.Authorization = `Bearer ${token}`
          }
        }

        return config
      },
      (error) => Promise.reject(error),
    )

    // Add response interceptor for handling auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
          router.push("/auth/login")
        }
        return Promise.reject(error)
      },
    )

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const accessToken = TokenService.getAccessToken()

        if (accessToken) {
          // Mock user data for demo purposes
          // In a real app, you would validate the token with your API
          setUser({
            id: "1",
            name: "Security Analyst",
            email: "analyst@haktrak.com",
            role: "analyst",
          })
        }
      } catch (error) {
        TokenService.clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
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

      // In a real app, this would be an API call
      // const response = await axios.post('http://localhost:5000/api/auth/login', { email, password })

      // Mock successful login for demo
      const mockResponse = {
        data: {
          accessToken: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: "1",
            name: "Security Analyst",
            email,
            role: "analyst",
          },
        },
      }

      // Complete the login process
      completeLogin(mockResponse.data)

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
        setError({ message: "An error occurred during login. Please try again." })
        toast.error("An error occurred during login. Please try again.")
      }

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const completeLogin = (data: LoginResponse) => {
    const { accessToken, refreshToken, user } = data

    // Store tokens securely
    TokenService.storeTokens(accessToken, refreshToken)

    // Set authorization header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`

    // Set user data
    setUser(user)

    // Navigate to dashboard
    router.push("/dashboard")
  }

  const logout = () => {
    TokenService.clearTokens()
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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

