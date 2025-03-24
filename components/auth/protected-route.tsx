"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-provider"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Wait for auth to be initialized before redirecting
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.replace("/auth/login")
      }
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple"></div>
      </div>
    )
  }

  // If authentication checks pass, render children
  return isAuthenticated ? <>{children}</> : null
}