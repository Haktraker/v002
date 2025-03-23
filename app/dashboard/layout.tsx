"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import ProtectedRoute from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ProtectedRoute>
        <div className="flex h-screen bg-background transition-colors duration-200">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto bg-background p-4 transition-colors duration-200">{children}</main>
          </div>
          <Toaster />
        </div>
      </ProtectedRoute>
    </ThemeProvider>
  )
}

