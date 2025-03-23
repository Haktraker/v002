"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { SessionManager } from "@/lib/auth/session-manager"
import { toast } from "sonner"

export function SessionInitializer() {
  const { logout } = useAuth()

  useEffect(() => {
    // Initialize session manager
    const cleanup = SessionManager.init(() => {
      // This function is called when the session expires
      logout()
      toast.error("Your session has expired. Please sign in again.")
    })

    return cleanup
  }, [logout])

  // This component doesn't render anything
  return null
}

