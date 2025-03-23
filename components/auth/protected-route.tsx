"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-provider"
import { TokenService } from "@/lib/auth/token-service"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [isRouteReady, setIsRouteReady] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Wait for auth to be initialized before redirecting
    if (!isLoading) {
      // Check both the auth context and token service for authentication
      const hasValidToken = TokenService.isAuthenticated()
      
      if (!isAuthenticated && !hasValidToken) {
        // Redirect to login if not authenticated
        router.push("/auth/login")
      } else {
        // Mark route as ready if authenticated
        setIsRouteReady(true)
      }
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading spinner while checking authentication or redirecting
  if (isLoading || !isRouteReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple"></div>
      </div>
    )
  }

  // If authentication checks pass and route is ready, render children
  return <>{children}</>
} 