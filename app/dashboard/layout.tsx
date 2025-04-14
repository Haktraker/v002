"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Toaster } from "@/components/ui/toaster"
import ProtectedRoute from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto bg-[hsl(var(--dashboard-bg))] p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
            <div className="container mx-auto max-w-[1600px] h-full w-full px-2 sm:px-4">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </ProtectedRoute>
  )
}
